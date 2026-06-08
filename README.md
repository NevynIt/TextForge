# TextForge

TextForge is a modular local-first React workbench for text-first authoring, structured models, and package-owned visual surfaces.

The previous implementation is preserved in Git at tag `textforge-v1-final` and branch `archive/v1-current`.

## Current Status

The active roadmap baseline is Roadmap V20.

Validated baseline includes the contribution/capability spine, provider-aware resources, repository/include resolution, ITM foundation, ITM static projections, Lua automation, Visual ITM runtime recovery, Cytoscape/jsMind/Sigma runtime renderers, and the read-only BPMN visual chain through `WP-BPMN-VISUAL-B`.

The next implementation slice must be selected from current V20 candidates. `WP-TABLES` is dependency-ready but held until its dedicated grilling session is complete.

## Start Here

- [Roadmap index](roadmap/README.md)
- [Roadmap V20](roadmap/ROADMAP_V20.md)
- [RAPID log](roadmap/decisions/RAPID.md)
- [Workpackage register](roadmap/workpackages/workpackage-register.md)
- [Implementation status](roadmap/workpackages/implementation-status.md)

## Build On macOS

From a fresh checkout:

```bash
git clone <repo-url> TextForge
cd TextForge
```

Use Node `>=20.19.0` or `>=22.12.0`. Node 22 LTS is the simplest choice.

Enable the repo-pinned package manager:

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

Install dependencies:

```bash
corepack pnpm install --frozen-lockfile
```

Build the TextForge web artifacts:

```bash
corepack pnpm --filter @textforge/textforge-web build
```

The build regenerates:

```text
apps/textforge-web/dist/index.html
apps/textforge-web/dist-single/index.html
apps/textforge-web/dist-single-small/index.html
apps/textforge-web/releases/TextForge 2.9.x.zip
```

Use `apps/textforge-web/dist-single/index.html` for the full standalone single-file build with bundled docs. Use `apps/textforge-web/dist-single-small/index.html` for the smaller standalone build without bundled docs.

The versioned release zip step uses the system `zip` command on macOS. If `zip` is missing, install Apple's command line tools:

```bash
xcode-select --install
```

### Development Server

```bash
corepack pnpm --filter @textforge/textforge-web dev --port 4173
```

Then open `http://127.0.0.1:4173`.

### Verification

Run the web app tests:

```bash
corepack pnpm --filter @textforge/textforge-web test
```

Run the full workspace verification:

```bash
corepack pnpm verify
```

The root `corepack pnpm build` command runs all workspace builds and its prebuild step regenerates roadmap dependency-map docs. To produce only the TextForge web artifacts, prefer the filtered web build above.

## Guides And References

- [User guide](docs/guides/user-guide.md)
- [Manual user test suite](docs/manual-tests/README.md)
- [Lua guide](docs/guides/lua-guide.md)
- [Plugin development guide](docs/guides/plugin-dev.md)
- [Docs index](docs/README.md)
- [Examples index](docs/examples/README.md)
- [Architecture papers index](docs/architecture/README.md)
- [Reference specs index](docs/reference/specs/README.md)
