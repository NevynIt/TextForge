import type { DocumentIdentity } from "../domain/types";

const SHAPE_CODES = ["R", "C", "S", "W"] as const;
const COLOR_CODES = ["r", "g", "b", "y", "p", "c", "w", "u"] as const;
const SHAPEZ_EMPTY_CODE = "--------";
const SHAPEZ_CODE_PATTERN = /^(([CRSW][rgbypcwu])|--){4}$/;

export const shapezColors: Record<(typeof COLOR_CODES)[number], string> = {
  r: "#ff666a",
  g: "#78ff66",
  b: "#66a7ff",
  y: "#fcf52a",
  p: "#dd66ff",
  c: "#87fff5",
  w: "#ffffff",
  u: "#aaaaaa"
};

const quadrantTransforms = [
  { x: 5, y: -5, rotation: 0 },
  { x: 5, y: 5, rotation: 90 },
  { x: -5, y: 5, rotation: 180 },
  { x: -5, y: -5, rotation: 270 }
];

const shapezPaths: Record<(typeof SHAPE_CODES)[number], string> = {
  R: "M -5 -4 H 4 V 5 H -5 Z",
  C: "M -5 5 L -5 -4 A 9 9 0 0 1 4 5 Z",
  S: "M -5 -0.4 L 4 -4 L 0.4 5 L -5 5 Z",
  W: "M -5 -0.4 L 4 -4 L 4 5 L -5 5 Z"
};

interface ParsedQuadrant {
  shape: (typeof SHAPE_CODES)[number] | "-";
  color: (typeof COLOR_CODES)[number] | "-";
}

export function isValidShapezOneLayerCode(code: string | undefined): code is string {
  return typeof code === "string" && SHAPEZ_CODE_PATTERN.test(code) && code !== SHAPEZ_EMPTY_CODE;
}

export function parseShapezOneLayerCode(code: string | undefined): ParsedQuadrant[] | null {
  if (!isValidShapezOneLayerCode(code)) {
    return null;
  }
  return (code.match(/.{1,2}/g) || []).map((part) =>
    part === "--"
      ? { shape: "-", color: "-" }
      : { shape: part[0] as ParsedQuadrant["shape"], color: part[1] as ParsedQuadrant["color"] }
  );
}

export function normalizeShapezOneLayerCode(code: string | undefined, fallbackSeed = "shapez-badge"): string {
  return isValidShapezOneLayerCode(code) ? code : createShapezOneLayerCode(fallbackSeed);
}

export function createShapezOneLayerCode(seed: string): string {
  const qualityChecks = [
    (code: string) => {
      const stats = codeStats(code);
      return stats.nonEmpty >= 2 && stats.distinctColors >= 2;
    },
    (code: string) => codeStats(code).nonEmpty >= 2,
    (code: string) => code !== SHAPEZ_EMPTY_CODE
  ];

  for (const accepts of qualityChecks) {
    for (let salt = 0; salt < 256; salt += 1) {
      const code = createCandidateCode(seed, salt);
      if (accepts(code)) {
        return code;
      }
    }
  }

  return "CrCgCbCy";
}

export function dominantShapezColor(code: string): (typeof COLOR_CODES)[number] {
  const parsed = parseShapezOneLayerCode(code);
  if (!parsed) {
    return "u";
  }
  const counts = new Map<(typeof COLOR_CODES)[number], number>();
  parsed.forEach((part) => {
    if (part.color === "-") {
      return;
    }
    counts.set(part.color, (counts.get(part.color) || 0) + 1);
  });
  let dominant: (typeof COLOR_CODES)[number] = "u";
  let highest = -1;
  COLOR_CODES.forEach((color) => {
    const count = counts.get(color) || 0;
    if (count > highest) {
      dominant = color;
      highest = count;
    }
  });
  return dominant;
}

export function createDocumentIdentity(seed: string): DocumentIdentity {
  const code = createShapezOneLayerCode(seed);
  return documentIdentityForShapezCode(code);
}

export function createUniqueDocumentIdentity(seed: string, existing: Set<string>, preferredCode?: string): DocumentIdentity {
  if (isValidShapezOneLayerCode(preferredCode) && !existing.has(preferredCode)) {
    existing.add(preferredCode);
    return documentIdentityForShapezCode(preferredCode);
  }

  for (let salt = 0; salt < 512; salt += 1) {
    const code = createShapezOneLayerCode(`${seed}:${salt}`);
    if (!existing.has(code) && code !== SHAPEZ_EMPTY_CODE) {
      existing.add(code);
      return documentIdentityForShapezCode(code);
    }
  }

  throw new Error("Unable to allocate unique document badge.");
}

export function shapezOneLayerToSvgBody(code: string): string {
  const parsed = parseShapezOneLayerCode(code) || parseShapezOneLayerCode("CrCgCbCy");
  if (!parsed) {
    return "";
  }
  const background = `<circle cx="0" cy="0" r="11.5" fill="rgba(40, 50, 65, 0.1)" />`;
  const quadrants = parsed
    .map((part, index) => {
      if (part.shape === "-" || part.color === "-") {
        return "";
      }
      const transform = quadrantTransforms[index];
      return `<path d="${shapezPaths[part.shape]}" fill="${shapezColors[part.color]}" stroke="#555" stroke-width="0.9" transform="translate(${transform.x} ${transform.y}) rotate(${transform.rotation})" />`;
    })
    .join("");
  return `${background}${quadrants}`;
}

export function documentIdentityForShapezCode(code: string): DocumentIdentity {
  return {
    color: shapezColors[dominantShapezColor(code)],
    badgeLabel: code,
    badgeKind: "shapez-one-layer",
    shapeCode: code
  };
}

function codeStats(code: string): { nonEmpty: number; distinctColors: number } {
  const parsed = parseShapezOneLayerCode(code);
  if (!parsed) {
    return { nonEmpty: 0, distinctColors: 0 };
  }
  const colors = new Set<string>();
  let nonEmpty = 0;
  parsed.forEach((part) => {
    if (part.shape === "-" || part.color === "-") {
      return;
    }
    nonEmpty += 1;
    colors.add(part.color);
  });
  return { nonEmpty, distinctColors: colors.size };
}

function createCandidateCode(seed: string, salt: number): string {
  let state = hashString(`${seed}:${salt}`);
  const quadrants: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    state = mixHash(state ^ (0x9e3779b9 + index * 0x45d9f3b));
    const empty = state % 5 === 0;
    if (empty) {
      quadrants.push("--");
      continue;
    }
    state = mixHash(state ^ 0x27d4eb2d);
    const shape = SHAPE_CODES[state % SHAPE_CODES.length];
    state = mixHash(state ^ 0x85ebca6b);
    const color = COLOR_CODES[state % COLOR_CODES.length];
    quadrants.push(`${shape}${color}`);
  }
  return quadrants.join("");
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixHash(value: number): number {
  let hash = value >>> 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return hash >>> 0;
}
