# Build TextForge On Windows Native

These instructions are for building directly in Windows with PowerShell, not inside WSL.

## Prerequisites

Use Node `>=20.19.0` or `>=22.12.0`. Node 22 LTS is the simplest choice.

Install Git and Node. With `winget`:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
```

Open a new PowerShell window after installation and confirm:

```powershell
git --version
node -v
```

The versioned release zip step uses PowerShell `Compress-Archive` on Windows, so no separate `zip` package is required.

## Fresh Checkout

```powershell
git clone <repo-url> TextForge
cd TextForge
```

## Package Manager

TextForge pins `pnpm@10.0.0` through Corepack.

```powershell
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

## Install Dependencies

```powershell
corepack pnpm install --frozen-lockfile
```

## Build The Web Artifacts

```powershell
corepack pnpm --filter @textforge/textforge-web build
```

The build regenerates:

```text
apps/textforge-web/dist/index.html
apps/textforge-web/dist-single/index.html
apps/textforge-web/dist-single-small/index.html
apps/textforge-web/releases/TextForge <version>.zip
```

Use `apps/textforge-web/dist-single/index.html` for the full standalone single-file build with bundled docs. Use `apps/textforge-web/dist-single-small/index.html` for the smaller standalone build without bundled docs.

## Development Server

```powershell
corepack pnpm --filter @textforge/textforge-web dev --port 4173
```

Then open `http://127.0.0.1:4173`.

## Verification

Run the web app tests:

```powershell
corepack pnpm --filter @textforge/textforge-web test
```

Run the full workspace verification:

```powershell
corepack pnpm verify
```

The root `corepack pnpm build` command runs all workspace builds and its prebuild step regenerates roadmap dependency-map docs. To produce only the TextForge web artifacts, prefer the filtered web build above.
