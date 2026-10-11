import { PermissionFlagsBits as P, type Guild } from 'discord.js';
import type { Store } from '../database/store.js';
const pending = new Map<string, Promise<string[]>>();
export function initializeGuild(guild: Guild, db: Store): Promise<string[]> {
  const existing = pending.get(guild.id);
  if (existing) return existing;
  const task = setup(guild, db).finally(() => pending.delete(guild.id));
  pending.set(guild.id, task);
  return task;
}
async function setup(guild: Guild, db: Store): Promise<string[]> {
  db.changeGuild(guild.id, (g) => (g.active = true));
  const warnings: string[] = [];
  try {
    const me = await guild.members.fetchMe();
    if (!me.permissions.has(P.ManageRoles))
      warnings.push(
        'Missing Manage Roles. Grant it to the bot integration role to create and assign the optional ARCHNEMESIS BOT role.',
      );
    else {
      const roles = await guild.roles.fetch(),
        cfg = db.guild(guild.id);
      let role = cfg.setupRoleId ? roles.get(cfg.setupRoleId) : undefined;
      if (!role) {
        // Reuse by name only if unambiguous; never edit an administrator-customized role.
        const matches = roles.filter((r) => r.name === 'ARCHNEMESIS BOT' && !r.managed);
        if (matches.size > 1)
          throw new Error(
            'Multiple ARCHNEMESIS BOT roles exist. Remove ambiguity before retrying setup.',
          );
        role = matches.first();
        if (!role)
          role = await guild.roles.create({
            name: 'ARCHNEMESIS BOT',
            color: cfg.roleColor,
            permissions: 0n,
            mentionable: false,
            reason: 'Optional cosmetic bot setup role',
          });
        db.changeGuild(guild.id, (g) => (g.setupRoleId = role!.id));
      }
      if (role.managed)
        warnings.push(
          'The stored setup role is integration-managed; choose an ordinary cosmetic role.',
        );
      else if (role.permissions.bitfield !== 0n)
        warnings.push(
          'The existing setup role has permissions. It was preserved but will not be automatically assigned; use a role with no permissions.',
        );
      else if (!me.roles.cache.has(role.id)) {
        await guild.channels.fetch();
        const grantsAccess = guild.channels.cache.some(
          (ch) =>
            'permissionOverwrites' in ch &&
            (ch.permissionOverwrites.cache.get(role!.id)?.allow.bitfield ?? 0n) !== 0n,
        );
        if (grantsAccess)
          warnings.push(
            'The existing setup role grants channel permissions. It was preserved and will not be assigned automatically.',
          );
        else if (me.roles.highest.comparePositionTo(role) <= 0)
          warnings.push(
            'Move the bot integration role above ARCHNEMESIS BOT before assigning the setup role.',
          );
        else await me.roles.add(role, 'Assign optional cosmetic setup role');
      }
    }
  } catch (error) {
    warnings.push(
      `Setup could not finish: ${error instanceof Error ? error.message : 'Discord request failed'}`,
    );
  }
  db.changeGuild(guild.id, (g) => (g.setupWarning = warnings.join('\n') || null));
  return warnings;
}
export async function diagnoseGuild(guild: Guild, db: Store): Promise<string> {
  const me = await guild.members.fetchMe(),
    cfg = db.guild(guild.id);
  const required = [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ReadMessageHistory];
  const { PermissionsBitField } = await import('discord.js');
  const missing = new PermissionsBitField(required).remove(me.permissions).toArray();
  const problems = [
    `Baseline guild permissions missing: ${missing.join(', ') || 'none'}`,
    `Highest bot role: ${me.roles.highest.name}`,
    `Setup role: ${cfg.setupRoleId ?? 'not configured'}`,
  ];
  for (const [label, id] of [
    ['Level announcements', cfg.levelChannel],
    ['Moderation log', cfg.modLogChannel],
  ]) {
    if (!id) continue;
    const ch = await guild.channels.fetch(id).catch(() => null);
    problems.push(
      `${label}: ${!ch ? 'channel deleted or inaccessible' : ch.permissionsFor(me)?.has([P.ViewChannel, P.SendMessages]) ? 'accessible' : 'missing View Channel / Send Messages in channel overwrites'}`,
    );
  }
  const inaccessible = guild.channels.cache.filter(
    (ch) => !ch.permissionsFor(me)?.has(P.ViewChannel),
  ).size;
  problems.push(
    `Cached channels hidden from bot: ${inaccessible}`,
    cfg.setupWarning ?? 'Role setup has no recorded warnings.',
    'Grant only the permissions for enabled features. Move the bot role above moderation targets and assignable roles. Administrator is never required.',
  );
  return problems.join('\n');
}
