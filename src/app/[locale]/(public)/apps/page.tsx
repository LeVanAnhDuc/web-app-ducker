import type { Metadata } from "next";
import { OverviewPage, overviewMetadata, overviewStaticParams } from "../_entry/entry-page";

/** The overview of every app — the page the top tab and the sidebar's first item open (ADR-0023). */

type PageParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return overviewStaticParams();
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  return overviewMetadata("apps", (await params).locale);
}

export default async function AppsPage({ params }: PageParams) {
  return <OverviewPage group="apps" locale={(await params).locale} />;
}
