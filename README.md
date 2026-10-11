<div align="center">

# ⚔️ ARCHNEMESIS BOT

### YOUR SERVER. YOUR RULES. YOUR NEMESIS.

**A modular, self-hosted Discord bot built for control, community, and freedom.**

[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-E11D48?style=for-the-badge&logo=gnu&logoColor=white)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

<br />

**325 counted actions** · **342 registered actions** · **36 command groups**

[**🚀 Quick Start**](#-quick-start) · [**✨ Features**](#-features) · [**📚 Commands**](docs/COMMANDS.md) · [**🛡️ Permissions**](docs/PERMISSIONS.md) · [**🔍 Verification**](docs/VERIFICATION.md)

<br />

> No Redis. No PostgreSQL. No paid APIs. No unnecessary infrastructure.

</div>

---

## ✨ Features

|     | Module                | What it does                                                                        |
| :-: | --------------------- | ----------------------------------------------------------------------------------- |
| 🛡️  | **Moderation**        | Bans, kicks, timeouts, warnings, cleanup, role and nickname tools, persistent cases |
| ⚙️  | **Server management** | Guided setup, diagnostics, module toggles, configuration export and deletion        |
| 🪙  | **Economy & XP**      | Virtual balances, daily rewards, transfers, inventory and leaderboards              |
| 🗳️  | **Community**         | Polls, giveaways, suggestions, RSVPs, tags, notes, tasks and tickets                |
| 🎭  | **Engagement**        | Reaction roles, optional welcome messages, starboards and logs                      |
| ⏰  | **Reminders**         | Persistent scheduling, retries, rescheduling and failed-job inspection              |
| 🎮  | **Fun & media**       | Games, text tools, avatars, local meme and quote-card rendering                     |
| 🎵  | **Optional audio**    | Local Ogg Opus playback with per-guild queues; no external streaming                |

> **Count transparency:** 342 registered slash actions across 36 groups; 325 counted after excluding declared aliases and informational-only entries. Counts are tracked in [`docs/command-counts.json`](docs/command-counts.json). Mocked handler tests do **not** imply all Discord API operations are live-verified. Read the [verification report](docs/VERIFICATION.md).

## 🚀 Quick Start

**Requirements:** Node.js **24 recommended** (or **22.13+**), npm, and a Discord application token. A system font such as DejaVu Sans is needed for PNG generation.

```bash
git clone <YOUR_REPOSITORY_URL>
cd archnemesis-bot
npm ci
npm run setup
npm run build
npm start
```

The interactive setup wizard requests a **bot token**, an optional development guild ID, and an optional operator user ID. A guild ID is **not required**. Token input is hidden; `.env` is written with restrictive permissions, and existing `.env` files are preserved unless you explicitly approve replacement.

<details>
<summary><strong>🧰 Developer commands</strong></summary>

```bash
npm run dev         # TypeScript watch mode
npm run typecheck   # Strict TypeScript validation
npm run lint        # ESLint
npm test            # Mocked handler, workflow and security tests
npm run build       # Compile TypeScript into dist/
npm start           # Run compiled bot
npm run list        # List registered actions
npm run reference   # Regenerate command docs and count manifest
npm run format      # Format project files
```

`npm run check` is also available. Rebuild after source changes before running `npm start`.

</details>

## 🤖 Install on Discord

1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications) and configure **Guild Install** with `bot` and `applications.commands` scopes.
2. Use the following link, replacing `APPLICATION_ID` with your application's ID:

   ```text
   https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot%20applications.commands&permissions=84992
   ```

3. Start the bot and allow time for global slash commands to propagate.
4. Run **`/setup wizard`**, then **`/diagnose check`**. Use **`/setup module`** to enable or disable modules.

The baseline invite requests View Channel, Send Messages, Embed Links, and Read Message History — **not Administrator**. The `/utility invite` command can generate an installation link. Commands register globally on startup; `DEV_GUILD_ID` additionally registers a development-guild copy. Legacy `GUILD_ID` is ignored.

### 🔐 Permissions without surprises

On startup or server join, ARCHNEMESIS stores isolated server settings. If permitted, it creates or reuses a **non-mentionable, zero-permission `ARCHNEMESIS BOT` role**, assigning it only when the Discord role hierarchy allows. It does not overwrite existing role colors or permissions. Ambiguous same-name roles and missing permissions produce warnings visible through `/setup permissions` and `/diagnose check`.

Staff commands enforce authorization at runtime. Read [permission troubleshooting](docs/PERMISSIONS.md) for moderation, hierarchy, channel overrides, AutoMod, tickets and audio.

## 🧠 Built for self-hosting

```text
Discord Gateway
      │
      ▼
  discord.js
      │
      ▼
Interaction router ──► Guards & permissions
      │
      ├──► Modular command groups
      ├──► Community services
      ├──► Reminder scheduler
      └──► SQLite (guild-isolated data)
```

