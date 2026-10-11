import type { Group } from '../types.js';
import { opt, num, txt } from '../types.js';
import { say, formatInt } from '../../services/format.js';
const list = [
  {
    name: 'search',
    description: 'Make a YouTube Music search link',
    options: [txt('query', 'Artist or track')],
  },
  {
    name: 'spotify',
    description: 'Make a Spotify search link',
    options: [txt('query', 'Artist or track')],
  },
  {
    name: 'beat',
    description: 'Calculate milliseconds between beats',
    options: [num('bpm', 'Beats per minute', 20, 400)],
  },
  {
    name: 'bars',
    description: 'Calculate duration of a musical passage',
    options: [
      num('bpm', 'Beats per minute', 20, 400),
      num('bars', 'Number of 4-beat bars', 1, 10000),
    ],
  },
  {
    name: 'notes',
    description: 'Calculate equal temperament note frequency',
    options: [num('midi', 'MIDI pitch 0–127 (A4=69)', 0, 127)],
  },
  { name: 'tap', description: 'Guide to estimating BPM by tapping' },
  {
    name: 'format',
    description: 'Convert seconds into mm:ss format',
    options: [num('seconds', 'Total seconds', 0, 1000000)],
  },
  { name: 'help', description: 'Music utility help and limitations' },
];
export default {
  name: 'music',
  description: 'Music links, tempo and note tools (not a voice music player)',
  subs: list,
  run: async (i, sub) => {
    switch (sub) {
      case 'search':
        return void (await say(
          i,
          `🎵 https://music.youtube.com/search?q=${encodeURIComponent(opt.s(i, 'query'))}`,
        ));
      case 'spotify':
        return void (await say(
          i,
          `🎧 https://open.spotify.com/search/${encodeURIComponent(opt.s(i, 'query'))}`,
        ));
      case 'beat':
        return void (await say(
          i,
          `🥁 ${opt.int(i, 'bpm')} BPM = **${(60000 / opt.int(i, 'bpm')).toFixed(2)} ms** per beat.`,
        ));
      case 'bars': {
        const t = (4 * 60 * opt.int(i, 'bars')) / opt.int(i, 'bpm');
        return void (await say(
          i,
          `🎼 ${opt.int(i, 'bars')} bars of 4/4 = **${t.toFixed(2)} seconds**.`,
        ));
      }
      case 'notes': {
        const m = opt.int(i, 'midi');
        return void (await say(
          i,
          `🎹 MIDI ${m} = **${(440 * 2 ** ((m - 69) / 12)).toFixed(2)} Hz**.`,
        ));
      }
      case 'tap':
        return void (await say(
          i,
          '🎵 Count beats over 15 seconds and multiply by four to estimate BPM.',
        ));
      case 'format': {
        const s = opt.int(i, 'seconds');
        return void (await say(
          i,
          `⏱️ ${formatInt(s)}s = **${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}**`,
        ));
      }
      case 'help':
        return void (await say(
          i,
          '🎧 Music commands provide search links and tempo utilities. Optional /audio commands play operator-provided Ogg Opus files; they do not download YouTube or Spotify audio.',
        ));
    }
  },
} satisfies Group;
