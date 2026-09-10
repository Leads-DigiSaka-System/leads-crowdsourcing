const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

// Run with: node --experimental-vm-modules --test tests/password-reset.test.cjs
// The actual route/helper sources run with isolated database and email adapters.
const root = path.resolve(__dirname, "..");
const token = "a".repeat(64);
const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");
const user = { id: "user-1", email: "member@example.com", password: "old-password-hash" };
const productionEnv = { NODE_ENV: "production", AUTH_URL: "https://impactofresearch.fund" };

function record(overrides = {}) {
  return {
    id: "reset-1", userId: user.id, tokenHash: hashToken(token),
    createdAt: new Date(Date.now() - 120_000),
    expiresAt: new Date(Date.now() + 3_600_000), usedAt: null,
    requestIp: "198.51.100.4", ...overrides,
  };
}

function createDatabase(users = [user], records = []) {
  const state = { users: structuredClone(users), records: structuredClone(records), updates: 0 };
  let sequence = records.length;
  let transactionTail = Promise.resolve();

  function matches(row, where = {}) {
    return Object.entries(where).every(([key, expected]) => {
      if (key === "user") {
        const related = state.users.find((item) => item.id === row.userId);
        return related && matches(related, expected);
      }
      const actual = row[key];
      if (expected === null || typeof expected !== "object" || expected instanceof Date) {
        return actual === expected;
      }
      return Object.entries(expected).every(([operator, value]) => {
        if (operator === "not") return actual !== value;
        if (operator === "gt") return actual > value;
        if (operator === "gte") return actual >= value;
        if (operator === "lte") return actual <= value;
        throw new Error(`Unsupported mock query operator: ${operator}`);
      });
    });
  }

  const prisma = {
    user: {
      async findUnique({ where }) {
        return structuredClone(state.users.find((item) => matches(item, where)) || null);
      },
      async update({ where, data }) {
        const found = state.users.find((item) => matches(item, where));
        assert.ok(found, "updated user must exist");
        Object.assign(found, data);
        state.updates += 1;
        return structuredClone(found);
      },
    },
    passwordReset: {
      async count({ where }) { return state.records.filter((item) => matches(item, where)).length; },
      async findFirst({ where, orderBy }) {
        const found = state.records.filter((item) => matches(item, where));
        if (orderBy?.createdAt === "desc") found.sort((a, b) => b.createdAt - a.createdAt);
        return structuredClone(found[0] || null);
      },
      async create({ data }) {
        const created = { id: `generated-${++sequence}`, createdAt: new Date(), usedAt: null, ...data };
        state.records.push(created);
        return structuredClone(created);
      },
      async updateMany({ where, data }) {
        const found = state.records.filter((item) => matches(item, where));
        for (const item of found) Object.assign(item, data);
        return { count: found.length };
      },
      async deleteMany({ where }) {
        const before = state.records.length;
        state.records = state.records.filter((item) => !matches(item, where));
        return { count: before - state.records.length };
      },
    },
    $transaction(operation) {
      // A mutex models atomic transactions; competing consumers observe the claim.
      const result = transactionTail.then(() => operation(prisma));
      transactionTail = result.catch(() => {});
      return result;
    },
  };
  return { state, prisma };
}

