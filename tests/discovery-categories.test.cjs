const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

// Run with: node --experimental-vm-modules --test tests/discovery-categories.test.cjs
// Exercise the actual discovery route with an isolated database adapter.
const root = path.resolve(__dirname, "..");
const plain = (value) => JSON.parse(JSON.stringify(value));
const project = (id, slug, overrides = {}) => ({
  id, title: id, authors: "", overview: "", tags: [],
  category: { slug }, show: true, archived: false,
  recommendationRank: 1, createdAt: "2026-01-01", daysLeft: 30,
  pledges: [], goal: 100, ...overrides,
});
const projects = [
  project("legacy", "environment", { title: "Bamboo farming", recommendationRank: 2, daysLeft: 5 }),
  project("native", "agriculture", { tags: ["Bamboo"], createdAt: "2026-02-01", pledges: [{ amount: 50, status: "paid" }] }),
  project("unranked", "environment", { recommendationRank: null, createdAt: "2026-03-01", isCompleted: true }),
  project("health", "health"),
  project("uncategorized", null, { category: null }),
  project("hidden", "environment", { show: false }),
  project("archived", "agriculture", { archived: true }),
];

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    if (key === "OR") return expected.some((condition) => matches(row, condition));
    const actual = row?.[key];
    if (expected === null || typeof expected !== "object") return actual === expected;
    if ("in" in expected) return expected.in.includes(actual);
    if ("not" in expected) return actual !== expected.not;
    if ("contains" in expected) {
      return expected.mode === "insensitive"
        ? actual.toLowerCase().includes(expected.contains.toLowerCase())
        : actual.includes(expected.contains);
    }
    if ("hasSome" in expected) return expected.hasSome.some((item) => actual.includes(item));
    return matches(actual, expected);
  });
}

async function createHarness() {
  const context = vm.createContext({ URL, console });
  const modules = new Map();
  const prisma = {
    project: {
      async findMany({ where, orderBy, skip = 0, take }) {
        const found = projects.filter((item) => matches(item, where));
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0];
          found.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * (direction === "desc" ? -1 : 1));
        }
        return found.slice(skip, take === undefined ? undefined : skip + take);
      },
      async count({ where }) { return projects.filter((item) => matches(item, where)).length; },
    },
  };
  const adapters = {
    "@/lib/prisma": { prisma },
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
  };
  async function load(identifier) {
    if (modules.has(identifier)) return modules.get(identifier);
    const exports = adapters[identifier];
    const filename = identifier === "@/lib/project-categories" ? "lib/project-categories.js" : identifier;
    const loaded = exports
      ? new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      }, { context, identifier })
      : new vm.SourceTextModule(await fs.readFile(path.join(root, filename), "utf8"), { context, identifier });
    modules.set(identifier, loaded);
    await loaded.link(load);
    await loaded.evaluate();
    return loaded;
  }
  return {
    async helpers() { return (await load("@/lib/project-categories")).namespace; },
    async discover(query) {
      const route = await load("app/api/projects/discovery/route.js");
      const response = await route.namespace.GET(new Request(`https://example.test/api/projects/discovery?${query}`));
      assert.equal(response.status, 200);
      return response.json();
    },
  };
}

test("public categories merge Environment into Agriculture with a stable icon and label", async () => {
  const { getDiscoveryCategories, getCategoryLabel, normalizeCategorySlug } = await (await createHarness()).helpers();
  const categories = [
    { slug: "environment", name: "Environment", icon: "Waves" },
    { slug: "health", name: "Health", icon: "HeartPulse" },
    { slug: "agriculture", name: "Agriculture", icon: "Sprout" },
  ];
  const expected = [
    { id: "all", label: "All projects" },
    { id: "agriculture", label: "Agriculture", icon: "Sprout" },
    { id: "health", label: "Health", icon: "HeartPulse" },
  ];
  assert.deepEqual(plain(getDiscoveryCategories(categories)), expected);
  assert.deepEqual(plain(getDiscoveryCategories([...categories].reverse())), expected);
  assert.deepEqual(plain(getDiscoveryCategories([categories[0]])[1]), { id: "agriculture", label: "Agriculture", icon: "Leaf" });
  assert.equal(normalizeCategorySlug(" Environment "), "agriculture");
  assert.equal(normalizeCategorySlug(), "all");
  assert.equal(getCategoryLabel(" ENVIRONMENT "), "Agriculture");
  assert.equal(getCategoryLabel("Urban Planning"), "Urban Planning");
});

test("Agriculture and legacy Environment links find both stored categories in every ordering mode", async (t) => {
  const expected = {
    all: ["unranked", "native", "legacy"],
    recommended: ["native", "legacy"],
    newest: ["unranked", "native", "legacy"],
    "ending-soon": ["legacy", "native", "unranked"],
    funded: ["unranked", "native", "legacy"],
  };
  for (const category of ["agriculture", "environment"]) {
    for (const [filter, ids] of Object.entries(expected)) {
      await t.test(`${category}, ${filter}`, async () => {
        const app = await createHarness();
        const result = await app.discover(`category=${category}&filter=${filter}`);
        assert.deepEqual(result.projects.map((item) => item.id), ids);
        assert.equal(result.pagination.totalCount, ids.length);
      });
    }
  }
});

test("combined category search and pagination include legacy records without hidden or archived projects", async () => {
  const app = await createHarness();
  const result = await app.discover("category=agriculture&filter=newest&search=Bamboo&limit=1&page=2");
  assert.deepEqual(result.projects.map((item) => item.id), ["legacy"]);
  assert.deepEqual(result.pagination, {
    currentPage: 2, totalPages: 2, totalCount: 2, hasNextPage: false, hasPreviousPage: true,
  });
});

test("other categories remain independent and all projects still includes uncategorized records", async () => {
  const app = await createHarness();
  const health = await app.discover("category=health&filter=newest");
  assert.deepEqual(health.projects.map((item) => item.id), ["health"]);
  const all = await app.discover("category=all&filter=newest");
  assert.deepEqual(all.projects.map((item) => item.id).sort(), ["health", "legacy", "native", "uncategorized", "unranked"]);
});
