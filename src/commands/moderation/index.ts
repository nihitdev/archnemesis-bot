import { PermissionFlagsBits, ChannelType } from 'discord.js';
import type { Group } from '../types.js';
import { opt, usr, num } from '../types.js';
import { needGuild, say, esc } from '../../services/format.js';
import { checkPermissions, guardHierarchy } from '../../middleware/guard.js';
import { randomUUID } from 'node:crypto';
import { modlog } from '../../services/modlog.js';
const reason = {
  name: 'reason',
  description: 'Optional reason',
  type: 'string' as const,
  max: 450,
};
const list = [
  { name: 'ban', description: 'Ban a user from the server', options: [usr(), reason] },
  { name: 'kick', description: 'Kick a member', options: [usr(), reason] },
  {
    name: 'unban',
    description: 'Unban a Discord user by ID',
    options: [
      { name: 'userid', description: 'Discord user ID', type: 'string' as const, required: true },
      reason,
    ],
  },
  {
    name: 'timeout',
    description: 'Temporarily timeout a member',
    options: [usr(), num('minutes', 'Timeout minutes', 1, 40320), reason],
  },
  { name: 'untimeout', description: 'Remove member timeout', options: [usr(), reason] },
  {
    name: 'warn',
    description: 'Store a moderator warning',
    options: [usr(), { ...reason, required: true }],
  },
  { name: 'warnings', description: 'Show a member warning history', options: [usr()] },
  { name: 'clearwarnings', description: 'Clear stored member warnings', options: [usr()] },
  {
    name: 'purge',
    description: 'Bulk delete recent messages (up to 100)',
    options: [num('count', 'Recent messages to delete', 1, 100)],
  },
  {
    name: 'slowmode',
    description: 'Set channel slowmode seconds',
    options: [num('seconds', 'Slowmode (0 disables)', 0, 21600)],
  },
  { name: 'lock', description: 'Lock the current text channel' },
  { name: 'unlock', description: 'Unlock the current text channel' },
  {
    name: 'nickname',
    description: 'Change or clear a member nickname',
    options: [
      usr(),
      {
        name: 'nickname',
        description: 'New nickname (omit to clear)',
        type: 'string' as const,
        max: 32,
      },
    ],
  },
  {
    name: 'roleadd',
    description: 'Give a role to a member',
    options: [
      usr(),
      { name: 'role', description: 'Role to add', type: 'role' as const, required: true },
    ],
  },
  {
    name: 'roleremove',
    description: 'Remove a role from a member',
    options: [
      usr(),
      { name: 'role', description: 'Role to remove', type: 'role' as const, required: true },
    ],
  },
  {
    name: 'softban',
    description: 'Ban then unban to remove recent messages',
    options: [usr(), reason],
  },
];
export default {
  name: 'moderation',
  description: 'Staff moderation and warning commands',
  subs: list,
  run: async (i, sub, c) => {
    const guildId = needGuild(i),
      g = i.guild!;
    const respond = async (text: string) => {
      if (
        !['warnings'].includes(sub) &&
        (text.startsWith('✅') || text.startsWith('🧹') || text.startsWith('🔒'))
      )
        c.db.put(guildId, 'case', randomUUID().slice(0, 12), i.user.id, {
          action: sub,
          target: i.options.getUser('user')?.id ?? null,
          summary: text,
          reason: i.options.getString('reason') ?? null,
        });
      await say(i, text);
    };
    const perms: Record<string, bigint> = {
      ban: PermissionFlagsBits.BanMembers,
      softban: PermissionFlagsBits.BanMembers,
      unban: PermissionFlagsBits.BanMembers,
      kick: PermissionFlagsBits.KickMembers,
      timeout: PermissionFlagsBits.ModerateMembers,
      untimeout: PermissionFlagsBits.ModerateMembers,
      purge: PermissionFlagsBits.ManageMessages,
      slowmode: PermissionFlagsBits.ManageChannels,
      lock: PermissionFlagsBits.ManageRoles,
      unlock: PermissionFlagsBits.ManageRoles,
      nickname: PermissionFlagsBits.ManageNicknames,
      roleadd: PermissionFlagsBits.ManageRoles,
      roleremove: PermissionFlagsBits.ManageRoles,
      warn: PermissionFlagsBits.ModerateMembers,
      warnings: PermissionFlagsBits.ModerateMembers,
      clearwarnings: PermissionFlagsBits.ModerateMembers,
    };
    const local = ['warn', 'warnings', 'clearwarnings'].includes(sub);
    if (
      !(await checkPermissions(
        i,
        perms[sub],
        local ? 0n : perms[sub],
        ['purge', 'slowmode', 'lock', 'unlock'].includes(sub) ? 'channel' : 'guild',
      ))
    )
      return;
    if (
      !['warnings', 'purge', 'slowmode', 'lock', 'unlock', 'unban'].includes(sub) &&
      !(await guardHierarchy(i))
    )
      return;
    if (!i.deferred) await i.deferReply({ flags: 64 });
    const u = i.options.getUser('user'),
      reasonText = i.options.getString('reason') ?? `Action by ${i.user.username}`;
    try {
      switch (sub) {
        case 'ban':
        case 'softban': {
          if (!u) break;
          await g.members.ban(u.id, {
            reason: reasonText,
            deleteMessageSeconds: sub === 'softban' ? 86400 : 0,
          });
          if (sub === 'softban') {
            try {
              await g.members.unban(u.id, `Softban by ${i.user.username}`);
            } catch {
              c.db.put(guildId, 'case', randomUUID().slice(0, 12), i.user.id, {
                action: 'softban-partial',
                target: u.id,
                summary: 'Ban succeeded; unban failed. Member remains banned.',
                reason: reasonText,
              });
              await say(
                i,
                `The ban succeeded but the unban failed. ${esc(u.username)} remains banned. Use /moderation unban with ID ${u.id} after checking permissions.`,
                true,
              );
              return;
            }
          }
          await modlog(g, c.db, `${sub}: ${u.username} by ${i.user.username}: ${reasonText}`);
          return void (await respond(
            `✅ ${sub === 'ban' ? 'Banned' : 'Softbanned'} ${esc(u.username)}.`,
          ));
        }
        case 'kick': {
          const m = await g.members.fetch(u!.id);
          await m.kick(reasonText);
          await modlog(g, c.db, `Kick ${u!.username} by ${i.user.username}: ${reasonText}`);
          return void (await respond(`✅ Kicked ${esc(u!.username)}.`));
        }
        case 'unban': {
          const id = opt.s(i, 'userid');
          if (!/^\d{17,21}$/.test(id)) return void (await respond('❌ Invalid Discord user ID.'));
          await g.members.unban(id, reasonText);
          return void (await respond(`✅ Unbanned ${id}.`));
        }
        case 'timeout':
        case 'untimeout': {
          const m = await g.members.fetch(u!.id);
          await m.timeout(sub === 'timeout' ? opt.int(i, 'minutes') * 60000 : null, reasonText);
          await modlog(g, c.db, `${sub} ${u!.username} by ${i.user.username}`);
          return void (await respond(
            `✅ ${sub === 'timeout' ? 'Timed out' : 'Removed timeout for'} ${esc(u!.username)}.`,
          ));
        }
        case 'warn': {
          const data = c.db.changeUser(guildId, u!.id, (r) =>
            r.warnings.push({ reason: reasonText, moderatorId: i.user.id, at: Date.now() }),
          );
          await modlog(g, c.db, `Warn ${u!.username} by ${i.user.username}: ${reasonText}`);
          return void (await respond(
            `✅ Warning #${data.warnings.length} recorded for ${esc(u!.username)}.`,
          ));
        }
        case 'warnings': {
          const w = c.db.user(guildId, u!.id).warnings;
          return void (await respond(
            w.length
              ? `Warnings for ${esc(u!.username)} (${w.length}):\n${w
                  .slice(-15)
                  .map(
                    (x, n) =>
                      `${n + 1}. ${esc(x.reason)} • <t:${Math.floor(x.at / 1000)}:d> • <@${x.moderatorId}>`,
                  )
                  .join('\n')}`
              : '✅ No warnings.',
          ));
        }
        case 'clearwarnings': {
          c.db.changeUser(guildId, u!.id, (r) => (r.warnings = []));
          return void (await respond(`✅ Cleared warnings for ${esc(u!.username)}.`));
        }
        case 'purge': {
          if (!i.channel || i.channel.type !== ChannelType.GuildText)
            return void (await respond('Use this in a regular server text channel.'));
          const deleted = await i.channel.bulkDelete(opt.int(i, 'count'), true);
          await modlog(
            g,
            c.db,
            `Purge ${deleted.size} messages by ${i.user.username} in #${i.channel.name}`,
          );
          return void (await respond(
            `🧹 Deleted **${deleted.size}** recent messages (messages over 14 days old are skipped).`,
          ));
        }
        case 'slowmode': {
          if (i.channel?.type !== ChannelType.GuildText)
            return void (await respond('Use a server text channel.'));
          await i.channel.setRateLimitPerUser(opt.int(i, 'seconds'));
          return void (await respond(`✅ Slowmode: ${opt.int(i, 'seconds')} seconds.`));
        }
        case 'lock':
        case 'unlock': {
          if (i.channel?.type !== ChannelType.GuildText)
            return void (await respond('Use a server text channel.'));
          await i.channel.permissionOverwrites.edit(g.roles.everyone, {
            SendMessages: sub === 'lock' ? false : null,
          });
          return void (await respond(`🔒 Channel ${sub === 'lock' ? 'locked' : 'unlocked'}.`));
        }
        case 'nickname': {
          const m = await g.members.fetch(u!.id);
          await m.setNickname(opt.sn(i, 'nickname') ?? null, reasonText);
          return void (await respond(`✅ Nickname updated for ${esc(u!.username)}.`));
        }
        case 'roleadd':
        case 'roleremove': {
          const role = opt.r(i, 'role'),
            m = await g.members.fetch(u!.id);
          if (sub === 'roleadd') await m.roles.add(role.id, reasonText);
          else await m.roles.remove(role.id, reasonText);
          return void (await respond(
            `✅ Role ${sub === 'roleadd' ? 'added to' : 'removed from'} ${esc(u!.username)}.`,
          ));
        }
      }
    } catch (e) {
      return void (await respond(
        `❌ Discord rejected the action: ${esc(e instanceof Error ? e.message : String(e))}`,
      ));
    }
  },
} satisfies Group;
