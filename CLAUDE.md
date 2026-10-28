# CLAUDE.md

Dead Prom Queens (a fictional act). Deathrock, trash goth, post-punk. Next.js 16 + P1 (Puck), deployed to Pantheon (`dead-prom-queens`).
Everything band-specific comes from `band.config.json` (identity, which sections exist, type choices, palette, hosting, the location of the local
off-limits notes) plus content files under `data/` and `content/`.

**Editorial rule.** Public copy, metadata, alt text, code comments and docs must never state or hint at anything the band's off-limits list marks.
The list lives in the gitignored file named by `editorial.offLimitsFile` in `band.config.json` (`docs/off-limits.md`), never in a committed file,
because the list itself would give the topics away. It has 0 entries. The reviewer checks every commit against it. Keep backstory out of everything committed.

## Setup decisions

Recorded by `/init-band` on 2026-10-26. Change them in `band.config.json` (then `pnpm theme` if the palette or type changed), not here; this list is the why.

- **Band:** Dead Prom Queens, a fictional act (pages never present it as real). Prom-night deathrock on a four-track. Drum machines, cheap synths, tape hiss, no encore.
- **Sections on:** Merch, Lyrics, Press kit. **Off:** Tour and tickets, Tour map, Press; their routes return 404 and they drop out of the nav, sitemap and `llms.txt`.
- **Type:** the built-in faces (`typography.wordmarkFace`/`accentFace`: Unbounded and UnifrakturCook) are off. The band's own faces are set through `typography.customFaces`: Broken 15 (wordmark) and Selfish (script, for large headings), both by Misprinted Type, served as WOFF2 from the files bucket (`files.deadpromqueens.jazzsequence.com/fonts/`) and never committed. Eyebrows, small headings and labels are Special Elite (the owner's pick from a side-by-side of four candidates), self-hosted. See "Type" under the design approval workflow and "Custom faces" below for how they work and the licence limits.
- **Icons and social card are drawn in Broken 15** (`app/icon.*`, `app/apple-icon.png`, `app/favicon.ico`, `public/icons/`, `public/og-default.jpg`), by `pnpm theme && node scripts/make-brand-assets.mjs`. The script reads the original font from the gitignored `docs/fonts/<customFaces.wordmark.source>` (`BROKEN15.TTF`); that file is not in git and the bucket holds only the WOFF2s, so it has to be restored from the owner's copy before regenerating. With no `source` configured it draws in Unbounded. Changing the wordmark face means regenerating them. The social card sits on the hero photo (`public/images/hero.jpg`, with the hero's left and bottom shades), and the script writes it as a JPEG. The band's photos in `public/images/` are web copies of originals kept in the gitignored `images/` folder (JPEG, at most 1600px wide, under 300 KiB, metadata stripped). The `placeholder-*` PNGs are solid colours with no text, so they only follow the palette.
- **Palette:** see `band.config.json`; the gate needed no adjustments.
- **Hosting:** Pantheon site `dead-prom-queens`; P1 site `a5773c86-3c93-46ed-9450-8f363b7f0982`; audio served from https://files.deadpromqueens.jazzsequence.com.
- **Workflows installed:** `test-deployed-site.yml`, `sync-puck-registry.yml`.
- Secrets are never in files; see "Secrets on Pantheon" below for how each is set.

## Commit review (reviewer agent)

Installed from https://github.com/jazzsequence/claude-code-reviewer. Every commit of AI-written code needs an
approval from the `reviewer` subagent first; a PreToolUse hook (`.claude/helpers/hook-handler.cjs`) and a git
pre-commit hook (`.githooks/pre-commit`, config in `.reviewer-config.sh`) block the commit otherwise.

1. Stage the change (`git add`), then spawn the reviewer: `Agent({ subagent_type: "reviewer", prompt: "<what changed and why>" })`.
2. Describe the change factually. Never tell the reviewer to approve, and never write `reviewer-approved` myself.
3. On APPROVE, commit within 5 minutes and without touching the index again (the approval is bound to the staged content).
   On REJECT, fix and request a fresh review.
4. `USER_COMMIT=1` is for commits the owner writes by hand. Claude never uses it; if the reviewer is unavailable or blocks
   something wrong, stop and ask the owner.

How this fits the rest of this file:
- The reviewer is the commit gate. It does not replace the PR, the Storybook approval for `design-system/` (see below),
  or CI. Open PRs from feature branches cut from a freshly pulled `main` (`git checkout main && git pull`, not just a fetch; this includes design branches, see below); the owner merges.
