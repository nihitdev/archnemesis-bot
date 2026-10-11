import { installationUrl } from '../../services/registration.js';
import { randomUUID, createHash } from 'node:crypto';
import type { Group } from '../types.js';
import { num, txt, opt, usr } from '../types.js';
import { say, pick, needGuild, formatInt, duration, esc } from '../../services/format.js';
import { calculate } from '../../services/math.js';
const list = [
  { name: 'help', description: 'List all available command groups' },
  { name: 'ping', description: 'Bot gateway latency' },
  { name: 'uptime', description: 'Bot running time' },
  { name: 'about', description: 'About the ArchNemesis bot' },
  { name: 'invite', description: 'Get a bot invite link' },
  { name: 'user', description: 'Basic Discord account information', options: [usr(false)] },
  { name: 'server', description: 'Basic server information' },
  { name: 'id', description: 'Get a user or your own Discord ID', options: [usr(false)] },
  {
    name: 'snowflake',
    description: 'Decode a Discord snowflake timestamp',
    options: [txt('id', 'Discord snowflake ID')],
  },
  {
    name: 'timestamp',
    description: 'Convert UNIX seconds to Discord timestamp',
    options: [num('seconds', 'Epoch seconds', 0, 2147483647)],
  },
  { name: 'now', description: 'The current UTC time' },
  {
    name: 'choose',
    description: 'Pick from comma-separated options',
    options: [txt('options', 'Comma-separated choices')],
  },
  {
    name: 'random',
    description: 'Generate a random integer',
    options: [
      num('minimum', 'Low boundary', -1000000000, 1000000000),
      num('maximum', 'High boundary', -1000000000, 1000000000),
    ],
  },
  { name: 'uuid', description: 'Generate a UUID version 4' },
  { name: 'hash', description: 'SHA-256 hash of text', options: [txt()] },
  {
    name: 'calc',
    description: 'Safe arithmetic calculator',
    options: [txt('expression', 'Example: 2*(3+5)')],
  },
  {
    name: 'color',
    description: 'Preview RGB values from a hex color',
    options: [txt('hex', 'Hex color e.g. #c4a7e7')],
  },
  {
    name: 'poll',
    description: 'Make a simple yes/no reaction poll',
    options: [txt('question', 'Poll question')],
  },
  {
    name: 'remind',
    description: 'Schedule a reminder in this channel',
    options: [num('minutes', 'Minutes from now', 1, 10080), txt('message', 'Reminder text')],
  },
  { name: 'reminders', description: 'Show your active reminders' },
  {
    name: 'cancelreminder',
    description: 'Cancel one of your reminders',
    options: [txt('id', 'Reminder ID')],
  },
  { name: 'profilelink', description: 'Make a Discord user profile link', options: [usr(false)] },
  {
    name: 'bytes',
    description: 'Convert a number of bytes into IEC units',
    options: [num('amount', 'Number of bytes', 0, 1000000000)],
  },
  { name: 'coin', description: 'Flip a quick virtual coin' },
  {
    name: 'roll',
    description: 'Roll a random number from 1 to N',
    options: [num('sides', 'Number of sides', 2, 1000000)],
  },
];
export default {
  name: 'utility',
  description: 'General info, tools, reminders and help',
  subs: list,
  run: async (i, sub, c) => {
    switch (sub) {
      case 'help':
        return void (await say(
          i,
          `🤖 **ArchNemesis Bot** — ${[...c.commands.values()].reduce((n, x) => n + x.subs.length, 0)} working commands in ${c.commands.size} groups:\n${[...c.commands.values()].map((g) => `**/${g.name}** (${g.subs.length}) — ${g.description}`).join('\n')}\nRun a group command to see its subcommands.`,
          true,
        ));
      case 'ping':
        return void (await say(i, `🏓 Pong! Gateway latency: **${i.client.ws.ping} ms**`));
      case 'uptime':
        return void (await say(i, `⏱️ Uptime: **${duration(Date.now() - c.started)}**`));
      case 'about':
        return void (await say(
          i,
          '🐧 **ArchNemesis Bot** • Modular TypeScript + discord.js • SQLite WAL storage • no Redis/Postgres • self-hosted modular bot.',
        ));
      case 'invite':
        return void (await say(
          i,
          `🔗 Invite: ${installationUrl(i.client.user.id)}\nGive the bot only the permissions needed for commands you use (e.g., Manage Messages or Moderate Members).`,
        ));
      case 'user':
      case 'id':
      case 'profilelink': {
        const u = i.options.getUser('user') ?? i.user;
        if (sub === 'id') return void (await say(i, `🆔 ${u.id}`));
        if (sub === 'profilelink')
          return void (await say(i, `🔗 https://discord.com/users/${u.id}`));
        return void (await say(
          i,
          `👤 **${esc(u.username)}**\nID: ${u.id}\nCreated: <t:${Math.floor(u.createdTimestamp / 1000)}:D>\nBot: ${u.bot ? 'yes' : 'no'}`,
        ));
      }
      case 'server': {
        needGuild(i);
        return void (await say(
          i,
          `🏠 **${esc(i.guild!.name)}** • ${formatInt(i.guild!.memberCount)} members • ID: ${i.guild!.id}`,
        ));
      }
      case 'snowflake': {
        const id = opt.s(i, 'id');
        if (!/^\d{17,21}$/.test(id)) return void (await say(i, '❌ Invalid snowflake ID.', true));
        const epoch = Number((BigInt(id) >> 22n) + 1420070400000n);
        return void (await say(i, `🕒 Created: <t:${Math.floor(epoch / 1000)}:F>`));
      }
      case 'timestamp':
        return void (await say(
          i,
          `🕒 <t:${opt.int(i, 'seconds')}:F> — <t:${opt.int(i, 'seconds')}:R>`,
        ));
      case 'now':
        return void (await say(i, `🕒 Current time: <t:${Math.floor(Date.now() / 1000)}:F>`));
      case 'choose': {
        const xs = opt
          .s(i, 'options')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
        return void (await say(
          i,
          xs.length < 2
            ? '❌ Use at least two comma-separated choices.'
            : `🎯 **${esc(pick(xs))}**`,
        ));
      }
      case 'random': {
        const a = opt.int(i, 'minimum'),
          b = opt.int(i, 'maximum');
        return void (await say(
          i,
          a > b
            ? '❌ Minimum must be <= maximum.'
            : `🎲 **${Math.floor(Math.random() * (b - a + 1)) + a}**`,
        ));
      }
      case 'uuid':
        return void (await say(i, `🆔 \`${randomUUID()}\``));
      case 'hash':
        return void (await say(
          i,
          `🔐 SHA-256: \`${createHash('sha256').update(opt.s(i, 'text')).digest('hex')}\``,
        ));
      case 'calc': {
        try {
          return void (await say(i, `🧮 **${calculate(opt.s(i, 'expression'))}**`));
        } catch (e) {
          return void (await say(i, `❌ ${String(e)}`, true));
        }
      }
      case 'color': {
        const v = opt.s(i, 'hex').replace(/^#/, '');
        if (!/^[0-9a-f]{6}$/i.test(v))
          return void (await say(i, 'Use a 6-character hex color, e.g. #c4a7e7.'));
        const rgb = [0, 2, 4].map((j) => parseInt(v.slice(j, j + 2), 16));
        return void (await say(i, `🎨 **#${v.toUpperCase()}** = RGB(${rgb.join(', ')})`));
      }
      case 'poll': {
        await i.editReply({
          content: `📊 **${esc(opt.s(i, 'question'))}**\n✅ Yes  |  ❌ No`,
          allowedMentions: { parse: [] },
        });
        const msg = await i.fetchReply();
        await msg.react('✅');
        await msg.react('❌');
        return;
      }
      case 'remind': {
        needGuild(i);
        const mins = opt.int(i, 'minutes'),
          id = randomUUID().slice(0, 8);
        c.reminders.add({
          id,
          at: Date.now() + mins * 60000,
          userId: i.user.id,
          guildId: i.guildId!,
          channelId: i.channelId,
          text: opt.s(i, 'message'),
        });
        return void (await say(i, `⏰ Reminder scheduled in ${mins} minutes. ID: \`${id}\``, true));
      }
      case 'reminders': {
        needGuild(i);
        const rows = c.reminders.get(i.user.id, i.guildId!);
        return void (await say(
          i,
          `⏰ **Reminders**\n${rows.map((r) => `\`${r.id}\` • <t:${Math.floor(r.at / 1000)}:R> • ${esc(r.text).slice(0, 75)}`).join('\n') || 'None scheduled.'}`,
          true,
        ));
      }
      case 'cancelreminder':
        return void (await say(
          i,
          c.reminders.remove(i.user.id, opt.s(i, 'id'), needGuild(i))
            ? '✅ Reminder removed.'
            : '❌ Reminder not found.',
          true,
        ));
      case 'bytes': {
        let n = opt.int(i, 'amount'),
          j = 0;
        while (n >= 1024 && j < 4) {
          n /= 1024;
          j++;
        }
        return void (await say(
          i,
          `💾 **${n.toFixed(2)} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][j]}**`,
        ));
      }
      case 'coin':
        return void (await say(i, `🪙 **${pick(['Heads', 'Tails'])}**`));
      case 'roll':
        return void (await say(i, `🎲 **${1 + Math.floor(Math.random() * opt.int(i, 'sides'))}**`));
    }
  },
} satisfies Group;
