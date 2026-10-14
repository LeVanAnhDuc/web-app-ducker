/**
 * Pure helpers for slugs and anchors. No dependency on any other layer.
 */

/** The combining diacritic range that NFD splits out (U+0300..U+036F). */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Normalises a Vietnamese string into a URL-safe ASCII slug.
 *
 * `đ` and `Đ` must be replaced BEFORE `normalize("NFD")`: they are separate
 * letters in Unicode, not "d + mark", so NFD cannot split them and the
 * diacritic-stripping step below would miss them.
 */
export function slugify(input: string): string {
  return input
    .replace(/đ/g, "d") // đ
    .replace(/Đ/g, "D") // Đ
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // whitespace and odd characters collapse into one hyphen
    .replace(/^-+|-+$/g, ""); // no stray hyphens at either end
}

/**
 * Hands out unique heading anchors in document order — the one disambiguation
 * rule shared by `buildToc` (authored markdown) and `renderMarkdownWithToc`
 * (READMEs), so the same headings always get the same anchors.
 *
 * `seen` counts occurrences per base, so repeats keep counting up; `emitted`
 * stops a base's own count colliding with an anchor a different base produced
 * ("Cài đặt" (2nd) vs. "Cài đặt 2"). An emoji- or symbol-only title slugifies to
 * "", which would render `href="#"` — it gets a stable per-position anchor.
 */
export function createAnchorAllocator(): (title: string) => string {
  const seen = new Map<string, number>();
  const emitted = new Set<string>();
  let position = 0;
  return (title) => {
    position += 1;
    const base = slugify(title) || `section-${position}`;
    let n = (seen.get(base) ?? 0) + 1;
    let candidate = n === 1 ? base : `${base}-${n}`;
    while (emitted.has(candidate)) {
      n++;
      candidate = `${base}-${n}`;
    }
    seen.set(base, n);
    emitted.add(candidate);
    return candidate;
  };
}

/** A section's anchor follows the same rule as slugs so `#...` always matches the table of contents. */
export function toAnchor(title: string): string {
  return slugify(title);
}

/**
 * Duplicate anchors make the table of contents and `#` links jump to the wrong
 * place. No schema can express this constraint, so it is checked here.
 */
export function ensureUniqueAnchors(
  anchors: string[],
): { ok: true } | { ok: false; duplicate: string } {
  const seen = new Set<string>();
  for (const anchor of anchors) {
    if (seen.has(anchor)) return { ok: false, duplicate: anchor };
    seen.add(anchor);
  }
  return { ok: true };
}
