import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

/**
 * Options for the heading system, side by side for the owner to choose from. Large headings (the page h1 and the
 * section h2) are Selfish in every option, at 48px or more: it is a script and unreadable small. What changes is the
 * face for eyebrows, small headings and labels, since neither Selfish nor Broken 15 (a logo face) works small.
 * The candidates besides Space Grotesk and Encode Sans Expanded (both already on the site) are loaded from Google
 * Fonts for this story only, so nothing is added to the site until one is chosen. Unbounded is in none of them.
 * Nothing here is wired into the site; choosing one is a follow-up change.
 */
const meta = { title: "Foundations/Heading options", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const CANDIDATE_FONTS =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=Special+Elite&display=swap";

type Option = {
  name: string;
  note: string;
  /** font-family for the eyebrow, small headings and labels */
  face: string;
  eyebrow: string;
  small: string;
  label: string;
  /** Large headings: Selfish in every option, the current face for the reference row. */
  h1: string;
  h2: string;
};

const SELFISH_H1 = "font-gothic text-7xl leading-[0.95] text-text md:text-9xl";
const SELFISH_H2 = "font-gothic text-5xl leading-none text-text md:text-7xl";

const OPTIONS: Option[] = [
  {
    name: "Today (for reference)",
    note: "Selfish only for the eyebrow; every heading in Encode Sans Expanded 800, capitals.",
    face: "var(--font-display)",
    eyebrow: "font-gothic text-5xl text-accent md:text-6xl",
    small: "text-2xl font-extrabold uppercase tracking-[-0.02em]",
    label: "text-xs font-semibold uppercase tracking-[0.18em]",
    h1: "text-metal font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-[-0.04em] md:text-8xl",
    h2: "text-metal font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-6xl",
  },
  {
    name: "B. Space Grotesk (already on the site)",
    note: "The generic option and the only one that adds nothing: the body face, bold, capitals, wide tracking.",
    face: "var(--font-body)",
    eyebrow: "text-sm font-bold uppercase tracking-[0.3em] text-accent",
    small: "text-xl font-bold uppercase tracking-[0.12em] text-text",
    label: "text-xs font-bold uppercase tracking-[0.18em]",
    h1: SELFISH_H1,
    h2: SELFISH_H2,
  },
  {
    name: "D. Barlow Condensed (new)",
    note: "A tall condensed grotesk, the gig-poster look. Narrow, so small headings stay short and readable and sit well under a wide script.",
    face: '"Barlow Condensed", "Arial Narrow", sans-serif',
    eyebrow: "text-xl font-bold uppercase tracking-[0.3em] text-accent",
    small: "text-3xl font-bold uppercase tracking-[0.06em] text-text",
    label: "text-sm font-bold uppercase tracking-[0.2em]",
    h1: SELFISH_H1,
    h2: SELFISH_H2,
  },
  {
    name: "E. Special Elite (new)",
    note: "A distressed typewriter, the photocopied-zine look. It has one weight and a lot of character, so it suits short labels better than long headings.",
    face: '"Special Elite", "Courier New", monospace',
    eyebrow: "text-base uppercase tracking-[0.25em] text-accent",
    small: "text-2xl text-text",
    label: "text-sm uppercase tracking-[0.15em]",
    h1: SELFISH_H1,
    h2: SELFISH_H2,
  },
  {
    name: "F. Cormorant Garamond (new)",
    note: "A high-contrast Victorian serif: the gothic-novel look, and the calmest pairing with Selfish. Thin strokes, so it is set bold and larger than the sans options.",
    face: '"Cormorant Garamond", Georgia, serif',
    eyebrow: "text-xl font-bold uppercase tracking-[0.3em] text-accent",
    small: "text-3xl font-bold text-text",
    label: "text-base font-bold uppercase tracking-[0.2em]",
    h1: SELFISH_H1,
    h2: SELFISH_H2,
  },
];

function Sample({ o }: { o: Option }) {
  const face = { fontFamily: o.face };
  return (
    <section className="border-b border-line px-6 py-12 md:px-12">
      <h2 className="mb-1 font-body text-sm font-bold uppercase tracking-[0.18em] text-text">{o.name}</h2>
      <p className="mb-10 max-w-2xl font-body text-sm text-muted">{o.note}</p>

      <div className="space-y-12">
        <div>
          <p className={o.eyebrow} style={face}>
            New album
          </p>
          <p className={o.h1}>Debut album</p>
        </div>

        <div>
          <p className={o.h2}>Latest releases</p>
          <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-4">
              <p className={o.small} style={face}>
                First EP
              </p>
              <p className="mt-1 font-body text-sm text-muted">2 tracks</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4">
              <p className={o.small} style={face}>
                Unreleased
              </p>
              <p className="mt-1 font-body text-sm text-muted">1 track</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl space-y-3">
          <p className={o.small} style={face}>
            What we collect
          </p>
          <p className="font-body text-base text-muted">
            Placeholder body copy under a small heading, so the pairing can be judged in running text.
          </p>
          <span className={`inline-block border border-dim px-6 py-3 text-muted ${o.label}`} style={face}>
            Listen
          </span>
        </div>
      </div>
    </section>
  );
}

// Story-only: pulls the candidate faces so they can be judged before anything is added to the site.
function CandidateFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CANDIDATE_FONTS;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  return null;
}

export const Options: Story = {
  render: () => (
    <div>
      <CandidateFonts />
      {OPTIONS.map((o) => (
        <Sample key={o.name} o={o} />
      ))}
    </div>
  ),
};
