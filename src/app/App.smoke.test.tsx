// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App smoke", () => {
  it("renders the workbench shell", async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText("TextForge")).toBeTruthy());
    expect(screen.getByText("Language")).toBeTruthy();
    expect(screen.getByText("Pipeline")).toBeTruthy();
  });
});
