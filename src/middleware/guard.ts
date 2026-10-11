import {
  PermissionFlagsBits as P,
  PermissionsBitField,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { say } from '../services/format.js';
import type { BotContext, Sub } from '../commands/types.js';
const cooldowns = new Map<string, number>();
export async function guardCooldown(i: ChatInputCommandInteraction): Promise<boolean> {
  const key = `${i.guildId}:${i.user.id}:${i.commandName}:${i.options.getSubcommand(false) ?? ''}`,
    now = Date.now(),
    remaining = (cooldowns.get(key) ?? 0) - now;
  if (remaining > 0) {
    await say(i, `Try again in ${(remaining / 1000).toFixed(1)}s.`, true);
    return false;
  }
  if (cooldowns.size >= 20000) {
    for (const [k, v] of cooldowns) if (v <= now) cooldowns.delete(k);
    if (cooldowns.size >= 20000) {
      await say(i, 'Bot is busy. Try again shortly.', true);
      return false;
    }
  }
  cooldowns.set(key, now + 2200);
  return true;
}
export const permissionNames = (bits: bigint) =>
  new PermissionsBitField(bits)
    .toArray()
    .map((n) => (n === 'ManageGuild' ? 'Manage Server' : n.replace(/([a-z])([A-Z])/g, '$1 $2')))
    .join(', ');
export async function checkPermissions(
  i: ChatInputCommandInteraction,
  user: bigint = 0n,
  bot: bigint = 0n,
  scope: 'guild' | 'channel' = 'guild',
): Promise<boolean> {
  if (!i.guild) {
    await say(i, 'Use this command in a server.', true);
    return false;
  }
  if (user === 0n && bot === 0n) return true;
  const actor = scope === 'guild' ? await i.guild.members.fetch(i.user.id) : null;
  const me = scope === 'guild' ? await i.guild.members.fetchMe() : null;
  const userPerms = actor?.permissions ?? i.memberPermissions,
    botPerms = me?.permissions ?? i.appPermissions;
  for (const [label, permissions, needed] of [
    ['You', userPerms, user],
    ['The bot', botPerms, bot],
  ] as const) {
    const missing = new PermissionsBitField(needed).remove(
      permissions?.has(P.Administrator) ? needed : (permissions?.bitfield ?? 0n),
    ).bitfield;
    if (missing) {
      await say(
        i,
        `${label} need: **${permissionNames(missing)}** (${scope} permissions). Check role permissions${scope === 'channel' ? ' and this channel’s overwrites' : ''}. Run /diagnose check for guidance.`,
        true,
      );
      return false;
    }
  }
  return true;
}
// Local database administration never requires the bot to have the caller's privilege.
export async function requireMod(i: ChatInputCommandInteraction, perm: bigint): Promise<boolean> {
  return checkPermissions(i, perm);
}
export async function authorize(
  i: ChatInputCommandInteraction,
  sub: Sub,
  ctx: BotContext,
): Promise<boolean> {
  if (!i.guildId || !i.guild) {
    await say(i, 'This bot’s commands are available in servers only.', true);
    return false;
  }
  const moduleName =
    i.commandName === 'utility' && ['remind', 'reminders', 'cancelreminder'].includes(sub.name)
      ? 'reminders'
      : i.commandName;
  if (
    !['setup', 'diagnose', 'developer'].includes(i.commandName) &&
    ctx.db.guild(i.guildId).disabledModules.includes(moduleName)
  ) {
    await say(
      i,
      'This module is disabled here. A server administrator can enable it with /setup module.',
      true,
    );
    return false;
  }
  return checkPermissions(i, sub.userPermissions, sub.botPermissions, sub.scope);
}
export async function guardHierarchy(i: ChatInputCommandInteraction): Promise<boolean> {
  const guild = i.guild!;
  const target = i.options.getUser('user');
  const actor = await guild.members.fetch(i.user.id),
    me = await guild.members.fetchMe();
  const deny = async (message: string) => {
    await say(i, message, true);
    return false;
  };
  if (target) {
    if ([guild.ownerId, i.user.id, me.id].includes(target.id))
      return deny('You cannot target yourself, the server owner, or this bot.');
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (
      member &&
      ((i.user.id !== guild.ownerId &&
        actor.roles.highest.comparePositionTo(member.roles.highest) <= 0) ||
        me.roles.highest.comparePositionTo(member.roles.highest) <= 0)
    )
      return deny(
        'Both your highest role and the bot’s highest role must be above the target member.',
      );
    if (
      member &&
      ['timeout', 'untimeout'].includes(i.options.getSubcommand()) &&
      member.permissions.has(P.Administrator)
    )
      return deny('Discord does not allow timing out administrators.');
  }
  const selected = i.options.getRole('role');
  if (selected) {
    const role = await guild.roles.fetch(selected.id);
    if (
      !role ||
      role.managed ||
      role.id === guild.id ||
      me.roles.highest.comparePositionTo(role) <= 0 ||
      (i.user.id !== guild.ownerId && actor.roles.highest.comparePositionTo(role) <= 0)
    )
      return deny(
        'Choose a non-managed role below both your highest role and the bot’s highest role.',
      );
    if (
      (role.permissions.bitfield & ~actor.permissions.bitfield) !== 0n &&
      !actor.permissions.has(P.Administrator)
    )
      return deny('You cannot assign a role containing permissions you do not have.');
  }
  return true;
}
export async function requireOwner(i: ChatInputCommandInteraction, c: BotContext) {
  if (c.ownerIds.has(i.user.id)) return true;
  await say(i, 'This command is restricted to configured bot operators.', true);
  return false;
}

const bursts = new Map<string, { until: number; count: number }>();
export function consumeRateLimit(guild: string, user: string, now = Date.now()): boolean {
  if (bursts.size >= 25000) {
    for (const [key, b] of bursts) if (b.until <= now) bursts.delete(key);
    if (bursts.size >= 25000) return false;
  }
  const limits: [[string, number], [string, number]] = [
    [`user:${guild}:${user}`, 8],
    [`guild:${guild}`, 60],
  ];
  for (const [key, limit] of limits) {
    const b = bursts.get(key);
    if (b && b.until > now && b.count >= limit) return false;
  }
  for (const [key] of limits) {
    const b = bursts.get(key);
    bursts.set(
      key,
      b && b.until > now
        ? { until: b.until, count: b.count + 1 }
        : { until: now + 10000, count: 1 },
    );
  }
  return true;
}
