# Implementation plan and verification ledger

## Baseline inspection
- Existing modular TypeScript architecture: 12 command groups, 181 registered actions; several aliases and static instructions must not count toward the requested 300 distinct operations.
- Four tests pass; they validate payloads, arithmetic, XP thresholds and simple JSON transfers only.
- Permission helper incorrectly requires bot Manage Guild for local settings; no caller/target hierarchy validation.
- No guild join/leave initialization, dedicated setup role, component routing, SQLite migrations or production build/lint scripts.
- Reminders are removed before delivery and cancellation lacks guild scope.
- Existing .env and user data must remain untouched. This workspace has no Git metadata.

## Ordered implementation
1. SQLite WAL migrations, non-destructive legacy import, atomic operations, scoped records.
2. Permission declarations and enforcement, moderation hierarchy, safe role initialization, setup/diagnostics, global registration.
3. Interaction routing, bounded cooldowns, lifecycle/error handling and safe outputs.
4. Stateful community modules and substantive command expansion; preserve existing commands without counting aliases.
5. Developer commands, reference docs, production build/lint and automated integration checks.
6. Record actual verified command counts and live Discord verification requirements. Do not claim production readiness from mock tests alone.

## Acceptance checks
Typecheck, lint, tests, build, payload validation, multi-guild isolation, missing permissions, role creation/reuse/hierarchy, atomic economy rollback, reminder restart/retry, command coverage, documentation/script consistency.

## Implemented and verified in this session
- Retained the existing TypeScript module layout and original command names; added readable formatting and typed action registries.
- Global registration plus optional DEV_GUILD_ID; per-guild lifecycle/configuration; permission declarations/runtime enforcement; safe role setup and diagnostics.
- SQLite WAL and indexed migration schema; original JSON retained during one-time import; atomic economy/inventory operations and scoped reminders/records.
- Community modules, AutoMod, cases, tickets, media rendering, optional local audio, welcome/reaction/starboard/logging event handlers.
- Buttons, modals, select menus, autocomplete, bounded rate controls, error redaction and shutdown draining.
- Public setup wizard, compiled production build, lint, reference generator, installation/troubleshooting/deployment docs and optional Docker configuration.
- Downloaded the official AGPL v3 text to LICENSE at the user's request; package metadata is AGPL-3.0-only.

## Final local verification
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm test`: 371 tests passed, including 342 handler dispatch/acknowledgement smoke tests. Remaining tests cover focused workflows/security/infrastructure; smoke tests are not exhaustive success-path or live API validation.
- `npm run build`: passed.
- Compiled JavaScript loader and payload validation: 36 groups, 342 registered actions, no duplicate subcommand names and all per-group/option limits respected.
- Count manifest: 325 counted actions after 17 declared aliases/informational actions are excluded.
- Setup wizard exercised in an isolated temporary directory: token-only public configuration succeeds, development guild optional, .env permissions 0600.
- `npm start` exercised with an explicitly empty token: correctly exits before connecting.
- Production dependency audit: no known vulnerabilities reported at verification time.

## Remaining external validation
No live Discord connection was made. Public installation/propagation, actual API mutations, live role/channel permission changes, native AutoMod, gateway reactions, optional member intent and voice transport still require the live checklist in docs/VERIFICATION.md. Docker was unavailable and its image was not built. Large-scale load, independent security review and any enterprise service guarantee are not established by this local suite.
