import type { Metadata } from "next";
import { DetailPage, detailMetadata, detailStaticParams } from "../../../_entry/entry-page";

// ISR: GitHub is asked again at most once an hour (ADR-0023). Must stay a literal —
// Next reads segment config statically.
export const revalidate = 3600;

type PageParams = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return detailStaticParams("games", { requireRepo: true });
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  return detailMetadata("games", locale, slug, "releases");
}

export default async function GameReleasesPage({ params }: PageParams) {
  const { locale, slug } = await params;
  return <DetailPage group="games" locale={locale} slug={slug} tab="releases" />;
}
