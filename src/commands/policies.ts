import { PermissionFlagsBits as P } from 'discord.js';
import type { Group } from './types.js';
const moderation: Record<string, bigint> = {
  ban: P.BanMembers,
  softban: P.BanMembers,
  unban: P.BanMembers,
  kick: P.KickMembers,
  timeout: P.ModerateMembers,
  untimeout: P.ModerateMembers,
  warn: P.ModerateMembers,
  warnings: P.ModerateMembers,
  clearwarnings: P.ModerateMembers,
  purge: P.ManageMessages,
  slowmode: P.ManageChannels,
  lock: P.ManageRoles,
  unlock: P.ManageRoles,
  nickname: P.ManageNicknames,
  roleadd: P.ManageRoles,
  roleremove: P.ManageRoles,
};
const settings: Record<string, string[]> = {
  administration: ['leveling', 'levelchannel', 'clearlevelchannel', 'modlog', 'clearmodlog'],
  leveling: ['setxp', 'addxp', 'resetxp'],
};
export function applyPolicies(group: Group) {
  for (const sub of group.subs) {
    if (group.name === 'moderation') {
      sub.userPermissions = moderation[sub.name];
      sub.botPermissions = ['warn', 'warnings', 'clearwarnings'].includes(sub.name)
        ? 0n
        : moderation[sub.name];
      sub.scope = ['purge', 'slowmode', 'lock', 'unlock'].includes(sub.name) ? 'channel' : 'guild';
    }
    if (settings[group.name]?.includes(sub.name)) sub.userPermissions = P.ManageGuild;
    if (group.name === 'utility' && sub.name === 'poll') {
      sub.botPermissions = P.AddReactions | P.ReadMessageHistory;
      sub.scope = 'channel';
    }
    sub.userPermissions ??= 0n;
    sub.botPermissions ??= 0n;
    if (
      sub.name === 'help' ||
      (group.name === 'utility' && sub.name === 'about') ||
      (group.name === 'music' && sub.name === 'tap') ||
      (group.name === 'games' && sub.name === 'reaction')
    )
      sub.informational = true;
  }
  const aliases: Record<string, string> = {
    'text/mock': 'text/alternating',
    'images/globalavatar': 'images/avatar',
    'games/coin': 'utility/coin',
    'fun/coinflip': 'utility/coin',
    'games/dice': 'utility/roll',
    'fun/dice': 'utility/roll',
    'fun/choose': 'utility/choose',
    'fun/highlow': 'games/highlow',
    'utility/server': 'administration/server',
  };
  for (const sub of group.subs) sub.aliasOf ??= aliases[`${group.name}/${sub.name}`];
  if (group.name === 'developer') group.defaultPermissions = 0n;
}
