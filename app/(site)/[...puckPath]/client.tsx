"use client";

import dynamic from "next/dynamic";
import type { Data } from "@puckeditor/core";
import { Render } from "@puckeditor/core/rsc";
import publicConfig from "../../../puck.public";
import { useLocalFlag } from "../../../lib/site/use-local-flag";

/** localStorage key P1 sets while an editor is signed in (P1_LOGGED_IN_KEY in @pantheon-systems/puck-css; __tests__/public-config.test.ts checks they match). */
export const P1_LOGGED_IN = "p1_logged_in";

// Only a signed-in editor ever needs the widget, and it imports the editor tooling, so it is a separate chunk.
const P1EditWidget = dynamic(() => import("./edit-widget").then((m) => m.P1EditWidget), { ssr: false });

function EditWidgetGate({ route }: { route: string }) {
  return useLocalFlag(P1_LOGGED_IN) ? <P1EditWidget route={route} /> : null;
}

/**
 * Renders a published page. It uses Puck's lightweight Render (not puck-css's RenderClient, which pulls in Puck's editor core)
 * and the public config, so a visitor does not download the editor.
 */
export function Client({
  data,
  pageMetadata,
}: {
  data: Data;
  pageMetadata?: {
    route: string;
    documentName?: string;
    pageType?: "page" | "template" | "override";
  };
}) {
  return (
    <>
      <Render config={publicConfig} data={data} />
      {pageMetadata && <EditWidgetGate route={pageMetadata.route} />}
    </>
  );
}
