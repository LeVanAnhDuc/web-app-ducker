import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import type { AppCard as AppCardRow } from "@/content";
import styles from "./AppCard.module.css";

/**
 * Data for one app card — the `AppCard` shape from `@/content` (ADR-0018),
 * read straight from frontmatter. There is no editorial `status` to filter out:
 * file-backed content has no such state (R14).
 */
export type AppCardData = AppCardRow;

export type AppCardProps = {
  app: AppCardData;
  /** Locale prefix for every link in the card. */
  locale: string;
  /**
   * Status badge label, **already translated**. No label means no badge: better
   * a missing badge than showing the reader a technical key.
   */
  statusLabel?: string;
  /** Repo link label, already translated, e.g. "View on GitHub". */
  repoLabel?: string;
  /** Group prefix for the name link; defaults to `/${locale}/apps`. Games pass `/${locale}/games`. */
  basePath?: string;
};

/**
 * App card in the home page grid.
 *
 * The most important invariant: **the display name is the heading, the repo
 * slug is secondary mono text only**. The slug never climbs into the heading.
 *
 * `role="listitem"` is an ARIA role, not a tag change: the card stays an
 * `<article>` (unchanged CSS), but the card grids it sits in (home, `/apps`)
 * are semantically lists, and e2e/registry.spec.ts asserts on that role.
 */
export function AppCard({ app, locale, statusLabel, repoLabel, basePath }: AppCardProps) {
  const detailHref = `${basePath ?? `/${locale}/apps`}/${app.slug}`;
  // A private repo gets no link: clicking it would only reach GitHub's 404 page.
  const repoHref = !app.isRepoPrivate && app.repoUrl ? app.repoUrl : null;

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.top}>
        <h3 className={styles.name}>
          <a className={styles.nameLink} href={detailHref}>
            {app.name}
          </a>
        </h3>
        {statusLabel ? <Badge kind={app.integration}>{statusLabel}</Badge> : null}
      </div>

      <p className={styles.slug}>
        {repoHref && repoLabel ? (
          <a
            // `nameLink` first: it only contributes `display`/`min-height` here (its
            // `color` loses the cascade to `slugLink`'s own, later rule), reused
            // rather than invented to reach the 24px tap target (WCAG 2.2 SC 2.5.8)
            // now that this link exists on the list pages too — the old CMS-backed
            // card never populated `repoUrl` here, so this anchor did not render
            // before ADR-0018.
            className={`${styles.nameLink} ${styles.slugLink}`}
            href={repoHref}
            aria-label={`${repoLabel}: ${app.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {app.slug}
          </a>
        ) : (
          app.slug
        )}
      </p>

      {app.tagline ? (
        <p className={styles.tagline} data-testid="tagline">
          {app.tagline}
        </p>
      ) : null}

      {app.techStack.length > 0 ? (
        <div className={styles.chips}>
          {app.techStack.map((tech) => (
            <Chip key={tech}>{tech}</Chip>
          ))}
        </div>
      ) : null}
    </article>
  );
}
