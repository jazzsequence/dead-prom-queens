/**
 * Regenerates icons and the social card from the wordmark font. Run: node scripts/make-brand-assets.mjs
 *
 * app/   icon.png, icon.svg, apple-icon.png, favicon.ico   (Next file conventions)
 * public/icons/   icon-192.png, icon-512.png, icon-maskable-512.png   (referenced by app/manifest.ts)
 * public/og-default.jpg   1200x630 social card
 *
 * The mark is the band name's first letter on the site's darkest surface with an accent bar, and the card is the
 * name over the hero photo (public/images/hero.jpg) with the same left and bottom shades the hero uses, or on a
 * surface gradient when there is no photo. Name and colours come from band.config.json and the generated theme (run `pnpm theme`
 * first if you changed the palette), so a re-themed band gets matching assets.
 *
 * The face is the band's own wordmark when typography.customFaces.wordmark.source names a font file under docs/fonts/
 * (gitignored: the font is never committed, only what is drawn with it), otherwise Unbounded.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { chromium } from "@playwright/test";
import opentype from "opentype.js";

const require = createRequire(import.meta.url);
const unbounded = (file) =>
  path.join(path.dirname(require.resolve("@fontsource-variable/unbounded/package.json")), "files", file);

const { band, typography } = JSON.parse(readFileSync("band.config.json", "utf8"));

// The face the marks are drawn in. `outline` is what opentype.js reads for the SVG favicon (it reads WOFF and TTF, not
// WOFF2); `embed` is what the browser renders the PNGs from. Unbounded is wide, bold and set tight in capitals; a custom
// face is one weight, set as typed with normal tracking, like the Wordmark component.
function chooseFace() {
  const custom = typography?.customFaces?.wordmark;
  if (!custom?.source) {
    const staticFont = path.join(path.dirname(require.resolve("@fontsource/unbounded/package.json")), "files/unbounded-latin-800-normal.woff");
    return {
      embed: `url(data:font/woff2;base64,${readFileSync(unbounded("unbounded-latin-wght-normal.woff2")).toString("base64")})`,
      weightRange: "200 900", weight: 800, spacing: "-0.05em", transform: "uppercase", outline: readFileSync(staticFont), iconScale: 1, iconShift: "-1%, -6%",
    };
  }
  const file = path.join("docs/fonts", custom.source);
  if (!existsSync(file)) {
    throw new Error(`typography.customFaces.wordmark.source is "${custom.source}" but ${file} is missing. Put the original font file there (docs/ is gitignored and the font is never committed), or remove "source" to draw with Unbounded.`);
  }
  const bytes = readFileSync(file);
  const format = /\.otf$/i.test(file) ? "opentype" : "truetype";
  return { embed: `url(data:font/${format === "opentype" ? "otf" : "ttf"};base64,${bytes.toString("base64")}) format("${format}")`, weightRange: "400", weight: 400, spacing: "0", transform: "none", outline: bytes, custom: true, iconScale: 1.3, iconShift: "-1%, -12%" };
}
const FACE = chooseFace();
const theme = readFileSync("design-system/theme.generated.css", "utf8");
const token = (name) => theme.match(new RegExp(`--color-${name}: (#[0-9a-f]{6});`))?.[1] ?? (() => { throw new Error(`--color-${name} not found in theme.generated.css; run pnpm theme`); })();
const INK = token("void");
const SURFACE = token("surface");
const RAISED = token("raised");
const METAL_HI = token("metal-hi");
const ACCENT = token("accent");
const NAME = band.name;
const INITIAL = [...NAME][0].toUpperCase();
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const parseFont = (buf) => opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const font = parseFont(FACE.outline);
// Shrink the card title so a long name still fits inside the margins: measured from the face's own advances for a
// custom face; Unbounded, which is wide, keeps the estimate it has always used.
const TITLE_SIZE = FACE.custom
  ? Math.max(56, Math.min(168, Math.floor(1056 / font.getAdvanceWidth(NAME, 1))))
  : Math.max(56, Math.min(168, Math.floor(1056 / ([...NAME].length * 0.9))));

// The photo behind the social card, when it exists. Embedded as a data URL so the browser needs nothing else.
const OG_PHOTO = "public/images/hero.jpg";
const photo = existsSync(OG_PHOTO) ? readFileSync(OG_PHOTO).toString("base64") : undefined;
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const fontFace = `@font-face { font-family: U; src: ${FACE.embed}; font-weight: ${FACE.weightRange}; }`;

const iconHtml = (size, { round, scale }) => `<!doctype html><meta charset="utf-8"><style>
  ${fontFace}
  html, body { margin: 0; background: transparent; }
  .icon { width: ${size}px; height: ${size}px; background: ${INK}; position: relative; overflow: hidden;
    display: grid; place-items: center; border-radius: ${round ? size * 0.2 : 0}px; }
  .icon span { font: ${FACE.weight} ${size * scale * FACE.iconScale}px/1 U; color: ${METAL_HI}; letter-spacing: ${FACE.spacing}; transform: translate(${FACE.iconShift}); }
  .icon i { position: absolute; left: 0; right: 0; bottom: 0; height: ${size * 0.13}px; background: ${ACCENT}; }
</style><div class="icon"><span>${esc(INITIAL)}</span><i></i></div>`;

const ogHtml = `<!doctype html><meta charset="utf-8"><style>
  ${fontFace}
  html, body { margin: 0; }
  .card { width: 1200px; height: 630px; position: relative; overflow: hidden; background: linear-gradient(135deg, ${INK} 0%, ${SURFACE} 45%, ${RAISED} 100%); }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 6%; }
  .card .shade { position: absolute; inset: 0;
    background: linear-gradient(90deg, ${rgba(INK, 0.92)} 0%, ${rgba(INK, 0.55)} 38%, ${rgba(INK, 0)} 68%),
                linear-gradient(0deg, ${rgba(INK, 0.85)} 0%, ${rgba(INK, 0)} 40%); }
  .card h1 { position: absolute; left: 72px; right: 72px; bottom: 64px; margin: 0; font: ${FACE.weight} ${TITLE_SIZE}px/1 U; letter-spacing: ${FACE.spacing}; text-transform: ${FACE.transform}; color: ${METAL_HI}; }
  .card .bar { position: absolute; left: 72px; bottom: 40px; width: 150px; height: 8px; background: ${ACCENT}; }
</style><div class="card">${photo ? `<img src="data:image/jpeg;base64,${photo}" alt=""><div class="shade"></div>` : ""}<h1>${esc(NAME)}</h1><div class="bar"></div></div>`;

const browser = await chromium.launch();
const shoot = async (html, w, h, selector, type = "png") => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html);
  await page.evaluate((weight) => document.fonts.load(`${weight} 64px U`), FACE.weight);
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.locator(selector).screenshot({ omitBackground: true, type, ...(type === "jpeg" ? { quality: 88 } : {}) });
  await page.close();
  return buf;
};
// Rounded icons carry an alpha channel, which Next requires for the PNGs inside favicon.ico.
const icon = (size, opts = { round: true, scale: 0.64 }) => shoot(iconHtml(size, opts), size, size, ".icon");

mkdirSync("public/icons", { recursive: true });
writeFileSync("app/icon.png", await icon(512));
writeFileSync("app/apple-icon.png", await icon(180, { round: false, scale: 0.64 }));
writeFileSync("public/icons/icon-192.png", await icon(192));
writeFileSync("public/icons/icon-512.png", await icon(512));
// Maskable: full bleed, with the mark inside the central 80% safe zone.
writeFileSync("public/icons/icon-maskable-512.png", await icon(512, { round: false, scale: 0.5 }));
writeFileSync("public/og-default.jpg", await shoot(ogHtml, 1200, 630, ".card", "jpeg"));

// SVG favicon: outline the glyph so it does not depend on the font being installed. `font` is the face parsed above
// (opentype.js reads WOFF and TTF, not WOFF2, which is why Unbounded's static 800 weight is used for it).
const fontSize = 512 * 0.64 * FACE.iconScale;
const glyph = font.getPath(INITIAL, 0, 0, fontSize);
const box = glyph.getBoundingBox();
// Centre horizontally, and sit slightly above centre to leave room for the bar (matches the PNGs).
const dx = (512 - (box.x2 - box.x1)) / 2 - box.x1 - 512 * 0.01;
const dy = (512 - (box.y2 - box.y1)) / 2 - box.y1 - 512 * 0.06;
glyph.commands.forEach((c) => {
  for (const k of ["x", "x1", "x2"]) if (k in c) c[k] += dx;
  for (const k of ["y", "y1", "y2"]) if (k in c) c[k] += dy;
});
writeFileSync(
  "app/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>${esc(NAME)}</title>` +
    `<clipPath id="r"><rect width="512" height="512" rx="102"/></clipPath>` +
    `<g clip-path="url(#r)"><rect width="512" height="512" fill="${INK}"/>` +
    `<path d="${glyph.toPathData(2)}" fill="${METAL_HI}"/>` +
    `<rect y="445" width="512" height="67" fill="${ACCENT}"/></g></svg>\n`,
);

// PNG-in-ICO: header, directory entries, then the PNG payloads.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => icon(n)));
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((n, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(n, 0);
  e.writeUInt8(n, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
writeFileSync("app/favicon.ico", Buffer.concat([head, ...entries, ...pngs]));
await browser.close();
