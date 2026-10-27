"use client";

import { Page } from "../../components/site/section";
import { Button, ButtonLink } from "../../design-system/components/Button";

/** Shown when a page throws while rendering. Keeps the header, footer and player in place. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Page narrow>
      <p className="font-display text-lg uppercase tracking-[0.25em] text-accent md:text-xl">500</p>
      <h1 className="font-gothic text-6xl leading-[0.95] text-text md:text-8xl">
        Something broke
      </h1>
      <p className="text-lg text-muted">That page failed to load. Try again, or head somewhere else.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">Home</ButtonLink>
      </div>
    </Page>
  );
}