- Per commit the hook runs `pnpm test`, `pnpm lint && pnpm typecheck` and `pnpm build` (`.reviewer-config.sh`; the generated defaults were npm
  and would have failed). Docs-only commits (`.md`, `.mdx`, `.txt`, `.rst`) and commits touching only `.claude/` or `.githooks/` skip all of
  that (`REVIEWER_TEXT_ONLY_PATTERN`, and the reviewer's own skip rule matches); they still need the reviewer's checklist. e2e is not in
  the hook (needs a fresh build and port 3100; CI runs it on every PR): run `pnpm test:e2e` myself before opening a PR, and the reviewer
  runs it too when `e2e/`, `app/` routes or `design-system/` change.
- Reviewer files are committed: `.claude/agents/reviewer.md`, `.claude/helpers/hook-handler.cjs`, `.claude/settings.json`,
  `.githooks/`, `.reviewer-config.sh`, and the checklist at `.claude/REVIEWER_CHECKLIST.md` (moved out of the gitignored `docs/`).
  The checklist's "Project-specific checks" section holds this repo's rules: the editorial rule (against the local off-limits list), the design-system gate (story at the
  relevant sizes, flagged for the owner's Storybook approval), docs/a11y, and P1 content and key rules. Edit it when a rule changes.
  Re-running the upstream `install.sh` will not overwrite the config or checklist, but will flag `reviewer.md` as locally modified (path edit).
- Commit trailer stays `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (the reviewer checks for a co-author line).
- The hooks cap AI commits at 5 files and 500 inserted lines (lock files excluded), so split work into small logical commits within a PR.
  Merge commits are exempt. Anything inherently larger is the owner's to commit with `USER_COMMIT=1`; ask rather than work around it.
- `docs/` is gitignored (local source material and the off-limits notes). Do not put anything that must be committed in it. Keep a backup of it
  outside the repo: it is the one place with material that exists nowhere else, and switching to a branch that tracked it would delete it.

## Commands (pnpm; Node per `.nvmrc`)

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (needs `.env`, see `.env.example`). Like `build`, `storybook` and `build-storybook`, it first runs `scripts/copy-maplibre-worker.mjs` (see the tour map bullet); `dev` and `storybook` also run `pnpm theme` first |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Required before presenting changes |
| `pnpm build` | Production build; works with placeholder `NEXT_PUBLIC_CSS_SITE_ID` and `CSS_API_KEY`. First copies MapLibre's worker files into gitignored `public/maplibre/` |
| `pnpm test:e2e` (alias `test:a11y`; `P1_LIVE=1` runs against live P1 content using the credentials in `.env`, default is repo-copy only) | Playwright: axe, keyboard, navigation and favicon checks against the standalone build (run `pnpm build` first; kill any stale server on :3100). Build and run with CI's placeholder key and an unroutable base URL (the site id is the real one, which is not a secret; the placeholder key is what keeps the run off P1): `CSS_API_KEY=ci-placeholder CSS_API_KEY_LIVE= NEXT_PUBLIC_CSS_SITE_ID=a5773c86-3c93-46ed-9450-8f363b7f0982 NEXT_PUBLIC_CSS_BASE_URL=http://127.0.0.1:9 pnpm build`, then the same variables with `pnpm test:e2e` (see `test-pantheon.yml`). Never point a placeholder run at `ccr.p1.pantheon.io` (see "No P1 traffic from placeholders" under Architecture). A build that loads the real credentials from `.env` prerenders the published P1 pages, so the e2e run then tests those instead of the repo copies (seen on `/albums/ep`: album pages are prerendered at build and served until `revalidate = 300`) |
| `pnpm storybook` / `pnpm build-storybook` | Design system (`design-system/`, config in `.storybook/`); copies MapLibre's worker into `public/maplibre/` first |
| `pnpm theme` | Generate `design-system/theme.generated.css` from the palette in `band.config.json` (see "Palette" under the design approval workflow). `--check` (`tsx scripts/generate-theme.ts --check`) fails if the committed file is stale |
| `pnpm init-band <command>` | The helper the `/init-band` skill drives: `status` (is `setup.initialized` set), `suggest-palette --hue N [--loudness quiet\|balanced\|loud] [--scheme analogous\|complement\|triad\|mono]` (palette JSON on stdout, contrast report on stderr), `check-palette <file>` (exit 1 if the gate rejects it), `apply <answers.json> [--force] [--skip-assets]` (writes the config, local off-limits notes, docs, `package.json` name and description, `CODEOWNERS` owner, workflows and generated assets, and prints the secrets to set). The answers file is the person's answers, so keep it under the gitignored `docs/`. It never receives a secret |
| `pnpm sync:registry` | Push Puck registry to P1 (needs `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY`; CI does it once the example workflow is installed) |

## Architecture decisions

- **`band.config.json`:** validated once by `lib/band/config.ts` (`parseBandConfig`, hand-written, no schema dependency; it lists every problem at once) and exported as
  `band`, `features`, `typography`, `editorial`. The palette in the same file is validated separately by `lib/theme/palette.ts`. `band` is the name, tagline, description,
  genre, `fictional` flag, canonical `siteUrl` (`NEXT_PUBLIC_SITE_URL` overrides it per environment), footer year and optional imprint line, and social links. Never hard-code
  a band name, genre or URL in a component; read it from here. `setup.initialized` records that `/init-band` has run; `hosting.pantheonSite` and `hosting.p1SiteId` record where the site lives (neither is a secret; keys and tokens never go in the file). Playwright specs cannot import the JSON module (its ESM loader rejects it): they read it through `e2e/helpers/config.ts`.
- **Features (`features.tour`, `merch`, `lyrics`, `map`, `press`, `pressKit`).** An off section drops out of the header and footer, the sitemap and `llms.txt`, and its routes return 404
  (`tour` covers `/tour`, `/tickets/[id]`, `/ticket`, the home page's tour list and the hero's Tour dates button (the code version swaps its default buttons for Listen alone), the 404 page's Tour dates button, and the tour list and hero button in the `content/p1-pages/home.json` fixture, which `/init-band` rewrites so it still says what the code version says; `lyrics` also stops tracks linking to lyrics; `press` covers `/press`; `pressKit` covers the `/press/kit` entries in the sitemap and `llms.txt` and the footer's Press kit link (it does not follow `press`; `__tests__/site-footer.test.tsx` pins that); the page itself is P1-only, below;
  `map` hides `TourMap` on the tour and ticket pages and needs `tour`). `/press/kit` and any other P1-only page are the owner's to publish or not in P1 (so turning `pressKit` off only removes the kit's sitemap and `llms.txt` entries and its footer link: the page stays up until it is unpublished in P1; its zip is built locally from the originals and uploaded to the files bucket at `press/press-kit.zip`, which the page links to); the `[...puckPath]` catch-all
  must stay an untouched shim, so it is not gated. The per-album and listen pages are always on.
- **Content split:** lyrics = Markdown in repo; bio, albums, tour dates, merch = P1 (with repo fallbacks); images = P1 media;
  audio = a Cloudflare R2 bucket served from the domain in `NEXT_PUBLIC_AUDIO_BASE_URL`, listed server-side at build/ISR
  from `<album-slug>/<NN>-<track-slug>.m4a`. Audio is never committed (`music/` is gitignored).
- **P1 media pictures are sized when the block renders.** P1 media (`media.p1.pantheon.io`, redirecting to `pantheon-files.com`) serves an upload at its original size unless the URL asks for less: `?fit=scale-down` alone returned a 1.7 MB WebP for one band photo, `&width=800` a 66 KB AVIF (the format follows the browser's Accept header). The published pages carry the plain URLs, so `lib/site/media-url.ts` (`mediaUrl`) adds `width` in the Puck block layer: gallery 1400 (one column), 960 (two or three); image-and-text and merch grid 960; hero 1400. About twice the drawn column, and never much smaller, because `LightboxImage` opens the same file larger. **Do not raise them to or above an upload's own width**: P1 media never enlarges, so a width at or above the upload's returns the original unresized and not recompressed (measured on dev: a 1024 px portrait was a 751 KiB WebP for `width=1200` and a 63 KiB AVIF for `width=800`; measured on live, where the `/bio` portraits are 1000 px and the landscape 1500 px wide: `width=1000` gave a 949 KiB WebP and `width=950` a 77 KiB AVIF, `width=1500` gave a 1.3 MB WebP and `width=1400` a 132 KiB AVIF). The first version of this used 1200, 1600 and 1920 and the second 1000 and 1500, so each time some of the `/bio` pictures stayed unresized; the uploads' real widths are 1000 and 1500, so the narrow widths stay under 1000 and the wide ones under 1500, and `__tests__/p1-blocks.test.tsx` fails if they do not. An upload narrower than the width asked for (a 960 px photo, say) is still sent back as it is, so after editing a P1 page check its images' sizes (the `Content-Type` is `image/webp` and the size is hundreds of KiB when it was not resized). It is in `components/puck/band/`, not `design-system/`, so it needs no Storybook approval; a URL that already has a `width`, a local `/images/` file and any other host are left alone. It is not `buildImageUrl` from `@pantheon-systems/p1-media`, whose entry also carries the editor plugin. A new block that shows a P1 image must call `mediaUrl` too (`__tests__/p1-blocks.test.tsx` covers the current ones).
- **P1 pages (all of them except per-song lyrics, tickets and error pages, by decision):** `/`, `/tour`, `/bio`, `/merch`, `/listen`, `/albums`, `/albums/<slug>`, `/lyrics`, `/press`, `/privacy` render the published P1 page (`loadPublishedPage` via
  `lib/site/p1-content.ts`) and fall back to the repo copy when P1 is missing or unreachable, so CI (placeholder creds) and
  outages keep working. P1 pages use the band blocks in `components/puck/band/` (`PageHeadingBlock`, `ImageTextBlock`,
  `TourDatesBlock`, `MerchGridBlock`, plus `HeroBlock`, `ArticleBlock`, `AlbumHeaderBlock`, `TrackListBlock`, ... in `content-blocks.tsx` and
  `catalog-blocks.tsx`), offered in the editor under a category named after the band; ticket pages, sitemap and JSON-LD read shows from the `TourDatesBlock`. Catalog blocks get their data from
  `SiteDataProvider` (server-loaded on public pages via `P1Page`, fetched from `/api/site-data` in the editor canvas), so credentials never
  reach the browser. The starter's own "Welcome" document at `/` is ignored (`isStarterPage`). Page definitions live in
  `content/p1-pages/*.json`; CI renders them through a test-only `/e2e-fixtures/<name>` route (only when `E2E_FIXTURES=1`) and checks they
  say the same as the code versions, have one h1, pass axe and load every image (so a change to a code fallback needs the matching fixture change, and the reverse). Every design-system component must be mapped to a block or
  an exclusion reason in `__tests__/design-system-coverage.test.ts`. P1 has no
  templates/datasources here and the MCP cannot create them, so structured data lives in block array fields. Registry
  sync: `pnpm sync:registry` or the P1 MCP `sync_components` (CI does it on a site that has installed the example workflow); `fast-json-patch` is patched (`patches/`) because tsx
  otherwise loads its unshipped `index.ts`. Do NOT create P1 workstreams alongside code PRs (two histories, ordering bugs, merged-workstream reuse). Code merges and deploys first; pages are then created directly in P1 by the owner's instruction. Never publish or edit live P1 content unprompted.
- **How P1 content reaches live:** there is one P1 site and every Pantheon environment reads it; only the API key differs (drafts key off live, published-only
  key on live). So content does not move between environments: **publishing a page in P1 is the go-live step** (a page saved on `main` but not published is
  invisible to both keys; `publish_page` copies it live). Code moves dev -> test -> live through the Pantheon promotion workflow. To preview a content change
  without publishing, use a P1 workstream (that is what workstreams are for; the "no workstreams" rule above is only about pairing them with code PRs).
  Each `content/p1-pages/*.json` is both the design of a page and its fallback copy, so those files do not follow later edits made in P1.
- **Where the rest of the content lives:** the public pages are code under `app/(site)/` with content in the repo:
  `data/albums.json` (albums, tracks, an optional `gallery` of extra art per album, an album with no `year` is how unreleased material is modelled; exactly one album is `featured`, which sets the home hero and the "latest" badge and is otherwise an ordinary album at `/albums/<slug>`),
  `data/tour.json` and `data/merch.json` (fallbacks), `content/lyrics/*.md` (frontmatter `title`/`album`/`track`, `### Label` sections), `content/press/article.md`.
  To add a song: add it to `data/albums.json`, upload `<album>/<NN>-<slug>.m4a` to the bucket, add `content/lyrics/<slug>.md` if it has lyrics.
  P1 pages render inside the `(site)` layout (the catch-all lives under it). That layout supplies the header, footer and player, so a P1 page needs no header or footer block (an Article-only page like `/press` has both). The editor canvas has no layout, so `puckRoot.render` (`components/puck/root.tsx`) wraps the page in the real `SiteHeader` and `SiteFooter` there only (`puck.isEditing`), locked with `inert`, so pages can be built as they will look; on the public site the root adds nothing, so they never double up.
- **Content that is the band's own, and what is still a placeholder.** The album (Class of Never), its lyrics, the bio fallback page, the hero and the photos are the band's. Shows and the press article are still the template's neutral samples until the band replaces them (`CONTENT.md` says where). Merch is the band's: the published P1 `/merch` page is the source (the owner edits its grid and uploads the photos to P1 media, so they are not in git), and `data/merch.json` is only the fallback, with the same names and prices but the placeholder picture, so it drifts from P1 when the owner edits there. Audio is in the R2 bucket as `class-of-never/NN-slug.m4a`; a track with no file there shows "Audio unavailable". Public copy never counts the songs on the album, and the album blurb describes the sound, not how the record was made.
  The `placeholder-*` PNGs are solid colours in the palette (`node scripts/make-placeholder-images.mjs`); icons and the social card are drawn from the band name and palette,
  with the hero photo behind the card (`node scripts/make-brand-assets.mjs`). Both scripts read the generated theme, so run `pnpm theme` first after changing the palette. The seeded tour has one on-sale and one sold-out date
  so both ticket pages stay covered by tests; the ticket flow (`/tickets/[id]` -> `/ticket?...`) keeps all state in the URL and collects nothing. Tour dates are fictional and must never be presented as real.
- **Tour map (`TourMap` in the design system; MapLibre GL + OpenStreetMap raster tiles).** It starts as text (each venue and its
  address, no links out) and loads MapLibre and the tiles only when the visitor clicks "Show map", so by default nothing is requested and nothing
  about the visitor leaves the site. MapLibre 6 ships its web worker as two separate files that neither Turbopack nor Vite emits, so
  `scripts/copy-maplibre-worker.mjs` copies them into gitignored `public/maplibre/` before dev, build and Storybook, and the component loads that same-origin
  worker (`workerUrl`; Storybook passes a relative path like its images). Same-origin means the CSP needs no `blob:`. ESLint skips `public/maplibre/`. `maplibre-gl` is
  pinned exactly (check `package.json` for the version): do not adopt a release less than two weeks old. Pins come from each show's `lat`/`lon` (geocode the street address; the
  P1 `TourDatesBlock` carries them, `data/tour.json` is the fallback). It is placed on each show page (`/tickets/[id]`, that show's pin) and under the dates on `/tour` (in `TourDatesBlock` and the
  code fallback, every pin) when `features.map` is on; a show with no coordinates gets no map.
- **Public pages render with a lighter Puck config.** Every P1 page used to ship 937 KiB gzipped of JavaScript (a page without Puck, like a lyrics page, ships 183) because `puck.config` (the editor's config) reached the public bundle through the client wrapper, and with it about 650 KiB of editor tooling: the Pantheon design toolkit and its charts, Puck's editor core, drag and drop, yjs. Now `puck.components.tsx` holds the shared blocks (**new blocks go there**), `puck.config.tsx` is the editor and registry config (the shared blocks plus the three heavy ones, unchanged in content), and `puck.public.tsx` is what visitors render with: the same blocks, except that `ParagraphBlock`, `GridBlock` and `DataListBlock`, whose modules import the editor tooling, load on demand through `components/puck/lazy-block.tsx`. `app/(site)/[...puckPath]/client.tsx` renders with `Render` from `@puckeditor/core/rsc` (not puck-css's `RenderClient`, which wraps Puck's full client `Render`) and the public config, and the "Edit this page" pill is its own module, `edit-widget.tsx`, loaded only when localStorage `p1_logged_in` is set. P1 pages now ship about 243 KiB gzipped, and three editor stylesheets (the design toolkit's is 364 KiB raw) are no longer loaded on public pages. Checked against a clean `main` build: the same pixels on 8 pages at desktop and mobile. `__tests__/public-config.test.ts` crawls what `client.tsx` imports statically and fails if the editor tooling returns, and checks the two configs have the same blocks. So nothing the public client reaches may import `@pantheon-systems/puck-css` (the bare entry; use its subpaths `/fields`, `/seo`, `/sanitize-richtext`), `/connectable`, `@pantheon-systems/pds-toolkit-react`, `recharts`, `@puckeditor/core` (the bare entry; `/rsc` is the light one), `puck.config` or those three block modules, and a new block whose module needs the editor tooling should be lazy like them. Public pages no longer provide puck-css's `PuckConfigProvider` (nothing on the public path reads it); re-check that if a block starts using puck-css's config hooks. Adding or renaming a block in `puck.components.tsx` triggers the registry sync like `puck.config.tsx` does.
- **Finding what is in a page's JavaScript.** `pnpm exec next analyze --output`, then `pnpm exec next analyze export` (JSON lines; Turbopack, about 15 s, no server): `part` records give module sizes per route and output file, `group` records say which outputs are `async`, `module` records list each module's sync and async dependencies. A route's initial JavaScript is its client `.js` outputs minus the `async` groups' outputs, and a breadth-first search over the `sync` dependencies from a project file shows why a package is bundled (that is how the chains above were found). The real per-page figure is the gzipped size of the scripts listed in `.next/server/app/<route>.html`. To check a change did not alter what visitors see, serve a clean `main` build and the branch on two ports and compare full-page screenshots, with a control that must differ (two different pages).
- **Songs and lyrics are independent resources.** A track with no lyrics, or lyrics with no audio, is normal (the seeded third track has no lyrics on purpose).
- **Persistent player** lives in the site layout; no cookies, no tracking, no mailing list. The `<audio>` element must
  NOT have `crossOrigin`: with it, every new preview/prod origin has to be added to the bucket's CORS list or playback
  silently fails (downloads still work because they go through `/api/download`). Without it playback needs no CORS.
- **Caching.** Pages are prerendered and refreshed in the background (ISR), and Pantheon's edge (Cloudflare) caches what they send. Measured on the built server (headers) and on the live site:
  - *Pages that read P1* (`/`, `/tour`, `/bio`, `/merch`, `/listen`, `/albums`, `/albums/[slug]`, `/lyrics`, `/press`, `/privacy`, `/tickets/[id]`, and the catch-all) export `revalidate = 300` and send `s-maxage=300, stale-while-revalidate=31535700`: the edge may keep a page five minutes and serve it stale while it refreshes. Publishing from the P1 editor also calls `revalidatePath` (the SDK's publish route; read in its source, not watched live), so 300 seconds is the backstop for a change that did not come through it. The export must be a literal (Next reads it statically) and **every page under `app/(site)` that calls `getP1Page`, `getShows`, `getSiteData` or `loadPublishedPage` must have one**: without it the page is prerendered once and sent as `s-maxage=31536000`, a year at the edge (`/albums`, `/lyrics`, `/press` and `/privacy` once did). `__tests__/page-revalidation.test.ts` fails if one is missing. Lyric pages (`/lyrics/[slug]`) read the repo, not P1, so they are static for a year on purpose and change on deploy. HTML shows `cf-cache-status: DYNAMIC` at the edge whatever it sends; that is how Pantheon's edge treats Next.js pages today, so the caching that matters for pages is the persistent ISR cache below.
  - *Persistent cache:* on Pantheon, `cacheHandler.mjs` stores ISR output in GCS (or files), so it survives restarts and is shared between instances; locally Next uses its own.
  - *Files in `public/`* (`next.config.ts`, pinned by `__tests__/public-file-caching.test.ts`): Next's default is `max-age=0`, which Cloudflare does not cache (`cf-cache-status: BYPASS`). A local image is referenced as `/images/x.jpg?v=<build>` (`design-system/asset.ts`), a new URL every build, so that URL is `immutable` for a year. Everything else that keeps its URL (the same path without `v`, `/icons/`, `og-default.jpg`, the MapLibre worker in `/maplibre/`, and the metadata routes `/icon.png`, `/icon.svg`, `/apple-icon.png` and `/favicon.ico`) is cached an hour and served stale up to a day. Never mark anything immutable unless the URL carries the version. Next applies these by path, so a 404 for a missing file under those paths carries them too: an unversioned miss can stick for up to an hour, and a versioned one is cached for the life of that URL (the same trade-off as `/_next/static`; the version changes with every build, so a later upload is a new URL). After the first live deploy with this, check that `/images/<file>?v=<new>` is served fresh and that `cf-cache-status` reaches `HIT`.
  - *All of this can be lost silently if the build cannot read P1:* see "The P1 key must be right at build time too" below; `pnpm build` now fails in that case.
- **Unreleased** means no public release (not "coming soon"). It is an album-style page with no `year`; do not seed it with
  songs that merely lack audio.
- Content editing guide for humans: `CONTENT.md`.
- **`serverExternalPackages: ["yjs"]`** in `next.config.ts` stops the "Yjs was already imported" warning (yjs loaded twice, ESM and CJS). The starter's `webpack` yjs alias is ignored by Turbopack, the default builder.
- **Single Next config:** `next.config.ts` only. The starter's `.mjs` config and the Pantheon template's `.ts`
  config coexisted and Next silently loaded the `.mjs`, dropping `output: "standalone"`. Merged; do not re-add.
  `cacheHandler.mjs` must stay plain JS: the standalone server loads it at runtime.
  `start` must be `node .next/standalone/server.js` (with `copy-standalone` in `build`), never `next start`: that
  ignores `output: standalone` and looks for `cacheHandler.mjs` inside `.next/`, so every request 500s on Pantheon.
- **`NEXT_PUBLIC_CSS_BASE_URL` is required** (`https://ccr.p1.pantheon.io`): the auth routes do not default it and 500 with "Server configuration error" if blank. (The data client does default; the broker does not.)
- **Secrets on Pantheon:** `terminus secret:site:set <site>[.env] NAME value --type=env --scope=web --rebuild`.
  Changes only apply after a rebuild. Values are write-only. P1 key: `CSS_API_KEY` (drafts scope) on dev/test/local;
  `CSS_API_KEY_LIVE` (published-only) on live. **How `CSS_API_KEY` is stored matters for multidevs.** A Pantheon secret has a base value (what every environment gets) and optional values of its own per environment, and an environment can only be given its own value once a base exists. A PR environment (multidev) has no value of its own, so it gets the base. Until 2026-10-28 the base was a dummy `placeholder-…` (created at setup so dev and test could have their own values, and written down nowhere), dev and test held the real drafts key as their own values, and every multidev therefore built as a placeholder: repo copies instead of published P1 pages, and P1 sign-in failing with "Broker login failed (500)". The base is now the real drafts key, updated in place with `terminus secret:site:set <site> CSS_API_KEY <value>` (no `.env` suffix, and **without** `--type` or `--scope`: that is how Terminus updates an existing secret and it keeps the type and scope; passing them fails with "already exists"). Never leave a dummy base: look at `[p1] <env> credentials as this build sees them` in a build log (`terminus node:logs:build:get <site>.<env> <build-id>`, which works for PR environments) for what an environment really gets. Live is unaffected because it reads `CSS_API_KEY_LIVE` and `applyP1ApiKey` copies it over `CSS_API_KEY`. P1's allowed origins include `https://*-dead-prom-queens.pantheonsite.io`. `getP1ApiKey()` (`lib/site/p1-key.ts`) picks the key by `PANTHEON_ENVIRONMENT` and throws on live without the live key; `instrumentation.ts` copies it into `CSS_API_KEY` at start because the SDK's published-page reads use that variable directly. Live with no `CSS_API_KEY_LIVE` returns 500 on purpose (verified), never the drafts key. Next loads `.env` itself, so test this with `CSS_API_KEY_LIVE=` (empty), not unset.
- **No P1 traffic from placeholders.** CI, the e2e run and local checks use placeholder credentials (a key containing "placeholder", an all-zeros or missing site id) so
  they render the repo copies. They must never send P1 a request: earlier they did, against the live backend, and every one was refused (measured with a local
  listener standing in for P1: 26 requests per build and about 2 per page load, so thousands per e2e run). `isP1Configured()` in `lib/site/p1-config.ts` is false for
  those credentials; `getP1Page` then returns null without calling the SDK, and `next.config.ts` sets the build-time `NEXT_PUBLIC_CSS_BASE_URL` to the unroutable
  `http://127.0.0.1:9`, which also stops the SDK's own catch-all route (that route must stay an untouched shim; `published-page-routes.test.ts` pins it). CI's build and
  e2e steps use the same unroutable URL. After the change a build, the whole e2e run and 14 page loads sent the listener 0 requests. In placeholder mode an unknown path
  returns a 500 (the SDK's fetch to the unroutable address fails) where P1's 400 used to be handled; nothing tests it. The key is judged by `getP1ApiKey()`, so on live it is
  `CSS_API_KEY_LIVE`; the check runs at build time, and on Pantheon the live key is a secret that only applies after a rebuild. To check for stray
  requests, point `NEXT_PUBLIC_CSS_BASE_URL` at a local HTTP listener and count what it receives.
- **The P1 key must be right at build time too, or the whole site goes uncached.** `isP1Configured()` judges the key by `getP1ApiKey()`, but the SDK does not call that: it reads
  `CSS_API_KEY` itself. `applyP1ApiKey()` (`lib/site/p1-key.ts`) copies the live key into `CSS_API_KEY` on live, and is called from `next.config.ts` (build and start) and `instrumentation.ts`
  (start; it does not run during `next build`). When the live build skipped it, the SDK sent the drafts-default key, P1 answered 401, and the SDK's `loadPublishedPage` calls `connection()`
  on failure, which made every P1-backed route dynamic for that build: `private, no-cache, no-store`, no `x-nextjs-cache`, a P1 round trip on every request (about 1 to 2 s TTFB). The build
  still succeeded, with only `[p1-next-sdk] published content unavailable for <path>: Authentication required` in its log. `scripts/check-prerender.mjs` (the end of `pnpm build`,
  tested by `__tests__/check-prerender.test.ts`) now fails the build when a page that reads P1 was not prerendered, because a failed build keeps the previous good one running; set
  `ALLOW_DYNAMIC_P1_ROUTES=1` to ship anyway, for example to deploy while P1 is down. To reproduce or check a key problem without touching P1, build against a local listener that answers
  401 and logs the `x-api-key` header it receives (dummy keys, `PANTHEON_ENVIRONMENT=live`), then read the route table in the build output. A Pantheon build or server with no usable P1 credentials (no `PANTHEON_ENVIRONMENT` means CI and local, which stay silent by design) prints `[p1] The <env> environment has no usable P1 credentials: <setting>` from `next.config.ts` (`p1ConfigProblem` in `lib/site/p1-config.ts`: it names the setting, never a value), so a multidev that serves the repo copies and fails P1 sign-in with "Broker login failed (500)" says why in its build log (`terminus node:logs:build:get <site>.<env> <build-id>` works for PR environments).

## Accessibility

Target is WCAG 2.2 AA. Three layers: `eslint-plugin-jsx-a11y` (recommended rules) on `design-system/`,
`components/site/` and `app/(site)/`; the Storybook a11y addon (`test: "error"`); and `e2e/a11y.spec.ts`, which runs axe
(wcag2a/2aa/21a/21aa/22aa + best-practice) on every public route at desktop and mobile sizes plus keyboard, skip-link,
focus-ring and reduced-motion checks. When adding a route, add it to the `routes` list there. The e2e specs are feature-aware: they list every route but wrap those that belong to a switchable section in `when("<feature>", ...)` (or check `features.<feature>`) from `e2e/helpers/config.ts`, which reads `band.config.json`, so a band with sections off still passes; wrap a new route the same way. The 404 page goes through P1, so it is only checked with
`A11Y_P1_ROUTES=1` and real credentials in `.env`. Each page needs exactly one
h1; cards take `headingLevel="h2"` when they sit directly under it. Seeking uses a real `<input type="range">`.
Not covered by automation: screen-reader pass, captions (songs rely on linked lyrics as the text alternative), and the
player in its "has audio" state (CI has no bucket credentials).

## Standards

Follows https://specification.website where it applies: canonical + Open Graph via `pageMetadata`, JSON-LD, robots/sitemap/manifest,
security headers + CSP in `next.config.ts` (production only; `/p1` exempt), privacy page, custom 404/500, optimised images. Deliberately not done (template defaults,
change them on purpose): AI-crawler rules in robots.txt and Content-Signal, hreflang (one language, so there is no per-language `lang` handling for titles either),
cookie consent and GPC (no cookies or data processing), RSS (no feed content). standard.site support is verification plumbing
driven by `data/standard-site.json`; the records themselves are created by `scripts/publish-standard-site.mjs` (reads `band.config.json`) with the owner's
account, which Claude must not run without being given credentials. `security.txt` needs `SECURITY_CONTACT`.

**Privacy.** Any change that adds a third-party request or stores anything about a visitor must update the Privacy page in the same changeset: the repo copy
(`content/p1-pages/privacy.json`), the page's code fallback, and the published P1 `/privacy` page (a live edit, so it needs the owner's go-ahead). The tour map is the
first such case: the CSP in `next.config.ts` allows `connect-src https://tile.openstreetmap.org` (`img-src` already allows `https:`, and the worker is same-origin so
`script-src 'self'` covers it), and the Privacy page has a "The map" section saying it contacts OpenStreetMap, which sees the visitor's IP address, and only after they click
Show map. A published P1 `/privacy` page is a separate copy, so any later change to this text has to be made in P1 as well. The band's two display fonts are the second case: they load from the Cloudflare-served files bucket, so the page says Cloudflare also sees a request when a page loads them.

## CI / deployment

- `test-pantheon.yml`: lint, typecheck, unit, build, accessibility (Playwright + axe), all on the runner with placeholder credentials. Nothing here needs a Pantheon environment or secrets; the deployed-site check is its own workflow (below). Storybook is built only by `storybook-preview.yml` (every PR), not here.
- `promote-pantheon.yml`: push to `test` or `live` branch tags `pantheon_test_N` / `pantheon_live_N`.
- `sync-puck-registry.yml`: syncs the Puck registry on pushes touching `components/puck/**`, `puck.components.tsx` or `puck.config.tsx`. Needs `CSS_BASE_URL`, `CSS_SITE_ID`, `CSS_REGISTRY_API_KEY` as repo secrets, for this site's own P1 only; skipped for Dependabot pushes.
- `storybook-preview.yml`: per-PR preview at `https://<owner>.github.io/<repo>/pr-N/` (gh-pages; needs
  Pages enabled, which needs a public repo or paid plan). Both jobs that push to gh-pages (publish and the cleanup on PR close) share one `queue: max` concurrency group, `storybook-gh-pages`: the per-PR group cannot serialise different PRs, and two PRs publishing at once failed with a rejected or unlockable `gh-pages` push (a re-run passed); plain grouping would let a newer run cancel the waiting one and drop a PR's preview, so builds for different PRs now run one at a time. The `action-validator` lint rejects `queue` (its schema is stale; GitHub accepts it), so do not drop it for that.
- Repo secrets: `PANTHEON_MACHINE_TOKEN` (also as a Dependabot secret) for `promote-pantheon.yml` and the deployed-site check, plus `CSS_BASE_URL`, `CSS_SITE_ID` and `CSS_REGISTRY_API_KEY` for `sync-puck-registry.yml` (installed, so a push touching `components/puck/**` fails until all three are set). The always-on CI checks run on placeholders and need none.
- `dependabot.yml`: weekly (Monday) npm and GitHub Actions updates, minor and patch grouped, a 14-day cooldown (the "no release under two weeks old" rule; it applies to version updates only, security updates bypass it). TypeScript 7 and ESLint 10 are ignored, with the blockers copied from a sister site on the same stack: not re-tested here, so lift an entry by trying the update on a PR environment. A `versions:` ignore also hides security-update PRs for that range, so keep Dependabot alerts enabled (a repo setting, not in this file). Dependabot PRs are ordinary PRs into `main`: squash-merge them. `@pantheon-systems/nextjs-cache-handler` is deliberately not ignored (owner's call). A sister site keeps live on 0.9.0 after 0.11.0 took its live site down on a large cache, whereas `cacheHandler.mjs` here has an unbounded initialise, so revisit if live shows restarts.
- `test-deployed-site.yml`: waits for Pantheon to build `pr-N`/`dev`, then expects 200. Needs `PANTHEON_MACHINE_TOKEN` as an Actions and a Dependabot secret. Add it as a required check only once it passes.

## Palette

`band.config.json` is the source of truth for colour: 13 roles (`void`, `surface`, `raised`, `line`, `text`, `muted`, `dim`, `accent`, `accent-2`, `accent-3`,
`metal-hi`, `metal-mid`, `metal-lo`) as `#rrggbb`. `pnpm theme` writes `design-system/theme.generated.css` (the `@theme` colour tokens, the glow shadows and the
`--grad-accent`/`--grad-metal` gradients), which `ds.css` imports. Never edit the generated file; edit the config and regenerate. A reference palette (`__tests__/fixtures/reference-palette.json`) is the generator's regression fixture and must come out unchanged, whatever palette the band chooses.

- **Accessibility gate (`lib/theme/palette.ts`).** Every text colour must reach WCAG AA (4.5:1) on all three surfaces, and `void` text on the fills that carry it (`accent`, `accent-3`,
  `metal-hi`). `dim` is held to 4.5:1 too, stricter than the 3:1 a secondary-text token could claim. A failing colour is lifted in OKLCH lightness (same hue, `lib/theme/contrast.ts`) and
  reported on stderr; an unrepairable palette (for example a light surface, since the system is dark-only) is rejected with the reason and nothing is written. The generator never emits a failing
  palette. Note the generated file holds the adjusted values while the config keeps what the author wrote.
- **Storybook.** Foundations > Color and type renders the active palette (swatches with ratios), a table of every gated pair, and a deliberately failing example showing what the lift does. They read
  `band.config.json` through the same generator code, so they cannot drift from the real tokens.
- **Staleness.** `__tests__/theme-palette.test.ts` fails if `theme.generated.css` is not what the config produces. `build` does not run the generator (production builds should not need `tsx`);
  `dev` and `storybook` do.
- **Roles only.** Components use `accent`, `accent-2`, `accent-3` and `metal`, never a hue; `__tests__/colour-token-roles.test.ts` fails if a hue-named token returns or an original-palette literal
  appears outside its justified allowlist.

## Design approval workflow

Design work goes on `design-<topic>` branches into a protected `design` branch. Merging the PR is the approval.
Only approved tokens/components are applied to the site via a PR from `design` to `main`. Dark theme only; the palette comes from
`band.config.json` (see "Palette").

The flow, and why each step is the way it is:
1. **Cut the branch from a freshly pulled `main`, never from `design`.** `design` can lag behind `main`; a branch cut from it carries that lag, and the later apply merge then has to reconcile two diverged histories (it once reverted newer text in `CLAUDE.md` and the coverage test).
2. **Open the PR into `design`** with the Storybook preview link. The owner's merge of that PR is the design approval. Merge it with a **merge commit**, so `design` picks up `main`'s history along with the change.
3. **Apply it:** pull `main`, cut a branch from it, merge `origin/design` into it, and open a PR into `main`. Merge it with a **merge commit**, so `design` becomes an ancestor of `main` and the next design PR does not conflict. If the merge conflicts, resolve it deliberately and then check the whole tree: `git diff origin/main` must list only the intended files, and `git diff origin/design -- design-system .storybook` must be empty. Never rely on `-X theirs` alone; it silently takes `design`'s older text.
4. **Wire it up** (the site code that uses the new component or prop) in a separate PR into `main` once the apply has merged.

**Merge method, stated on every PR.** The repo default is squash, and the owner squashes unless told otherwise. So the first line of every PR body Claude opens is `**Merge method: MERGE COMMIT**` or `**Merge method: SQUASH**`, and the message that hands over the link says the same.

| PR | Merge method |
|---|---|
| `design-<topic>` into `design` | Merge commit |
| `design` into `main` (apply) | Merge commit |
| Anything else into `main` (code, content, docs, CI, wiring) | Squash |

Squashing either design-flow leg is what produced repeated conflicts on the apply merge (#44 to #45, #47 to #48).

Type: body copy is Space Grotesk. This band's heading system is two single-weight faces: **Selfish** (`--font-gothic`) for large headings (the page h1 and section
h2: hero, `SectionHeading`, lyrics title, album header, the Markdown page title), as typed, in flat `text-text` (the metal gradient washes out its thin strokes), at
48px or more; and **Special Elite** (`--font-display`, self-hosted from `@fontsource/special-elite`, so no third-party request) for eyebrows, small headings, nav and
button labels, uppercase and tracked, never with negative tracking. Neither Selfish nor Broken 15 works small, which is why neither is used for eyebrows or small
headings. Neither face has a bold, so `font-synthesis-weight: none` (`ds.css`) stops the browser faking one; do not add `font-bold`-style classes to them for emphasis.
The wordmark face (Unbounded, capitals, -0.05em, off here) and the blackletter accent (UnifrakturCook, off here) are optional template choices in `band.config.json`
(`typography.wordmarkFace`, `typography.accentFace`); when off, those roles fall back to the display face, so components never need to know which was chosen. `design-system/fonts.ts` imports a built-in face only when its option is on, because every import adds its `@font-face` rules to the CSS every page downloads; `__tests__/fonts-follow-config.test.ts` fails if the file and the config disagree. Turning one on therefore also means adding its import (Unbounded: move `@fontsource-variable/unbounded` from devDependencies back to dependencies, since the file is imported at runtime; UnifrakturCook: `pnpm add @fontsource/unifrakturcook`). Encode Sans Expanded, the old heading face, is gone. Where a
wordmark face is chosen it is for the name only, in flat colour; never set the name in the blackletter face. A custom face (below) replaces the built-in one for its role.

## Custom faces

`typography.customFaces` in `band.config.json` names the band's own faces: a `baseUrl` and a `wordmark` and/or `accent` face (`family`, `file`, and an optional
`source`). A custom face replaces the built-in one for its role only. `pnpm theme` emits its `@font-face` (one weight, `font-display: swap`) and points `--font-wordmark`
and `--font-gothic` at it, falling back to the display face while it loads or if the bucket is unreachable. The parser (`lib/band/config.ts`) holds every value to a plain
alphabet because it ends up in generated CSS and a URL, and `renderThemeCss` refuses an unsafe URL or family itself.

- **Not in git, and why.** Misprinted Type's licence allows use in the site's layout, but forbids embedding where visitors can type with the font and asks for permission
  to produce products or artwork with it. So the WOFF2s live in the files bucket (`fonts/broken15.woff2`, `fonts/selfish.woff2`), the original TTFs stay in the gitignored
  `docs/fonts/`, and the faces are never an editor font choice or used in an input. The owner decided the icons and social card are drawn in Broken 15 after that was raised, and has confirmed Misprinted Type's permission for them.
- **What it depends on.** The CSP `font-src` allows the origin of `baseUrl` only (`next.config.ts`; `__tests__/csp-font-src.test.ts`). The bucket's CORS rule must list the
  production domain, the Pantheon environments (`dev-`, `test-`, `live-` and `pr-*-dead-prom-queens.pantheonsite.io`), the GitHub Pages Storybook origin and localhost, or the
  browser silently falls back to the display face. e2e and local runs from `127.0.0.1` therefore render the fallback, by design.
- **How each face is set.** The wordmark is normal weight (one weight, so no faux bold), normal tracking, as typed, and `text-4xl md:text-5xl` in the header (Broken 15 has a small x-height and busy edges, so it is lost below about 36px). Selfish
  (`font-gothic`) is for large headings only and must be at least `text-5xl` (48px), because it is a script that is unreadable small: `__tests__/accent-face-size.test.ts` fails closed otherwise. Eyebrows and small headings use the display face (Special Elite).
- **Changing a face.** Upload the WOFF2 to the bucket, edit `customFaces`, run `pnpm theme`, restore the original font to `docs/fonts/` and run `node scripts/make-brand-assets.mjs`.
