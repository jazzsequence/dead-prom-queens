import type { Metadata } from "next";

import { Page } from "../../components/site/section";
import { ButtonLink } from "../../design-system/components/Button";
import { features } from "../../lib/band/config";
import { pageMetadata } from "../../lib/site/seo";

export const metadata: Metadata = pageMetadata({ title: "Page not found", description: "That page does not exist.", path: "/404", noindex: true });

/** Rendered inside the site layout, so unknown URLs keep the header, footer and player. */
export default function NotFound() {
  return (
    <Page narrow>
      <p className="font-display text-lg uppercase tracking-[0.25em] text-accent md:text-xl">404</p>
      <h1 className="font-gothic text-6xl leading-[0.95] text-text md:text-8xl">
        Nothing here
      </h1>
      <p className="text-lg text-muted">That page doesn&apos;t exist. Try one of these instead.</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        {features.tour && <ButtonLink href="/tour" variant="outline">Tour dates</ButtonLink>}
        <ButtonLink href="/listen" variant="outline">Listen</ButtonLink>
      </div>
    </Page>
  );
}
