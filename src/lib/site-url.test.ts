import { describe, expect, it } from "vitest";

import { PRODUCTION_URL, siteUrl } from "./site-url";

describe("siteUrl", () => {
  it("defaults to the production URL", () => {
    expect(siteUrl({}).href).toBe(`${PRODUCTION_URL}/`);
  });

  it("treats a blank variable as unset", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "  " }).href).toBe(`${PRODUCTION_URL}/`);
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://docs.example.com" }).href).toBe("https://docs.example.com/");
  });
});
