import { PermissionFlagsBits as P, AttachmentBuilder } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt, usr } from '../types.js';
import { say, esc } from '../../services/format.js';
export default actionGroup(
  'audit',
  'Server-scoped bot action history',
  [
    {
      name: 'recent',
      description: 'Show recent bot audit records',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'audit')
            .slice(0, 20)
            .map((r) => `${r.id}: ${esc(String(r.data.action))} — <@${r.owner}>`)
            .join('\n') || 'No audit records.',
          true,
        );
      },
    },
    {
      name: 'actor',
      description: 'Find recent actions by a staff member',
      userPermissions: P.ManageGuild,
      options: [usr()],
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'audit', i.options.getUser('user', true).id)
            .slice(0, 20)
            .map((r) => `${r.id}: ${esc(String(r.data.action))}`)
            .join('\n') || 'No records for that actor.',
          true,
        );
      },
    },
    {
      name: 'record',
      description: 'Inspect an audit entry',
      userPermissions: P.ManageGuild,
      options: [txt('id')],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'audit', i.options.getString('id', true));
        await say(i, r ? JSON.stringify(r, null, 2) : 'Record not found.', true);
      },
    },
    {
      name: 'export',
      description: 'Export up to 1000 recent bot audit records as JSON',
      userPermissions: P.ManageGuild,
      execute: async (i, c) => {
        await i.editReply({
          files: [
            new AttachmentBuilder(
              Buffer.from(JSON.stringify(c.db.records(i.guildId!, 'audit'), null, 2)),
              { name: 'audit.json' },
            ),
          ],
        });
      },
    },
    {
      name: 'discord',
      description: 'Read recent Discord server audit entries',
      userPermissions: P.ViewAuditLog,
      botPermissions: P.ViewAuditLog,
      execute: async (i) => {
        if (!i.deferred) await i.deferReply({ flags: 64 });
        const logs = await i.guild!.fetchAuditLogs({ limit: 10 });
        await say(
          i,
          logs.entries
            .map(
              (r) =>
                `${r.id}: action ${r.action}, actor ${r.executorId ?? 'unknown'}, target ${r.targetId ?? 'unknown'}`,
            )
            .join('\n') || 'No entries.',
        );
      },
    },
  ],
  P.ManageGuild,
);
