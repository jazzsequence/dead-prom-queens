import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteDataProvider } from "../components/site/site-data";
import albums from "../data/albums.json";
import { getCatalog } from "../lib/site/catalog";
import { getLyrics } from "../lib/site/lyrics";
import type { SiteData } from "../lib/site/site-data";
import { shows } from "../lib/site/tour";
import config from "../puck.config";

const FIXTURES = path.join(process.cwd(), "content", "p1-pages");
const pages = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, doc: JSON.parse(readFileSync(path.join(FIXTURES, f), "utf8")) as { path: string; content: { type: string; props: Record<string, unknown> }[] } }));

/** Site data from the repo copy only: the real loader asks P1, which cannot run outside a request. */
async function getSiteData(): Promise<SiteData> {
  const lyrics = await getLyrics();
  return { albums: await getCatalog(), shows, lyrics: lyrics.map(({ slug, title, album, track }) => ({ slug, title, album, track })) };
}

const components = config.components as Record<string, { render: (p: never) => React.ReactElement; defaultProps?: object }>;

describe("the P1 page definitions", () => {
  it("only use blocks that are registered", () => {
    for (const { file, doc } of pages) for (const b of doc.content) expect(components[b.type], `${file}: unknown block ${b.type}`).toBeDefined();
  });

  it("only point at albums that exist in the catalog", () => {
    const slugs = new Set(albums.map((a) => a.slug));
    for (const { file, doc } of pages) for (const b of doc.content) if (typeof b.props.albumSlug === "string") expect(slugs.has(b.props.albumSlug), `${file}: ${b.props.albumSlug}`).toBe(true);
  });

  it("each have exactly one block that supplies the page's h1", () => {
    const h1 = new Set(["HeroBlock", "PageHeadingBlock", "AlbumHeaderBlock", "ArticleBlock"]);
    for (const { file, doc } of pages) expect(doc.content.filter((b) => h1.has(b.type)).length, file).toBe(1);
  });
});

describe("blocks", () => {
  it("the image gallery's one-column option is one wide picture, and 2 and 3 keep the grid", () => {
    const items = [
      { imageUrl: "/images/hero.jpg", alt: "A wide photo" },
      { imageUrl: "/images/band-bw.jpg", alt: "Another photo" },
    ];
    const render = (columns: string) => renderToStaticMarkup(components.ImageGalleryBlock.render({ columns, items } as never));
    expect(render("1")).not.toContain("grid-cols-");
    expect(render("2")).toContain("sm:grid-cols-2");
    expect(render("2")).not.toContain("md:grid-cols-3");
    expect(render("3")).toContain("md:grid-cols-3");
  });

  // P1 media serves an upload at its original size unless the URL asks for less (lib/site/media-url.ts): /bio was 11 MB without this.
  describe("P1 media pictures", () => {
    const media = "https://media.p1.pantheon.io/image/a5773c86-3c93-46ed-9450-8f363b7f0982/assets/8cb57e31/photo.jpg?fit=scale-down";
    const html = (type: string, props: object) => {
      const block = components[type] as { render: (p: never) => React.ReactElement; defaultProps?: object };
      return renderToStaticMarkup(block.render({ ...block.defaultProps, ...props } as never));
    };

    it("are requested at the size they are drawn at, wider for one wide picture than for a grid", () => {
      const items = [{ imageUrl: media, alt: "A photo" }];
      expect(html("ImageGalleryBlock", { columns: "1", items })).toContain("width=1500");
      expect(html("ImageGalleryBlock", { columns: "2", items })).toContain("width=1000");
      expect(html("ImageGalleryBlock", { columns: "3", items })).toContain("width=1000");
      expect(html("ImageTextBlock", { imageUrl: media, imageAlt: "A photo" })).toContain("width=1000");
      expect(html("MerchGridBlock", { items: [{ name: "Tee", price: "$25", imageUrl: media }] })).toContain("width=1000");
      expect(html("HeroBlock", { imageUrl: media, title: "Title" })).toContain("width=1500");
    });

    // P1 media sends an upload back unresized when the width asked for is at or above the upload's own width, and this site's uploads are
    // 1024 and 1600 px wide. A width above 1500 (or 1000 for the narrow ones) silently turns the saving off, as a 1200 and a 1600 did.
    it("stay below the widths of the uploads on this site (1024 and 1600 px), or P1 media sends the original", () => {
      const items = [{ imageUrl: media, alt: "A photo" }];
      const widths = [
        html("ImageGalleryBlock", { columns: "2", items }),
        html("ImageGalleryBlock", { columns: "3", items }),
        html("ImageTextBlock", { imageUrl: media, imageAlt: "A photo" }),
        html("MerchGridBlock", { items: [{ name: "Tee", price: "$25", imageUrl: media }] }),
      ].map((h) => Number(/width=(\d+)/.exec(h)?.[1]));
      for (const w of widths) expect(w).toBeLessThan(1024);
    });

    it("leave local images and other hosts alone", () => {
      const items = [
        { imageUrl: "/images/hero.jpg", alt: "Local" },
        { imageUrl: "https://example.com/photo.jpg", alt: "Elsewhere" },
      ];
      expect(html("ImageGalleryBlock", { columns: "2", items })).not.toContain("width=");
    });
  });

  it("every block renders from its default props without throwing", async () => {
    const site = await getSiteData();
    for (const [name, block] of Object.entries(components)) {
      if (!name.endsWith("Block") || ["P1WelcomeBlock", "DataListBlock"].includes(name)) continue;
      expect(() => renderToStaticMarkup(<SiteDataProvider initial={site}>{block.render((block.defaultProps ?? {}) as never)}</SiteDataProvider>), name).not.toThrow();
    }
  });

  it("catalog blocks show the catalog's own data", async () => {
    const site = await getSiteData();
    const html = (name: string, props: object) => renderToStaticMarkup(<SiteDataProvider initial={site}>{components[name].render(props as never)}</SiteDataProvider>);
    const album = html("TrackListBlock", { albumSlug: "class-of-never", heading: "Track list" });
    expect(album).toContain("Crowned &amp; Buried");
    expect(album).toContain("Slow Dance, Open Casket");
    expect(html("AlbumHeaderBlock", { albumSlug: "class-of-never", kicker: "" })).toContain(">Class of Never<");
    expect(html("LyricsIndexBlock", {})).toContain("/lyrics/crowned-and-buried");
    expect(html("AlbumGridBlock", { headingLevel: "h2", includeUnreleased: "no" })).not.toContain("Unreleased");
    expect(html("TourPreviewBlock", { count: 2, heading: "Tour", kicker: "", linkLabel: "", linkHref: "" }).match(/Get tickets|Sold out/g)?.length).toBe(2);
  });

  it("an unknown album says so instead of crashing", async () => {
    const site = await getSiteData();
    const out = renderToStaticMarkup(<SiteDataProvider initial={site}>{components.TrackListBlock.render({ albumSlug: "nope" } as never)}</SiteDataProvider>);
    expect(out).toContain("check the Album choice");
  });

  it("show a loading state while the editor fetches the catalog", () => {
    const out = renderToStaticMarkup(<SiteDataProvider>{components.AlbumGridBlock.render({} as never)}</SiteDataProvider>);
    expect(out).toContain("Loading albums");
  });
});
