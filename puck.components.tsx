/**
 * The Puck blocks every page can render. The editor config (puck.config.tsx) adds the three heavy ones back as they are;
 * the public config (puck.public.tsx) loads them on demand, so the editor tooling they import never reaches visitors.
 */
import { p1Blocks } from "./components/puck/blocks";
import { buttonBlock } from "./components/puck/button-block";
import { dividerBlock } from "./components/puck/divider-block";
import { headingBlock } from "./components/puck/heading-block";
import { imageBlock } from "./components/puck/image-block";
import { mediaFigureBlock } from "./components/puck/media-figure-block";
import { quoteBlock } from "./components/puck/quote-block";
import { spacerBlock } from "./components/puck/spacer-block";
import { welcomeBlock } from "./components/puck/welcome-block";
import { albumGridBlock, albumHeaderBlock, albumSectionBlock, lyricsIndexBlock, tourPreviewBlock, trackListBlock } from "./components/puck/band/catalog-blocks";
import { articleBlock, buttonRowBlock, heroBlock, imageGalleryBlock, sectionHeadingBlock } from "./components/puck/band/content-blocks";
import { imageTextBlock } from "./components/puck/band/image-text-block";
import { merchGridBlock } from "./components/puck/band/merch-grid-block";
import { pageHeadingBlock } from "./components/puck/band/page-heading-block";
import { tourDatesBlock } from "./components/puck/band/tour-dates-block";

export const sharedComponents = {
  ...p1Blocks,
  HeroBlock: heroBlock,
  SectionHeadingBlock: sectionHeadingBlock,
  ArticleBlock: articleBlock,
  ImageGalleryBlock: imageGalleryBlock,
  ButtonRowBlock: buttonRowBlock,
  TourPreviewBlock: tourPreviewBlock,
  AlbumGridBlock: albumGridBlock,
  AlbumHeaderBlock: albumHeaderBlock,
  TrackListBlock: trackListBlock,
  AlbumSectionBlock: albumSectionBlock,
  LyricsIndexBlock: lyricsIndexBlock,
  PageHeadingBlock: pageHeadingBlock,
  ImageTextBlock: imageTextBlock,
  TourDatesBlock: tourDatesBlock,
  MerchGridBlock: merchGridBlock,
  HeadingBlock: headingBlock,
  ImageBlock: imageBlock,
  MediaFigureBlock: mediaFigureBlock,
  QuoteBlock: quoteBlock,
  DividerBlock: dividerBlock,
  SpacerBlock: spacerBlock,
  ButtonBlock: buttonBlock,
  P1WelcomeBlock: welcomeBlock,
};
