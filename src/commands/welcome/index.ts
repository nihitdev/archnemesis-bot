import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say } from '../../services/format.js';
import { checkOutputChannel, welcomeText } from '../../services/community.js';
export default actionGroup(
  'welcome',
  'Configure optional member-join greeting messages',
  [
    {
      name: 'channel',
      description: 'Choose the channel for welcome messages',
      userPermissions: P.ManageGuild,
      options: [
        { name: 'channel', description: 'Welcome channel', type: 'channel', required: true },
      ],
      execute: async (i, c) => {
        const id = i.options.getChannel('channel', true).id;
        if (!(await checkOutputChannel(i.guild!, id))) {
          await say(i, 'The bot needs View Channel and Send Messages in that channel.', true);
          return;
        }
        const old = c.db.get(i.guildId!, 'config', 'welcome');
        c.db.put(i.guildId!, 'config', 'welcome', i.user.id, { ...old?.data, channel: id });
        await say(i, 'Welcome channel saved.', true);
      },
    },
    {
      name: 'template',
      description: 'Set a greeting with {user} and {server} placeholders',
      userPermissions: P.ManageGuild,
      options: [txt('text')],
      execute: async (i, c) => {
        const old = c.db.get(i.guildId!, 'config', 'welcome');
        c.db.put(i.guildId!, 'config', 'welcome', i.user.id, {
          ...old?.data,
          template: i.options.getString('text', true),
        });
        await say(i, 'Greeting template saved.', true);
      },
    },
    {
      name: 'enable',
      description: 'Enable welcomes when the optional member intent is configured',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const old = c.db.get(i.guildId!, 'config', 'welcome');
        if (process.env.ENABLE_MEMBER_EVENTS !== 'true' || !old?.data.channel) {
          await say(
            i,
            'Set a welcome channel, then have the operator enable Server Members Intent in the portal and ENABLE_MEMBER_EVENTS=true before restarting.',
            true,
          );
          return;
        }
        c.db.put(i.guildId!, 'config', 'welcome', i.user.id, { ...old.data, enabled: true });
        await say(i, 'Welcome messages enabled.', true);
      },
    },
    {
      name: 'disable',
      description: 'Disable member-join greetings',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const old = c.db.get(i.guildId!, 'config', 'welcome');
        c.db.put(i.guildId!, 'config', 'welcome', i.user.id, { ...old?.data, enabled: false });
        await say(i, 'Welcome messages disabled.', true);
      },
    },
    {
      name: 'preview',
      description: 'Preview your saved welcome template privately',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const cfg = c.db.get(i.guildId!, 'config', 'welcome');
        await say(
          i,
          welcomeText(
            String(cfg?.data.template ?? 'Welcome {user} to {server}!'),
            i.user.username,
            i.guild!.name,
          ),
          true,
        );
      },
    },
    {
      name: 'status',
      description: 'Inspect welcome configuration and intent availability',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        await say(
          i,
          `${JSON.stringify(c.db.get(i.guildId!, 'config', 'welcome')?.data ?? {})}\nMember events enabled by operator: ${process.env.ENABLE_MEMBER_EVENTS === 'true'}`,
          true,
        );
      },
    },
  ],
  P.ManageGuild,
);
