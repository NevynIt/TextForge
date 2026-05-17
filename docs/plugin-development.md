# TextForge Custom Plugin Development

TextForge custom plugins are self-contained JavaScript files uploaded from the Plugin Manager. A plugin file defines one plain plugin object and passes it to the local `registerTextForgePlugin(plugin)` callback.

Start from `examples/textforge-plugin-boilerplate.js`.

## Rules

- Keep the file self-contained. Do not import remote code or use network APIs.
- Export `id`, `name`, and `version`.
- Contribution IDs must be unique across the running workspace.
- Pipelines refer to contribution IDs, not functions.
- Uploaded plugins are registered live and are immediately available in the language and pipeline lists.
- The upload wrapper provides `registerTextForgePlugin` locally while the file runs; it is not a persistent plugin global.

## Shape

```js
registerTextForgePlugin({
  id: "my-plugin",
  name: "My Plugin",
  version: "0.1.0",
  languages: [],
  linters: [],
  transformers: [],
  viewers: [],
  editors: [],
  pipelines: []
});
```

## Contribution Kinds

`languages` add language IDs and file extensions.

`linters` inspect a `TextDocument` and return diagnostics.

`transformers` receive a pipeline value and return a new text/model/html/svg value.

`viewers` receive a pipeline value and return a viewer result.

`editors` return source-bound editor surfaces. V1 editor skeletons should be read-only.

`pipelines` list contribution IDs in execution order.

## Upload

Open Plugin Manager, choose `Upload plugin`, and select the `.js` or `.mjs` file. If registration succeeds, the plugin appears as loaded and its pipelines are available immediately.
