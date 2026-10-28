/**
 * Whether this build or server has real P1 credentials. CI, the e2e run and local checks deliberately use
 * placeholders (a key containing "placeholder", an all-zeros or missing site id) so they test the repo copies,
 * and in that case the site must not ask P1 for anything: every request goes to a real backend and is
 * refused, which is noise for the people who run it. A real key and a real UUID site id are required.
 */
import { getP1ApiKey, isLive } from "./p1-key";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ZEROS = /^[0-]+$/;

type Env = Record<string, string | undefined>;

/**
 * Why this environment has no usable P1 credentials, or null when it has them. Names the setting that is wrong and never includes a
 * value, so it is safe to print in a build log. On Pantheon a build without credentials quietly becomes a placeholder build (repo copies,
 * an unroutable broker URL, and P1 login failing with "Broker login failed (500)"); next.config.ts prints this so the log says why.
 */
export function p1ConfigProblem(env: Env = process.env): string | null {
  // getP1ApiKey owns which key a given environment uses (live has its own published-only key). It throws on live
  // without that key, which here simply means "not configured".
  const keyName = isLive(env) ? "CSS_API_KEY_LIVE" : "CSS_API_KEY";
  let key = "";
  try {
    key = getP1ApiKey(env) ?? "";
  } catch {
    return `${keyName} (the published-only key) is not set`;
  }
  if (!key) return `${keyName} is empty or not set`;
  if (/placeholder/i.test(key)) return `${keyName} is a placeholder`;
  const site = env.NEXT_PUBLIC_CSS_SITE_ID ?? "";
  if (!site) return "NEXT_PUBLIC_CSS_SITE_ID is empty or not set";
  if (!UUID.test(site) || ZEROS.test(site)) return "NEXT_PUBLIC_CSS_SITE_ID is not a real site id";
  return null;
}

export const isP1Configured = (env: Env = process.env): boolean => p1ConfigProblem(env) === null;
