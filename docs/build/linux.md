# Build TextForge On Linux

## Prerequisites

Use Node `>=20.19.0` or `>=22.12.0`. Node 22 LTS is the simplest choice.

Install Git and `zip`. On Debian or Ubuntu:

```bash
sudo apt update
sudo apt install -y git zip ca-certificates
```

If your distro package manager does not provide a new enough Node version, install Node with a version manager such as `nvm`, `asdf`, or Volta. Confirm the active version before installing dependencies:

```bash
node -v
```

## Fresh Checkout

```bash
git clone <repo-url> TextForge
cd TextForge
```

## Package Manager

TextForge pins `pnpm@10.0.0` through Corepack.

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

## Install Dependencies

```bash
corepack pnpm install --frozen-lockfile
```

## Build The Web Artifacts

```bash
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

```bash
corepack pnpm --filter @textforge/textforge-web dev --port 4173
```

Then open `http://127.0.0.1:4173`.

## Verification

Run the web app tests:

```bash
corepack pnpm --filter @textforge/textforge-web test
```

Run the full workspace verification:

```bash
corepack pnpm verify
```

The root `corepack pnpm build` command runs all workspace builds and its prebuild step regenerates roadmap dependency-map docs. To produce only the TextForge web artifacts, prefer the filtered web build above.
