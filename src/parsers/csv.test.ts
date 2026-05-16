import { describe, expect, it } from "vitest";
import { parseDelimited } from "./csv";

describe("parseDelimited", () => {
  it("parses quoted CSV fields", () => {
    const table = parseDelimited("name,value\n\"a,b\",2", ",", "text.csv");

    expect(table.columns).toEqual(["name", "value"]);
    expect(table.rows).toEqual([["a,b", "2"]]);
  });

  it("reports row width anomalies", () => {
    const table = parseDelimited("a,b\n1", ",", "text.csv");

    expect(table.diagnostics?.[0].severity).toBe("warning");
  });
});
