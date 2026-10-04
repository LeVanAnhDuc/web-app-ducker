import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GithubNotice } from "./GithubNotice";

describe("GithubNotice", () => {
  it("names the problem and links to GitHub", () => {
    render(
      <GithubNotice
        tone="unavailable"
        title="Chưa lấy được README"
        body="Thử lại sau."
        actionLabel="Mở kho trên GitHub"
        actionHref="https://github.com/o/r"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Chưa lấy được README");
    expect(screen.getByRole("link", { name: "Mở kho trên GitHub" })).toHaveAttribute("href", "https://github.com/o/r");
  });

  it("is a plain region, not a live status, when the state is simply empty", () => {
    render(
      <GithubNotice
        tone="empty"
        title="Chưa có bản phát hành nào"
        body="…"
        actionLabel="Releases"
        actionHref="https://github.com/o/r/releases"
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Chưa có bản phát hành nào")).toBeInTheDocument();
  });
});
