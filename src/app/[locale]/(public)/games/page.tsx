import type { Metadata } from "next";
import { OverviewPage, overviewMetadata, overviewStaticParams } from "../_entry/entry-page";

/** The overview of every game — the page the top tab and the sidebar's first item open (ADR-0023). */

type PageParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return overviewStaticParams();
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  return overviewMetadata("games", (await params).locale);
}

export default async function GamesPage({ params }: PageParams) {
  return <OverviewPage group="games" locale={(await params).locale} />;
}
