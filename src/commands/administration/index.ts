import { PermissionFlagsBits, ChannelType } from 'discord.js';
import type { Group } from '../types.js';
import { opt, usr } from '../types.js';
import { needGuild, say, esc } from '../../services/format.js';
import { requireMod } from '../../middleware/guard.js';
const list = [
  { name: 'server', description: 'Information about this server' },
  { name: 'member', description: 'Information about a server member', options: [usr()] },
  {
    name: 'channel',
    description: 'Information about a channel',
    options: [
      {
        name: 'channel',
        description: 'Server text channel',
        type: 'channel' as const,
        required: true,
      },
    ],
  },
  {
    name: 'role',
    description: 'Information about a role',
    options: [{ name: 'role', description: 'Server role', type: 'role' as const, required: true }],
  },
  { name: 'roles', description: 'Top server roles' },
  { name: 'channels', description: 'List number of channels by type' },
  { name: 'settings', description: 'Show bot settings' },
  {
    name: 'leveling',
    description: 'Enable or disable XP rewards',
    options: [
      {
        name: 'enabled',
        description: 'Enable XP tracking?',
        type: 'boolean' as const,
        required: true,
      },
    ],
  },
  {
    name: 'levelchannel',
    description: 'Set channel for level-up announcements',
    options: [
      {
        name: 'channel',
        description: 'Announcement channel',
        type: 'channel' as const,
        required: true,
      },
    ],
  },
  { name: 'clearlevelchannel', description: 'Disable level-up announcements' },
  {
    name: 'modlog',
    description: 'Set moderation audit channel',
    options: [
      {
        name: 'channel',
        description: 'Audit log channel',
        type: 'channel' as const,
        required: true,
      },
    ],
  },
  { name: 'clearmodlog', description: 'Disable moderation audit channel' },
  { name: 'emojis', description: 'List server emoji names' },
  { name: 'boosts', description: 'Show server boost stats' },
];
export default {
  name: 'administration',
  description: 'Server info and server-specific bot settings',
  subs: list,
  run: async (i, sub, c) => {
    const id = needGuild(i),
      g = i.guild!;
    if (
      ['leveling', 'levelchannel', 'clearlevelchannel', 'modlog', 'clearmodlog'].includes(sub) &&
      !(await requireMod(i, PermissionFlagsBits.ManageGuild))
    )
      return;
    switch (sub) {
      case 'server':
        return void (await say(
          i,
          `🏠 **${esc(g.name)}**\nID: ${g.id}\nMembers: ${g.memberCount}\nCreated: <t:${Math.floor(g.createdTimestamp / 1000)}:D>\nOwner: <@${g.ownerId}>\nBoost tier: ${g.premiumTier}`,
        ));
      case 'member': {
        const u = opt.u(i, 'user'),
          m = await g.members.fetch(u.id).catch(() => null);
        return void (await say(
          i,
          `👤 **${esc(u.username)}**\nID: ${u.id}\nCreated: <t:${Math.floor(u.createdTimestamp / 1000)}:D>\nJoined: ${m?.joinedTimestamp ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : 'Not a current member'}\nRoles: ${m?.roles.cache.size ?? 0}`,
        ));
      }
      case 'channel': {
        const ch = opt.ch(i, 'channel');
        return void (await say(
          i,
          `#️⃣ <#${ch.id}>\nID: ${ch.id}\nType: ${ch.type}\nCreated: <t:${Math.floor(Number((BigInt(ch.id) >> 22n) + 1420070400000n) / 1000)}:D>`,
        ));
      }
      case 'role': {
        const r = opt.r(i, 'role');
        return void (await say(
          i,
          `🎭 **${esc(r.name)}**\nID: ${r.id}\nMembers cached: ${'members' in r ? r.members.size : 'N/A'}\nMentionable: ${'mentionable' in r ? r.mentionable : false}`,
        ));
      }
      case 'roles':
        return void (await say(
          i,
          `🎭 Roles:\n${g.roles.cache
            .sort((a, b) => b.position - a.position)
            .first(20)
            .map((r) => esc(r.name))
            .join(' • ')}`,
        ));
      case 'channels': {
        const ch = g.channels.cache;
        return void (await say(
          i,
          `📂 Total cached: ${ch.size}\nText: ${ch.filter((x) => x.type === ChannelType.GuildText).size}\nVoice: ${ch.filter((x) => x.type === ChannelType.GuildVoice).size}\nCategories: ${ch.filter((x) => x.type === ChannelType.GuildCategory).size}`,
        ));
      }
      case 'settings': {
        const s = c.db.guild(id);
        return void (await say(
          i,
          `⚙️ **ArchNemesis settings**\nXP: ${s.levelsEnabled ? 'ON' : 'OFF'}\nLevel announcements: ${s.levelChannel ? `<#${s.levelChannel}>` : 'off'}\nMod log: ${s.modLogChannel ? `<#${s.modLogChannel}>` : 'off'}`,
          true,
        ));
      }
      case 'leveling': {
        const enabled = i.options.getBoolean('enabled', true);
        c.db.changeGuild(id, (g) => (g.levelsEnabled = enabled));
        return void (await say(i, `✅ XP rewards ${enabled ? 'enabled' : 'disabled'}.`, true));
      }
      case 'levelchannel': {
        const ch = opt.ch(i, 'channel');
        c.db.changeGuild(id, (g) => (g.levelChannel = ch.id));
        return void (await say(i, `✅ Announcements set to <#${ch.id}>.`, true));
      }
      case 'clearlevelchannel':
        c.db.changeGuild(id, (g) => (g.levelChannel = null));
        return void (await say(i, '✅ Level announcements disabled.', true));
      case 'modlog': {
        const ch = opt.ch(i, 'channel');
        c.db.changeGuild(id, (g) => (g.modLogChannel = ch.id));
        return void (await say(i, `✅ Mod log set to <#${ch.id}>.`, true));
      }
      case 'clearmodlog':
        c.db.changeGuild(id, (g) => (g.modLogChannel = null));
        return void (await say(i, '✅ Mod log disabled.', true));
      case 'emojis':
        return void (await say(
          i,
          `😀 ${g.emojis.cache.size} custom emoji(s): ${
            g.emojis.cache
              .map((e) => esc(e.name ?? 'unnamed'))
              .slice(0, 35)
              .join(', ') || 'None'
          }`,
        ));
      case 'boosts':
        return void (await say(
          i,
          `🚀 **${esc(g.name)}** has ${g.premiumSubscriptionCount ?? 0} boosts (Tier ${g.premiumTier}).`,
        ));
    }
  },
} satisfies Group;
