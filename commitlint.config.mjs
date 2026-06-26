/**
 * Conventional Commits — https://www.conventionalcommits.org/
 *
 * Examples:
 *   feat(cattle): add herd list page
 *   fix(auth): handle expired Clerk session
 *   chore(deps): bump @supabase/ssr
 *   refactor(db): split client into server/browser/admin
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "revert",
      ],
    ],
    "subject-case": [2, "never", ["pascal-case", "upper-case", "start-case"]],
    "header-max-length": [2, "always", 100],
  },
};
