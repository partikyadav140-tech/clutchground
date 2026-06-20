export function getEnvVar(name: string): string | undefined {
  // Safety guard: non-VITE_ vars should NEVER be accessed on the client
  const isClient = typeof window !== "undefined";
  if (isClient && !name.startsWith("VITE_")) {
    console.error(
      `[SECURITY] Attempted to access server-only env var "${name}" on the client. This is a security violation.`,
    );
    return undefined;
  }

  // 1. Try to get it from process.env (Node.js / Render)
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name];
  }

  // 2. Try to get it from import.meta.env (Vite compiler inlining / client side / SSR)
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name] as string;
  }

  return undefined;
}
