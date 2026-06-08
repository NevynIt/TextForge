# Build TextForge On Windows With WSL

These instructions are for building inside WSL 2, usually with Ubuntu. Treat WSL as a separate Linux environment: Windows-installed Node and pnpm do not count inside WSL.

Keep the repo in the WSL Linux filesystem, such as `~/src/TextForge`, instead of under `/mnt/c/...`. Builds and installs are much faster and avoid Windows filesystem edge cases.

## Prerequisites

Install WSL 2 and Ubuntu from Windows PowerShell:

```powershell
wsl --install -d Ubuntu
```

Then open Ubuntu and install Linux prerequisites:

```bash
sudo apt update
sudo apt install -y git zip ca-certificates
```

Use Node `>=20.19.0` or `>=22.12.0`. Node 22 LTS is the simplest choice. If Ubuntu's package manager does not provide a new enough Node version, install Node inside WSL with a version manager such as `nvm`, `asdf`, or Volta.

Confirm the active WSL Node version:

```bash
node -v
```

## Fresh Checkout

```bash
mkdir -p ~/src
cd ~/src
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

To open the repo folder from Windows Explorer:

```bash
explorer.exe .
```

## Development Server

```bash
corepack pnpm --filter @textforge/textforge-web dev --port 4173
```

Then open `http://127.0.0.1:4173` in a Windows browser. WSL 2 normally forwards localhost automatically.

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
