import { createHash } from "node:crypto";

type Env = Record<string, string | undefined>;

const fingerprint = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 8);

// A placeholder is not a secret, and seeing the exact string says who set it. Nothing else is ever printed: a real key shows only its length
// and the first 8 hex characters of its SHA-256, which cannot be reversed and can be compared with the same fingerprint of the key you hold.
const PLACEHOLDER = /^[\w.-]{0,60}placeholder[\w.-]{0,60}$/i;

/**
 * What this environment's P1 settings look like to the build or server, written for a log. Used by next.config.ts on Pantheon (never on
 * live) to answer "which value does this environment actually get?" when a multidev build reports no usable P1 credentials.
 */
export function describeP1Credentials(env: Env = process.env): string {
  const key = env.CSS_API_KEY;
  const keyPart =
    key === undefined ? "CSS_API_KEY is not set"
    : key === "" ? "CSS_API_KEY is empty"
    : PLACEHOLDER.test(key) ? `CSS_API_KEY is the placeholder "${key}"`
    : `CSS_API_KEY is ${key.length} characters, sha256 ${fingerprint(key)}`;
  const names = Object.keys(env).filter((name) => /CSS|P1_|PANTHEON|APP_ENV|NEXT_PUBLIC/i.test(name)).sort().join(", ");
  return `${keyPart}; NEXT_PUBLIC_CSS_SITE_ID is ${env.NEXT_PUBLIC_CSS_SITE_ID ? "set" : "not set"}; NEXT_PUBLIC_CSS_BASE_URL is ${env.NEXT_PUBLIC_CSS_BASE_URL ?? "not set"}; related variable names: ${names || "(none)"}`;
}
