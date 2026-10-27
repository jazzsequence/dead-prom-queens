export type LyricSection = { label: string; lines: string[] };

export function LyricsBlock({ title, album, sections }: { title: string; album?: string; sections: LyricSection[] }) {
  return (
    <article className="mx-auto max-w-xl space-y-10">
      <header className="space-y-2">
        {album && <p className="font-display text-base uppercase tracking-[0.25em] text-accent md:text-lg">{album}</p>}
        <h1 className="font-gothic text-5xl leading-none text-text md:text-7xl">{title}</h1>
      </header>
      {sections.map((s, i) => (
        <section key={`${i}-${s.label}`} className="space-y-3">
          {s.label && <h2 className="font-display text-xs uppercase tracking-[0.25em] text-accent-2">{s.label}</h2>}
          <p className="whitespace-pre-line text-lg leading-8">{s.lines.join("\n")}</p>
        </section>
      ))}
    </article>
  );
}
