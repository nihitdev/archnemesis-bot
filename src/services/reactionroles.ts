import {
  PermissionFlagsBits as P,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
  type PartialUser,
  type Guild,
} from 'discord.js';
import type { Store } from '../database/store.js';
export async function safeCosmeticRole(guild: Guild, id: string) {
  const role = await guild.roles.fetch(id),
    me = await guild.members.fetchMe();
  if (
    !role ||
    role.managed ||
    role.id === guild.id ||
    role.permissions.bitfield !== 0n ||
    !me.permissions.has(P.ManageRoles) ||
    me.roles.highest.comparePositionTo(role) <= 0
  )
    return null;
  await guild.channels.fetch();
  if (
    guild.channels.cache.some(
      (ch) =>
        'permissionOverwrites' in ch &&
        (ch.permissionOverwrites.cache.get(id)?.allow.bitfield ?? 0n) !== 0n,
    )
  )
    return null;
  return role;
}
export async function applyReactionRole(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  db: Store,
  add: boolean,
) {
  if (user.bot) return;
  const guild = reaction.message.guild;
  if (!guild || db.guild(guild.id).disabledModules.includes('reactionroles')) return;
  const key = `${reaction.message.id}:${reaction.emoji.id ?? reaction.emoji.name}`,
    binding = db.get(guild.id, 'reactionrole', key);
  if (!binding || !binding.data.enabled) return;
  const roleId = String(binding.data.role),
    member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  const grantId = `${key}:${user.id}`;
  if (add) {
    if (!db.get(guild.id, 'selfrole', roleId)) return;
    const role = await safeCosmeticRole(guild, roleId);
    if (!role) return;
    const others = db
      .records(guild.id, 'reaction-grant', user.id)
      .filter((r) => r.id !== grantId && r.data.role === roleId);
    const managed = !member.roles.cache.has(roleId) || others.some((r) => r.data.managed === true);
    if (!member.roles.cache.has(roleId)) await member.roles.add(role, 'Opt-in reaction role');
    db.put(guild.id, 'reaction-grant', grantId, user.id, { role: roleId, managed });
  } else {
    const grant = db.get(guild.id, 'reaction-grant', grantId);
    if (!grant) return;
    const others = db
      .records(guild.id, 'reaction-grant', user.id)
      .filter((r) => r.id !== grantId && r.data.role === roleId && r.data.managed);
    if (grant.data.managed && !others.length)
      await member.roles.remove(roleId, 'Reaction role opt-out');
    db.delete(guild.id, 'reaction-grant', grantId);
  }
}
