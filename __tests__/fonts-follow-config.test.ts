import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { typography } from "../lib/band/config";

// Every font import adds its @font-face rules to the CSS that every page downloads, so design-system/fonts.ts loads an optional
// built-in face only when band.config.json turns it on (and nothing for faces that no style references).
const fonts = readFileSync(new URL("../design-system/fonts.ts", import.meta.url), "utf-8");
const imports = (pkg: string) => new RegExp(`^import "${pkg}[/"]`, "m").test(fonts);

describe("design-system/fonts.ts", () => {
  it("imports Unbounded only when typography.wordmarkFace is on, and UnifrakturCook only when typography.accentFace is on", () => {
    expect(imports("@fontsource-variable/unbounded"), "Unbounded vs typography.wordmarkFace").toBe(typography.wordmarkFace);
    expect(imports("@fontsource/unifrakturcook"), "UnifrakturCook vs typography.accentFace").toBe(typography.accentFace);
  });

  it("does not load a face that no style references", () => {
    expect(imports("@fontsource/encode-sans-expanded")).toBe(false);
  });

  it("still loads the body and display faces", () => {
    expect(imports("@fontsource-variable/space-grotesk")).toBe(true);
    expect(imports("@fontsource/special-elite")).toBe(true);
  });
});
