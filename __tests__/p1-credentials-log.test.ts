import { describe, expect, it } from "vitest";

import { describeP1Credentials } from "../lib/site/p1-credentials-log";

const REAL = "sat_3f9a1c77d2e04b58a6c1e9d0b4f2a713";

describe("describeP1Credentials", () => {
  it("shows a real key only as its length and a short fingerprint, never the key", () => {
    const text = describeP1Credentials({ CSS_API_KEY: REAL, NEXT_PUBLIC_CSS_SITE_ID: "80040fab-7068-49dd-a12d-4d0b2bc2383d" });
    expect(text).toContain(`${REAL.length} characters, sha256 `);
    expect(text).toMatch(/sha256 [0-9a-f]{8};/);
    expect(text).not.toContain(REAL);
    expect(text).not.toContain(REAL.slice(0, 12));
  });

  it("gives the same fingerprint for the same key, and a different one for another key", () => {
    const a = describeP1Credentials({ CSS_API_KEY: REAL });
    expect(describeP1Credentials({ CSS_API_KEY: REAL })).toBe(a);
    expect(describeP1Credentials({ CSS_API_KEY: `${REAL}x` })).not.toBe(a);
  });

  it("prints a placeholder in full, because it is not a secret and shows who set it", () => {
    expect(describeP1Credentials({ CSS_API_KEY: "placeholder-set-per-env" })).toContain('CSS_API_KEY is the placeholder "placeholder-set-per-env"');
    expect(describeP1Credentials({ CSS_API_KEY: "ci-placeholder" })).toContain('"ci-placeholder"');
  });

  it("says when the key is missing or empty", () => {
    expect(describeP1Credentials({})).toContain("CSS_API_KEY is not set");
    expect(describeP1Credentials({ CSS_API_KEY: "" })).toContain("CSS_API_KEY is empty");
  });

  it("lists the names of related variables but never their values, and leaves unrelated ones out", () => {
    const text = describeP1Credentials({ CSS_API_KEY: REAL, CSS_API_KEY_LIVE: "sat_live_secret_value_0001", PANTHEON_ENVIRONMENT: "pr-9", R2_SECRET_ACCESS_KEY: "unrelated-secret", HOME: "/home/x" });
    expect(text).toContain("CSS_API_KEY, CSS_API_KEY_LIVE, PANTHEON_ENVIRONMENT");
    expect(text).not.toContain("sat_live_secret_value_0001");
    expect(text).not.toContain("unrelated-secret");
    expect(text).not.toContain("R2_SECRET_ACCESS_KEY");
    expect(text).not.toContain("HOME");
  });
});
