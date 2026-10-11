# Gateway events

`src/bot.ts` wires guild lifecycle, messages for XP, optional member welcomes, reaction roles/starboards, channel/role lifecycle logging, and interactions. Async event work is tracked for graceful shutdown. Message Content intent is not used. Optional member and voice intents are gated by environment settings.
