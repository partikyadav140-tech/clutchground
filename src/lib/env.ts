export function getEnvVar(name: string): string | undefined {
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
