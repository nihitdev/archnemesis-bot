# ARCHNEMESIS / WEBSITE

Official static website for ARCHNEMESIS BOT. Built with React 19, TypeScript, Vite, Tailwind CSS v4 and Lucide icons. No backend or runtime account integrations.

## One-command local setup

Extract this archive **at the repository root**, so it becomes `archnemesis-bot/site/`:

```bash
cd site
./setup.sh
```

`setup.sh` checks Node.js >=22.13, installs dependencies, attempts to detect your GitHub `origin`, syncs commands from `../docs/COMMANDS.md` when available, typechecks/builds the site, then launches the Vite development server on `http://127.0.0.1:5173`.

It never modifies the bot or overwrites existing `.env.local` files.

## Manual scripts

```bash
npm install
npm run sync:commands
npm run dev
npm run build
npm run preview
```

## Config

Create `site/.env.local` (optional). See `.env.example`:

```dotenv
VITE_GITHUB_URL=https://github.com/YOUR_USERNAME/archnemesis-bot
VITE_DISCORD_CLIENT_ID=1558808248562225213
```

`VITE_GITHUB_URL` is inferred from your repository's `origin` by `./setup.sh` if the file doesn't exist. The Discord application ID is public and has a default. **Never place your Discord bot token in any `VITE_` variable or on the website.**

The invite uses the least-privilege baseline `permissions=84992`, with scopes `bot applications.commands`. Discord guild admins can adjust more permissions for features they enable.

## Commands

The command explorer tries to index the existing `../docs/COMMANDS.md`. Until synced, it displays a **clearly labeled preview** of specific commands described in the project's README. The marketing counts (325 counted actions / 342 registered actions / 36 groups) are documented release figures, not a claim of live verification. To refresh after changing the bot's registry:

```bash
# From the repository root:
npm run reference
cd site && npm run sync:commands
```

## Build and hosting

```bash
npm run build
```

Publish `site/dist/` on Cloudflare Pages, Vercel, Netlify or another static host. For Vercel use root directory `site` and build `npm run build`; for Cloudflare Pages root directory `site`, build `npm run build`, output `dist`. If you want the latest command list in hosted builds, run `npm run sync:commands && npm run build` as the build command and ensure the parent `docs/` folder is available.

## Accessibility and performance

Responsive layout, keyboard-search shortcut `/`, semantic headings/buttons, focus outlines, reduced-motion support, local compressed WebP art and no tracking scripts. The illustration was generated for this project.

License: `AGPL-3.0-only` (same as the parent bot repository).
