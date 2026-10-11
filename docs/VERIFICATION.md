# Verification and operational limits

This repository is implemented and locally tested. It is **not certified production-ready by live Discord testing**. No token was printed or used to connect during this implementation. Existing `.env` and user-data files were not edited.

## Command accounting

`npm run reference` derives the counts from the actual loaded registry. Current counts are recorded in `command-counts.json`; declared aliases and informational entries are excluded from the counted total. Every registered action has a handler dispatch/acknowledgement smoke test. These tests exercise a fixture path, which may be a permission denial or validation failure; they are not exhaustive proof of every branch or API effect.

Stateful tests separately assert poll ballots and closing, giveaway eligibility and rerolls, RSVP capacity, private-data isolation, transaction rollback, legacy imports, permission middleware, setup-role creation/reuse/denial/hierarchy, reminder retries/cancellation, buttons/modals/autocomplete, setup-session ownership, rate limits, PNG output and local audio path restrictions.

## Recorded local result

Typecheck, lint (no warnings), build and 371 tests passed. The suite includes 342 handler smoke tests plus 29 focused checks. Compiled registry/payload checks passed. A temporary token-only setup run and missing-token compiled startup check passed. The production dependency audit reported no known vulnerabilities at verification time.

## Live acceptance checklist

- Invite to two real guilds through the baseline OAuth URL; verify global discovery without DEV_GUILD_ID.
- Reinstall/restart and verify optional role reuse without duplicates; test missing Manage Roles, customized roles, duplicate names and hierarchy changes.
- Test channel denies, equal/higher moderation targets, deleted members/channels/roles and real Discord error responses.
- Verify native AutoMod creation and limits, moderation actions, role edits, ticket privacy and staff access.
- Test buttons, modals, autocomplete and select menus in desktop/mobile clients, including expired sessions.
- Verify event listeners for joins, departures, reactions on uncached messages, welcome output and starboard edits/removals.
- Verify reminder delivery after restart and network failure; confirm the documented at-least-once semantics are acceptable.
- With explicit optional intent settings, verify real voice connection, DAVE negotiation, audio decoding, pause/skip and disconnects.
- Build/run the optional Docker image on the intended CPU/OS. Docker was unavailable in the implementation environment.
- Test recovery from a host/process crash and inspect resource usage under the expected guild/member load.

## Deliberate limits

- One process per token/database; local SQLite, no distributed coordination. Polls/RSVPs/giveaways are capped at 1,000 participants.
- Guild removal retains data; deletion requires explicit server-owner confirmation. No automatic destructive retention policy.
- Jobs have bounded retries but are not exactly-once. Voice queues are ephemeral, and no remote media URLs are fetched.
- Giveaways are manually drawn after the entry deadline. Event scheduling stores RSVPs locally rather than creating Discord Scheduled Events.
- Starboards publish links and counts from publicly viewable source channels; they do not copy private-channel content. Reaction counts include Discord's aggregate total, not a filtered count of unique human voters. Threshold changes apply on subsequent reaction events.
- Reaction role changes that occurred while the bot was offline are not backfilled. Disabling/deleting a binding retains existing roles. Self-role safety checks reject guild permissions and channel allows, but Discord administrators can change roles independently; they remain responsible for later grants.
- Ticket closing denies the requester's direct Send Messages overwrite, but administrators retain Discord's inherent access. Ticket channels/history are retained, and transcript export is not implemented.
- Logging captures channel/role create/delete events and dispatched privileged bot actions. It does not record message content, every Discord audit event, or promise tamper-proof compliance logging.
- Some legacy games are one-shot challenges or practice hands, as their descriptions state; they are not full multiplayer game engines.
- Bot operators can read local SQLite records, including member notes. Secret credentials belong in environment configuration, not personal notes.

## Follow-up hardening before a large public rollout

Complete the live checklist, measure performance at intended load, expand successful-path API mocks for complex features, and decide a published data-retention/privacy policy. The current tests do not claim load testing, Discord verification approval, external penetration testing, or an enterprise service-level guarantee.
