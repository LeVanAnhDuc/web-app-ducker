import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";
import { buildSitemap } from "@/lib/sitemap";

/** `/sitemap.xml` — prerendered at build, like the pages it lists. */
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(siteUrl());
}
