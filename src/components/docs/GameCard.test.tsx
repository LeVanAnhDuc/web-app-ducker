import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameCard } from "./GameCard";

const base = {
  slug: "web-game-duck-solitaire",
  name: "Duck Solitaire",
  tagline: "Mỗi ván bài đều sinh từ một seed",
  techStack: [] as string[],
  integration: "standalone" as const,
  isRepoPrivate: false,
  repoUrl: "https://github.com/LeVanAnhDuc/web-game-duck-solitaire",
  parent: null,
};

describe("GameCard", () => {
  it("tên hiển thị là tiêu đề, không phải liên kết — R5 không có trang chi tiết", () => {
    render(<GameCard game={base} />);
    const heading = screen.getByRole("heading");
    expect(heading).toHaveTextContent("Duck Solitaire");
    expect(screen.queryByRole("link", { name: "Duck Solitaire" })).toBeNull();
  });

  it("dòng slug dẫn thẳng ra repo khi công khai", () => {
    render(<GameCard game={base} repoLabel="Xem trên GitHub" />);
    expect(screen.getByRole("link", { name: /Duck Solitaire|web-game-duck-solitaire/ }))
      .toHaveAttribute("href", base.repoUrl);
  });

  it("repo riêng tư thì không dựng liên kết chết", () => {
    render(<GameCard game={{ ...base, isRepoPrivate: true }} repoLabel="Xem trên GitHub" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(base.slug)).toBeInTheDocument();
  });

  it("không tagline thì không bịa mô tả", () => {
    render(<GameCard game={{ ...base, tagline: null }} />);
    expect(screen.queryByTestId("tagline")).toBeNull();
  });
});
