import type { DocumentIdentity } from "../domain/types";
import { normalizeShapezOneLayerCode, shapezOneLayerToSvgBody } from "../core/shapezBadges";

export function DocumentBadge({ identity }: { identity: DocumentIdentity }) {
  const code = normalizeShapezOneLayerCode(identity.shapeCode || identity.badgeLabel, identity.badgeLabel || "document-badge");
  return (
    <span class="document-badge" title={code} aria-label={`Shape ${code}`}>
      <svg viewBox="-14 -14 28 28" role="img" aria-hidden="true" dangerouslySetInnerHTML={{ __html: shapezOneLayerToSvgBody(code) }} />
    </span>
  );
}

export function documentBadgeSvgMarkup(identity: DocumentIdentity): string {
  const code = normalizeShapezOneLayerCode(identity.shapeCode || identity.badgeLabel, identity.badgeLabel || "document-badge");
  return `<span class="document-badge" title="${escapeAttribute(code)}"><svg viewBox="-14 -14 28 28" role="img" aria-hidden="true">${shapezOneLayerToSvgBody(code)}</svg></span>`;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
