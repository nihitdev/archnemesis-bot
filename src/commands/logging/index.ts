import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { say, esc } from '../../services/format.js';
import { checkOutputChannel } from '../../services/community.js';
import { serverLog } from '../../services/logging.js';
export default actionGroup(
  'logging',
  'Channel and role lifecycle logging',
  [
    {
      name: 'channel',
      description: 'Choose a channel for channel/role create/delete events',
      userPermissions: P.ManageGuild,
      options: [{ name: 'channel', description: 'Log channel', type: 'channel', required: true }],
      execute: async (i, c) => {
        const id = i.options.getChannel('channel', true).id;
        if (!(await checkOutputChannel(i.guild!, id))) {
          await say(i, 'The bot needs View Channel and Send Messages in that channel.', true);
          return;
        }
        const old = c.db.get(i.guildId!, 'config', 'logging');
        c.db.put(i.guildId!, 'config', 'logging', i.user.id, {
          ...old?.data,
          channel: id,
          enabled: true,
        });
        await say(i, 'Lifecycle logging enabled.', true);
      },
    },
    {
      name: 'disable',
      description: 'Disable automatic lifecycle logs',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const old = c.db.get(i.guildId!, 'config', 'logging');
        c.db.put(i.guildId!, 'config', 'logging', i.user.id, { ...old?.data, enabled: false });
        await say(i, 'Logging disabled.', true);
      },
    },
    {
      name: 'enable',
      description: 'Resume automatic lifecycle logs',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const old = c.db.get(i.guildId!, 'config', 'logging');
        if (!old?.data.channel) {
          await say(i, 'Configure a log channel first.', true);
          return;
        }
        c.db.put(i.guildId!, 'config', 'logging', i.user.id, { ...old.data, enabled: true });
        await say(i, 'Logging enabled.', true);
      },
    },
    {
      name: 'recent',
      description: 'Show recently captured lifecycle events',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'server-log')
            .slice(0, 20)
            .map((r) => `${r.data.event}: ${esc(String(r.data.detail))}`)
            .join('\n') || 'No captured events.',
          true,
        );
      },
    },
    {
      name: 'test',
      description: 'Send a diagnostic event through the configured logger',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const cfg = c.db.get(i.guildId!, 'config', 'logging');
        if (!cfg?.data.enabled || !(await checkOutputChannel(i.guild!, String(cfg.data.channel)))) {
          await say(i, 'Enable logging and configure an accessible channel first.', true);
          return;
        }
        await serverLog(i.guild!, c.db, 'test', `Requested by ${i.user.id}`);
        await say(i, 'Test log sent.', true);
      },
    },
  ],
  P.ManageGuild,
);
