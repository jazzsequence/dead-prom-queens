export function SectionHeading({
  kicker,
  children,
  as: Tag = "h2",
}: {
  kicker?: string;
  children: string;
  /** Use "h1" for the page title; every page needs exactly one. */
  as?: "h1" | "h2";
}) {
  return (
    <header className="space-y-2">
      {kicker && (
        <p className="font-display text-base uppercase tracking-[0.25em] text-accent md:text-lg">
          {kicker}
        </p>
      )}
      <Tag className="font-gothic text-5xl leading-none text-text md:text-7xl">
        {children}
      </Tag>
      <span className="block h-px w-24 bg-[image:var(--grad-accent)]" aria-hidden />
    </header>
  );
}
