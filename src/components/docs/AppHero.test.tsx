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
  it("the display name is the h1, the repo slug is secondary only", () => {
    render(<AppHero app={app} locale="vi" crumb="Ứng dụng / Lõi" labels={labels} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Ducker ID");
    expect(heading).not.toHaveTextContent("ducker-id");
    expect(screen.getByText("ducker-id")).toBeInTheDocument();
  });

  it("a private repo gets a badge instead of a dead link", () => {
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

  it("flags a missing translation when content falls back to another locale", () => {
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
  it("renders feature titles and descriptions from frontmatter", () => {
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

  it("renders no heading for an empty block when there are no features", () => {
    const { container } = render(<FeatureGrid features={[]} title="Tính năng" />);
    expect(container).toBeEmptyDOMElement();
  });
});
