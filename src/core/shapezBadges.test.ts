import { describe, expect, it } from "vitest";
import { createShapezOneLayerCode, createUniqueDocumentIdentity, dominantShapezColor, parseShapezOneLayerCode, shapezColors, shapezOneLayerToSvgBody } from "./shapezBadges";

describe("shapezBadges", () => {
  it("parses valid one-layer Shapez codes and rejects invalid ones", () => {
    expect(parseShapezOneLayerCode("CrRgSbWu")).toEqual([
      { shape: "C", color: "r" },
      { shape: "R", color: "g" },
      { shape: "S", color: "b" },
      { shape: "W", color: "u" }
    ]);
    expect(parseShapezOneLayerCode("--------")).toBeNull();
    expect(parseShapezOneLayerCode("CwCw")).toBeNull();
    expect(parseShapezOneLayerCode("xxxxxxxx")).toBeNull();
  });

  it("renders exact Shapez quadrant geometry, palette, and backing", () => {
    expect(shapezOneLayerToSvgBody("CrRgSbWu")).toBe(
      '<circle cx="0" cy="0" r="11.5" fill="rgba(40, 50, 65, 0.1)" />' +
      '<path d="M -5 5 L -5 -4 A 9 9 0 0 1 4 5 Z" fill="#ff666a" stroke="#555" stroke-width="0.9" transform="translate(5 -5) rotate(0)" />' +
      '<path d="M -5 -4 H 4 V 5 H -5 Z" fill="#78ff66" stroke="#555" stroke-width="0.9" transform="translate(5 5) rotate(90)" />' +
      '<path d="M -5 -0.4 L 4 -4 L 0.4 5 L -5 5 Z" fill="#66a7ff" stroke="#555" stroke-width="0.9" transform="translate(-5 5) rotate(180)" />' +
      '<path d="M -5 -0.4 L 4 -4 L 4 5 L -5 5 Z" fill="#aaaaaa" stroke="#555" stroke-width="0.9" transform="translate(-5 -5) rotate(270)" />'
    );
    expect(shapezColors.w).toBe("#ffffff");
    expect(shapezColors.u).toBe("#aaaaaa");
    expect(dominantShapezColor("CrRu--Ru")).toBe("u");
  });

  it("generates readable non-empty one-layer codes", () => {
    const code = createShapezOneLayerCode("alpha");
    const parts = parseShapezOneLayerCode(code);

    expect(code).toMatch(/^(([CRSW][rgbypcwu])|--){4}$/);
    expect(code).not.toBe("--------");
    expect(parts?.filter((part) => part.shape !== "-").length).toBeGreaterThanOrEqual(2);
  });

  it("allocates a new unique code when the preferred code is already taken", () => {
    const existing = new Set(["CrRgSbWu"]);

    const identity = createUniqueDocumentIdentity("seed", existing, "CrRgSbWu");

    expect(identity.shapeCode).toMatch(/^(([CRSW][rgbypcwu])|--){4}$/);
    expect(identity.shapeCode).not.toBe("CrRgSbWu");
    expect(existing.has(identity.shapeCode || "")).toBe(true);
  });
});
