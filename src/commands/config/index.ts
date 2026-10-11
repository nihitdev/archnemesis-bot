import { AttachmentBuilder, PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say } from '../../services/format.js';
export default actionGroup(
  'config',
  'Inspect and maintain server-scoped bot configuration',
  [
    {
      name: 'export',
      description: 'Download bot settings for this guild without user data',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        await i.editReply({
          files: [
            new AttachmentBuilder(Buffer.from(JSON.stringify(c.db.guild(i.guildId!), null, 2)), {
              name: 'guild-settings.json',
            }),
          ],
        });
      },
    },
    {
      name: 'modules',
      description: 'Show available modules and their enabled states',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const disabled = c.db.guild(i.guildId!).disabledModules;
        await say(
          i,
          [...c.commands.keys()]
            .map((n) => `${n}: ${disabled.includes(n) ? 'disabled' : 'enabled'}`)
            .join('\n'),
          true,
        );
      },
    },
    {
      name: 'storage',
      description: 'Show this guild’s stored record counts',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        const rows = c.db.sql
          .prepare('SELECT kind,COUNT(*) AS n FROM records WHERE guild=? GROUP BY kind')
          .all(i.guildId!);
        const users = c.db.sql
          .prepare('SELECT COUNT(*) AS n FROM users WHERE guild=?')
          .get(i.guildId!)!;
        await say(
          i,
          `Member records: ${users.n}\n${rows
            .slice(0, 40)
            .map((r) => `${r.kind}: ${r.n}`)
            .join('\n')}`,
          true,
        );
      },
    },
    {
      name: 'resetsettings',
      description: 'Reset XP/log channel settings while retaining user data and role records',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        c.db.changeGuild(i.guildId!, (g) => {
          g.levelsEnabled = true;
          g.levelChannel = null;
          g.modLogChannel = null;
          g.disabledModules = [];
        });
        await say(i, 'XP, logging and module settings reset. Member data retained.', true);
      },
    },
    {
      name: 'deleteguild',
      description: 'Server-owner-only permanent deletion of this guild’s local bot data',
      userPermissions: P.Administrator,
      options: [txt('confirm', 'Type the current server ID to confirm permanent deletion')],
      execute: async (i, c) => {
        if (i.user.id !== i.guild!.ownerId || i.options.getString('confirm', true) !== i.guildId) {
          await say(
            i,
            'Only the server owner may delete data, using this server ID as confirmation.',
            true,
          );
          return;
        }
        c.db.deleteGuild(i.guildId!);
        await say(
          i,
          'This server’s local bot data was deleted. Discord messages, channels and roles remain. New activity will create fresh records.',
          true,
        );
      },
    },
  ],
  P.ManageGuild,
);
