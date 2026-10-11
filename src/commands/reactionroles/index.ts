import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { safeCosmeticRole } from '../../services/reactionroles.js';
const id = txt('id', 'Binding ID from /reactionroles list');
export default actionGroup(
  'reactionroles',
  'Bind emoji reactions to approved cosmetic roles',
  [
    {
      name: 'add',
      description: 'Bind a reaction on a message to a previously approved self-role',
      userPermissions: P.ManageRoles,
      botPermissions: P.ManageRoles,
      options: [
        txt('link', 'Discord message link in this server'),
        txt('emoji', 'Unicode emoji or custom emoji ID'),
        {
          name: 'role',
          description: 'Previously approved self-role',
          type: 'role',
          required: true,
        },
      ],
      execute: async (i, c) => {
        const match = i.options
            .getString('link', true)
            .match(/^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/),
          roleId = i.options.getRole('role', true).id;
        if (!match || match[1] !== i.guildId || !c.db.get(i.guildId!, 'selfrole', roleId)) {
          await say(
            i,
            'Use a message link from this server and a role approved with /selfroles allow.',
            true,
          );
          return;
        }
        const role = await safeCosmeticRole(i.guild!, roleId),
          actor = await i.guild!.members.fetch(i.user.id);
        if (
          !role ||
          (i.user.id !== i.guild!.ownerId && actor.roles.highest.comparePositionTo(role) <= 0)
        ) {
          await say(i, 'Role is unsafe or outside your hierarchy.', true);
          return;
        }
        const channel = await i.guild!.channels.fetch(match[2]),
          me = await i.guild!.members.fetchMe();
        if (
          !channel?.isTextBased() ||
          !channel.permissionsFor(actor)?.has(P.ViewChannel) ||
          !channel.permissionsFor(me)?.has([P.ViewChannel, P.ReadMessageHistory, P.AddReactions])
        ) {
          await say(
            i,
            'Both you and the bot must access the source channel; the bot also needs Read Message History and Add Reactions.',
            true,
          );
          return;
        }
        const message = await channel.messages.fetch(match[3]);
        const reacted = await message.react(i.options.getString('emoji', true));
        const key = `${message.id}:${reacted.emoji.id ?? reacted.emoji.name}`;
        c.db.put(i.guildId!, 'reactionrole', key, i.user.id, {
          role: roleId,
          channel: channel.id,
          message: message.id,
          emoji: reacted.emoji.id ?? reacted.emoji.name,
          enabled: true,
        });
        await say(i, `Reaction-role binding saved: ${key}`, true);
      },
    },
    {
      name: 'list',
      description: 'List reaction-role bindings',
      userPermissions: P.ManageRoles,
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'reactionrole')
            .slice(0, 20)
            .map(
              (r) =>
                `${esc(r.id)} → <@&${r.data.role}> (${r.data.enabled ? 'enabled' : 'disabled'})`,
            )
            .join('\n') || 'No bindings.',
          true,
        );
      },
    },
    {
      name: 'remove',
      description: 'Delete a binding without changing existing member roles',
      userPermissions: P.ManageRoles,
      options: [id],
      execute: async (i, c) => {
        await say(
          i,
          c.db.delete(i.guildId!, 'reactionrole', i.options.getString('id', true))
            ? 'Binding removed; existing roles remain.'
            : 'Binding not found.',
          true,
        );
      },
    },
    {
      name: 'disable',
      description: 'Pause one reaction-role binding',
      userPermissions: P.ManageRoles,
      options: [id],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'reactionrole', i.options.getString('id', true));
        if (!r) {
          await say(i, 'Binding not found.', true);
          return;
        }
        c.db.put(i.guildId!, 'reactionrole', r.id, r.owner, { ...r.data, enabled: false });
        await say(i, 'Binding disabled.', true);
      },
    },
    {
      name: 'enable',
      description: 'Resume a safe reaction-role binding',
      userPermissions: P.ManageRoles,
      botPermissions: P.ManageRoles,
      options: [id],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'reactionrole', i.options.getString('id', true));
        if (
          !r ||
          !c.db.get(i.guildId!, 'selfrole', String(r.data.role)) ||
          !(await safeCosmeticRole(i.guild!, String(r.data.role)))
        ) {
          await say(i, 'Binding or safe self-role unavailable.', true);
          return;
        }
        c.db.put(i.guildId!, 'reactionrole', r.id, r.owner, { ...r.data, enabled: true });
        await say(i, 'Binding enabled.', true);
      },
    },
  ],
  P.ManageRoles,
);
