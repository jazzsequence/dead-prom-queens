/**
 * Self-hosted font files. Import this once from each entry point (Storybook preview and the site
 * layout) rather than from ds.css, so the bundler resolves the font URLs itself.
 *
 * Only the faces this site uses are imported: every import adds its @font-face rules to the CSS every page downloads.
 * The two optional built-in faces (`typography.wordmarkFace` is Unbounded, `typography.accentFace` is UnifrakturCook)
 * are off here, so they are not imported. To turn one on, set it in band.config.json and add its import here:
 * Unbounded is `@fontsource-variable/unbounded`, which must move from devDependencies back to dependencies (this file is
 * imported at runtime, so a dev-only package breaks a production install); UnifrakturCook is `@fontsource/unifrakturcook`,
 * which was removed (`pnpm add @fontsource/unifrakturcook`).
 * __tests__/fonts-follow-config.test.ts fails if this file and the config disagree.
 */
import "@fontsource-variable/space-grotesk";
import "@fontsource/special-elite/400.css";
