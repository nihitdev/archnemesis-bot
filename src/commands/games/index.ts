import type { Group } from '../types.js';
import { num, opt, txt } from '../types.js';
import { say, pick } from '../../services/format.js';
const words = [
  'typescript',
  'discord',
  'hyprland',
  'quickshell',
  'archnemesis',
  'gaming',
  'starlight',
  'wallpaper',
  'keyboard',
  'nebula',
];
const questions = [
  ['Which planet is known as the Red Planet?', 'Mars'],
  ['What is the capital of Japan?', 'Tokyo'],
  ['What does CPU stand for?', 'Central Processing Unit'],
  ['How many bits are in a byte?', '8'],
  ['What animal is the Linux mascot?', 'Penguin'],
];
const cmds = [
  { name: 'slots', description: 'Spin a slot machine' },
  {
    name: 'highlow',
    description: 'Guess high or low on 1–100',
    options: [
      {
        name: 'guess',
        description: 'High is 51–100',
        type: 'string' as const,
        required: true,
        choices: ['high', 'low'],
      },
    ],
  },
  {
    name: 'guess',
    description: 'Guess a number between 1 and 100',
    options: [num('number', 'Your guess', 1, 100)],
  },
  { name: 'scramble', description: 'Get a scrambled word to solve' },
  { name: 'trivia', description: 'Answer a random trivia question' },
  { name: 'coin', description: 'Toss a coin' },
  { name: 'dice', description: 'Roll a D20' },
  { name: 'lottery', description: 'Generate six random numbers' },
  { name: 'blackjack', description: 'Get a two-card blackjack opening hand' },
  { name: 'memory', description: 'Get a simple memory challenge' },
  {
    name: 'anagram',
    description: 'Sort letters alphabetically',
    options: [txt('word', 'Word to transform')],
  },
  { name: 'reaction', description: 'Get a reaction challenge' },
];
export default {
  name: 'games',
  description: '12 lightweight server games (no gambling or paid currency)',
  subs: cmds,
  run: async (i, sub) => {
    switch (sub) {
      case 'slots': {
        const x = Array.from({ length: 3 }, () => pick(['🍒', '🍋', '⭐', '🍉', '💎']));
        return void (await say(
          i,
          `🎰 | ${x.join(' | ')} |\n**${new Set(x).size === 1 ? 'JACKPOT!' : new Set(x).size === 2 ? 'Two matched!' : 'Try again!'}**`,
        ));
      }
      case 'highlow': {
        const n = 1 + Math.floor(Math.random() * 100);
        return void (await say(
          i,
          `🎲 Rolled ${n}. **${(n > 50 ? 'high' : 'low') === opt.s(i, 'guess') ? 'Won!' : 'Lost!'}**`,
        ));
      }
      case 'guess': {
        const n = 1 + Math.floor(Math.random() * 100);
        return void (await say(
          i,
          `🎯 Number: **${n}**, your guess: **${opt.int(i, 'number')}**, distance: ${Math.abs(n - opt.int(i, 'number'))}`,
        ));
      }
      case 'scramble': {
        const w = pick(words);
        return void (await say(
          i,
          `🔤 Unscramble: **${[...w].sort(() => Math.random() - 0.5).join('')}**\nAnswer: ||${w}||`,
        ));
      }
      case 'trivia': {
        const [q, a] = pick(questions);
        return void (await say(i, `❓ **${q}**\nAnswer: ||${a}||`));
      }
      case 'coin':
        return void (await say(i, `🪙 **${pick(['Heads', 'Tails'])}**`));
      case 'dice':
        return void (await say(i, `🎲 **${Math.floor(Math.random() * 20) + 1}/20**`));
      case 'lottery':
        return void (await say(
          i,
          `🎟️ **${[...new Set(Array.from({ length: 50 }, () => 1 + Math.floor(Math.random() * 49)))]
            .slice(0, 6)
            .sort((a, b) => a - b)
            .join(', ')}**`,
        ));
      case 'blackjack': {
        const a = 1 + Math.floor(Math.random() * 13),
          b = 1 + Math.floor(Math.random() * 13);
        return void (await say(
          i,
          `🃏 Opening hand: **${Math.min(a, 10)} + ${Math.min(b, 10)} = ${Math.min(a, 10) + Math.min(b, 10)}** (practice only)`,
        ));
      }
      case 'memory': {
        const nums = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
        return void (await say(i, `🧠 Memorize this sequence: ||${nums}||`));
      }
      case 'anagram':
        return void (await say(i, `🔤 ${[...opt.s(i, 'word')].sort().join('')}`));
      case 'reaction':
        return void (await say(
          i,
          `⚡ Challenge: type **${pick(['NEBULA', 'WAYLAND', 'TSB', 'KAiRO', 'VOID'])}** in chat as fast as you can!`,
        ));
    }
  },
} satisfies Group;
