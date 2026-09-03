// src/lib/schemas.test.ts
import { describe, it, expect } from "vitest";
import { appInputSchema, sectionInputSchema } from "./schemas";

describe("appInputSchema", () => {
  it("từ chối slug có chữ hoa hoặc khoảng trắng", () => {
    expect(appInputSchema.safeParse({ slug: "Ducker ID", kind: "CORE", status: "DRAFT" }).success).toBe(false);
  });
  it("nhận slug hợp lệ", () => {
    const r = appInputSchema.safeParse({ slug: "ducker-id", kind: "CORE", status: "DRAFT" });
    expect(r.success).toBe(true);
  });
  it("techStack mặc định là mảng rỗng", () => {
    const r = appInputSchema.parse({ slug: "a", kind: "SATELLITE", status: "DRAFT" });
    expect(r.techStack).toEqual([]);
  });
});

describe("sectionInputSchema", () => {
  it("thân bài phải có discriminator type", () => {
    expect(sectionInputSchema.safeParse({ anchor: "a", title: "T", body: { content: "x" } }).success).toBe(false);
    expect(sectionInputSchema.safeParse({ anchor: "a", title: "T", body: { type: "markdown", content: "x" } }).success).toBe(true);
  });
});
