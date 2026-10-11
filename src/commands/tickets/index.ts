import { PermissionFlagsBits as P, ChannelType } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId } from '../../services/records.js';
const id = txt('id', 'Ticket ID');
export default actionGroup('tickets', 'Private support channels and ticket tracking', [
  {
    name: 'configure',
    description: 'Choose the staff role allowed to access new tickets',
    userPermissions: P.ManageGuild,
    options: [{ name: 'role', description: 'Support team role', type: 'role', required: true }],
    execute: async (i, c) => {
      const role = i.options.getRole('role', true);
      if (role.id === i.guildId) {
        await say(i, 'Do not use @everyone as the support role.', true);
        return;
      }
      c.db.put(i.guildId!, 'config', 'tickets', i.user.id, { role: role.id });
      await say(i, 'Support role saved for future tickets.', true);
    },
  },
  {
    name: 'open',
    description: 'Open a private support ticket channel',
    botPermissions: P.ManageChannels | P.ManageRoles,
    options: [txt('subject')],
    execute: async (i, c) => {
      const cfg = c.db.get(i.guildId!, 'config', 'tickets'),
        role = cfg ? await i.guild!.roles.fetch(String(cfg.data.role)) : null;
      if (!role || role.id === i.guildId) {
        await say(i, 'A server manager must configure a valid support role first.', true);
        return;
      }
      if (c.db.records(i.guildId!, 'ticket', i.user.id).some((r) => r.data.state === 'open')) {
        await say(i, 'You already have an open ticket. Use /tickets mine.', true);
        return;
      }
      if (!i.deferred) await i.deferReply({ flags: 64 });
      const key = recordId();
      const channel = await i.guild!.channels.create({
        name: `ticket-${key}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: i.guildId!, deny: [P.ViewChannel] },
          { id: i.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
          { id: role.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] },
          {
            id: i.client.user.id,
            allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageChannels],
          },
        ],
        reason: `Support ticket ${key}`,
      });
      c.db.put(i.guildId!, 'ticket', key, i.user.id, {
        channel: channel.id,
        subject: i.options.getString('subject', true),
        state: 'open',
        staffRole: role.id,
      });
      await say(i, `Ticket ${key} opened: <#${channel.id}>`);
    },
  },
  {
    name: 'mine',
    description: 'Show your support tickets',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'ticket', i.user.id)
          .slice(0, 20)
          .map(
            (r) => `${r.id}: ${esc(String(r.data.subject))} — ${r.data.state} <#${r.data.channel}>`,
          )
          .join('\n') || 'No tickets.',
        true,
      );
    },
  },
  {
    name: 'queue',
    description: 'Show open tickets for server managers',
    userPermissions: P.ManageGuild,
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'ticket')
          .filter((r) => r.data.state === 'open')
          .slice(0, 25)
          .map((r) => `${r.id}: ${esc(String(r.data.subject))} <#${r.data.channel}>`)
          .join('\n') || 'No open tickets.',
        true,
      );
    },
  },
  {
    name: 'close',
    description: 'Close your ticket and remove the requester’s send permission',
    botPermissions: P.ManageRoles,
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'ticket', i.options.getString('id', true));
      if (!r || (r.owner !== i.user.id && !i.memberPermissions?.has(P.ManageGuild))) {
        await say(i, 'Ticket not found or you cannot close it.', true);
        return;
      }
      const ch = await i.guild!.channels.fetch(String(r.data.channel)).catch(() => null);
      if (ch?.type === ChannelType.GuildText)
        await ch.permissionOverwrites.edit(r.owner, { SendMessages: false });
      c.db.put(i.guildId!, 'ticket', r.id, r.owner, { ...r.data, state: 'closed' });
      await say(i, 'Ticket closed; its history is retained.', true);
    },
  },
  {
    name: 'reopen',
    description: 'Reopen a closed ticket as a server manager',
    userPermissions: P.ManageGuild,
    botPermissions: P.ManageRoles,
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'ticket', i.options.getString('id', true));
      if (!r) {
        await say(i, 'Ticket not found.', true);
        return;
      }
      const ch = await i.guild!.channels.fetch(String(r.data.channel));
      if (ch?.type !== ChannelType.GuildText) {
        await say(i, 'Ticket channel no longer exists.', true);
        return;
      }
      await ch.permissionOverwrites.edit(r.owner, { SendMessages: true });
      c.db.put(i.guildId!, 'ticket', r.id, r.owner, { ...r.data, state: 'open' });
      await say(i, 'Ticket reopened.', true);
    },
  },
  {
    name: 'claim',
    description: 'Assign yourself to handle a ticket',
    userPermissions: P.ManageGuild,
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'ticket', i.options.getString('id', true));
      if (!r || r.data.state !== 'open') {
        await say(i, 'Open ticket not found.', true);
        return;
      }
      c.db.put(i.guildId!, 'ticket', r.id, r.owner, { ...r.data, assignee: i.user.id });
      await say(i, `Ticket assigned to <@${i.user.id}>.`, true);
    },
  },
]);
