import type { Guild } from 'discord.js';
import type { Store } from '../database/store.js';
import { randomUUID } from 'node:crypto';
import { checkOutputChannel } from './community.js';
export async function serverLog(guild: Guild, db: Store, event: string, detail: string) {
  if (db.guild(guild.id).disabledModules.includes('logging')) return;
  const cfg = db.get(guild.id, 'config', 'logging');
  if (!cfg?.data.enabled) return;
  db.put(guild.id, 'server-log', randomUUID().slice(0, 12), 'system', { event, detail });
  if (!cfg.data.channel) return;
  const channel = await checkOutputChannel(guild, String(cfg.data.channel));
  if (channel)
    await channel.send({
      content: `${event}: ${detail}`.slice(0, 1900),
      allowedMentions: { parse: [] },
    });
}
