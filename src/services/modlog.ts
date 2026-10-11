import { type Guild, ChannelType } from 'discord.js';
import type { Store } from '../database/store.js';
import { esc } from './format.js';
export async function modlog(g: Guild, db: Store, text: string) {
  const id = db.guild(g.id).modLogChannel;
  if (!id) return;
  try {
    const channel = await g.channels.fetch(id);
    if (channel?.type === ChannelType.GuildText)
      await channel.send({
        content: `🛡️ ${esc(text).slice(0, 1800)}`,
        allowedMentions: { parse: [] },
      });
  } catch {
    /* optional log channel */
  }
}
