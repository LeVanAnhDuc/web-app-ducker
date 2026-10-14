import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppCard } from "./AppCard";

const base = {
  slug: "app-manage-gym", name: "Manage Gym", tagline: "Nhật ký tập luyện",
  techStack: ["Next.js 16"], integration: "planned" as const,
  isRepoPrivate: false, repoUrl: null, parent: null,
};

describe("AppCard", () => {
  it("the display name is the heading, the slug is secondary text only", () => {
    render(<AppCard app={base} locale="vi" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Manage Gym");
    expect(screen.getByRole("heading")).not.toHaveTextContent("app-manage-gym");
  });

  it("a private repo gets no dead GitHub link", () => {
    render(<AppCard app={{ ...base, isRepoPrivate: true }} locale="vi" />);
    expect(screen.queryByRole("link", { name: /github/i })).toBeNull();
  });

  it("the link points to a locale-prefixed path", () => {
    render(<AppCard app={base} locale="en" />);
    expect(screen.getByRole("link", { name: /Manage Gym/ }))
      .toHaveAttribute("href", "/en/apps/app-manage-gym");
  });

  it("links into the group named by basePath — games are not apps", () => {
    render(<AppCard app={base} locale="vi" basePath="/vi/games" />);
    expect(screen.getByRole("link", { name: /Manage Gym/ })).toHaveAttribute("href", "/vi/games/app-manage-gym");
  });
});
