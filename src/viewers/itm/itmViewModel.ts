import type { ItmSourceRange, ResolvedItmEntity, ResolvedItmRelationship } from "@textforge/itm";
import type { ItmPipelineValue, SourceRange } from "../../domain/types";
import { toTextForgeSourceRange } from "../../parsers/itm";

export interface ItmGraphViewNode {
  id: string;
  label: string;
  type?: string;
  classes?: string[];
  details?: string;
  sourceRange?: SourceRange;
  style?: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface ItmGraphViewEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: string;
  width?: number;
  color?: string;
  details?: string;
  sourceRange?: SourceRange;
  style?: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface ItmGraphViewModel {
  nodes: ItmGraphViewNode[];
  edges: ItmGraphViewEdge[];
  directed: boolean;
}

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

export function getEntityStyleRecord(entity: Pick<ResolvedItmEntity, "attributes">): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getEntityAttributes(entity))
      .map(([key, value]) => [key, stringifyAttributeValue(value)])
      .filter(([, value]) => value.length > 0)
  );
}

export function getOutgoingRelationships(entity: Pick<ResolvedItmEntity, "outgoing">): ResolvedItmRelationship[] {
  return sortRelationships(entity.outgoing.filter((relationship) => relationship.relationshipKind === "explicit"));
}

export function getRelationshipId(relationship: Pick<ResolvedItmRelationship, "uid" | "id">): string {
  return relationship.id || relationship.uid;
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

export function countEntities(entities: readonly ResolvedItmEntity[]): number {
  return entities.reduce((count, entity) => count + 1 + countEntities(entity.children), 0);
}

export function projectItmGraph(model: ItmPipelineValue): ItmGraphViewModel {
  const sourceText = model.source?.text;
  const nodeIds = new Set(model.resolved.entities.map((entity) => getEntityId(entity)));
  const nodes = model.resolved.entities.map((entity) => {
    const style = getEntityStyleRecord(entity);
    return {
      id: getEntityId(entity),
      label: getEntityLabel(entity),
      type: getEntityType(entity),
      classes: getEntityTags(entity),
      details: getEntityDescription(entity),
      sourceRange: getSourceRange(entity.sourceRange, sourceText),
      style,
      data: {
        depth: entity.parent ? entityDepth(entity) : 0,
        rank: entity.rank ?? 0,
        attributes: getEntityAttributes(entity),
        declaredId: entity.id || entity.localId,
        style
      }
    } satisfies ItmGraphViewNode;
  });
  const edges: ItmGraphViewEdge[] = [];

  model.resolved.entities.forEach((entity) => {
    if (entity.parent) {
      const parentId = getEntityId(entity.parent);
      const childId = getEntityId(entity);
      edges.push({
        id: `containment:${parentId}:${childId}`,
        source: parentId,
        target: childId,
        label: "contains",
        type: "itm::contains",
        sourceRange: getSourceRange(entity.sourceRange, sourceText),
        style: { "line-style": "dashed", opacity: "0.8" },
        data: { containment: true }
      });
    }
  });

  sortRelationships(model.resolved.relationships)
    .filter((relationship) => relationship.relationshipKind === "explicit")
    .forEach((relationship) => {
      const sourceId = getEntityId(relationship.source);
      const targetId = getRelationshipTargetId(relationship);
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        return;
      }
      const style = stringifyRelationshipAttributes(relationship);
      edges.push({
        id: getRelationshipId(relationship),
        source: sourceId,
        target: targetId,
        label: getRelationshipLabel(relationship),
        type: relationship.typeRef,
        sourceRange: getSourceRange(relationship.sourceRange, sourceText),
        style,
        data: {
          relationshipKind: relationship.relationshipKind,
          attributes: relationship.attributes?.values || {},
          style
        }
      });
    });

  return { nodes, edges, directed: true };
}

export function entityTopic(entity: ResolvedItmEntity): string {
  const label = getEntityLabel(entity);
  const type = getEntityType(entity);
  return type ? `${label} (${type})` : label;
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

function stringifyRelationshipAttributes(relationship: Pick<ResolvedItmRelationship, "attributes">): Record<string, string> {
  return Object.fromEntries(
    Object.entries(relationship.attributes?.values || {})
      .map(([key, value]) => [key, stringifyAttributeValue(value)])
      .filter(([, value]) => value.length > 0)
  );
}

function entityDepth(entity: ResolvedItmEntity): number {
  let depth = 0;
  let current = entity.parent;
  while (current) {
    depth += 1;
    current = current.parent;
  }
  return depth;
}