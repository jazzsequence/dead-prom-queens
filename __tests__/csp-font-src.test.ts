import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bandConfig = JSON.parse(readFileSync(resolve(root, "band.config.json"), "utf-8")) as { typography: { customFaces?: { baseUrl: string } } };

// The CSP is only sent in production, so load next.config.ts as production does and read the header it builds.
async function publicCsp() {
  vi.stubEnv("NODE_ENV", "production");
  vi.resetModules();
  const config = (await import("../next.config")).default;
  const rules = await config.headers!();
  const csp = rules.flatMap((r) => r.headers).find((h) => h.key === "Content-Security-Policy");
  return csp?.value ?? "";
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Content-Security-Policy font-src", () => {
  it("allows the bucket that serves the band's own fonts, and no other origin", async () => {
    const fontSrc = (await publicCsp()).split("; ").find((d) => d.startsWith("font-src"));
    const faces = bandConfig.typography.customFaces;
    expect(fontSrc).toBe(faces ? `font-src 'self' ${new URL(faces.baseUrl).origin}` : "font-src 'self'");
  });
});
