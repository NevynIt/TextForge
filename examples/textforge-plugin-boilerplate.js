// TextForge custom plugin boilerplate.
// Upload this file from the Plugin Manager. Keep it self-contained: do not import
// remote modules, call network APIs, or depend on plugin globals.

const plugin = {
  id: "custom-example",
  name: "Custom Example Plugin",
  version: "0.1.0",

  // Optional language registrations.
  // languages: [
  //   {
  //     id: "text.example",
  //     name: "Example Text",
  //     parentId: "text.plain",
  //     extensions: [".example"],
  //     mediaType: "text/plain"
  //   }
  // ],

  // Optional diagnostics.
  // linters: [
  //   {
  //     kind: "linter",
  //     id: "example-linter",
  //     name: "Example Linter",
  //     accepts: "text.plain",
  //     lint(document) {
  //       return document.text.includes("TODO")
  //         ? [{ source: "example-linter", severity: "information", message: "Found TODO text." }]
  //         : [];
  //     }
  //   }
  // ],

  // Optional transformers.
  transformers: [
    {
      kind: "transformer",
      id: "example-uppercase",
      name: "Uppercase Text",
      input: "text.plain",
      output: "text.plain",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("Uppercase Text expects text input.");
        }
        return { ...value, text: value.text.toUpperCase() };
      }
    }
  ],

  // Optional viewers.
  viewers: [
    {
      kind: "viewer",
      id: "example-html-viewer",
      name: "Example HTML Viewer",
      input: "text.plain",
      render(value) {
        if (value.kind !== "text") {
          throw new Error("Example HTML Viewer expects text input.");
        }
        return {
          kind: "html",
          title: "Example HTML Viewer",
          html: `<pre>${escapeHtml(value.text)}</pre>`,
          capabilities: { search: true, zoom: true }
        };
      }
    }
  ],

  // Optional source-bound editor skeletons.
  // editors: [
  //   {
  //     kind: "editor",
  //     id: "example-editor",
  //     name: "Example Editor",
  //     input: "text.plain",
  //     create() {
  //       return {
  //         kind: "editor-skeleton",
  //         title: "Example Editor",
  //         editorKind: "tree",
  //         message: "Custom editor UI goes here in a future plugin iteration."
  //       };
  //     }
  //   }
  // ],

  // Pipelines resolve contribution IDs through the registry.
  pipelines: [
    {
      id: "example-uppercase-preview",
      name: "Uppercase Preview",
      input: "text.plain",
      steps: ["example-uppercase", "example-html-viewer"],
      category: "Custom"
    }
  ]
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

registerTextForgePlugin(plugin);
