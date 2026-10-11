import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { say, esc } from '../../services/format.js';
const role = { name: 'role', description: 'Cosmetic role', type: 'role' as const, required: true };
export default actionGroup('selfroles', 'Opt-in cosmetic roles with no permission escalation', [
  {
    name: 'allow',
    description: 'Allow members to opt into a zero-permission role',
    userPermissions: P.ManageRoles,
    botPermissions: P.ManageRoles,
    options: [role],
    execute: async (i, c) => {
      const r = await i.guild!.roles.fetch(i.options.getRole('role', true).id),
        me = await i.guild!.members.fetchMe(),
        actor = await i.guild!.members.fetch(i.user.id);
      if (
        !r ||
        r.managed ||
        r.id === i.guildId ||
        r.permissions.bitfield !== 0n ||
        me.roles.highest.comparePositionTo(r) <= 0 ||
        (i.user.id !== i.guild!.ownerId && actor.roles.highest.comparePositionTo(r) <= 0)
      ) {
        await say(i, 'Select a zero-permission role below both staff and bot roles.', true);
        return;
      }
      // Channel overwrites may grant access independently; require no explicit allow overwrites anywhere.
      await i.guild!.channels.fetch();
      if (
        i.guild!.channels.cache.some(
          (ch) =>
            'permissionOverwrites' in ch &&
            (ch.permissionOverwrites.cache.get(r.id)?.allow.bitfield ?? 0n) !== 0n,
        )
      ) {
        await say(i, 'This role has channel permission grants and cannot be self-assigned.', true);
        return;
      }
      c.db.put(i.guildId!, 'selfrole', r.id, i.user.id, {});
      await say(i, 'Role is available for self-assignment.', true);
    },
  },
  {
    name: 'disallow',
    description: 'Stop new self-assignment of a role',
    userPermissions: P.ManageRoles,
    options: [role],
    execute: async (i, c) => {
      await say(
        i,
        c.db.delete(i.guildId!, 'selfrole', i.options.getRole('role', true).id)
          ? 'Role removed from the opt-in list. Existing members keep it.'
          : 'Role was not listed.',
        true,
      );
    },
  },
  {
    name: 'list',
    description: 'List opt-in server roles',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'selfrole')
          .map((r) => `<@&${r.id}>`)
          .join('\n') || 'No self-assignable roles.',
      );
    },
  },
  {
    name: 'join',
    description: 'Assign an approved cosmetic role to yourself',
    botPermissions: P.ManageRoles,
    options: [role],
    execute: async (i, c) => {
      const id = i.options.getRole('role', true).id,
        r = await i.guild!.roles.fetch(id),
        me = await i.guild!.members.fetchMe();
      if (
        !c.db.get(i.guildId!, 'selfrole', id) ||
        !r ||
        r.managed ||
        r.permissions.bitfield !== 0n ||
        me.roles.highest.comparePositionTo(r) <= 0
      ) {
        await say(i, 'Role unavailable, no longer safe, or above the bot.', true);
        return;
      }
      await i.guild!.channels.fetch();
      if (
        i.guild!.channels.cache.some(
          (ch) =>
            'permissionOverwrites' in ch &&
            (ch.permissionOverwrites.cache.get(r.id)?.allow.bitfield ?? 0n) !== 0n,
        )
      ) {
        await say(i, 'Role now grants channel access; a server manager must review it.', true);
        return;
      }
      const member = await i.guild!.members.fetch(i.user.id);
      await member.roles.add(r);
      await say(i, `Joined ${esc(r.name)}.`, true);
    },
  },
  {
    name: 'leave',
    description: 'Remove an opt-in role from yourself',
    botPermissions: P.ManageRoles,
    options: [role],
    execute: async (i, c) => {
      const id = i.options.getRole('role', true).id;
      if (!c.db.get(i.guildId!, 'selfrole', id)) {
        await say(i, 'Role is not on the opt-in list. Contact a manager.', true);
        return;
      }
      const member = await i.guild!.members.fetch(i.user.id);
      await member.roles.remove(id);
      await say(i, 'Role removed.', true);
    },
  },
]);
