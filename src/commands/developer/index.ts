import type { Group } from '../types.js';
import { say, duration } from '../../services/format.js';
import { requireOwner } from '../../middleware/guard.js';
import { syncCommands } from '../../services/registration.js';
import { REST } from 'discord.js';
const list = [
  { name: 'health', description: 'Bot readiness and uptime' },
  { name: 'stats', description: 'Runtime and local storage stats' },
  { name: 'servers', description: 'Names of servers the bot can see' },
  { name: 'memory', description: 'Runtime Node.js memory usage' },
  { name: 'commands', description: 'Number of registered local commands' },
  { name: 'sync', description: 'Re-register slash commands (developer only)' },
  { name: 'version', description: 'Print runtime environment versions' },
];
export default {
  name: 'developer',
  description: 'Owner-only diagnostics and registration',
  subs: list,
  run: async (i, sub, c) => {
    if (!(await requireOwner(i, c))) return;
    switch (sub) {
      case 'health':
        return void (await say(
          i,
          `✅ Online • Uptime ${duration(Date.now() - c.started)} • Gateway ${i.client.ws.ping} ms`,
          true,
        ));
      case 'stats':
        return void (await say(
          i,
          `🛠️ Servers: ${i.client.guilds.cache.size}\nStored users: ${c.db.userCount()}\nStored guild settings: ${c.db.guildCount()}\nCommands: ${[...c.commands.values()].reduce((n, x) => n + x.subs.length, 0)}`,
          true,
        ));
      case 'servers':
        return void (await say(
          i,
          `🌐 Server names:\n${i.client.guilds.cache
            .map((g) => g.name)
            .slice(0, 35)
            .join('\n')}`,
          true,
        ));
      case 'memory': {
        const m = process.memoryUsage();
        return void (await say(
          i,
          `💾 RSS: ${(m.rss / 1024 / 1024).toFixed(1)} MiB • Heap: ${(m.heapUsed / 1024 / 1024).toFixed(1)} MiB`,
          true,
        ));
      }
      case 'commands':
        return void (await say(
          i,
          `🔧 ${c.commands.size} groups, ${[...c.commands.values()].reduce((n, x) => n + x.subs.length, 0)} subcommands.`,
          true,
        ));
      case 'version':
        return void (await say(
          i,
          `🟢 Node ${process.version} • discord.js 14.x • ArchNemesis Bot 0.1.0`,
          true,
        ));
      case 'sync': {
        if (!i.deferred) await i.deferReply({ flags: 64 });
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
        await syncCommands(rest, i.client.user.id, c.commands, process.env.DEV_GUILD_ID?.trim());
        return void (await say(
          i,
          `✅ Re-registered ${c.commands.size} slash-command groups globally.`,
        ));
      }
    }
  },
} satisfies Group;
