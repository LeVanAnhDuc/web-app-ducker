# User journeys

> **Answers:** Which end-to-end flows do users go through?
> **Status:** 🟢 complete
> **Updated:** 2026-09-13 · commit b2d70a8
> **Update when:** a new user flow appears · an existing flow changes in kind

<!-- HOW TO FILL
Write in USER LANGUAGE. No table names, no endpoints, no component names here.
One section per flow, IDs increment US-01, US-02… never reused.

"What can go wrong" is the most valuable section — it is the source of test cases and
of the error states on screen. Leave it empty and only the happy path gets built.

DOES NOT CONTAIN: UI layout detail, the function inventory (-> 02-requirements/scope.md).
-->

## US-01 · Read the documentation for one app

**Context:** a visitor lands on the site, in Vietnamese or English, wanting to know what
one app does and how to run it.

**Steps:**
1. Open the site; the root redirects to the preferred locale (`/` → `/vi`).
2. The home page shows the ecosystem diagram and a grid of apps.
3. Pick an app from the top tab strip, the left navigation tree, or the grid.
4. Read the page: what it is → quick start → how to use → features.
5. Use the right-hand table of contents to jump to a section.

**Expected result:** the page renders as static HTML from the CDN, in the chosen
language, with a table of contents built from its own sections.

**What can go wrong:**
- No translation for the current locale → render the default locale plus a
  "translation missing" badge, never a blank page. The badge doubles as the
  translation to-do list.
- A navigation node exists but has no publishable child → the node is not clickable
  rather than a link to a 404.
- The slug does not exist → 404.

**Related functions:** FR-01 · FR-02 · FR-03 · FR-11

---

## US-02 · Search the whole site

**Context:** the reader knows a word, not which page holds it.

**Steps:**
1. Open the search box (it only loads its index at that moment).
2. Type; matching happens in the browser.
3. Pick a result and land on the page.

**Expected result:** results reflect the **current** content, including an edit made a
minute ago through the CMS.

**What can go wrong:**
- The index is built at deploy time instead of on demand → results silently lag the
  content until the next deploy. This is why the index is a cached route handler, not
  a build artifact.

**Related functions:** FR-04

---

## US-03 · Switch language

**Context:** the reader wants the other language on the page they are already on.

**Steps:** click `VI` / `EN` in the top bar.

**Expected result:** the same page in the other language, the choice remembered for the
next visit.

**What can go wrong:**
- A background request (soft navigation, server action, revalidate) can lose the locale
  on an auth redirect — the failure mode that
  [ADR-0010](../decisions/0010-locale-aware-login-redirect.md) exists to fix.

**Related functions:** FR-05

---

## US-04 · Sign in to administer

**Context:** the owner wants to change content.

**Steps:**
1. Go to `/{locale}/admin`; not signed in → redirected to `/{locale}/admin/login`.
2. Enter the single administrator email and password.
3. Land on the dashboard: what is still a draft, which app is missing a translation.

**Expected result:** a session; the whole `/admin` area becomes reachable.

**What can go wrong:**
- The password hash in `.env` contains `$` and was not escaped → it is truncated on
  load and the page only ever says "wrong password". See [`../05-operations/runbook.md`](../05-operations/runbook.md) §3.1.
- Deep-linking into `/admin/...` before signing in must come back to the login page
  **of the same locale**.

**Related functions:** FR-06

---

## US-05 · Edit content and see it live

**Context:** the owner spots a mistake on a public page.

**Steps:**
1. Open the app or doc page in the CMS editor.
2. Edit the general information, features, or sections; reorder with the arrow controls.
3. Save.
4. Open the public page.

**Expected result:** the public page shows the new content **without a deploy**. This is
the product's central promise and the one `e2e/content-roundtrip.spec.ts` proves.

**What can go wrong:**
- Content written to the database from **outside the running server** (a seed, an e2e
  suite on another port, hand-typed SQL) does not invalidate that server's cache — and
  the cache is on disk, so restarting does not clear it. `rm -rf .next`.
- The first view right after a write can still serve the stale copy: tag revalidation
  is stale-while-revalidate.
- Publishing a container with no published child is refused (invariant I2).

**Related functions:** FR-07 · FR-08 · FR-09

---

## US-06 · Reshape the navigation tree

**Context:** the owner wants a new tab, or wants an app to sit under a different group.

**Steps:**
1. Open `/admin/navigation`.
2. Add a root node (a tab), a container, or attach an app / doc page as a leaf.
3. Reorder with the four arrow buttons, or drag.
4. Publish.

**Expected result:** the top tab strip and the left sidebar — the same tree — change on
the public site. URLs do **not** change: they stay flat.

**What can go wrong:**
- Making a node its own descendant (a cycle) → refused; detection walks **up** the
  parent chain, not down (a `visited` set going down can never catch it).
- Giving a node children while it is an app or doc page → refused, it must be a
  container.
- Deleting the last app under a published container would leave an empty published
  container — the delete path re-checks and demotes the parent to draft, and says so.

**Related functions:** FR-10 · FR-11

---

## US-07 · Add an image

**Context:** a page needs a diagram or screenshot.

**Steps:** open the media library, upload, pick the image inside the editor.

**Expected result:** the file lands in object storage and is served from a public URL;
its dimensions are recorded when they can be read.

**What can go wrong:**
- Object storage is not configured → the drop zone is not drawn at all rather than
  offering an upload that cannot work.
- The bucket exists but public access was never enabled → every image 404s.
- Dimensions cannot be read → stored as unknown; the upload still succeeds, because
  the measurement is nice-to-have, not an admission condition.

**Related functions:** FR-12

---

## US-08 · Preview a draft

**Context:** the owner wants to see an unpublished page as it will look.

**Steps:** open the preview link carrying the preview secret.

**Expected result:** the draft renders.

**What can go wrong:**
- A wrong or missing secret currently renders an explanatory block with HTTP **200**
  instead of 403/503 — returning the right status needs an experimental Next flag. See
  [`backlog.md`](../04-state/backlog.md) §Accepted long-term.

**Related functions:** FR-13
