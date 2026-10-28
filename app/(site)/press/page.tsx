import { promises as fs } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";

import { Page } from "../../../components/site/section";
import { StandardDocumentLink } from "../../../components/site/standard-document-link";
import { P1Page } from "../../../components/site/p1-page";
import { features } from "../../../lib/band/config";
import { getP1Page } from "../../../lib/site/p1-content";
import { p1PageMetadata } from "../../../lib/site/p1-metadata";

export const revalidate = 300;

export const generateMetadata = (): Promise<Metadata> => p1PageMetadata({
  title: "Press",
  description: "Interviews and reviews.",
  path: "/press",
  type: "article",
});

// The page title in Selfish, as typed, like the Article block's `# Title` (components/puck/band/content-blocks.tsx). Its own
// literal so the accent-face-size test can read the size it states.
const PRESS_TITLE = "prose-h1:font-gothic prose-h1:text-5xl prose-h1:font-normal prose-h1:normal-case prose-h1:leading-none prose-h1:tracking-normal md:prose-h1:text-7xl";

async function PressFallback() {
  const md = await fs.readFile(path.join(process.cwd(), "content", "press", "article.md"), "utf8");
  return (
    <Page narrow>
      <StandardDocumentLink path="/press" />
      <article
        className={`prose prose-invert max-w-none ${PRESS_TITLE} prose-headings:font-display prose-headings:font-normal prose-headings:uppercase prose-headings:tracking-[0.04em] prose-h2:text-xl prose-h2:font-body prose-h2:normal-case prose-h2:tracking-normal prose-strong:text-text prose-a:text-accent-3`}
      >
        {/* The article's title is a level-2 heading in the source; promote it so the page has an h1. */}
        <Markdown components={{ h2: ({ children }) => <h1>{children}</h1>, h3: ({ children }) => <h2>{children}</h2> }}>
          {md}
        </Markdown>
      </article>
    </Page>
  );
}

/** The published P1 page when there is one, otherwise the code version above. */
export default async function PressRoute() {
  if (!features.press) notFound();
  const doc = await getP1Page("/press");
  return doc ? <P1Page data={doc} path="/press" /> : <PressFallback />;
}
