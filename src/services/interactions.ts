import { PermissionFlagsBits as P, type Interaction } from 'discord.js';
import type { BotContext } from '../commands/types.js';
import { authorize, guardCooldown, consumeRateLimit } from '../middleware/guard.js';
import { say } from './format.js';
import { initializeGuild, diagnoseGuild } from './guilds.js';
import { randomUUID } from 'node:crypto';
import { errorMessage } from './errors.js';
import { log } from './logger.js';
export async function handleInteraction(i: Interaction, c: BotContext): Promise<void> {
  try {
    if (i.isRepliable() && !consumeRateLimit(i.guildId ?? 'dm', i.user.id)) {
      await i.reply({ content: 'Too many interactions. Try again in 10 seconds.', flags: 64 });
      return;
    }
    if (i.isStringSelectMenu() && i.customId.startsWith('setup:')) {
      const [, owner, created] = i.customId.split(':');
      if (
        !i.guild ||
        owner !== i.user.id ||
        !i.memberPermissions?.has(P.ManageGuild) ||
        Date.now() - Number(created) > 600000
      ) {
        await i.reply({
          content:
            'This setup session expired or belongs to another administrator. Run /setup wizard.',
          flags: 64,
        });
        return;
      }
      await i.deferUpdate();
      const member = await i.guild.members.fetch(i.user.id);
      if (!member.permissions.has(P.ManageGuild)) {
        await i.editReply({ content: 'Manage Server permission is required.', components: [] });
        return;
      }
      let text: string;
      switch (i.values[0]) {
        case 'permissions':
          text = await diagnoseGuild(i.guild, c.db);
          break;
        case 'role':
          text =
            (await initializeGuild(i.guild, c.db)).join('\n') || 'Optional role setup completed.';
          break;
        case 'xp-on':
        case 'xp-off':
          c.db.changeGuild(i.guild.id, (g) => (g.levelsEnabled = i.values[0] === 'xp-on'));
          text = 'XP setting saved.';
          break;
        default:
          text = 'Unknown setup step.';
      }
      await i.editReply({ content: text, allowedMentions: { parse: [] } });
      return;
    }
    if (i.isModalSubmit() && i.customId === 'suggestion:compose') {
      if (!i.guildId || c.db.guild(i.guildId).disabledModules.includes('suggestions')) {
        await i.reply({ content: 'Suggestions are unavailable here.', flags: 64 });
        return;
      }
      const idea = i.fields.getTextInputValue('idea').trim();
      if (!idea || idea.length > 1600) {
        await i.reply({ content: 'Enter 1–1600 characters.', flags: 64 });
        return;
      }
      c.db.put(i.guildId, 'suggestion', randomUUID().slice(0, 12), i.user.id, {
        idea,
        status: 'open',
        reason: '',
      });
      await i.reply({ content: 'Suggestion submitted.', flags: 64 });
      return;
    }
    if (i.isButton() && i.customId.startsWith('suggestion-vote:')) {
      const [, key, value] = i.customId.split(':');
      const r = i.guildId ? c.db.get(i.guildId, 'suggestion', key) : undefined;
      if (
        !i.guildId ||
        !r ||
        r.data.status !== 'open' ||
        c.db.guild(i.guildId).disabledModules.includes('suggestions')
      ) {
        await i.reply({ content: 'This suggestion is closed or unavailable.', flags: 64 });
        return;
      }
      if (value !== 'yes' && value !== 'no') return;
      c.db.put(i.guildId, `suggestion-vote:${key}`, i.user.id, i.user.id, {
        support: value === 'yes',
      });
      await i.reply({ content: 'Vote saved.', flags: 64 });
      return;
    }
    if (!i.isChatInputCommand()) {
      if (i.isAutocomplete()) {
        if (
          !i.guildId ||
          i.commandName !== 'tags' ||
          c.db.guild(i.guildId).disabledModules.includes('tags')
        ) {
          await i.respond([]);
          return;
        }
        const query = String(i.options.getFocused()).toLowerCase();
        await i.respond(
          c.db
            .records(i.guildId, 'tag')
            .filter((r) => r.id.includes(query))
            .slice(0, 25)
            .map((r) => ({ name: r.id, value: r.id })),
        );
      } else if (i.isMessageComponent() || i.isModalSubmit())
        await i.reply({ content: 'This interaction is no longer available.', flags: 64 });
      return;
    }
    const group = c.commands.get(i.commandName),
      name = i.options.getSubcommand(false),
      sub = group?.subs.find((s) => s.name === name);
    if (!group || !sub) {
      await say(i, 'This command is outdated. Wait for command synchronization.', true);
      return;
    }
    if (!(await guardCooldown(i))) return;
    if (!sub.opensModal) {
      const publicReply =
        ['fun', 'games', 'music', 'images', 'text', 'textplus'].includes(group.name) ||
        (group.name === 'utility' &&
          !['help', 'remind', 'reminders', 'cancelreminder'].includes(sub.name)) ||
        (group.name === 'leveling' && !sub.userPermissions) ||
        (group.name === 'polls' && ['create', 'results', 'list'].includes(sub.name)) ||
        (group.name === 'giveaways' &&
          ['create', 'draw', 'reroll', 'info', 'list'].includes(sub.name)) ||
        (group.name === 'events' && ['create', 'info', 'list'].includes(sub.name)) ||
        (group.name === 'suggestions' && ['submit', 'view', 'list'].includes(sub.name));
      await i.deferReply({ flags: publicReply ? undefined : 64 });
    }
    if (!(await authorize(i, sub, c))) return;
    if (sub.opensModal) {
      await group.run(i, sub.name, c);
      return;
    }
    if (sub.userPermissions)
      c.db.put(i.guildId!, 'audit', randomUUID().slice(0, 12), i.user.id, {
        action: `${group.name}/${sub.name}`,
        status: 'dispatched',
      });
    await group.run(i, sub.name, c);
  } catch (error) {
    log('error', 'interaction_failed', { error });
    if (i.isRepliable())
      try {
        const content = errorMessage(error);
        if (i.deferred || i.replied) await i.editReply({ content, allowedMentions: { parse: [] } });
        else await i.reply({ content, flags: 64, allowedMentions: { parse: [] } });
      } catch {
        /* Expired or disconnected interaction; error already logged. */
      }
  }
}
