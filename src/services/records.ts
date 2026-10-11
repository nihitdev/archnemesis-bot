import { randomUUID } from 'node:crypto';
import { PermissionFlagsBits as P, type ChatInputCommandInteraction } from 'discord.js';
import type { BotContext } from '../commands/types.js';
import { say } from './format.js';
export const recordId = () => randomUUID().slice(0, 12);
export async function owned(
  i: ChatInputCommandInteraction,
  c: BotContext,
  kind: string,
  staff = false,
) {
  const row = c.db.get(i.guildId!, kind, i.options.getString('id', true));
  if (!row) {
    await say(i, 'Record not found in this server.', true);
    return;
  }
  if (row.owner !== i.user.id && !(staff && i.memberPermissions?.has(P.ManageGuild))) {
    await say(i, 'Only the creator or an authorized server manager can change this record.', true);
    return;
  }
  return row;
}
