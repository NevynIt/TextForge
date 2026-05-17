// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App smoke", () => {
  it("renders the workbench shell", async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(screen.getByText("Ready.")).toBeTruthy());
    expect(screen.getByText("TextForge")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New" })).toBeTruthy();
    expect((container.querySelector(".actionbar select") as HTMLSelectElement | null)?.disabled).toBe(false);
    expect(screen.getByLabelText("Pipeline")).toBeTruthy();
    expect(screen.queryByText("No document open.")).toBeNull();
  });
});
