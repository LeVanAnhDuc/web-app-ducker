import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { AppDetail } from "@/content";
import { AppHero } from "./AppHero";
import { FeatureGrid } from "./FeatureGrid";

const app: AppDetail = {
  slug: "ducker-id",
  name: "Ducker ID",
  tagline: "Cổng đăng nhập và bảng khởi chạy ứng dụng",
  integration: "core",
  techStack: ["Next.js 16"],
  repoUrl: "https://github.com/LeVanAnhDuc/web-app-ducker-id",
  isRepoPrivate: false,
  parent: null,
  body: "Nội dung.",
  features: [],
  locale: "vi",
  isFallback: false,
};

const labels = {
  status: "Lõi",
  privateRepo: "Repo riêng tư",
  repo: "Xem repo",
  fallback: "Chưa có bản dịch",
};

describe("AppHero", () => {
  it("tên hiển thị là h1, slug repo chỉ ở vai phụ", () => {
    render(<AppHero app={app} locale="vi" crumb="Ứng dụng / Lõi" labels={labels} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Ducker ID");
    expect(heading).not.toHaveTextContent("ducker-id");
    expect(screen.getByText("ducker-id")).toBeInTheDocument();
  });

  it("repo riêng tư thì không dựng liên kết chết, thay bằng huy hiệu", () => {
    render(
      <AppHero
        app={{ ...app, isRepoPrivate: true }}
        locale="vi"
        crumb="Ứng dụng / Lõi"
        labels={labels}
      />,
    );
    expect(screen.queryByRole("link", { name: "Xem repo" })).toBeNull();
    expect(screen.getByText("Repo riêng tư")).toBeInTheDocument();
  });

  it("báo bản dịch thiếu khi nội dung lùi về ngôn ngữ khác", () => {
    render(
      <AppHero
        app={{ ...app, locale: "vi", isFallback: true }}
        locale="en"
        crumb="Apps / Core"
        labels={labels}
      />,
    );
    expect(screen.getByText("Chưa có bản dịch")).toBeInTheDocument();
  });
});

describe("FeatureGrid", () => {
  it("dựng tiêu đề và mô tả tính năng từ frontmatter", () => {
    render(
      <FeatureGrid
        title="Tính năng"
        features={[
          { title: "Đăng nhập OTP", description: null, icon: null },
          { title: "Consent screen", description: "Màn hình xin quyền OAuth.", icon: null },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Đăng nhập OTP" })).toBeInTheDocument();
    expect(screen.getByText("Màn hình xin quyền OAuth.")).toBeInTheDocument();
  });

  it("không tính năng nào thì không dựng tiêu đề cho khối trống", () => {
    const { container } = render(<FeatureGrid features={[]} title="Tính năng" />);
    expect(container).toBeEmptyDOMElement();
  });
});
