// src/lib/fuzzy.test.ts
import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzy";

const docs = [
  { href: "/vi/apps/ducker-id", title: "Ducker ID", kind: "app" as const, text: "đăng nhập oauth consent" },
  { href: "/vi/apps/manage-gym",     title: "Manage Gym",     kind: "app" as const, text: "nhật ký tập luyện" },
];

describe("fuzzyMatch", () => {
  it("matches on the title", () => {
    expect(fuzzyMatch("gym", docs)[0].title).toBe("Manage Gym");
  });
  it("matches on the body text", () => {
    expect(fuzzyMatch("consent", docs)[0].title).toBe("Ducker ID");
  });
  it("ignores diacritics — typing 'tap luyen' still finds 'tập luyện'", () => {
    expect(fuzzyMatch("tap luyen", docs)[0].title).toBe("Manage Gym");
  });
  it("returns an empty array when nothing matches", () => {
    expect(fuzzyMatch("zzzzz", docs)).toEqual([]);
  });
  it("an empty query returns an empty array, not everything", () => {
    expect(fuzzyMatch("", docs)).toEqual([]);
  });
});
