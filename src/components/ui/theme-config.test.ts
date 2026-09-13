import { describe, it, expect } from "vitest";

import { THEME_STORAGE_KEY } from "./theme-config";

describe("theme-config", () => {
  // Changing this string silently signs every existing visitor out of their
  // theme choice. See docs/specs/next-themes/design.md section 6.
  it("keeps the storage key the hand-rolled implementation used", () => {
    expect(THEME_STORAGE_KEY).toBe("ducker-theme");
  });
});
