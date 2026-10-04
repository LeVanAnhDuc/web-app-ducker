import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryTabs } from "./EntryTabs";

const props = {
  label: "Nội dung của Ducker ID",
  readmeHref: "/vi/apps/x",
  releasesHref: "/vi/apps/x/releases",
  labels: { readme: "README", releases: "Bản phát hành" },
};

describe("EntryTabs", () => {
  it("is a named nav of two real links", () => {
    render(<EntryTabs {...props} current="readme" />);
    expect(screen.getByRole("navigation", { name: "Nội dung của Ducker ID" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "README" })).toHaveAttribute("href", "/vi/apps/x");
    expect(screen.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("href", "/vi/apps/x/releases");
  });

  it("marks only the current tab with aria-current", () => {
    render(<EntryTabs {...props} current="releases" />);
    expect(screen.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "README" })).not.toHaveAttribute("aria-current");
  });
});
