import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { num } from '../types.js';
import { say } from '../../services/format.js';
import { checkOutputChannel } from '../../services/community.js';
export default actionGroup('starboard', 'Highlight starred public-channel message links', [
  {
    name: 'channel',
    description: 'Set the public starboard destination',
    userPermissions: P.ManageGuild,
    options: [
      { name: 'channel', description: 'Destination channel', type: 'channel', required: true },
    ],
    execute: async (i, c) => {
      const id = i.options.getChannel('channel', true).id,
        ch = await checkOutputChannel(i.guild!, id);
      if (!ch) {
        await say(i, 'The bot needs View Channel and Send Messages there.', true);
        return;
      }
      const old = c.db.get(i.guildId!, 'config', 'starboard');
      if (old && old.data.channel !== id && c.db.records(i.guildId!, 'star').length) {
        await say(
          i,
          'Existing starboard posts are tied to the configured channel. Clear those entries before changing destinations.',
          true,
        );
        return;
      }
      c.db.put(i.guildId!, 'config', 'starboard', i.user.id, {
        threshold: 3,
        ...old?.data,
        channel: id,
        enabled: true,
      });
      await say(
        i,
        'Starboard enabled. Public message links are posted when ⭐ reactions reach the threshold.',
        true,
      );
    },
  },
  {
    name: 'threshold',
    description: 'Set the number of stars needed for a highlight',
    userPermissions: P.ManageGuild,
    options: [num('count', 'Required stars', 1, 100)],
    execute: async (i, c) => {
      const old = c.db.get(i.guildId!, 'config', 'starboard');
      c.db.put(i.guildId!, 'config', 'starboard', i.user.id, {
        ...old?.data,
        threshold: i.options.getInteger('count', true),
      });
      await say(i, 'Threshold saved; posts update on their next reaction event.', true);
    },
  },
  {
    name: 'disable',
    description: 'Disable new starboard updates',
    userPermissions: P.ManageGuild,
    execute: async (i, c) => {
      const old = c.db.get(i.guildId!, 'config', 'starboard');
      c.db.put(i.guildId!, 'config', 'starboard', i.user.id, { ...old?.data, enabled: false });
      await say(i, 'Starboard disabled. Existing highlights remain.', true);
    },
  },
  {
    name: 'top',
    description: 'Show the most-starred tracked messages',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'star')
          .sort((a, b) => Number(b.data.count) - Number(a.data.count))
          .slice(0, 10)
          .map((r) => `⭐ ${r.data.count} — ${r.data.url}`)
          .join('\n') || 'No highlighted messages.',
      );
    },
  },
  {
    name: 'status',
    description: 'Show starboard configuration and tracked message count',
    userPermissions: P.ManageGuild,
    execute: async (i, c) => {
      await say(
        i,
        `${JSON.stringify(c.db.get(i.guildId!, 'config', 'starboard')?.data ?? {})}\nTracked posts: ${c.db.records(i.guildId!, 'star').length}`,
        true,
      );
    },
  },
]);
