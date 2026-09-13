# Glossary

> **Answers:** What is this concept called in code, and how does it appear in the UI?
> **Status:** 🟢 complete
> **Updated:** 2026-09-13 · commit b2d70a8
> **Update when:** a new domain concept shows up in code or in the UI

<!-- HOW TO FILL
This file LOCKS NAMES. Its purpose: every session names variables / tables / routes the
same way instead of inventing a new word for the same concept each time.

Only add a row once the concept EXISTS in code or in the UI. A table full of imagined
concepts is worthless.

DOES NOT CONTAIN: long domain explanations (-> overview.md).
-->

| Term | One-sentence definition | Name in code | UI name (VI) | UI name (EN) |
| --- | --- | --- | --- | --- |
| App | One product in the ecosystem, with a repo, a stack and features | `App` | Ứng dụng | App |
| App kind | Whether an app is the identity core or a satellite | `AppKind` = `CORE` \| `SATELLITE` | Lõi / Vệ tinh | Core / Satellite |
| Feature | One bullet of what an app can do | `Feature` | Tính năng | Feature |
| Doc page | A standalone article that is not about one app | `DocPage` | Trang hướng dẫn | Guide |
| Section | One heading-plus-body block inside an app page or doc page | `Section` | Mục | Section |
| Anchor | The slug of a section, used by the table of contents | `Section.anchor` | — | — |
| Nav node | One entry in the navigation tree; the same tree renders the top tabs and the sidebar | `NavNode` | Mục điều hướng | Navigation item |
| Nav kind | Which of the three node types this is | `NavKind` = `CONTAINER` \| `APP` \| `DOC` | Chứa / Ứng dụng / Tài liệu | Container / App / Doc |
| Root node | A node with no parent — it renders as a top tab | `parentId = null` | Mục gốc | Root item |
| Container | A node that only groups and toggles; it holds no content and has no URL | `NavKind.CONTAINER` | Chứa | Container |
| Publication status | Whether a record is visible to the public | `Status` = `DRAFT` \| `PUBLISHED` \| `ARCHIVED` | Nháp / Đã đăng / Lưu trữ | Draft / Published / Archived |
| Locale | One enabled language, ordered, exactly one of them default | `Locale` | Ngôn ngữ | Language |
| Translation | The per-language text of a record; one **row** per language | `*Translation` (`AppTranslation`, …) | Bản dịch | Translation |
| Media | One uploaded image in object storage | `Media` | Ảnh | Image |
| Search index | The per-locale JSON the browser fuzzy-matches against | tag `search-index` | Tìm kiếm | Search |

**Banned names**

- Use **`DocPage`**, never `Article` / `Post` / `Guide` as a code identifier — `Guide`
  is the English UI label only.
- Use **`NavNode`**, never `MenuItem` / `TreeNode` / `NavItem`.
- Use **`Status`**, never `state` / `visibility` / `isPublished` for the same idea.
- Use **`Container`** for the grouping node type, never `Folder` / `Group`.
  `DocPage.group` was a real column and was **deleted** in migration `0002_nav_tree`;
  reintroducing the word invites the model it replaced.
- The product is **Ducker**. `app-store-doc` is the retired repository slug and must not
  appear in new prose. Display names are capitalised with spaces — **Match CV**, not
  `web-app-match-cv`; see `design-system/ducker/MASTER.md` §5.