async function createHarness(options = {}) {
  const database = createDatabase(options.users, options.records);
  const messages = [];
  const env = { ...productionEnv, ...options.env };
  const context = vm.createContext({ URL, Date, process: { env }, console: { error() {} } });
  const modules = new Map();
  const adapters = {
    "@/lib/prisma": { prisma: database.prisma },
    "@/lib/email": {
      async sendPasswordResetEmail(message) {
        messages.push(message);
        return options.send ? options.send(message) : { data: { id: "mail-1" }, error: null };
      },
    },
    crypto: { default: crypto },
    bcryptjs: { default: bcrypt },
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    zod: { z },
    ...options.adapters,
  };

  async function load(identifier) {
    if (modules.has(identifier)) return modules.get(identifier);
    let loadedModule;
    if (adapters[identifier]) {
      const exports = adapters[identifier];
      loadedModule = new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      }, { context, identifier });
    } else {
      const filename = identifier === "@/lib/password-reset" ? "lib/password-reset.js" : identifier;
      loadedModule = new vm.SourceTextModule(await fs.readFile(path.join(root, filename), "utf8"), { context, identifier });
    }
    modules.set(identifier, loadedModule);
    await loadedModule.link(load);
    await loadedModule.evaluate();
    return loadedModule;
  }

  return {
    ...database, messages, env,
    async module(filename) { return (await load(filename)).namespace; },
    async forgot(email, rawBody) {
      const route = await load("app/api/auth/forgot/route.js");
      return route.namespace.POST(new Request(`${productionEnv.AUTH_URL}/api/auth/forgot`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.4" },
        body: rawBody === undefined ? JSON.stringify({ email }) : rawBody,
      }));
    },
    async reset(resetToken = token, password = "new-password", rawBody) {
      const route = await load("app/api/auth/reset-password/route.js");
      return route.namespace.POST(new Request(`${productionEnv.AUTH_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: rawBody === undefined ? JSON.stringify({ token: resetToken, password }) : rawBody,
      }));
    },
    async status(resetToken = token) {
      const route = await load("app/api/auth/reset-token-status/route.js");
      return route.namespace.GET(new Request(`${productionEnv.AUTH_URL}/api/auth/reset-token-status?t=${encodeURIComponent(resetToken)}`));
    },
  };
}

test("forgot normalizes email and sends a production URL containing only the raw token", async () => {
  const app = await createHarness();
  assert.equal((await app.forgot("  MEMBER@EXAMPLE.COM  ")).status, 200);
  assert.equal(app.messages.length, 1);
  assert.equal(app.messages[0].to, user.email);
  const link = new URL(app.messages[0].resetUrl);
  assert.equal(link.origin, productionEnv.AUTH_URL);
  assert.equal(link.pathname, "/reset-password");
  const rawToken = link.searchParams.get("t");
  assert.match(rawToken, /^[a-f0-9]{64}$/);
  assert.equal(app.state.records[0].tokenHash, hashToken(rawToken));
  assert.notEqual(app.state.records[0].tokenHash, rawToken);
  assert.ok(app.state.records[0].expiresAt > new Date());
});

test("provider rejection, missing receipt, and thrown errors release the reservation for retry", async (t) => {
  for (const failure of ["rejection", "missing-receipt", "throw"]) {
    await t.test(failure, async () => {
      let accepted = false;
      const app = await createHarness({ send() {
        if (accepted) return { data: { id: "retry-mail" } };
        if (failure === "throw") throw new Error("provider unavailable");
        return failure === "rejection" ? { error: { message: "rejected" } } : { data: {} };
      } });
      assert.equal((await app.forgot(user.email)).status, 503);
      assert.equal(app.state.records.length, 0);
      accepted = true;
      assert.equal((await app.forgot(user.email)).status, 200);
      assert.equal(app.state.records.length, 1);
    });
  }
});

test("cooldown blocks immediate resend but allows a new link afterward and retires the old link", async () => {
  const app = await createHarness();
  assert.equal((await app.forgot(user.email)).status, 200);
  assert.equal((await app.forgot(user.email)).status, 429);
  assert.equal(app.messages.length, 1);
  app.state.records[0].createdAt = new Date(Date.now() - 61_000);
  assert.equal((await app.forgot(user.email)).status, 200);
  assert.equal(app.state.records.length, 2);
  assert.ok(app.state.records[0].usedAt);
  assert.equal(app.state.records[1].usedAt, null);
});

test("failed resend preserves the prior usable link", async () => {
  const app = await createHarness({ records: [record()], send: () => ({ error: { message: "rejected" } }) });
  assert.equal((await app.forgot(user.email)).status, 503);
  assert.equal(app.state.records.length, 1);
  assert.equal(app.state.records[0].usedAt, null);
  assert.equal((await app.status()).status, 200);
});

test("a serialization conflict retries reservation without sending duplicate emails", async () => {
  const app = await createHarness();
  const transaction = app.prisma.$transaction;
  let attempts = 0;
  app.prisma.$transaction = async (operation, options) => {
    assert.equal(options.isolationLevel, "Serializable");
    if (++attempts === 1) throw Object.assign(new Error("serialization conflict"), { code: "P2034" });
    return transaction(operation);
  };
  assert.equal((await app.forgot(user.email)).status, 200);
  assert.equal(attempts, 2);
  assert.equal(app.messages.length, 1);
  assert.equal(app.state.records.length, 1);
});

test("daily quota includes expired and consumed history", async () => {
  const records = [0, 1, 2].map((index) => record({
    id: `history-${index}`, createdAt: new Date(Date.now() - (index + 2) * 3_600_000),
    expiresAt: new Date(Date.now() - 3_600_000), usedAt: index === 0 ? new Date() : null,
  }));
  const app = await createHarness({ records });
  assert.equal((await app.forgot(user.email)).status, 429);
  assert.equal(app.messages.length, 0);
  assert.equal(app.state.records.length, 3);
});

test("IP quota includes requests for other accounts", async () => {
  const records = Array.from({ length: 10 }, (_, index) => record({ id: `ip-${index}`, userId: `other-${index}` }));
  const app = await createHarness({ records });
  assert.equal((await app.forgot(user.email)).status, 429);
  assert.equal(app.messages.length, 0);
});

test("invalid input and unknown or Google-only accounts never send mail", async () => {
  const app = await createHarness();
  for (const email of [undefined, null, 42, {}, "bad-email"]) {
    assert.equal((await app.forgot(email)).status, 400);
  }
  assert.equal((await app.forgot(undefined, "{")).status, 400);
  assert.equal((await app.forgot("unknown@example.com")).status, 200);
  app.state.users[0].password = null;
  const google = await app.forgot(user.email);
  assert.equal(google.status, 400);
  assert.equal((await google.json()).code, "GOOGLE_ONLY");
  assert.equal(app.messages.length, 0);
  assert.equal(app.state.records.length, 0);
});

test("token status distinguishes valid, malformed, expired, consumed and Google-only tokens", async (t) => {
  const app = await createHarness({ records: [record()] });
  const valid = await app.status();
  assert.equal(valid.status, 200);
  assert.equal(valid.headers.get("cache-control"), "no-store");
  assert.equal((await app.status("invalid")).status, 400);
  assert.equal((await app.status("b".repeat(64))).status, 404);
  for (const change of [{ expiresAt: new Date(Date.now() - 1) }, { usedAt: new Date() }]) {
    await t.test(Object.keys(change)[0], async () => {
      const invalid = await createHarness({ records: [record(change)] });
      assert.equal((await invalid.status()).status, 404);
      assert.equal((await invalid.reset()).status, 400);
      assert.equal(invalid.state.updates, 0);
    });
  }
  app.state.users[0].password = null;
  assert.equal((await app.status()).status, 404);
  assert.equal((await app.reset()).status, 400);
});

test("reset rejects malformed JSON, invalid token and short passwords without changing the user", async () => {
  const app = await createHarness({ records: [record()] });
  assert.equal((await app.reset(token, "new-password", "{")).status, 400);
  assert.equal((await app.reset("bad-token")).status, 400);
  assert.equal((await app.reset(token, "short")).status, 400);
  assert.equal((await app.reset(token, { password: "invalid type" })).status, 400);
  assert.equal(app.state.users[0].password, user.password);
  assert.equal(app.state.records[0].usedAt, null);
});

test("successful reset hashes the password and invalidates every outstanding link without deleting history", async () => {
  const app = await createHarness({ records: [record(), record({ id: "reset-2", tokenHash: hashToken("b".repeat(64)) })] });
  assert.equal((await app.reset()).status, 200);
  assert.equal(await bcrypt.compare("new-password", app.state.users[0].password), true);
  assert.equal(app.state.records.length, 2);
  assert.ok(app.state.records.every((item) => item.usedAt));
  assert.equal((await app.status()).status, 404);
  assert.equal((await app.reset()).status, 400);
  assert.equal(app.state.updates, 1);
});

test("concurrent redemption permits one password update", async () => {
  const app = await createHarness({ records: [record()] });
  // Load once before concurrent calls so module initialization is not part of the race.
  await app.module("app/api/auth/reset-password/route.js");
  const results = await Promise.all([app.reset(token, "password-one"), app.reset(token, "password-two")]);
  assert.deepEqual(results.map((response) => response.status).sort(), [200, 400]);
  assert.equal(app.state.updates, 1);
  const winner = results[0].status === 200 ? "password-one" : "password-two";
  assert.equal(await bcrypt.compare(winner, app.state.users[0].password), true);
});

test("a token that expires while hashing cannot update the password", async () => {
  const app = await createHarness({
    records: [record()],
    adapters: { bcryptjs: { default: { async hash() {
      app.state.records[0].expiresAt = new Date(Date.now() - 1);
      return "password-hash";
    } } } },
  });
  assert.equal((await app.reset()).status, 400);
  assert.equal(app.state.updates, 0);
  assert.equal(app.state.users[0].password, user.password);
});

test("reset URL honors authentication origin priority and safely encodes the token", async () => {
  const app = await createHarness();
  const { createPasswordResetUrl } = await app.module("@/lib/password-reset");
  const env = {
    NODE_ENV: "production", AUTH_URL: "https://auth.example.com/api/auth",
    NEXTAUTH_URL: "https://nextauth.example.com", NEXT_PUBLIC_APP_URL: "https://public.example.com",
  };
  assert.equal(createPasswordResetUrl("a&b", env), "https://auth.example.com/reset-password?t=a%26b");
  delete env.AUTH_URL;
  assert.equal(new URL(createPasswordResetUrl(token, env)).origin, env.NEXTAUTH_URL);
  delete env.NEXTAUTH_URL;
  assert.equal(new URL(createPasswordResetUrl(token, env)).origin, env.NEXT_PUBLIC_APP_URL);
  assert.throws(() => createPasswordResetUrl(token, {}), /not configured/);
});

test("production reset URL rejects localhost, HTTP, credentials and non-web schemes", async () => {
  const app = await createHarness();
  const { createPasswordResetUrl } = await app.module("@/lib/password-reset");
  for (const AUTH_URL of [
    "https://localhost:3000", "https://127.0.0.1", "https://[::1]", "http://impactofresearch.fund",
    "https://user:password@impactofresearch.fund", "ftp://impactofresearch.fund", "not a URL",
  ]) {
    assert.throws(() => createPasswordResetUrl(token, { NODE_ENV: "production", AUTH_URL }));
  }
  assert.equal(new URL(createPasswordResetUrl(token, { AUTH_URL: "http://localhost:3000" })).origin, "http://localhost:3000");
  const invalid = await createHarness({ env: { AUTH_URL: "http://localhost:3000" } });
  assert.equal((await invalid.forgot(user.email)).status, 500);
  assert.equal(invalid.messages.length, 0);
  assert.equal(invalid.state.records.length, 0);
});

test("email client is initialized at send time and passes the production reset link to the provider", async () => {
  let clients = 0;
  const outgoing = [];
  class Resend {
    constructor(key) {
      clients += 1;
      assert.equal(key, "test-provider-key");
      this.emails = { async send(message) { outgoing.push(message); return { data: { id: "accepted" } }; } };
    }
  }
  const app = await createHarness({ adapters: { resend: { Resend } } });
  const email = await app.module("lib/email.js");
  assert.equal(clients, 0);
  app.env.RESEND_API_KEY = "test-provider-key";
  const resetUrl = `${productionEnv.AUTH_URL}/reset-password?t=${token}`;
  const result = await email.sendPasswordResetEmail({ to: user.email, resetUrl, maskedEmail: "me***@example.com" });
  assert.equal(result.data.id, "accepted");
  assert.equal(clients, 1);
  assert.equal(outgoing[0].to, user.email);
  assert.match(outgoing[0].from, /@impactofresearch\.fund/);
  assert.ok(outgoing[0].html.includes(resetUrl));
});

test("missing email credentials fail at send time and the route releases its reservation", async () => {
  let clients = 0;
  let email;
  class Resend {
    constructor() {
      clients += 1;
      throw new Error("Missing API key");
    }
  }
  const app = await createHarness({
    adapters: { resend: { Resend } },
    send: (message) => email.sendPasswordResetEmail(message),
  });
  email = await app.module("lib/email.js");
  assert.equal(clients, 0);
  await assert.rejects(email.sendPasswordResetEmail({
    to: user.email, resetUrl: `${productionEnv.AUTH_URL}/reset-password?t=${token}`,
    maskedEmail: "me***@example.com",
  }), /Missing API key/);
  assert.equal(clients, 1);
  assert.equal((await app.forgot(user.email)).status, 503);
  assert.equal(clients, 2);
  assert.equal(app.state.records.length, 0);
});