- **SQLite by default:** `data/bot.sqlite`; override with `DATABASE_PATH`.
- **Durable state:** WAL, migrations, indexed guild keys, transactional transfers and inventory gifts.
- **Local-first:** No Redis, PostgreSQL, paid APIs or external database server.
- **Single process:** Run one bot process per token/database; distributed job leasing is not implemented.
- **Graceful shutdown:** Active handlers and jobs are drained before SQLite closes.

<details>
<summary><strong>🗄️ Data retention, migration and backups</strong></summary>

On first use, legacy `bot.json` and `reminders.json` beside the SQLite file are imported once; the originals are not modified or deleted. Leaving a guild marks its settings inactive but retains records. A server owner can explicitly remove guild-local records using `/config deleteguild confirm:<guild-id>`; this does not remove Discord messages, roles or channels.

For a consistent backup, stop the bot before copying the database, or use SQLite's online backup facilities. WAL files matter when copying a live database. Never publicly expose `.env`, SQLite data, logs or audio files. Operators with filesystem access can inspect stored records.

Reminder delivery is **at least once**: a crash during acknowledgement can cause duplicate delivery. After eight failures, a reminder is retained for `/reminders failed` and `/reminders retry`.

</details>

<details>
<summary><strong>🎵 Optional voice playback</strong></summary>

Set `ENABLE_AUDIO=true` and put **Ogg Opus** files in `media/`, or set `AUDIO_DIRECTORY`. Files are limited to 100 MiB; symlinks and path traversal are rejected. `/audio library` lists tracks; `/audio play` queues one. Voice Connect/Speak permissions are required. The queue is ephemeral, and audio is **local only** — no YouTube or Spotify scraping.

```bash
ffmpeg -i input.wav -c:a libopus -ar 48000 media/track.ogg
```

Use audio you have permission to play. Real voice transport, host UDP connectivity and codec compatibility still require live verification.

</details>

<details>
<summary><strong>👋 Optional member welcome events</strong></summary>

Enable **Server Members Intent** in the Discord Developer Portal, set `ENABLE_MEMBER_EVENTS=true`, and restart. Configure `/welcome channel`, `/welcome template`, then `/welcome enable`. The feature is disabled by default. Other privileged intents are not enabled by default; XP does not require message content.

</details>

<details>
<summary><strong>📏 Operational limits</strong></summary>

Polls and giveaways support up to 1,000 ballots/entrants per activity. Notes, tasks, bookmarks, suggestions, polls, events and giveaways are limited to 100 records per creator per guild. Giveaways require a host to run `/giveaways draw`; bot event RSVPs are not native Discord Scheduled Events. Listings and exports are bounded.

</details>

## 🖥️ Deployment

A small Linux host with Node.js, a writable persistent data directory, a font package and outbound Discord access is enough. **systemd** is recommended for a lightweight Ubuntu VPS; run as a non-root user with graceful shutdown enabled.

<details>
<summary><strong>🐳 Optional Docker deployment</strong></summary>

```bash
docker compose up --build -d
```

The image builds in stages, installs DejaVu fonts, and runs as the `node` user. Compose persists SQLite data via a volume. Migrate and verify any existing JSON data before switching storage. Docker has **not** been verified live in the supplied report. Mount an audio directory separately if needed.

</details>

## 🧪 Quality & verification

The project includes mocked dispatch and acknowledgement tests for every registered handler, plus workflow and security tests. **Typecheck, lint and production build were reported passing** in the supplied verification summary. Live Discord behavior should be tested separately, especially moderation mutations, permissions, command propagation, and optional voice.

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

**Read the honest test matrix:** [docs/VERIFICATION.md](docs/VERIFICATION.md).

## 🧩 Project structure

```text
src/
├── commands/              # Modular actions and policies
├── middleware/guard.ts    # Permission and cooldown enforcement
├── services/              # Interactions, guild setup and events
├── database/store.ts      # SQLite and migrations
└── jobs/reminders.ts      # Persistent reminder delivery
tests/                     # Mocked and workflow tests
docs/                      # Command and operations reference
```

Contributions should add **real, supported functionality**, not aliases or placeholder actions to inflate command counts. Run `npm run reference` after changing command declarations.

## 📚 Documentation

| Guide                                              | Description                            |
| -------------------------------------------------- | -------------------------------------- |
| [Command reference](docs/COMMANDS.md)              | All declared slash actions             |
| [Command count manifest](docs/command-counts.json) | Auditable action totals                |
| [Permission guide](docs/PERMISSIONS.md)            | Role hierarchy and feature permissions |
| [Verification report](docs/VERIFICATION.md)        | What is tested vs. unverified          |

## ⚖️ License

**GNU Affero General Public License v3.0 only — `AGPL-3.0-only`.** See [LICENSE](LICENSE). Third-party dependencies retain their respective licenses.

---

<div align="center">

### ⚔️ YOUR SERVER. YOUR RULES. YOUR NEMESIS.

**Built with TypeScript. Powered by open source.**

</div>
