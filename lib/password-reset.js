export function createPasswordResetUrl(token, env = process.env) {
  // Match the origin used by authentication, including deployments behind a proxy.
  const configuredUrl = env.AUTH_URL || env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) throw new Error("Password reset URL is not configured");

  const base = new URL(configuredUrl);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("Invalid password reset origin");
  }
  if (env.NODE_ENV === "production" && (
    base.protocol !== "https:" ||
    ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
  )) {
    throw new Error("Password reset requires the public HTTPS origin in production");
  }

  const url = new URL("/reset-password", base.origin);
  url.searchParams.set("t", token);
  return url.toString();
}

export function isPasswordResetToken(token) {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
}
