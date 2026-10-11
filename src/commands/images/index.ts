import { AttachmentBuilder } from 'discord.js';
import { renderCard } from '../../services/images.js';
import type { Group } from '../types.js';
import { opt, usr } from '../types.js';
import { needGuild, say } from '../../services/format.js';
const list = [
  {
    name: 'meme',
    description: 'Render a two-panel text meme as a PNG',
    options: [
      {
        name: 'top',
        description: 'Top panel text',
        type: 'string' as const,
        required: true,
        max: 120,
      },
      {
        name: 'bottom',
        description: 'Bottom panel text',
        type: 'string' as const,
        required: true,
        max: 120,
      },
    ],
  },
  {
    name: 'quote',
    description: 'Render a quote and attribution as a PNG card',
    options: [
      {
        name: 'text',
        description: 'Quote text',
        type: 'string' as const,
        required: true,
        max: 120,
      },
      {
        name: 'author',
        description: 'Attribution',
        type: 'string' as const,
        required: true,
        max: 50,
      },
    ],
  },
  { name: 'avatar', description: 'Link to a full-size user avatar', options: [usr(false)] },
  { name: 'globalavatar', description: 'Show a global profile avatar', options: [usr(false)] },
  {
    name: 'serveravatar',
    description: 'Server-specific profile avatar if set',
    options: [usr(false)],
  },
  { name: 'banner', description: 'Link to a user banner', options: [usr(false)] },
  { name: 'servericon', description: 'Link to your server icon' },
  { name: 'serverbanner', description: 'Link to your server banner' },
  {
    name: 'emoji',
    description: 'Show custom emoji metadata',
    options: [
      { name: 'emoji', description: 'Custom emoji ID', type: 'string' as const, required: true },
    ],
  },
  { name: 'splash', description: 'Show the server invitation splash image' },
];
export default {
  name: 'images',
  description: 'View profile and server images without external image APIs',
  subs: list,
  run: async (i, sub) => {
    const u = i.options.getUser('user') ?? i.user,
      g = i.guild;
    switch (sub) {
      case 'meme':
      case 'quote': {
        if (!i.deferred) await i.deferReply();
        const data = await renderCard(
          sub,
          opt.s(i, sub === 'meme' ? 'top' : 'text'),
          opt.s(i, sub === 'meme' ? 'bottom' : 'author'),
        );
        await i.editReply({ files: [new AttachmentBuilder(data, { name: `${sub}.png` })] });
        return;
      }
      case 'avatar':
      case 'globalavatar':
        return void (await say(i, `🖼️ ${u.displayAvatarURL({ size: 1024, extension: 'png' })}`));
      case 'serveravatar': {
        needGuild(i);
        const m = await g!.members.fetch(u.id).catch(() => null);
        return void (await say(
          i,
          `🖼️ ${m?.displayAvatarURL({ size: 1024, extension: 'png' }) ?? u.displayAvatarURL({ size: 1024, extension: 'png' })}`,
        ));
      }
      case 'banner': {
        const fetched = await i.client.users.fetch(u.id, { force: true });
        return void (await say(i, fetched.bannerURL({ size: 1024 }) ?? 'No banner set.'));
      }
      case 'servericon':
        needGuild(i);
        return void (await say(i, g!.iconURL({ size: 1024 }) ?? 'No server icon.'));
      case 'serverbanner':
        needGuild(i);
        return void (await say(i, g!.bannerURL({ size: 1024 }) ?? 'No server banner.'));
      case 'splash':
        needGuild(i);
        return void (await say(i, g!.splashURL({ size: 1024 }) ?? 'No invite splash image.'));
      case 'emoji': {
        needGuild(i);
        const x = opt.s(i, 'emoji').match(/\d{17,21}/)?.[0];
        if (!x) return void (await say(i, '❌ Provide the ID of a custom emoji.'));
        const e = g!.emojis.cache.get(x);
        return void (await say(
          i,
          e ? `😀 ${e.name}: ${e.url}` : 'That emoji is not cached in this server.',
        ));
      }
    }
  },
} satisfies Group;
