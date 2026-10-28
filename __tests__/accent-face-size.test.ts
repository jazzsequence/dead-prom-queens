import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The accent face (--font-gothic, Selfish) is a script that is unreadable small. It is for large headings only, at 48px
 * (text-5xl) and up; eyebrows and small headings use the display face. This reads the source for every use of
 * `font-gothic` and fails closed: each use must sit in one readable class string that ALSO states a size of at least
 * 48px, and carries no smaller size at another breakpoint. So a size set
 * somewhere else (`cn("font-gothic", "text-sm")`, a parent's class, a `${...}` expression, a string wrapped over
 * several lines) is a failure to explain, not a silent pass. Put a use that is legitimately built that way in
 * ALLOWED with the reason. Sizes built at runtime from a variable are the one thing a source scan cannot see; the
 * Typography story shows the minimum size for review.
 */
const MIN_PX = 48;
const ALLOWED: { file: string; reason: string }[] = [];

const SIZES: Record<string, number> = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72, "8xl": 96, "9xl": 128 };

// "md:text-sm/5", "!text-sm", "text-xl!" and "[&>span]:text-xs" are all a size; text-accent and text-text are not.
function sizePx(token: string): number | undefined {
  let t = token;
  for (let m = t.match(/^(?:\[[^\]]*\]|[^\s:[\]]+):/); m; m = t.match(/^(?:\[[^\]]*\]|[^\s:[\]]+):/)) t = t.slice(m[0].length);
  t = t.replace(/^!/, "").replace(/!$/, "").replace(/\/\S*$/, "");
  const named = t.match(/^text-(xs|sm|base|lg|xl|[2-9]xl)$/);
  if (named) return SIZES[named[1]];
  const arbitrary = t.match(/^text-\[(\d+(?:\.\d+)?)(px|rem)\]$/);
  if (arbitrary) return arbitrary[2] === "rem" ? Number(arbitrary[1]) * 16 : Number(arbitrary[1]);
  return undefined;
}

/** What is wrong with a class string that uses font-gothic, or undefined when it is fine. */
function problem(classes: string): string | undefined {
  const sizes = classes.split(/\s+/).map(sizePx).filter((n): n is number => n !== undefined);
  if (!sizes.length) return "states no size of its own";
  if (Math.min(...sizes) < MIN_PX) return `has a size under ${MIN_PX}px`;
  return undefined;
}

// The literal around a use: from the nearest quote or backtick before it to the nearest one after. A literal that
// wraps lines, runs long or holds a ${...} expression cannot be read this way, so it is reported as unresolved.
function literalAround(src: string, at: number): string | undefined {
  const before = Math.max(src.lastIndexOf('"', at), src.lastIndexOf("'", at), src.lastIndexOf("`", at));
  const afters = ['"', "'", "`"].map((q) => src.indexOf(q, at)).filter((i) => i !== -1);
  if (before === -1 || !afters.length) return undefined;
  const literal = src.slice(before + 1, Math.min(...afters));
  return literal.length <= 200 && !literal.includes("\n") && !literal.includes("${") ? literal : undefined;
}

type Use = { file: string; line: number; classes?: string };

function usesIn(src: string, file: string): Use[] {
  const found: Use[] = [];
  for (let at = src.indexOf("font-gothic"); at !== -1; at = src.indexOf("font-gothic", at + 1)) {
    const lineStart = src.lastIndexOf("\n", at) + 1;
    // A comment that names the class is not a use of it.
    if (/^\s*(\/\/|\/\*|\*)/.test(src.slice(lineStart, src.indexOf("\n", at) === -1 ? undefined : src.indexOf("\n", at)))) continue;
    found.push({ file, line: src.slice(0, at).split("\n").length, classes: literalAround(src, at) });
  }
  return found;
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" || name === ".next" ? [] : files(path);
    return /\.(tsx|ts|jsx|js|mdx)$/.test(name) ? [path] : [];
  });
}

function allUses(): Use[] {
  return ["app", "components", "design-system"].flatMap((dir) => files(join(root, dir)).flatMap((f) => usesIn(readFileSync(f, "utf-8"), relative(root, f))));
}

describe("the accent face is never set small", () => {
  it("finds the kickers it is meant to guard, and reads every one of them", () => {
    const uses = allUses();
    expect(uses.length).toBeGreaterThan(5);
    expect(uses.filter((u) => u.classes === undefined && !ALLOWED.some((a) => a.file === u.file)).map((u) => `${u.file}:${u.line}`)).toEqual([]);
  });

  it(`gives every use a size of its own, and never one under ${MIN_PX}px (text-5xl)`, () => {
    const bad = allUses()
      .filter((u) => u.classes !== undefined)
      .flatMap((u) => {
        const why = problem(u.classes!);
        return why ? [`${u.file}:${u.line} "${u.classes}" ${why}`] : [];
      });
    expect(bad).toEqual([]);
  });

  describe("the check itself", () => {
    it("flags every way of setting it small", () => {
      for (const bad of [
        "font-gothic text-xl text-accent",
        "font-gothic md:text-lg text-2xl",
        "text-sm font-gothic",
        "font-gothic text-[20px]",
        "font-gothic text-[1rem]",
        "font-gothic text-sm/5",
        "font-gothic text-xl!",
        "font-gothic !text-sm",
        "font-gothic [&>span]:text-xs",
        "font-gothic text-3xl md:text-sm",
        "font-gothic text-4xl",
        "font-gothic text-4xl md:text-5xl",
        "font-gothic text-[40px]",
        "font-gothic text-[2.5rem]",
      ]) {
        expect(problem(bad), bad).toBe("has a size under 48px");
      }
    });

    it("flags a use that does not state its own size", () => {
      for (const unsized of ["font-gothic", "font-gothic text-accent", "mb-2 font-gothic text-accent"]) expect(problem(unsized), unsized).toBe("states no size of its own");
    });

    it("accepts 48px and up", () => {
      for (const ok of ["font-gothic text-5xl text-text", "mb-2 font-gothic text-6xl", "font-gothic text-5xl md:text-7xl", "font-gothic text-[48px]", "font-gothic text-[3rem]", "font-gothic text-5xl/none"]) {
        expect(problem(ok), ok).toBeUndefined();
      }
    });

    it("cannot be fooled by a size set in a different literal, a ${} expression or a wrapped string", () => {
      const split = usesIn(`<p className={cn("font-gothic", "text-sm")}>x</p>`, "a.tsx");
      expect(split).toHaveLength(1);
      expect(problem(split[0].classes!)).toBe("states no size of its own");

      const template = usesIn('<p className={`font-gothic ${open ? "text-3xl" : "text-sm"}`}>x</p>', "b.tsx");
      expect(template[0].classes).toBeUndefined();

      const wrapped = usesIn("<p className={`\n  font-gothic\n  text-sm\n`}>x</p>", "c.tsx");
      expect(wrapped[0].classes).toBeUndefined();

      const long = usesIn(`<p className="${"a ".repeat(120)}font-gothic text-sm">x</p>`, "d.tsx");
      expect(long[0].classes).toBeUndefined();
    });

    it("does not count a comment that merely names the class", () => {
      expect(usesIn(" * Large headings use font-gothic, a script.\n// font-gothic is for headings\n/* font-gothic */", "e.tsx")).toEqual([]);
    });
  });
});
