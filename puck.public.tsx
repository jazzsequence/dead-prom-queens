import type { Config } from "@puckeditor/core";

import { lazyBlock } from "./components/puck/lazy-block";
import { puckRoot } from "./components/puck/root";
import { sharedComponents } from "./puck.components";

/**
 * What the public pages render with. The same blocks as the editor's config (puck.config.tsx), except that the three whose modules
 * import the editor tooling load on demand instead of sitting in every page's JavaScript (about 650 KiB gzipped of the 937 a page
 * shipped). Nothing here may import those modules statically; __tests__/public-config.test.ts checks that.
 */
export const publicConfig = {
  root: puckRoot,
  components: {
    ...sharedComponents,
    ParagraphBlock: lazyBlock(() => import("./components/puck/paragraph-block").then((m) => m.paragraphBlock)),
    GridBlock: lazyBlock(() => import("./components/puck/grid-block").then((m) => m.gridBlock)),
    DataListBlock: lazyBlock(() => import("./components/puck/data-list-block").then((m) => m.dataListBlock)),
  },
} as Config;

export default publicConfig;
