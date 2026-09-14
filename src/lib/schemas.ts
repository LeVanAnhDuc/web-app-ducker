/**
 * `statusValues` is the one survivor of the Prisma-era schema module.
 *
 * Everything else here validated server-action input for the CMS
 * (`appInputSchema`, `featureInputSchema`, `sectionInputSchema`,
 * `docPageInputSchema`, `localeInputSchema`, `appKindValues`, `statusSchema`,
 * `appKindSchema`) and was deleted along with the administration surface
 * (ADR-0019) — nothing in `src/` imported them.
 *
 * This one survives because `src/content/nav-tree.ts` types its `NavRow.status`
 * field against it: every row built in `content/nav.ts` is `"PUBLISHED"`, and
 * `buildNavTree` / `assertNavInvariants` still filter on that value from their
 * Prisma-era contract (see the comment on `listNavRows` in `content/nav.ts`).
 */
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
