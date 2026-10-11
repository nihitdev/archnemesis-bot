import {
  PermissionFlagsBits as P,
  type GuildMember,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
  type PartialUser,
  type Guild,
} from 'discord.js';
import type { Store } from '../database/store.js';
import { esc } from './format.js';
export function welcomeText(template: string, name: string, guild: string) {
  return template.replaceAll('{user}', esc(name)).replaceAll('{server}', esc(guild)).slice(0, 1800);
}
export async function welcomeMember(member: GuildMember, db: Store) {
  const guild = member.guild;
  if (db.guild(guild.id).disabledModules.includes('welcome')) return;
  const cfg = db.get(guild.id, 'config', 'welcome');
  if (!cfg?.data.enabled || !cfg.data.channel) return;
  const channel = await guild.channels.fetch(String(cfg.data.channel)).catch(() => null);
  if (channel?.isTextBased() && 'send' in channel)
    await channel.send({
      content: welcomeText(
        String(cfg.data.template ?? 'Welcome {user} to {server}!'),
        member.user.username,
        guild.name,
      ),
      allowedMentions: { parse: [] },
    });
}
const starUpdates = new Set<string>();
export async function updateStarboard(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  db: Store,
) {
  if (user.bot || reaction.emoji.name !== '⭐') return;
  if (reaction.partial) await reaction.fetch();
  const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
  if (
    !message.guild ||
    message.author?.bot ||
    db.guild(message.guild.id).disabledModules.includes('starboard')
  )
    return;
  const cfg = db.get(message.guild.id, 'config', 'starboard');
  if (!cfg?.data.enabled || message.channelId === cfg.data.channel) return;
  const lock = `${message.guild.id}:${message.id}`;
  if (starUpdates.has(lock)) return;
  starUpdates.add(lock);
  try {
    const guild = message.guild,
      target = await guild.channels.fetch(String(cfg.data.channel)).catch(() => null);
    if (!target?.isTextBased() || !('send' in target) || !('permissionsFor' in message.channel))
      return;
    // Never advertise a message from a private channel to a public starboard.
    if (!message.channel.permissionsFor(guild.roles.everyone)?.has(P.ViewChannel)) return;
    const count = reaction.count ?? 0,
      existing = db.get(guild.id, 'star', message.id);
    if (!existing && count < Number(cfg.data.threshold)) return;
    if (existing) {
      const post = await target.messages.fetch(String(existing.data.post)).catch(() => null);
      if (count < Number(cfg.data.threshold)) {
        if (post) await post.delete();
        db.delete(guild.id, 'star', message.id);
        return;
      }
      if (post)
        await post.edit({
          content: `⭐ ${count} • ${message.url}`,
          allowedMentions: { parse: [] },
        });
      db.put(guild.id, 'star', message.id, message.author!.id, { ...existing.data, count });
    } else {
      const post = await target.send({
        content: `⭐ ${count} • ${message.url}`,
        allowedMentions: { parse: [] },
      });
      db.put(guild.id, 'star', message.id, message.author!.id, {
        post: post.id,
        channel: target.id,
        count,
        url: message.url,
      });
    }
  } finally {
    starUpdates.delete(lock);
  }
}
export async function checkOutputChannel(guild: Guild, id: string) {
  const ch = await guild.channels.fetch(id).catch(() => null),
    me = await guild.members.fetchMe();
  return ch?.isTextBased() &&
    'send' in ch &&
    ch.permissionsFor(me)?.has([P.ViewChannel, P.SendMessages])
    ? ch
    : null;
}
