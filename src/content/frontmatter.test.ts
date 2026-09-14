import { describe, expect, it } from "vitest";
import { parseEntry } from "./frontmatter";

const ok = `---
name: Ducker ID
slug: web-app-ducker-id
status: core
repo: https://github.com/LeVanAnhDuc/web-app-ducker-id
tagline: Identity provider.
order: 10
---
Body text.`;

describe("parseEntry", () => {
  it("reads the frontmatter and keeps the body", () => {
    const { data, body } = parseEntry(ok, "apps/web-app-ducker-id.en.mdx");
    expect(data.name).toBe("Ducker ID");
    expect(data.status).toBe("core");
    expect(data.order).toBe(10);
    expect(body.trim()).toBe("Body text.");
  });

  it("allows a planned entry with no tagline and no repo", () => {
    const raw = `---\nname: Tier List\nstatus: planned\norder: 90\n---\n`;
    const { data } = parseEntry(raw, "apps/tier-list.vi.mdx");
    expect(data.tagline).toBeUndefined();
    expect(data.slug).toBeUndefined();
  });

  it("rejects a status outside the five, naming the file", () => {
    const raw = `---\nname: X\nstatus: archived\norder: 1\n---\n`;
    expect(() => parseEntry(raw, "apps/x.vi.mdx")).toThrow(/apps\/x\.vi\.mdx/);
    expect(() => parseEntry(raw, "apps/x.vi.mdx")).toThrow(/status/);
  });

  it("rejects a display name that is really a slug", () => {
    const raw = `---\nname: web-app-match-cv\nstatus: connected\norder: 1\n---\n`;
    expect(() => parseEntry(raw, "apps/match-cv.vi.mdx")).toThrow(/display name/i);
  });

  it("parses features and keeps their order", () => {
    const raw = `---
name: Test App
status: core
order: 1
features:
  - title: Feature One
    description: First feature
    icon: star
  - title: Feature Two
    description: Second feature
---
`;
    const { data } = parseEntry(raw, "apps/test.vi.mdx");
    expect(data.features).toHaveLength(2);
    expect(data.features[0].title).toBe("Feature One");
    expect(data.features[1].title).toBe("Feature Two");
    expect(data.features[0].description).toBe("First feature");
  });

  it("defaults features to an empty array when not provided", () => {
    const raw = `---
name: Simple App
status: core
order: 1
---
`;
    const { data } = parseEntry(raw, "apps/simple.vi.mdx");
    expect(data.features).toEqual([]);
  });

  it("defaults repoPrivate to false when not provided", () => {
    const raw = `---
name: Public Repo App
status: core
order: 1
repo: https://github.com/example/repo
---
`;
    const { data } = parseEntry(raw, "apps/public.vi.mdx");
    expect(data.repoPrivate).toBe(false);
  });

  it("allows repoPrivate to be set to true for private repositories", () => {
    const raw = `---
name: Private Repo App
status: core
order: 1
repo: https://github.com/example/private-repo
repoPrivate: true
---
`;
    const { data } = parseEntry(raw, "apps/private.vi.mdx");
    expect(data.repoPrivate).toBe(true);
  });

  it("allows status: 'private' with a repo URL and repoPrivate: true", () => {
    const raw = `---
name: Private Integration
status: private
order: 1
repo: https://github.com/example/private-app
repoPrivate: true
---
`;
    const { data } = parseEntry(raw, "apps/private-integration.vi.mdx");
    expect(data.status).toBe("private");
    expect(data.repo).toBe("https://github.com/example/private-app");
    expect(data.repoPrivate).toBe(true);
  });

  it("allows a non-planned status without a repo and defaults repoPrivate to false", () => {
    const raw = `---
name: App Without Repo
status: planned
order: 1
---
`;
    const { data } = parseEntry(raw, "apps/no-repo.vi.mdx");
    expect(data.repo).toBeUndefined();
    expect(data.repoPrivate).toBe(false);
  });
});
