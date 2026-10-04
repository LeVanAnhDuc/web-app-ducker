import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AppCard } from "@/content";
import { RegistryList } from "./RegistryList";

const labels = {
  core: "Lõi",
  connected: "Đã nối",
  standalone: "Độc lập",
  planned: "Dự kiến nối",
  private: "Repo riêng tư",
};
const entry = (over: Partial<AppCard>): AppCard => ({
  slug: "web-app-ducker-id",
  name: "Ducker ID",
  tagline: "Một tài khoản",
  integration: "core",
  techStack: [],
  repoUrl: null,
  isRepoPrivate: false,
  parent: null,
  ...over,
});

describe("RegistryList", () => {
  it("renders one list item per entry, linking to the detail page", () => {
    render(
      <RegistryList
        entries={[
          entry({}),
          entry({ slug: "web-app-match-cv", name: "Match CV", integration: "connected", parent: "web-app-ducker-id" }),
        ]}
        basePath="/vi/apps"
        statusLabels={labels}
      />,
    );
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Ducker ID/ })).toHaveAttribute("href", "/vi/apps/web-app-ducker-id");
  });

  it("shows the translated status, never the raw key", () => {
    render(<RegistryList entries={[entry({ integration: "planned", tagline: null })]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.getByText("Dự kiến nối")).toBeInTheDocument();
    expect(screen.queryByText("planned")).toBeNull();
  });

  it("invents no tagline when the entry has none", () => {
    render(<RegistryList entries={[entry({ tagline: null })]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.queryByTestId("tagline")).toBeNull();
  });

  it("keeps the slug secondary — it is not inside the name", () => {
    render(<RegistryList entries={[entry({})]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.getByText("Ducker ID")).not.toHaveTextContent("web-app-ducker-id");
    expect(screen.getByText("web-app-ducker-id")).toBeInTheDocument();
  });
});
