import { useMemo, useState } from "preact/hooks";
import type { TextForgeResource } from "../resources/resourceCatalog";

interface ResourceBrowserPanelProps {
  resources: TextForgeResource[];
  onOpenResource: (resource: TextForgeResource) => void;
}

export function ResourceBrowserPanel({ resources, onOpenResource }: ResourceBrowserPanelProps) {
  const [selectedId, setSelectedId] = useState(resources[0]?.id || "");
  const selected = useMemo(
    () => resources.find((resource) => resource.id === selectedId) || resources[0],
    [resources, selectedId]
  );

  return (
    <div class="resource-browser-panel">
      <div class="lua-console-toolbar">
        <span>{resources.length} bundled resource{resources.length === 1 ? "" : "s"}</span>
        {selected ? (
          <>
            <button type="button" onClick={() => onOpenResource(selected)}>Open copy</button>
            <button type="button" onClick={() => void copyResourceText(selected)}>Copy text</button>
          </>
        ) : null}
      </div>
      <div class="resource-browser-layout">
        <div class="resource-grid">
          {resources.map((resource) => (
            <article class={resource.id === selected?.id ? "active" : ""} key={resource.id}>
              <button type="button" onClick={() => setSelectedId(resource.id)}>
                <strong>{resource.title}</strong>
                <span>{resource.path}</span>
                <small>{resource.description}</small>
              </button>
            </article>
          ))}
        </div>
        <section class="resource-preview">
          {selected ? (
            <>
              <header>
                <strong>{selected.title}</strong>
                <span>{selected.languageId}</span>
              </header>
              <pre>{selected.text}</pre>
            </>
          ) : (
            <p class="empty-state">No bundled resources.</p>
          )}
        </section>
      </div>
    </div>
  );
}

async function copyResourceText(resource: TextForgeResource): Promise<void> {
  try {
    await navigator.clipboard?.writeText(resource.text);
  } catch {
    // Clipboard access is permission-gated by the browser; the preview remains selectable.
  }
}
