import type { Metadata } from "next";
import { DetailPage, detailMetadata, detailStaticParams } from "../../../_entry/entry-page";

// ISR: GitHub is asked again at most once an hour (ADR-0023). Must stay a literal —
// Next reads segment config statically.
export const revalidate = 3600;

type PageParams = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return detailStaticParams("apps", { requireRepo: true });
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  return detailMetadata("apps", locale, slug, "releases");
}

export default async function AppReleasesPage({ params }: PageParams) {
  const { locale, slug } = await params;
  return <DetailPage group="apps" locale={locale} slug={slug} tab="releases" />;
}
