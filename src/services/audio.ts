import { readdirSync, realpathSync, statSync, existsSync, createReadStream } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  entersState,
  StreamType,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice';
import type { VoiceChannel } from 'discord.js';
import { UserError } from './errors.js';
import { log } from './logger.js';
type Session = {
  connection: VoiceConnection;
  player: AudioPlayer;
  channel: string;
  queue: string[];
  current: string | null;
  error: string | null;
};
const sessions = new Map<string, Session>();
export const audioEnabled = () => process.env.ENABLE_AUDIO === 'true';
export function libraryTracks(root = resolve(process.env.AUDIO_DIRECTORY ?? 'media')): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((f) => f.isFile() && /\.ogg$/i.test(f.name))
    .map((f) => f.name)
    .sort()
    .slice(0, 500);
}
export function trackPath(name: string, root = resolve(process.env.AUDIO_DIRECTORY ?? 'media')) {
  if (name !== basename(name) || !libraryTracks(root).includes(name))
    throw new UserError('Choose an Ogg Opus file listed by /audio library.');
  const canonical = realpathSync(root),
    path = realpathSync(resolve(root, name));
  if (!path.startsWith(canonical + sep) || statSync(path).size > 100 * 1024 * 1024)
    throw new UserError('Track path or size is not allowed (maximum 100 MiB).');
  return path;
}
export function audioSession(guild: string) {
  return sessions.get(guild);
}
export async function connectAudio(channel: VoiceChannel) {
  const existing = sessions.get(channel.guild.id);
  if (existing) {
    if (existing.channel !== channel.id)
      throw new UserError(
        'The bot is playing in another voice channel. Join it to control playback.',
      );
    return existing;
  }
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });
  const player = createAudioPlayer(),
    session: Session = {
      connection,
      player,
      channel: channel.id,
      queue: [],
      current: null,
      error: null,
    };
  sessions.set(channel.guild.id, session);
  connection.subscribe(player);
  player.on(AudioPlayerStatus.Idle, () => nextTrack(session));
  player.on('error', (error) => {
    session.error = 'Audio decoding or playback failed; verify the file contains Ogg Opus audio.';
    log('warn', 'audio_error', { guild: channel.guild.id, error });
    session.queue = [];
    session.current = null;
  });
  connection.on(VoiceConnectionStatus.Disconnected, () => disconnectAudio(channel.guild.id));
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20000);
    return session;
  } catch {
    disconnectAudio(channel.guild.id);
    throw new UserError(
      'Could not connect to voice. Check Connect/Speak permissions, network UDP access and current voice-library compatibility.',
    );
  }
}
function nextTrack(s: Session) {
  const track = s.queue.shift();
  s.current = track ?? null;
  if (!track) return;
  try {
    s.player.play(
      createAudioResource(createReadStream(trackPath(track)), { inputType: StreamType.OggOpus }),
    );
    s.error = null;
  } catch (error) {
    s.error = error instanceof Error ? error.message : 'Playback failed';
    s.current = null;
    s.queue = [];
    log('warn', 'audio_track_error', { error });
  }
}
export function enqueueTrack(s: Session, name: string) {
  trackPath(name);
  if (s.queue.length >= 50) throw new UserError('Queue limit is 50 tracks.');
  s.queue.push(name);
  if (s.player.state.status === AudioPlayerStatus.Idle) nextTrack(s);
}
export function disconnectAudio(guild: string) {
  const s = sessions.get(guild);
  if (!s) return;
  sessions.delete(guild);
  s.queue = [];
  s.player.stop(true);
  if (s.connection.state.status !== VoiceConnectionStatus.Destroyed) s.connection.destroy();
}
export function stopAllAudio() {
  for (const id of sessions.keys()) disconnectAudio(id);
}
