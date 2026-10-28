import { describe, expect, it, vi } from "vitest";

import { isP1Configured, p1ConfigProblem } from "../lib/site/p1-config";

const REAL = { CSS_API_KEY: "sat_abc123def456", NEXT_PUBLIC_CSS_SITE_ID: "80040fab-7068-49dd-a12d-4d0b2bc2383d" };

describe("isP1Configured", () => {
  it("is true for a real key and a real site id", () => {
    expect(isP1Configured(REAL)).toBe(true);
  });

  it("is false for the placeholders CI, e2e and local checks use", () => {
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "ci-placeholder" })).toBe(false);
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "e2e-placeholder" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "00000000-0000-0000-0000-000000000000" })).toBe(false);
    expect(isP1Configured({ CSS_API_KEY: "ci-placeholder", NEXT_PUBLIC_CSS_SITE_ID: "00000000-0000-0000-0000-000000000000" })).toBe(false);
  });

  it("judges live by its own published-only key, so a real live build is never disabled", () => {
    const live = { PANTHEON_ENVIRONMENT: "live", NEXT_PUBLIC_CSS_SITE_ID: REAL.NEXT_PUBLIC_CSS_SITE_ID };
    expect(isP1Configured({ ...live, CSS_API_KEY_LIVE: "sat_live_key_123" })).toBe(true);
    expect(isP1Configured({ ...live, CSS_API_KEY: "sat_drafts_key", CSS_API_KEY_LIVE: "" })).toBe(false);
  });

  it("is false when either value is missing, blank or not a UUID", () => {
    expect(isP1Configured({})).toBe(false);
    expect(isP1Configured({ ...REAL, CSS_API_KEY: "" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "" })).toBe(false);
    expect(isP1Configured({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "x" })).toBe(false);
  });
});

describe("p1ConfigProblem", () => {
  it("is null when isP1Configured is true", () => {
    expect(p1ConfigProblem(REAL)).toBeNull();
    expect(isP1Configured(REAL)).toBe(true);
  });

  it("names the setting that is wrong", () => {
    expect(p1ConfigProblem({ NEXT_PUBLIC_CSS_SITE_ID: REAL.NEXT_PUBLIC_CSS_SITE_ID })).toBe("CSS_API_KEY is empty or not set");
    expect(p1ConfigProblem({ ...REAL, CSS_API_KEY: "placeholder-x" })).toBe("CSS_API_KEY is a placeholder");
    expect(p1ConfigProblem({ CSS_API_KEY: REAL.CSS_API_KEY })).toBe("NEXT_PUBLIC_CSS_SITE_ID is empty or not set");
    expect(p1ConfigProblem({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "x" })).toBe("NEXT_PUBLIC_CSS_SITE_ID is not a real site id");
    expect(p1ConfigProblem({ ...REAL, NEXT_PUBLIC_CSS_SITE_ID: "00000000-0000-0000-0000-000000000000" })).toBe("NEXT_PUBLIC_CSS_SITE_ID is not a real site id");
  });

  it("names the live key on live, where the drafts key does not count", () => {
    const live = { PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: "sat_drafts_key", NEXT_PUBLIC_CSS_SITE_ID: REAL.NEXT_PUBLIC_CSS_SITE_ID };
    expect(p1ConfigProblem(live)).toBe("CSS_API_KEY_LIVE (the published-only key) is not set");
    expect(p1ConfigProblem({ ...live, CSS_API_KEY_LIVE: "sat_live_key_123" })).toBeNull();
  });

  it("never includes a value, so it can be printed in a build log", () => {
    const secret = "sat_super_secret_value_9f3a";
    for (const env of [{ CSS_API_KEY: secret }, { CSS_API_KEY: secret, NEXT_PUBLIC_CSS_SITE_ID: "not-a-uuid" }, { PANTHEON_ENVIRONMENT: "live", CSS_API_KEY: secret }]) {
      expect(p1ConfigProblem(env)).not.toContain(secret);
      expect(p1ConfigProblem(env)).not.toContain("not-a-uuid");
    }
  });
});

describe("getP1Page with placeholder credentials", () => {
  it("returns null without calling the P1 SDK", async () => {
    const loadPublishedPage = vi.fn();
    vi.resetModules();
    vi.doMock("@pantheon-systems/p1-next-sdk/server", () => ({ loadPublishedPage }));
    vi.stubEnv("CSS_API_KEY", "ci-placeholder");
    vi.stubEnv("NEXT_PUBLIC_CSS_SITE_ID", "00000000-0000-0000-0000-000000000000");
    const { getP1Page } = await import("../lib/site/p1-content");
    expect(await getP1Page("/tour")).toBeNull();
    expect(loadPublishedPage).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.doUnmock("@pantheon-systems/p1-next-sdk/server");
  });
});
