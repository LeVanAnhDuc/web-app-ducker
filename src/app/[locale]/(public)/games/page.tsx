import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { GameCard } from "@/components/docs/GameCard";
import { defaultLocale, locales } from "@/i18n/locales.generated";
import { listGames } from "@/content";
import styles from "./page.module.css";

/**
 * Danh sách toàn bộ trò chơi — đích của mục "Trò chơi" trên thanh trên cùng.
 *
 * R5: không có `/games/[slug]`. `getApp` chỉ tìm trong `apps`, nên một trò chơi
 * không có trang chi tiết nào để mở — mỗi thẻ ở đây dẫn thẳng ra kho mã của nó.
 */

type PageParams = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("games.title")} — ${t("brand.name")}`,
    description: t("games.description"),
    alternates: {
      canonical: `/${locale}/games`,
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, `/${code}/games`])),
        "x-default": `/${defaultLocale}/games`,
      },
    },
  };
}

export default async function GamesPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const games = await listGames(locale);

  const statusLabels = {
    core: t("status.core"),
    connected: t("status.connected"),
    planned: t("status.planned"),
    standalone: t("status.standalone"),
    private: t("status.private"),
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{t("games.eyebrow", { count: games.length })}</p>
        <h1 className={styles.title}>{t("games.title")}</h1>
        <p className={styles.lede}>{t("games.lede")}</p>
      </header>

      {games.length > 0 ? (
        <div className={styles.cards} role="list">
          {games.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              statusLabel={statusLabels[game.integration]}
              repoLabel={t("app.viewRepoOnGithub")}
            />
          ))}
        </div>
      ) : (
        // Màn hình trống là lời mời hành động, không phải chỗ than thở.
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("games.emptyTitle")}</p>
          <p className={styles.emptyBody}>{t("games.emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
