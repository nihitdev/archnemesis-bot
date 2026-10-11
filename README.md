# ARCHNEMESIS BOT

A self-hosted TypeScript / discord.js bot with guild-isolated SQLite storage. Existing modular commands are preserved; community, administration, setup and persistence features live in the same `src/` architecture. No PostgreSQL, Redis, paid API, or external service is required.

**342 registered slash actions in 36 groups; 325 counted after excluding declared aliases and informational-only actions.** See the generated [command reference](docs/COMMANDS.md) and [count manifest](docs/command-counts.json). Every registered handler has a mocked dispatch/acknowledgement test. This is not a claim that every Discord API operation has been verified live. See [verification and operational limits](docs/VERIFICATION.md).

## Run locally

Use Node.js 24 (recommended), or Node.js 22.13 or later, and npm. Older Node 22 versions may print a warning for built-in `node:sqlite`. PNG generation requires a system font; DejaVu Sans is a suitable choice.

```sh
npm install
npm run setup
npm run build
npm start
```

The setup wizard requests a bot token, an optional development guild ID, and an optional operator user ID. **A guild ID is not required.** Token input is hidden, `.env` is written with restrictive permissions, and an existing `.env` is preserved unless you explicitly choose to overwrite it. No configuration backups are created.

```sh
npm run dev          # TypeScript watch mode
npm run typecheck    # Strict TypeScript checks
npm run lint         # ESLint
npm test             # Mocked handlers, integration workflows and security tests
npm run build        # Compile src into dist
npm start            # Run compiled application
npm run list         # List registered slash actions
npm run reference    # Regenerate command docs and count manifest
npm run format       # Format source, scripts and tests
```

`npm run check` remains an alias for the existing TypeScript check. Build again after source changes before using `npm start`.

## Public installation

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications). Create its bot and copy its token into the setup wizard.
2. Enable public installation for the application and configure **Guild Install** with `bot` and `applications.commands` scopes. The bot implements server installation, not personal/user installation.
3. Use this URL, replacing `APPLICATION_ID` with your application ID:

   ```text
   https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot%20applications.commands&permissions=84992
   ```

   Baseline permissions: View Channel, Send Messages, Embed Links, Read Message History. Administrator is not requested. `/utility invite` builds the same link automatically.
4. Start the bot. Commands are registered globally on every startup. Global propagation is controlled by Discord. `DEV_GUILD_ID` additionally registers a development guild copy without disabling global registration. Legacy `GUILD_ID` is ignored; remove it at your convenience.
5. In the server, run `/setup wizard`, then `/diagnose check`. Use `/setup module` to disable features individually. Commands restricted to staff still enforce permissions at runtime even when Discord displays their parent group to everyone.

No privileged intents are enabled by default. Guilds, Guild Messages and Guild Message Reactions support configuration, XP and reaction features. Message text is not needed for XP. Discord-native AutoMod does not require Message Content intent.

## Setup role and permissions

On startup and guild join, the bot persists independent guild settings. If it has Manage Roles, it creates or reuses **ARCHNEMESIS BOT**, a non-mentionable, zero-permission role. It assigns the role only below its integration role. Existing role names, colors and permissions are never overwritten. Existing roles with permission flags or channel grants are not automatically assigned. Multiple same-name roles produce a warning instead of another duplicate.

`/setup color` configures the color used for future role creation; it intentionally does not repaint an existing customized role. Missing permissions produce persisted setup warnings visible through `/setup permissions` and `/diagnose check`.

See [permission troubleshooting](docs/PERMISSIONS.md) for moderation, role hierarchy, channel overwrites, AutoMod, tickets, reactions and optional audio. Local configuration, XP and warning storage do not require the bot to hold the staff member's Manage Server or Moderate Members permission.

## Features

- Moderation: bans, kicks, timeouts, warnings, message cleanup, role/nickname operations, persistent cases and annotations. Caller and bot permissions and target hierarchy are checked.
- Guild administration: role/channel tools, module controls, safe setup, configuration exports and explicit server-owner data deletion.
- Economy/XP: virtual balances, atomic transfers, daily/work rewards, cosmetic inventory, XP and leaderboards. Coins have no monetary value.
- Community: persistent polls, giveaways, event RSVPs, suggestions with voting buttons and submission modals, tags with autocomplete, private notes/tasks/bookmarks, private ticket channels.
- Engagement: reaction roles limited to approved cosmetic roles, optional welcome messages, link-only starboards and lifecycle logs.
- Scheduling: persistent reminders with retry/backoff, failed-job inspection, editing and rescheduling.
- Entertainment: existing games, text utilities, music calculations, avatars, locally rendered PNG memes and quote cards.
- Optional local voice playback: guild-specific queues of operator-provided Ogg Opus files; no scraping or streaming from YouTube/Spotify.

