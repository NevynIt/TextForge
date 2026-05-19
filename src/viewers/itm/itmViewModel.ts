import type { ItmSourceRange, ResolvedItmEntity, ResolvedItmRelationship } from "@textforge/itm";
import type { ItmPipelineValue, SourceRange } from "../../domain/types";
import { toTextForgeSourceRange } from "../../parsers/itm";

export function getRootEntities(model: ItmPipelineValue): ResolvedItmEntity[] {
  return sortEntities(model.resolved.entities.filter((entity) => !entity.parent));
}

export function getEntityId(entity: Pick<ResolvedItmEntity, "id" | "localId" | "qualifiedId" | "uid">): string {
  return entity.id || entity.localId || localNameFromReference(entity.qualifiedId) || entity.uid;
}

export function getEntityLabel(entity: Pick<ResolvedItmEntity, "label" | "id" | "localId" | "qualifiedId" | "uid">): string {
  return entity.label || entity.id || entity.localId || localNameFromReference(entity.qualifiedId) || entity.uid;
}

export function getEntityType(entity: Pick<ResolvedItmEntity, "typeRef">): string | undefined {
  return entity.typeRef;
}

export function getEntityTags(entity: Pick<ResolvedItmEntity, "tags">): string[] {
  return [...(entity.tags || [])];
}

export function getEntityAttributes(entity: Pick<ResolvedItmEntity, "attributes">): Record<string, unknown> {
  return entity.attributes?.values || {};
}

export function getEntityDescription(entity: Pick<ResolvedItmEntity, "description">): string | undefined {
  return entity.description?.text;
}

export function getOutgoingRelationships(entity: Pick<ResolvedItmEntity, "outgoing">): ResolvedItmRelationship[] {
  return sortRelationships(entity.outgoing.filter((relationship) => relationship.relationshipKind === "explicit"));
}

export function getRelationshipTargetId(relationship: Pick<ResolvedItmRelationship, "target" | "targetRef">): string {
  return relationship.target ? getEntityId(relationship.target) : localNameFromReference(relationship.targetRef) || relationship.targetRef || "missing-target";
}

export function getRelationshipLabel(relationship: Pick<ResolvedItmRelationship, "typeRef">): string {
  return normalizeRelationshipType(relationship.typeRef) || "related-to";
}

export function getSourceRange(range: ItmSourceRange | undefined, sourceText?: string): SourceRange | undefined {
  return sourceText ? toTextForgeSourceRange(range, sourceText) : undefined;
}

export function stringifyAttributeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return JSON.stringify(value);
}

export function sortEntities<T extends Pick<ResolvedItmEntity, "rank">>(entities: readonly T[]): T[] {
  return [...entities].sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
}

function sortRelationships<T extends Pick<ResolvedItmRelationship, "sourceRange">>(relationships: readonly T[]): T[] {
  return [...relationships].sort((left, right) => {
    const leftLine = left.sourceRange?.startLine ?? 0;
    const rightLine = right.sourceRange?.startLine ?? 0;
    if (leftLine !== rightLine) {
      return leftLine - rightLine;
    }
    return (left.sourceRange?.startColumn ?? 0) - (right.sourceRange?.startColumn ?? 0);
  });
}

function localNameFromReference(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value.split("::");
  return parts[parts.length - 1] || value;
}

function normalizeRelationshipType(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }
  return value === "related_to" ? "related-to" : value;
}