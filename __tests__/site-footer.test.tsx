import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// The footer reads the band's feature switches, so each case loads it fresh against a chosen set.
async function footer(features: { press: boolean; pressKit: boolean }) {
  vi.resetModules();
  vi.doMock("../lib/band/config", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../lib/band/config")>();
    return { ...actual, band: { ...actual.band, imprint: "", social: [] }, features: { ...actual.features, ...features } };
  });
  const { SiteFooter } = await import("../design-system/components/SiteFooter");
  return renderToStaticMarkup(<SiteFooter />);
}

afterEach(() => {
  vi.doUnmock("../lib/band/config");
});

describe("the footer's Press kit link", () => {
  it("follows the pressKit switch", async () => {
    expect(await footer({ press: false, pressKit: true })).toContain('href="/press/kit"');
    expect(await footer({ press: true, pressKit: false })).not.toContain("/press/kit");
  });

  it("does not depend on the press section", async () => {
    expect(await footer({ press: false, pressKit: true })).toContain("Press kit");
    expect(await footer({ press: true, pressKit: true })).toContain("Press kit");
    expect(await footer({ press: false, pressKit: false })).not.toContain("Press kit");
  });
});
