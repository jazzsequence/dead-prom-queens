import type { Metadata } from "next";

import { Page } from "../../../components/site/section";
import { ButtonLink } from "../../../design-system/components/Button";
import { band, features } from "../../../lib/band/config";
import { pageMetadata } from "../../../lib/site/seo";
import { JsonLd } from "../../../components/site/json-ld";
import { getP1Page, rootProp } from "../../../lib/site/p1-content";
import { artistData } from "../../../lib/site/structured-data";
import { LightboxImage } from "../../../design-system/components/LightboxImage";
import { P1Page } from "../../../components/site/p1-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getP1Page("/bio");
  return pageMetadata({
    title: rootProp(doc, "title") ?? "Bio",
    description: rootProp(doc, "description") ?? band.description,
    path: "/bio",
    image: "/images/band-bw.jpg",
  });
}

/** Renders the published P1 page when there is one; otherwise this copy. */
export default async function Bio() {
  const doc = await getP1Page("/bio");
  if (doc) {
    return (
      <>
        <JsonLd data={artistData()} />
        <P1Page data={doc} path="/bio" />
      </>
    );
  }
  return (
    <Page>
      <JsonLd data={artistData()} />
      <div className="space-y-10">
        <LightboxImage
          src="/images/band-bw.jpg"
          alt={`${band.name} in black and white against a peeling wall: Cilla Hex, Dead Wren Walking and Ellis Static, left to right.`}
          width={1600}
          height={1073}
          fetchPriority="high"
          className="w-full rounded-card border border-line"
        />
        <div className="max-w-3xl space-y-6">
          <p className="font-display text-lg uppercase tracking-[0.25em] text-accent md:text-xl">About</p>
          <h1 className="font-gothic text-6xl leading-[0.95] text-text md:text-8xl">
            {band.name}
          </h1>
          <div className="space-y-4 text-lg leading-8 text-muted">
            <p>
              {band.name} make deathrock and trash goth post-punk with the tape hiss left in: drum machines and handclaps, fuzzy
              bass out front, cheap synth stabs and a jangling guitar, recorded on a four-track.
            </p>
            <p>
              Cilla Hex fronts the band, a theatrical, unsteady voice that swings from sweet to shrill inside a line. Dead Wren Walking
              plays bass, guitar and keys, and sings two songs. Ellis Static plays guitar and synths and does the programming.
            </p>
            <p>Class of Never is their first album: a night at the prom, from the crowning to the last slow dance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {features.tour && <ButtonLink href="/tour">Tour dates</ButtonLink>}
            {features.press && <ButtonLink href="/press" variant="outline">Press</ButtonLink>}
          </div>
        </div>
      </div>
    </Page>
  );
}
