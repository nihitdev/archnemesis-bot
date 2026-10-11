import { PermissionFlagsBits } from 'discord.js';
import type { Group } from '../types.js';
import { num, usr, opt } from '../types.js';
import { needGuild, say, formatInt } from '../../services/format.js';
import { levelFromXp, xpForLevel } from '../../database/store.js';
import { requireMod } from '../../middleware/guard.js';
const list = [
  { name: 'rank', description: 'Your XP and level', options: [usr(false)] },
  { name: 'leaderboard', description: 'Server XP leaderboard' },
  { name: 'progress', description: 'XP needed for next level', options: [usr(false)] },
  {
    name: 'levelcalc',
    description: 'XP threshold for a given level',
    options: [num('level', 'Level to check', 0, 1000)],
  },
  {
    name: 'setxp',
    description: 'Set a member XP amount (staff)',
    options: [usr(), num('xp', 'New total XP', 0, 100000000)],
  },
  {
    name: 'addxp',
    description: 'Give a member XP (staff)',
    options: [usr(), num('xp', 'Amount of XP', 1, 100000)],
  },
  { name: 'resetxp', description: 'Reset one member XP (staff)', options: [usr()] },
  { name: 'messages', description: 'Count XP-eligible messages', options: [usr(false)] },
  { name: 'help', description: 'How XP and levels work' },
];
export default {
  name: 'leveling',
  description: 'Automatic XP, rank and server leaderboards',
  subs: list,
  run: async (i, sub, c) => {
    const guild = needGuild(i);
    if (
      ['setxp', 'addxp', 'resetxp'].includes(sub) &&
      !(await requireMod(i, PermissionFlagsBits.ManageGuild))
    )
      return;
    const u = i.options.getUser('user') ?? i.user,
      d = c.db.user(guild, u.id),
      lvl = levelFromXp(d.xp);
    switch (sub) {
      case 'rank':
        return void (await say(
          i,
          `⭐ <@${u.id}> • **Level ${lvl}** • ${formatInt(d.xp)} XP • ${d.messages} eligible messages`,
        ));
      case 'leaderboard': {
        const rows = c.db.leaders(guild, 'xp');
        return void (await say(
          i,
          `🏆 **XP leaderboard**\n${rows.map((x, j) => `${j + 1}. <@${x.id}> — Level ${levelFromXp(x.value)} (${formatInt(x.value)} XP)`).join('\n') || 'No XP earned yet.'}`,
        ));
      }
      case 'progress':
        return void (await say(
          i,
          `⭐ <@${u.id}>: ${formatInt(d.xp - xpForLevel(lvl))}/${formatInt(xpForLevel(lvl + 1) - xpForLevel(lvl))} XP towards level ${lvl + 1}`,
        ));
      case 'levelcalc':
        return void (await say(
          i,
          `📈 Level ${opt.int(i, 'level')} begins at **${formatInt(xpForLevel(opt.int(i, 'level')))} XP**.`,
        ));
      case 'setxp': {
        const next = c.db.changeUser(guild, u.id, (d) => (d.xp = opt.int(i, 'xp')));
        return void (await say(i, `✅ Set <@${u.id}> to ${next.xp} XP.`, true));
      }
      case 'addxp': {
        const next = c.db.changeUser(guild, u.id, (d) => (d.xp += opt.int(i, 'xp')));
        return void (await say(i, `✅ Added XP to <@${u.id}> (${next.xp} total).`, true));
      }
      case 'resetxp':
        c.db.changeUser(guild, u.id, (d) => {
          d.xp = 0;
          d.messages = 0;
        });
        return void (await say(i, `✅ Reset XP for <@${u.id}>.`, true));
      case 'messages':
        return void (await say(
          i,
          `💬 <@${u.id}> has **${d.messages}** messages rewarded with XP.`,
        ));
      case 'help':
        return void (await say(
          i,
          '📖 Each member receives 15–25 XP for their first eligible message every 60 seconds. Level N requires N² × 100 XP. Level announcements are off by default; server admins can enable them with `/administration levelchannel`.',
        ));
    }
  },
} satisfies Group;
