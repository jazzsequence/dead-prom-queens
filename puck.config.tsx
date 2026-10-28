import type { Config } from "@puckeditor/core";

import { gridBlock } from "./components/puck/grid-block";
import { paragraphBlock } from "./components/puck/paragraph-block";
import { puckRoot } from "./components/puck/root";
import { dataListBlock } from "./components/puck/data-list-block";
import { p1Categories } from "./components/puck/blocks";
import { band } from "./lib/band/config";
import { sharedComponents } from "./puck.components";

export const config = {
  categories: {
    ...p1Categories,
    band: {
      title: band.name,
      components: [
        "HeroBlock",
        "PageHeadingBlock",
        "SectionHeadingBlock",
        "ImageTextBlock",
        "ArticleBlock",
        "ImageGalleryBlock",
        "ButtonRowBlock",
        "TourDatesBlock",
        "TourPreviewBlock",
        "MerchGridBlock",
        "AlbumGridBlock",
        "AlbumHeaderBlock",
        "TrackListBlock",
        "AlbumSectionBlock",
        "LyricsIndexBlock",
      ],
    },
    data: {
      title: "Data",
      components: ["DataListBlock"],
    },
    pages: {
      title: "Page Sections",
      components: ["P1WelcomeBlock"],
    },
    // Replaced by the P1 component library. Still registered so existing pages
    // render, but hidden so new pages use the library versions.
    deprecated: {
      title: "Deprecated",
      components: [
        "HeadingBlock",
        "ParagraphBlock",
        "QuoteBlock",
        "ImageBlock",
        "MediaFigureBlock",
        "GridBlock",
        "DividerBlock",
        "SpacerBlock",
        "ButtonBlock",
      ],
      visible: false,
    },
  },
  root: puckRoot,
  components: {
    ...sharedComponents,
    ParagraphBlock: paragraphBlock,
    GridBlock: gridBlock,
    DataListBlock: dataListBlock,
  },
} as Config;

export default config;
