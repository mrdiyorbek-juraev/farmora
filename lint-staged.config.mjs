/**
 * lint-staged config — function form.
 *
 * Why a function returning a command WITHOUT file paths:
 *   On Windows, lint-staged single-quotes paths that contain special chars
 *   (e.g. `'D:\…\[locale]\layout.tsx'`). The Windows shell does not strip
 *   single quotes, so biome receives the literal quoted string and treats
 *   it as a relative path — producing `os error 123 (invalid path syntax)`.
 *
 *   By returning a string with no `${files}` interpolation, lint-staged
 *   never passes the paths to biome. Instead biome's `--staged` flag reads
 *   the file list directly from the git index, sidestepping the issue.
 */
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,css,md,mdx}": () =>
    "pnpm exec biome check --write --no-errors-on-unmatched --staged",
};
