import matter from "gray-matter";
import { z } from "zod";

/** The five integration states. Closed on purpose: a sixth must fail the build
 *  rather than render an unstyled chip. MASTER.md §1. */
export const integrationValues = ["core", "connected", "standalone", "planned", "private"] as const;
export type Integration = (typeof integrationValues)[number];

export const entryFrontmatter = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  status: z.enum(integrationValues),
  repo: z.string().url().optional(),
  tagline: z.string().min(1).optional(),
  order: z.number().int(),
  techStack: z.array(z.string()).default([]),
  /** Only "connected" entries carry this; it draws the branch under Ducker ID. */
  parent: z.string().optional(),
  /** Authored, not derived: the repository exists but is not public.
      Independent of `status: "private"`, which is about ecosystem integration. */
  repoPrivate: z.boolean().default(false),
  features: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        icon: z.string().min(1).optional(),
      }),
    )
    .default([]),
});

export type EntryFrontmatter = z.infer<typeof entryFrontmatter>;

export function parseEntry(raw: string, file: string): { data: EntryFrontmatter; body: string } {
  const { data, content } = matter(raw);
  const parsed = entryFrontmatter.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${file}: ${issue.path.join(".") || "frontmatter"} — ${issue.message}`);
  }
  // A slug in the name slot survives every type check and looks like real data
  // on the page, so it is caught here instead. MASTER.md §5.
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(parsed.data.name)) {
    throw new Error(`${file}: "${parsed.data.name}" is a slug, not a display name`);
  }
  return { data: parsed.data, body: content };
}
