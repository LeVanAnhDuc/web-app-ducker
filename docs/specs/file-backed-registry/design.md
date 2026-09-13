# Design — the registry becomes file-backed, and the CMS goes away

**Liên quan:** FR-22 · FR-23 · FR-24 · retires FR-06 · FR-07 · FR-08 · FR-09 · FR-10 ·
FR-12 · FR-13 · FR-17 · FR-21 · NFR-PERF-02 · NFR-REL-04 · NFR-I18N-01 · NFR-SEC-04 ·
ADR-0018 · ADR-0019

## 1. What changes, in one paragraph

Ducker stops being a database-backed CMS and becomes a static site whose content is
files in this repository. Adding an application, editing a description, publishing a
guide — each is an edit to a file under `content/` and a push. The administration
surface, the database, the identity layer and the object store are deleted outright,
not disabled. The public site keeps every function it has: the registry, app pages, doc
pages, search, language switch, theme, navigation, table of contents, SEO.

## 2. Why

The CMS was built for a second person who never arrived. One account owns the content
(`overview.md` §4 has always said so), and that account already edits this repository
every day with an editor it prefers. What the CMS buys — editing from a browser — costs
a Postgres branch on Neon, an R2 bucket, five secrets on Vercel, a session layer, and
58 files of administration UI. The registry is roughly a hundred short records that
change a few times a month.

The cost shows up as risk, not money: `NFR-DATA-03` already records that once content
has been edited through the CMS the database is the only copy **and there is no backup**.
Files in git have a backup by construction.

## 3. Scope

**In:** deleting the admin surface, the server layer and the schema; moving content into
`content/`; adding the eight repositories missing from the catalogue; a games group.

**Out:** the visual redesign. That is the second branch, against
`docs/design-system/ducker/MASTER.md`, and it must not be mixed in — a diff that both
deletes a subsystem and repaints every surface cannot be reviewed.

## 4. The content model

One file per record, frontmatter plus markdown body. The frontmatter fields are exactly
the columns the registry row and the app page render — nothing speculative.

```
content/
  apps/<slug>.<locale>.mdx      10 applications
  games/<slug>.<locale>.mdx     12 duck games
  docs/<slug>.<locale>.mdx      standalone guides
  nav.ts                        the navigation tree, hand-written
```

```yaml
---
name: Ducker Flow Grid          # display name, capitalised (MASTER.md §5)
slug: web-app-AI-workflow-automation-platform
status: standalone              # core | connected | standalone | planned | private
repo: https://github.com/LeVanAnhDuc/web-app-AI-workflow-automation-platform
tagline: Vẽ đồ thị các nút, nối lại, nền tảng chạy nó.
order: 40
---
```

**Locale is the filename suffix, not a row.** This is the one place the old model does
not survive translation: `ADR-0003` made locale a row in a translation table so a
language could be added as data. With files, a language is a sibling file. The fallback
chain stays — a missing `*.en.mdx` falls back to the default locale exactly as
`AppTranslation` did, so `FR-05` and its "missing translation" badge are unaffected.

**Three records carry no `tagline`.** `Tier List`, `Task Management` and `Duck Strike`
have no description anywhere — each project's own `overview.md` is 🔴 empty. They are
listed with `status: planned` and no tagline rather than an invented one. This is
`ADR-0009` applied: the page states current reality.

## 5. What gets deleted

| Deleted | Count | Replaced by |
| --- | --- | --- |
| `src/app/[locale]/(admin)/**` · `src/components/admin/**` | 58 files | nothing — editing is a commit |
| `src/server/content/` · `src/server/auth/` · `src/server/media/` | 24 files | `src/content/` — a reader over the file tree |
| `prisma/` — schema, 2 migrations, `seed.ts` | — | `content/` |
| `@prisma/client` · `@prisma/adapter-pg` · `next-auth` · `@aws-sdk/client-s3` · `bcryptjs` | 5 deps | — |
| `DATABASE_URL` · `DATABASE_URL_TEST` · `AUTH_SECRET` · `ADMIN_*` · `PREVIEW_SECRET` · `R2_*` | 11 vars | none remain |

`src/server/auth/boundary.test.ts` guarded `I9` — that no component imports Prisma,
Auth.js or the S3 SDK. With all three gone the test has nothing to guard and is deleted
with them; `I9` is retired in place in `invariants.md`.

## 6. What this costs

- **Draft preview (`FR-13`) disappears as a feature and comes back as infrastructure.**
  A draft is now a branch, and Vercel builds a preview URL per branch. Strictly better,
  and `NFR-SEC-07` — the known-wrong 200-instead-of-403 on a refused preview — retires
  with it.
- **Image dimensions are no longer recorded on upload (`FR-12`).** Images move to
  `public/`; anything that needs width and height must carry them in frontmatter.
- **Editing requires a checkout.** This is the whole trade. It is acceptable only
  because there is exactly one editor and that editor is already here.
- **`NFR-REL-05` and `ADR-0012` stop applying.** There is no external write path to
  invalidate a cache, because there is no database to write to. `rm -rf .next` after a
  seed becomes meaningless — the build reads the files.

## 7. Verification

- `pnpm build` with **no environment variables at all** must succeed and produce a
  complete site. That is `NFR-REL-04` strengthened: previously the site rendered empty
  without a database; now there is nothing to be without.
- `pnpm typecheck` · `pnpm lint` clean.
- `pnpm test:run` — every test naming a deleted module goes with it; the content reader
  gets its own tests, including the locale-fallback case that `FR-05` depends on.
- `pnpm e2e` — the existing public specs must pass untouched. Any admin spec is deleted.
- The 22 registry entries render, and the three without a tagline render without one.

## 8. Open question, deliberately not answered here

Whether the games belong on the home registry at all, or only on a `/games` page, is a
content decision the mockup settled visually (two groups on one page) but which will
look different once there are thirty games. Revisit when the count passes twenty.
