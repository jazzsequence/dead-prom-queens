import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { P1_LOGGED_IN_KEY } from "@pantheon-systems/puck-css";
import { describe, expect, it } from "vitest";

import { P1_LOGGED_IN } from "../app/(site)/[...puckPath]/client";
import config from "../puck.config";
import publicConfig from "../puck.public";

const root = resolve(__dirname, "..");
const CLIENT = "app/(site)/[...puckPath]/client.tsx";

// Everything a published page's JavaScript pulls in statically from client.tsx. These modules import the editor tooling (the design
// toolkit with its charts, Puck's editor core, drag and drop): about 650 KiB gzipped, which made every P1 page ship 937 KiB of
// JavaScript against 183 for a page without Puck. They may only be reached through a dynamic import().
const FORBIDDEN_PACKAGES = new Set([
  "@pantheon-systems/puck-css",
  "@pantheon-systems/puck-css/connectable",
  "@pantheon-systems/pds-toolkit-react",
  "@puckeditor/core",
  "recharts",
]);
const FORBIDDEN_FILES = new Set([
  "puck.config.tsx",
  "components/puck/paragraph-block.tsx",
  "components/puck/grid-block.tsx",
  "components/puck/data-list-block/data-list-block.tsx",
  "components/puck/data-list-block/index.ts",
  "components/puck/paragraph-editor-text.tsx",
]);

/** The non-type import and re-export specifiers of a source file (dynamic import() is deliberately not matched). */
function staticImports(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/^(?:import|export)\s+(type\s+)?(?:[^;]*?\sfrom\s+)?["']([^"']+)["']/gm)) if (!m[1]) out.push(m[2]);
  return out;
}

function resolveLocal(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(c) && /\.(tsx?|jsx?)$/.test(c)) return c;
  return null;
}

/** Walk the project files statically reachable from `entry`, returning each forbidden thing reached and the file that imports it. */
function violations(entry: string): string[] {
  const seen = new Set<string>();
  const found: string[] = [];
  const queue = [resolve(root, entry)];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of staticImports(readFileSync(file, "utf-8"))) {
      if (!spec.startsWith(".")) {
        if (FORBIDDEN_PACKAGES.has(spec)) found.push(`${relative(root, file)} imports ${spec}`);
        continue;
      }
      const target = resolveLocal(file, spec);
      if (!target) continue;
      if (FORBIDDEN_FILES.has(relative(root, target))) found.push(`${relative(root, file)} imports ${relative(root, target)}`);
      else queue.push(target);
    }
  }
  return found;
}

describe("the public Puck config", () => {
  it("has exactly the blocks the editor's config has, so a published page never meets an unknown block", () => {
    expect(Object.keys(publicConfig.components).sort()).toEqual(Object.keys(config.components).sort());
  });

  it("swaps the three heavy blocks for lazy ones and shares every other block with the editor", () => {
    const heavy = ["ParagraphBlock", "GridBlock", "DataListBlock"];
    for (const name of Object.keys(config.components)) {
      const same = publicConfig.components[name] === config.components[name];
      expect(same, name).toBe(!heavy.includes(name));
    }
  });

  it("keeps the editor tooling out of what the public client imports statically", () => {
    expect(violations(CLIENT)).toEqual([]);
  });

  it("the check can see a violation (it is not passing because it finds nothing)", () => {
    expect(violations("puck.config.tsx").length).toBeGreaterThan(0);
  });

  it("uses the signed-in key puck-css sets, so the edit pill appears for an editor", () => {
    expect(P1_LOGGED_IN).toBe(P1_LOGGED_IN_KEY);
  });
});
