import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import type { AppCard as GameCardRow } from "@/content";
import styles from "./AppCard.module.css";

export type GameCardProps = {
  game: GameCardRow;
  /** Nhãn huy hiệu trạng thái, đã dịch. Không có nhãn thì không dựng huy hiệu. */
  statusLabel?: string;
  /** Nhãn liên kết repo, đã dịch. Ví dụ "Xem trên GitHub". */
  repoLabel?: string;
};

/**
 * Game row for the home page and `/games` — the same block as `AppCard`, and it
 * reuses `AppCard.module.css` on purpose (R5): there is no `/games/[slug]`
 * detail route, so a game card differs from an app card in exactly one way —
 * the name is plain text, not a link — and nothing here earns its own
 * stylesheet. The repo link lives on the slug line, same as `AppCard`.
 */
export function GameCard({ game, statusLabel, repoLabel }: GameCardProps) {
  const repoHref = !game.isRepoPrivate && game.repoUrl ? game.repoUrl : null;

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.top}>
        <h3 className={styles.name}>{game.name}</h3>
        {statusLabel ? <Badge kind={game.integration}>{statusLabel}</Badge> : null}
      </div>

      <p className={styles.slug}>
        {repoHref && repoLabel ? (
          <a
            // See `AppCard`: `nameLink` is reused here purely for its
            // `display`/`min-height` (WCAG 2.2 SC 2.5.8), not its colour.
            className={`${styles.nameLink} ${styles.slugLink}`}
            href={repoHref}
            aria-label={`${repoLabel}: ${game.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {game.slug}
          </a>
        ) : (
          game.slug
        )}
      </p>

      {game.tagline ? (
        <p className={styles.tagline} data-testid="tagline">
          {game.tagline}
        </p>
      ) : null}

      {game.techStack.length > 0 ? (
        <div className={styles.chips}>
          {game.techStack.map((tech) => (
            <Chip key={tech}>{tech}</Chip>
          ))}
        </div>
      ) : null}
    </article>
  );
}
