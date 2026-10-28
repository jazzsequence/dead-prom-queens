"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type Loaded = { render: (props: never) => React.ReactNode };

/**
 * A Puck block that loads its code the first time a page uses it. The public config (puck.public.tsx) uses this for the blocks whose
 * modules import the editor tooling (the design toolkit with its charts, Puck's editor core, drag and drop), so visitors only
 * download that when a published page really contains one of these blocks. Only `render` is needed to show a page.
 */
export function lazyBlock(load: () => Promise<Loaded>) {
  const Lazy = dynamic(async () => ({ default: (await load()).render as unknown as ComponentType<Record<string, unknown>> }));
  return { render: (props: Record<string, unknown>) => <Lazy {...props} /> };
}
