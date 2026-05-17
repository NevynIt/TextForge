import type { DocumentIdentity } from "../domain/types";

const shapeColors: Record<string, string> = {
  r: "#e35757",
  g: "#5aa36f",
  b: "#4c78c8",
  y: "#d7a12f",
  p: "#8b67c7",
  c: "#4bb3b4",
  u: "#bfc4ca",
  w: "#ffffff"
};

const quadrants = [
  { x: 16, y: 0, rotation: 0 },
  { x: 16, y: 16, rotation: 90 },
  { x: 0, y: 16, rotation: 180 },
  { x: 0, y: 0, rotation: 270 }
];

export function DocumentBadge({ identity }: { identity: DocumentIdentity }) {
  const code = normalizeShapeCode(identity.shapeCode || identity.badgeLabel);
  return (
    <span class="document-badge" title={code} aria-label={`Shape ${code}`}>
      <svg viewBox="0 0 32 32" role="img" aria-hidden="true" dangerouslySetInnerHTML={{ __html: shapezBadgeSvgBody(code) }} />
    </span>
  );
}

export function documentBadgeSvgMarkup(identity: DocumentIdentity): string {
  const code = normalizeShapeCode(identity.shapeCode || identity.badgeLabel);
  return `<span class="document-badge" title="${escapeAttribute(code)}"><svg viewBox="0 0 32 32" role="img" aria-hidden="true">${shapezBadgeSvgBody(code)}</svg></span>`;
}

function shapezBadgeSvgBody(code: string): string {
  const parts = code.match(/.{1,2}/g) || [];
  return quadrants
    .map((quadrant, index) => {
      const part = parts[index] || "--";
      const shape = part[0] || "-";
      const color = part[1] || "-";
      if (shape === "-" || color === "-") {
        return "";
      }
      const fill = shapeColors[color] || shapeColors.u;
      return `<g transform="translate(${quadrant.x} ${quadrant.y})">${shapePath(shape, fill, quadrant.rotation)}</g>`;
    })
    .join("");
}

function shapePath(shape: string, fill: string, rotation: number): string {
  const transform = `rotate(${rotation} 8 8)`;
  if (shape === "C") {
    return `<path d="M8 8 L8 0 A8 8 0 0 1 16 8 Z" fill="${fill}" stroke="#202225" stroke-width="0.8" transform="${transform}"/>`;
  }
  if (shape === "R") {
    return `<path d="M8 0 H16 V8 H8 Z" fill="${fill}" stroke="#202225" stroke-width="0.8" transform="${transform}"/>`;
  }
  if (shape === "W") {
    return `<path d="M8 8 L16 1 L16 15 Z" fill="${fill}" stroke="#202225" stroke-width="0.8" transform="${transform}"/>`;
  }
  if (shape === "S") {
    return `<path d="M8 0 L10.2 5.4 L16 5.4 L11.4 9 L13.1 15 L8 11.4 L2.9 15 L4.6 9 L0 5.4 L5.8 5.4 Z" fill="${fill}" stroke="#202225" stroke-width="0.65" transform="${transform}"/>`;
  }
  return "";
}

function normalizeShapeCode(value: string): string {
  const clean = value.replace(/[^CRWSrgbypcuw-]/g, "");
  return clean.length >= 8 ? clean.slice(0, 8) : "CwCwCwCw";
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
