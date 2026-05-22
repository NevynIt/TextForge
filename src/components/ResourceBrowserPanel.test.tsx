// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ResourceBrowserPanel } from "./ResourceBrowserPanel";
import type { TextForgeResource } from "../resources/resourceCatalog";

const markdownResource: TextForgeResource = {
  id: "docs/manual-test-plan",
  title: "Manual Test Plan",
  path: "docs/manual-test-plan.md",
  languageId: "text.markdown",
  text: "# Manual Test Plan",
  description: "Release and smoke-test procedure."
};

const itmResource: TextForgeResource = {
  id: "examples/party",
  title: "Family Birthday Party Plan",
  path: "examples/Party.itm",
  languageId: "text.itm",
  text: "&root Party",
  description: "ITM sample project."
};

describe("ResourceBrowserPanel", () => {
  it("shows View HTML for markdown resources and triggers the view callback", () => {
    const onOpenResource = vi.fn();
    const onViewResource = vi.fn();

    render(
      <ResourceBrowserPanel
        resources={[markdownResource, itmResource]}
        onOpenResource={onOpenResource}
        onViewResource={onViewResource}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View HTML" }));

    expect(onViewResource).toHaveBeenCalledWith(markdownResource);
    expect(onOpenResource).not.toHaveBeenCalled();
  });

  it("hides View HTML for non-markdown resources", () => {
    const onOpenResource = vi.fn();
    const onViewResource = vi.fn();

    render(
      <ResourceBrowserPanel
        resources={[itmResource]}
        onOpenResource={onOpenResource}
        onViewResource={onViewResource}
      />
    );

    expect(screen.queryByRole("button", { name: "View HTML" })).toBeNull();
    expect(screen.getByRole("button", { name: "Open copy" })).toBeTruthy();
  });
});