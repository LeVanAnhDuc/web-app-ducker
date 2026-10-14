// src/i18n/messages.test.ts
import { describe, it, expect } from "vitest";
import vi from "./messages/vi.json";
import en from "./messages/en.json";
import { locales, defaultLocale } from "./locales";

/** The UI string tree: leaves are strings, branches are nested key groups. */
type MessageTree = { [key: string]: string | MessageTree };

const isTree = (value: string | MessageTree): value is MessageTree =>
  typeof value === "object" && value !== null;

/** Returns every key path in dotted form (`group.key`) so the two locales can be compared. */
const flatten = (tree: MessageTree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    isTree(value) ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

const lookup = (tree: MessageTree, path: string): string | MessageTree | undefined =>
  path.split(".").reduce<string | MessageTree | undefined>(
    (node, key) => (node !== undefined && isTree(node) ? node[key] : undefined),
    tree,
  );

const viTree: MessageTree = vi;
const enTree: MessageTree = en;

describe("UI strings", () => {
  it("vi and en have exactly the same keys — a missing key deploys a blank label", () => {
    expect(flatten(enTree).sort()).toEqual(flatten(viTree).sort());
  });
  it("no value is empty", () => {
    for (const msgs of [viTree, enTree]) {
      for (const key of flatten(msgs)) {
        expect(lookup(msgs, key), key).not.toBe("");
      }
    }
  });
  it("the default locale is in the locale list", () => {
    expect(locales).toContain(defaultLocale);
  });
});

describe("project name", () => {
  it("the brand is Ducker in every language", () => {
    for (const msgs of [viTree, enTree]) {
      expect(lookup(msgs, "brand.name")).toBe("Ducker");
    }
  });
  it("the word Atlas no longer appears in the UI strings", () => {
    for (const msgs of [viTree, enTree]) {
      for (const key of flatten(msgs)) {
        expect(String(lookup(msgs, key)), key).not.toMatch(/\bAtlas\b/);
      }
    }
  });
});
