// src/lib/slug.test.ts
import { describe, it, expect } from "vitest";
import { slugify, toAnchor, ensureUniqueAnchors } from "./slug";

describe("slugify", () => {
  it("strips Vietnamese diacritics", () => {
    expect(slugify("Chạy thử trong 5 phút")).toBe("chay-thu-trong-5-phut");
  });
  it("handles đ and Đ", () => {
    expect(slugify("Đăng nhập")).toBe("dang-nhap");
  });
  it("collapses whitespace and odd characters into one hyphen", () => {
    expect(slugify("Biến   môi  trường!!")).toBe("bien-moi-truong");
  });
  it("leaves no stray hyphens at either end", () => {
    expect(slugify("  --Là gì--  ")).toBe("la-gi");
  });
  it("an empty string returns empty", () => {
    expect(slugify("   ")).toBe("");
  });
});

describe("ensureUniqueAnchors", () => {
  it("accepts a list without duplicates", () => {
    expect(ensureUniqueAnchors(["la-gi", "quick-start"])).toEqual({ ok: true });
  });
  it("catches a duplicate anchor — duplicates make the table of contents jump to the wrong place", () => {
    expect(ensureUniqueAnchors(["la-gi", "la-gi"])).toEqual({ ok: false, duplicate: "la-gi" });
  });
});

describe("toAnchor", () => {
  it("reuses slugify", () => {
    expect(toAnchor("Tính năng")).toBe("tinh-nang");
  });
});
