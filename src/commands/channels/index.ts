import { ChannelType, PermissionFlagsBits as P, type TextChannel } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt, num, type BotContext } from '../types.js';
import { say } from '../../services/format.js';
import type { ChatInputCommandInteraction } from 'discord.js';
const channel = {
  name: 'channel',
  description: 'Server text channel',
  type: 'channel' as const,
  required: true,
};
const perms = {
  userPermissions: P.ManageChannels,
  botPermissions: P.ManageChannels,
  scope: 'channel' as const,
};
async function edit(i: ChatInputCommandInteraction, fn: (ch: TextChannel) => Promise<unknown>) {
  const ch = await i.guild!.channels.fetch(i.options.getChannel('channel', true).id);
  if (ch?.type !== ChannelType.GuildText) {
    await say(i, 'Choose a regular text channel.', true);
    return;
  }
  const actor = await i.guild!.members.fetch(i.user.id),
    me = await i.guild!.members.fetchMe();
  if (
    !ch.permissionsFor(actor)?.has(P.ManageChannels) ||
    !ch.permissionsFor(me)?.has(P.ManageChannels)
  ) {
    await say(i, 'Both you and the bot need Manage Channels in the selected channel.', true);
    return;
  }
  await fn(ch);
  await say(i, 'Channel updated.', true);
}
export default actionGroup(
  'channels',
  'Channel configuration with target-channel permission checks',
  [
    {
      name: 'create',
      description: 'Create a regular text channel',
      userPermissions: P.ManageChannels,
      botPermissions: P.ManageChannels,
      options: [{ ...txt('name'), max: 100 }],
      execute: async (i) => {
        const ch = await i.guild!.channels.create({
          name: i.options.getString('name', true),
          type: ChannelType.GuildText,
        });
        await say(i, `Created <#${ch.id}>.`, true);
      },
    },
    {
      name: 'topic',
      description: 'Set a text channel topic',
      ...perms,
      options: [channel, { ...txt('text'), max: 1024 }],
      execute: async (i) => {
        await edit(i, (ch) => ch.setTopic(i.options.getString('text', true)));
      },
    },
    {
      name: 'cleartopic',
      description: 'Clear a text channel topic',
      ...perms,
      options: [channel],
      execute: async (i) => {
        await edit(i, (ch) => ch.setTopic(null));
      },
    },
    {
      name: 'rename',
      description: 'Rename a text channel',
      ...perms,
      options: [channel, { ...txt('name'), max: 100 }],
      execute: async (i) => {
        await edit(i, (ch) => ch.setName(i.options.getString('name', true)));
      },
    },
    {
      name: 'nsfw',
      description: 'Set a channel age restriction flag',
      ...perms,
      options: [
        channel,
        { name: 'enabled', description: 'Age-restricted?', type: 'boolean', required: true },
      ],
      execute: async (i) => {
        await edit(i, (ch) => ch.setNSFW(i.options.getBoolean('enabled', true)));
      },
    },
    {
      name: 'slowmode',
      description: 'Set slowmode on a selected channel',
      ...perms,
      options: [channel, num('seconds', 'Slowmode seconds', 0, 21600)],
      execute: async (i) => {
        await edit(i, (ch) => ch.setRateLimitPerUser(i.options.getInteger('seconds', true)));
      },
    },
    {
      name: 'position',
      description: 'Move a text channel within its category',
      ...perms,
      options: [channel, num('position', 'Position', 0, 499)],
      execute: async (i) => {
        await edit(i, (ch) => ch.setPosition(i.options.getInteger('position', true)));
      },
    },
    {
      name: 'permissions',
      description: 'Inspect your and the bot’s permissions in a selected channel',
      options: [channel],
      execute: async (i) => {
        const ch = await i.guild!.channels.fetch(i.options.getChannel('channel', true).id),
          me = await i.guild!.members.fetchMe(),
          actor = await i.guild!.members.fetch(i.user.id);
        if (!ch || !ch.permissionsFor(actor)?.has(P.ViewChannel)) {
          await say(i, 'Channel unavailable.', true);
          return;
        }
        await say(
          i,
          `You: ${ch.permissionsFor(actor)?.toArray().join(', ')}\nBot: ${ch.permissionsFor(me)?.toArray().join(', ')}`,
          true,
        );
      },
    },
    {
      name: 'archive',
      description: 'Lock a channel and save the original everyone overwrite',
      ...perms,
      botPermissions: P.ManageRoles,
      options: [channel],
      execute: async (i, c) => {
        await archive(i, c, true);
      },
    },
    {
      name: 'restore',
      description: 'Restore an archived channel’s original everyone overwrite',
      ...perms,
      botPermissions: P.ManageRoles,
      options: [channel],
      execute: async (i, c) => {
        await archive(i, c, false);
      },
    },
  ],
  P.ManageChannels,
);
async function archive(i: ChatInputCommandInteraction, c: BotContext, locked: boolean) {
  const ch = await i.guild!.channels.fetch(i.options.getChannel('channel', true).id);
  if (ch?.type !== ChannelType.GuildText) {
    await say(i, 'Choose a text channel.', true);
    return;
  }
  const actor = await i.guild!.members.fetch(i.user.id),
    me = await i.guild!.members.fetchMe();
  if (!ch.permissionsFor(actor)?.has(P.ManageRoles) || !ch.permissionsFor(me)?.has(P.ManageRoles)) {
    await say(i, 'Both you and the bot need Manage Roles in the selected channel.', true);
    return;
  }
  const r = c.db.get(i.guildId!, 'channel-lock', ch.id);
  if (locked) {
    if (r) {
      await say(i, 'Already archived.', true);
      return;
    }
    const old = ch.permissionOverwrites.cache.get(i.guildId!);
    const previous = old?.deny.has(P.SendMessages)
      ? false
      : old?.allow.has(P.SendMessages)
        ? true
        : null;
    // Persist intended recovery before the network call, so a crash cannot lose the prior overwrite.
    c.db.put(i.guildId!, 'channel-lock', ch.id, i.user.id, { previous });
    await ch.permissionOverwrites.edit(i.guildId!, { SendMessages: false });
  } else {
    if (!r) {
      await say(i, 'No saved archive state.', true);
      return;
    }
    await ch.permissionOverwrites.edit(i.guildId!, {
      SendMessages: r.data.previous as boolean | null,
    });
    c.db.delete(i.guildId!, 'channel-lock', ch.id);
  }
  await say(
    i,
    locked
      ? 'Channel archived. Explicit member/role allows may still permit messages.'
      : 'Original everyone send permission restored.',
    true,
  );
}
