import 'dotenv/config';
import { Client, Events, GatewayIntentBits, REST, Partials } from 'discord.js';
import { Store, levelFromXp } from './database/store.js';
import { Reminders } from './jobs/reminders.js';
import { loadGroups } from './commands/loader.js';
import type { BotContext } from './commands/types.js';
import { esc } from './services/format.js';
import { initializeGuild } from './services/guilds.js';
import { handleInteraction } from './services/interactions.js';
import { syncCommands } from './services/registration.js';
import { welcomeMember, updateStarboard } from './services/community.js';
import { applyReactionRole } from './services/reactionroles.js';
import { serverLog } from './services/logging.js';
import { disconnectAudio, stopAllAudio } from './services/audio.js';
import { log } from './services/logger.js';

const token = process.env.DISCORD_TOKEN?.trim();
if (!token) {
  log('error', 'missing_token', { help: 'Run npm run setup' });
  process.exit(1);
}
const devGuild = process.env.DEV_GUILD_ID?.trim();
if (devGuild && !/^\d{17,21}$/.test(devGuild))
  throw new Error('DEV_GUILD_ID must be a Discord snowflake');
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    ...(process.env.ENABLE_AUDIO === 'true' ? [GatewayIntentBits.GuildVoiceStates] : []),
    ...(process.env.ENABLE_MEMBER_EVENTS === 'true' ? [GatewayIntentBits.GuildMembers] : []),
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
  allowedMentions: { parse: [] },
});
const groups = await loadGroups(),
  db = new Store();
const ctx: BotContext = {
  db,
  reminders: new Reminders(db),
  started: Date.now(),
  ownerIds: new Set(
    (process.env.DEV_USER_IDS ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  ),
  commands: groups,
};
let closing = false;
const inFlight = new Set<Promise<unknown>>();
const safely = (event: string, fn: () => Promise<unknown>) => {
  if (closing) return;
  const task = Promise.resolve()
    .then(fn)
    .catch((error) => log('error', event, { error }))
    .finally(() => inFlight.delete(task));
  inFlight.add(task);
};
bot.once(Events.ClientReady, (client) =>
  safely('startup', async () => {
    ctx.reminders.start(client);
    const rest = new REST({ version: '10', retries: 3 }).setToken(token);
    rest.on('rateLimited', (info) =>
      log('warn', 'discord_rate_limit', { retryAfter: info.timeToReset }),
    );
    try {
      await syncCommands(rest, client.user.id, groups, devGuild);
    } catch (error) {
      log('error', 'command_sync_failed', { error });
    }
    for (const guild of client.guilds.cache.values()) {
      const warnings = await initializeGuild(guild, db);
      if (warnings.length)
        log('warn', 'guild_setup', { guild: guild.id, warnings: warnings.join('; ') });
    }
    client.user.setActivity('/setup wizard | /utility help');
    log('info', 'ready', { guilds: client.guilds.cache.size, commandGroups: groups.size });
  }),
);
bot.on(Events.GuildCreate, (guild) =>
  safely('guild_join', async () => {
    await initializeGuild(guild, db);
    log('info', 'guild_joined', { guild: guild.id });
  }),
);
bot.on(Events.GuildDelete, (guild) =>
  safely('guild_leave', async () => {
    disconnectAudio(guild.id);
    db.changeGuild(guild.id, (g) => (g.active = false));
    log('info', 'guild_left', { guild: guild.id });
  }),
);
bot.on(Events.InteractionCreate, (i) => safely('interaction', () => handleInteraction(i, ctx)));
bot.on(Events.MessageCreate, (message) =>
  safely('message', async () => {
    if (!message.guild || message.author.bot || message.webhookId) return;
    const g = message.guild.id,
      u = message.author.id,
      settings = db.guild(g);
    if (!settings.levelsEnabled || settings.disabledModules.includes('leveling')) return;
    const prev = db.user(g, u);
    if (Date.now() - prev.lastXp < 60000) return;
    const before = levelFromXp(prev.xp),
      data = db.changeUser(g, u, (rec) => {
        rec.xp += 15 + Math.floor(Math.random() * 11);
        rec.lastXp = Date.now();
        rec.messages++;
      });
    const after = levelFromXp(data.xp);
    if (after <= before || !settings.levelChannel) return;
    const channel = await message.guild.channels.fetch(settings.levelChannel).catch(() => null);
    if (channel?.isTextBased() && 'send' in channel)
      await channel.send({
        content: `🎉 ${esc(message.author.username)} reached **level ${after}**!`,
        allowedMentions: { parse: [] },
      });
  }),
);
bot.on(Events.GuildMemberAdd, (member) => safely('welcome', () => welcomeMember(member, db)));
bot.on(Events.MessageReactionAdd, (reaction, user) => {
  safely('starboard', () => updateStarboard(reaction, user, db));
  safely('reaction_role', () => applyReactionRole(reaction, user, db, true));
});
bot.on(Events.MessageReactionRemove, (reaction, user) => {
  safely('starboard', () => updateStarboard(reaction, user, db));
  safely('reaction_role', () => applyReactionRole(reaction, user, db, false));
});
bot.on(Events.ChannelCreate, (ch) => {
  if ('guild' in ch)
    safely('channel_log', () =>
      serverLog(ch.guild, db, 'channel-created', `${ch.name} (${ch.id})`),
    );
});
bot.on(Events.ChannelDelete, (ch) => {
  if ('guild' in ch)
    safely('channel_log', () =>
      serverLog(ch.guild, db, 'channel-deleted', `${ch.name} (${ch.id})`),
    );
});
bot.on(Events.GuildRoleCreate, (role) =>
  safely('role_log', () => serverLog(role.guild, db, 'role-created', `${role.name} (${role.id})`)),
);
bot.on(Events.GuildRoleDelete, (role) =>
  safely('role_log', () => serverLog(role.guild, db, 'role-deleted', `${role.name} (${role.id})`)),
);
bot.on(Events.Error, (error) => log('error', 'gateway', { error }));
process.on('unhandledRejection', (error) => log('error', 'unhandled_rejection', { error }));
async function shutdown() {
  if (closing) return;
  closing = true;
  await ctx.reminders.stop();
  await Promise.allSettled([...inFlight]);
  stopAllAudio();
  await bot.destroy();
  db.close();
  log('info', 'shutdown');
}
process.once('SIGINT', () => {
  void shutdown().catch((error) => {
    log('error', 'shutdown', { error });
    process.exitCode = 1;
  });
});
process.once('SIGTERM', () => {
  void shutdown().catch((error) => {
    log('error', 'shutdown', { error });
    process.exitCode = 1;
  });
});
await bot.login(token).catch(async (error) => {
  log('error', 'login_failed', { error });
  await shutdown();
  process.exitCode = 1;
});
