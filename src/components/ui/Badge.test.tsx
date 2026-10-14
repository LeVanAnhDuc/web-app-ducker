// src/components/ui/Badge.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("sets data-kind so CSS picks the status colour", () => {
    render(<Badge kind="private">Repo riêng tư</Badge>);
    expect(screen.getByText("Repo riêng tư").getAttribute("data-kind")).toBe("private");
  });
  it("writes no colour value directly in inline style", () => {
    const { container } = render(<Badge kind="core">Lõi</Badge>);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i);
  });
});
