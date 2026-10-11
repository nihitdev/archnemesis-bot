import {
  ChannelType,
  PermissionFlagsBits as P,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import {
  audioEnabled,
  libraryTracks,
  audioSession,
  connectAudio,
  enqueueTrack,
  disconnectAudio,
} from '../../services/audio.js';
async function voice(i: ChatInputCommandInteraction) {
  if (!audioEnabled()) {
    await say(
      i,
      'Local audio is disabled. The operator may enable ENABLE_AUDIO=true and add Ogg Opus files to the media directory.',
      true,
    );
    return;
  }
  const member = await i.guild!.members.fetch(i.user.id),
    channel = member.voice.channel,
    me = await i.guild!.members.fetchMe();
  if (
    channel?.type !== ChannelType.GuildVoice ||
    !channel.permissionsFor(me).has([P.Connect, P.Speak])
  ) {
    await say(
      i,
      'Join a regular voice channel where the bot has Connect and Speak permissions.',
      true,
    );
    return;
  }
  const session = audioSession(i.guildId!);
  if (session && session.channel !== channel.id) {
    await say(i, 'Join the bot’s voice channel to control playback.', true);
    return;
  }
  return channel;
}
export default actionGroup('audio', 'Optional playback of operator-provided Ogg Opus audio', [
  {
    name: 'library',
    description: 'List locally available Ogg Opus tracks',
    execute: async (i) => {
      await say(
        i,
        libraryTracks().slice(0, 40).map(esc).join('\n') ||
          'No local Ogg Opus tracks are configured.',
        true,
      );
    },
  },
  {
    name: 'play',
    description: 'Queue a local track and join your voice channel',
    options: [txt('track', 'Exact filename from /audio library')],
    execute: async (i) => {
      if (!i.deferred) await i.deferReply();
      const ch = await voice(i);
      if (!ch) return;
      const session = await connectAudio(ch);
      enqueueTrack(session, i.options.getString('track', true));
      await say(i, 'Track queued.');
    },
  },
  {
    name: 'pause',
    description: 'Pause current local playback',
    execute: async (i) => {
      if (!(await voice(i))) return;
      const s = audioSession(i.guildId!);
      await say(i, s?.player.pause() ? 'Playback paused.' : 'Nothing is playing.', true);
    },
  },
  {
    name: 'resume',
    description: 'Resume paused playback',
    execute: async (i) => {
      if (!(await voice(i))) return;
      const s = audioSession(i.guildId!);
      await say(i, s?.player.unpause() ? 'Playback resumed.' : 'Nothing is paused.', true);
    },
  },
  {
    name: 'skip',
    description: 'Skip to the next queued track',
    execute: async (i) => {
      if (!(await voice(i))) return;
      const s = audioSession(i.guildId!);
      await say(i, s?.player.stop() ? 'Skipped current track.' : 'Nothing is playing.', true);
    },
  },
  {
    name: 'stop',
    description: 'Clear the queue and stop playback',
    execute: async (i) => {
      if (!(await voice(i))) return;
      const s = audioSession(i.guildId!);
      if (s) {
        s.queue = [];
        s.player.stop(true);
      }
      await say(i, 'Playback stopped and queue cleared.', true);
    },
  },
  {
    name: 'leave',
    description: 'Stop playback and disconnect from voice',
    execute: async (i) => {
      if (!(await voice(i))) return;
      disconnectAudio(i.guildId!);
      await say(i, 'Disconnected from voice.', true);
    },
  },
  {
    name: 'queue',
    description: 'Show the guild’s pending track queue',
    execute: async (i) => {
      const s = audioSession(i.guildId!);
      await say(
        i,
        s?.queue.map((t, n) => `${n + 1}. ${esc(t)}`).join('\n') || 'Queue is empty.',
        true,
      );
    },
  },
  {
    name: 'now',
    description: 'Show the current track and voice status',
    execute: async (i) => {
      const s = audioSession(i.guildId!);
      await say(
        i,
        s
          ? `Current: ${esc(s.current ?? 'none')}\nStatus: ${s.player.state.status}\n${s.error ?? ''}`
          : 'Not connected to voice.',
        true,
      );
    },
  },
]);
