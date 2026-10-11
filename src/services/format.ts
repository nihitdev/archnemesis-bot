import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

export const formatInt = (v: number) => v.toLocaleString('en-US');
export const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const esc = (s: string) => s.replace(/@/g, '@\u200b').replace(/`/g, 'ˋ');
export const duration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400),
    hours = Math.floor((seconds % 86400) / 3600),
    mins = Math.floor((seconds % 3600) / 60);
  return [days && `${days}d`, hours && `${hours}h`, mins && `${mins}m`, `${seconds % 60}s`]
    .filter(Boolean)
    .join(' ');
};
export async function say(i: ChatInputCommandInteraction, text: string, hidden = false) {
  const content = text.length > 1900 ? text.slice(0, 1890) + '…' : text;
  if (i.deferred) return i.editReply({ content, allowedMentions: { parse: [] } });
  if (i.replied)
    return i.followUp({
      content,
      allowedMentions: { parse: [] },
      flags: hidden ? MessageFlags.Ephemeral : undefined,
    });
  return i.reply({
    content,
    flags: hidden ? MessageFlags.Ephemeral : undefined,
    allowedMentions: { parse: [] },
  });
}
export const needGuild = (i: ChatInputCommandInteraction) => {
  if (!i.guildId || !i.guild) throw new Error('This command only works in a server.');
  return i.guildId;
};
