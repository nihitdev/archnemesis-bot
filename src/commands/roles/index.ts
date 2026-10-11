import { PermissionFlagsBits as P, type ChatInputCommandInteraction, type Role } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say } from '../../services/format.js';
const role = { name: 'role', description: 'Role to manage', type: 'role' as const, required: true };
const perms = { userPermissions: P.ManageRoles, botPermissions: P.ManageRoles };
async function selected(i: ChatInputCommandInteraction): Promise<Role | undefined> {
  const r = await i.guild!.roles.fetch(i.options.getRole('role', true).id),
    actor = await i.guild!.members.fetch(i.user.id),
    me = await i.guild!.members.fetchMe();
  if (
    !r ||
    r.managed ||
    r.id === i.guildId ||
    me.roles.highest.comparePositionTo(r) <= 0 ||
    (i.user.id !== i.guild!.ownerId && actor.roles.highest.comparePositionTo(r) <= 0)
  ) {
    await say(i, 'Select an ordinary role below both your role and the bot’s role.', true);
    return;
  }
  return r;
}
export default actionGroup(
  'roles',
  'Safely create and customize server roles',
  [
    {
      name: 'create',
      description: 'Create a cosmetic role with no permissions',
      ...perms,
      options: [{ ...txt('name'), max: 100 }],
      execute: async (i) => {
        const r = await i.guild!.roles.create({
          name: i.options.getString('name', true),
          permissions: 0n,
          mentionable: false,
        });
        await say(i, `Created role ${r.id} with no permissions.`, true);
      },
    },
    {
      name: 'rename',
      description: 'Rename an editable role',
      ...perms,
      options: [role, { ...txt('name'), max: 100 }],
      execute: async (i) => {
        const r = await selected(i);
        if (!r) return;
        await r.setName(i.options.getString('name', true));
        await say(i, 'Role renamed.', true);
      },
    },
    {
      name: 'color',
      description: 'Set an editable role’s hex color',
      ...perms,
      options: [role, txt('hex')],
      execute: async (i) => {
        const hex = i.options.getString('hex', true).replace(/^#/, '');
        if (!/^[a-f0-9]{6}$/i.test(hex)) {
          await say(i, 'Enter six hex digits.', true);
          return;
        }
        const r = await selected(i);
        if (!r) return;
        await r.setColor(parseInt(hex, 16));
        await say(i, 'Role color updated.', true);
      },
    },
    {
      name: 'hoist',
      description: 'Show or hide a role separately in the member list',
      ...perms,
      options: [
        role,
        { name: 'enabled', description: 'Display separately?', type: 'boolean', required: true },
      ],
      execute: async (i) => {
        const r = await selected(i);
        if (!r) return;
        await r.setHoist(i.options.getBoolean('enabled', true));
        await say(i, 'Role display updated.', true);
      },
    },
    {
      name: 'mentionable',
      description: 'Allow or prevent everyone mentioning a role',
      ...perms,
      options: [
        role,
        { name: 'enabled', description: 'Allow mentions?', type: 'boolean', required: true },
      ],
      execute: async (i) => {
        const r = await selected(i);
        if (!r) return;
        await r.setMentionable(i.options.getBoolean('enabled', true));
        await say(i, 'Role mentionability updated.', true);
      },
    },
    {
      name: 'permissions',
      description: 'Inspect a role’s permission flags',
      options: [role],
      execute: async (i) => {
        const r = await i.guild!.roles.fetch(i.options.getRole('role', true).id);
        await say(
          i,
          r
            ? `${r.name}: ${r.permissions.toArray().join(', ') || 'No permissions'}`
            : 'Role not found.',
          true,
        );
      },
    },
    {
      name: 'members',
      description: 'List cached members with a role',
      options: [role],
      execute: async (i) => {
        const r = await i.guild!.roles.fetch(i.options.getRole('role', true).id);
        await say(
          i,
          r
            ? `Cached members only (not a complete roster):\n${
                r.members
                  .first(30)
                  .map((m) => `<@${m.id}>`)
                  .join(', ') || 'None cached'
              }`
            : 'Role not found.',
          true,
        );
      },
    },
    {
      name: 'compare',
      description: 'Compare two roles in the hierarchy',
      options: [role, { name: 'other', description: 'Other role', type: 'role', required: true }],
      execute: async (i) => {
        const a = await i.guild!.roles.fetch(i.options.getRole('role', true).id),
          b = await i.guild!.roles.fetch(i.options.getRole('other', true).id);
        await say(
          i,
          a && b
            ? `${a.name} is ${a.comparePositionTo(b) > 0 ? 'above' : a.comparePositionTo(b) < 0 ? 'below' : 'the same as'} ${b.name}.`
            : 'A role no longer exists.',
          true,
        );
      },
    },
  ],
  P.ManageRoles,
);
