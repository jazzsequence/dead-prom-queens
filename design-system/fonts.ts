/**
 * Self-hosted font files. Import this once from each entry point (Storybook preview and the site
 * layout) rather than from ds.css, so the bundler resolves the font URLs itself.
 *
 * Only the faces this site uses are imported: every import adds its @font-face rules to the CSS every page downloads.
 * The two optional built-in faces (`typography.wordmarkFace` is Unbounded, `typography.accentFace` is UnifrakturCook)
 * are off here, so they are not imported; turn one on in band.config.json and add its import back
 * (`@fontsource-variable/unbounded`, `@fontsource/unifrakturcook`, installed as a dependency).
 * __tests__/fonts-follow-config.test.ts fails if this file and the config disagree.
 */
import "@fontsource-variable/space-grotesk";
import "@fontsource/special-elite/400.css";
