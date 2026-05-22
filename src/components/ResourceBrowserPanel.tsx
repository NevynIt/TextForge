import { useMemo, useState } from "preact/hooks";
import type { TextForgeResource } from "../resources/resourceCatalog";

interface ResourceBrowserPanelProps {
  resources: TextForgeResource[];
  onOpenResource: (resource: TextForgeResource) => void;
  onViewResource?: (resource: TextForgeResource) => void;
}

export function ResourceBrowserPanel({ resources, onOpenResource, onViewResource }: ResourceBrowserPanelProps) {
  const [selectedId, setSelectedId] = useState(resources[0]?.id || "");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const selected = useMemo(
    () => resources.find((resource) => resource.id === selectedId) || resources[0],
    [resources, selectedId]
  );
  const groupedResources = useMemo(() => groupResources(resources), [resources]);

  function toggleGroup(id: string): void {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div class="resource-browser-panel">
      <div class="lua-console-toolbar">
        <span>{resources.length} bundled resource{resources.length === 1 ? "" : "s"}</span>
        {selected ? (
          <>
            <button type="button" onClick={() => onOpenResource(selected)}>Open copy</button>
            {canViewResource(selected) && onViewResource ? (
              <button type="button" onClick={() => onViewResource(selected)}>View HTML</button>
            ) : null}
            <button type="button" onClick={() => void copyResourceText(selected)}>Copy text</button>
          </>
        ) : null}
      </div>
      <div class="resource-browser-layout">
        <div class="resource-list-pane">
          {groupedResources.map((group) => (
            <section class="resource-group" key={group.id}>
              <button
                type="button"
                class={`resource-group-toggle ${openGroups[group.id] ? "open" : "collapsed"}`}
                aria-expanded={openGroups[group.id] ? "true" : "false"}
                onClick={() => toggleGroup(group.id)}
              >
                <strong>{group.title}</strong>
                <span>{group.resources.length}</span>
              </button>
              {openGroups[group.id] ? (
                <div class="resource-group-list">
                  {group.resources.map((resource) => (
                    <article class={resource.id === selected?.id ? "active" : ""} key={resource.id}>
                      <button type="button" onClick={() => setSelectedId(resource.id)}>
                        <strong>{resource.title}</strong>
                        <span>{resource.path}</span>
                        <small>{resource.description}</small>
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
        <section class="resource-preview">
          {selected ? (
            <>
              <header>
                <strong>{selected.title}</strong>
                <span>{selected.languageId}</span>
              </header>
              <div class="resource-preview-body">
                <pre>{selected.text}</pre>
              </div>
            </>
          ) : (
            <p class="empty-state">No bundled resources.</p>
          )}
        </section>
      </div>
    </div>
  );
}

interface ResourceGroup {
  id: string;
  title: string;
  resources: TextForgeResource[];
}

function groupResources(resources: TextForgeResource[]): ResourceGroup[] {
  const groups = new Map<string, ResourceGroup>();
  resources.forEach((resource) => {
    const id = resourceGroupId(resource);
    const existing = groups.get(id);
    if (existing) {
      existing.resources.push(resource);
      return;
    }
    groups.set(id, { id, title: resourceGroupTitle(id), resources: [resource] });
  });
  return Array.from(groups.values());
}

function resourceGroupId(resource: TextForgeResource): string {
  if (resource.path.startsWith("docs/") || resource.path === "README.md") {
    return "docs";
  }
  if (resource.path.startsWith("examples/itm/") || resource.languageId === "text.itm" || resource.languageId === "text.indented-tree") {
    return "examples-itm";
  }
  if (resource.path.startsWith("examples/lua/") || resource.languageId === "text.lua") {
    return "examples-lua";
  }
  if (resource.path.startsWith("examples/markdown/")) {
    return "examples-markdown";
  }
  if (resource.path.includes("graphviz-dot-")) {
    return "examples-graphviz";
  }
  if (resource.path.includes("mermaid_")) {
    return "examples-mermaid";
  }
  return resource.path.startsWith("examples/") ? "examples-other" : "other";
}

function resourceGroupTitle(id: string): string {
  if (id === "docs") {
    return "Documentation";
  }
  if (id === "examples-itm") {
    return "ITM Examples";
  }
  if (id === "examples-lua") {
    return "Lua Examples";
  }
  if (id === "examples-markdown") {
    return "Markdown Examples";
  }
  if (id === "examples-graphviz") {
    return "Graphviz DOT Corpus";
  }
  if (id === "examples-mermaid") {
    return "Mermaid Examples";
  }
  if (id === "examples-other") {
    return "Other Examples";
  }
  return "Other Resources";
}

async function copyResourceText(resource: TextForgeResource): Promise<void> {
  try {
    await navigator.clipboard?.writeText(resource.text);
  } catch {
    // Clipboard access is permission-gated by the browser; the preview remains selectable.
  }
}

function canViewResource(resource: TextForgeResource): boolean {
  return resource.languageId === "text.markdown";
}