Polls and giveaways support up to 1,000 ballots/entrants per activity. Notes, tasks, bookmarks, suggestions, polls, events and giveaways are capped at 100 records per creator per guild. Listings and exports show bounded recent records. Giveaways require an explicit host `/giveaways draw` after their entry window; events are bot-local RSVP records, not Discord Scheduled Events. Acknowledgement tests include both successful and handled-error paths.

## Optional member events and audio

Welcome messages require both **Server Members Intent** in the Developer Portal and `ENABLE_MEMBER_EVENTS=true`, followed by a restart. Set a greeting channel and template with `/welcome channel` and `/welcome template`, then `/welcome enable`. The default remains disabled.

For audio, set `ENABLE_AUDIO=true`. Put `.ogg` files containing **Opus audio** in `media/`, or set `AUDIO_DIRECTORY`. Files must be ordinary local files, at most 100 MiB; symlinks and path traversal are rejected. `/audio library` lists files; `/audio play` queues one. Controls require joining the bot's voice channel. Connect and Speak permissions are checked there. This enables the non-privileged Guild Voice States intent. Tracks and the queue are intentionally ephemeral; persistent bot data remains in SQLite.

An example conversion on an operator machine with FFmpeg installed:

```sh
ffmpeg -i input.wav -c:a libopus -ar 48000 media/track.ogg
```

Use audio you have permission to play. The voice library includes DAVE support; actual voice transport, host UDP reachability, and codec compatibility require live verification. No remote URL fetching is accepted by the audio player.

## Persistence and upgrades

The default database is `data/bot.sqlite` (`DATABASE_PATH` overrides it). SQLite uses WAL, a busy timeout, schema migration markers, composite guild keys and indexes. Financial transfers and inventory gifts are atomic transactions. Private notes and bookmarks are scoped to both member and guild; bot operators with filesystem access can still inspect the database.

On first use, a legacy `bot.json` and `reminders.json` beside the SQLite file are imported once. **Original JSON files are not changed or deleted.** The application never copies `.env` or other configuration files as backups. Existing data in the checked-out repository has not been migrated by the test suite; normal startup performs the import.

Run one bot process per token/database. This deployment does not implement distributed job leases. Reminder delivery is at least once: a crash after Discord accepts a message but before its database acknowledgement may cause a duplicate on restart. After eight failed deliveries, a reminder is retained as failed for `/reminders failed` and `/reminders retry`.

Leaving a guild marks its settings inactive and stops delivery there; records are retained. The server owner can explicitly remove that guild's local data using `/config deleteguild confirm:<guild-id>`. This does not delete Discord roles, channels, or messages. New activity will create fresh records.

For a consistent operator backup, stop the process before copying SQLite data, or use SQLite's online backup tooling. When moving a running database, its WAL files matter. Do not expose the database, `.env`, audio library, or logs through a public web server.

## Deployment

A small Linux host with Node.js, a persistent writable data directory, a font package and outbound Discord connectivity is sufficient. Run the built process under systemd or another supervisor with a non-root user, working directory set to this repository, and graceful SIGTERM shutdown. The process drains active handlers and jobs before closing SQLite.

Optional Docker:

```sh
docker compose up --build -d
```

The image compiles in a build stage, installs DejaVu fonts and runs as the `node` user. The Compose volume persists SQLite data. For existing local JSON data, perform and verify migration locally before switching storage, or deliberately copy the originals into the volume. Docker is not required and was not executed in this environment. Mount an audio directory separately if enabling audio.

## Development and architecture

- `src/commands/`: existing groups plus typed action registries; permissions and compatibility aliases in `policies.ts`.
- `src/services/interactions.ts`: command/component routing, acknowledgement, module checks and error handling.
- `src/middleware/guard.ts`: permissions, role hierarchy, per-action cooldowns and bounded burst limits.
- `src/database/store.ts`: SQLite schema/imports, transactions and guild-scoped records.
- `src/services/`: guild setup, Discord registration, media, logging and community event handlers.
- `src/jobs/reminders.ts`: durable retrying delivery and shutdown coordination.
- `tests/`: credentials-free mocks plus stateful workflow and security checks.

Never add aliases, help text or unsupported handlers merely to increase the count. Run `npm run reference` when changing declarations. Native Discord API mutations are not blindly retried; discord.js handles rate limiting and transient REST retries, and persistent jobs apply their own bounded retry policy.

## License

Licensed under **GNU Affero General Public License version 3.0 only** (`AGPL-3.0-only`). The unmodified official text downloaded from [GNU](https://www.gnu.org/licenses/agpl-3.0.txt) is included in [LICENSE](LICENSE). Third-party dependencies retain their respective licenses.
