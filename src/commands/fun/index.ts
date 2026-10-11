import type { Group } from '../types.js';
import { opt, txt, num, usr } from '../types.js';
import { say, pick, esc } from '../../services/format.js';
const answers = [
  'Absolutely.',
  'Probably.',
  'Signs point to yes.',
  'Ask again later.',
  'Very doubtful.',
  'No chance.',
  'Maybe!',
  'Without a doubt.',
  'Not today.',
  'You already know the answer.',
];
const compliments = [
  'Your creativity is unmatched.',
  'You make the server better.',
  'You have excellent taste.',
  'Your edits deserve more views.',
  'You bring good energy.',
];
const jokes = [
  'Why did the developer go broke? Because they used up all their cache.',
  'There are 10 types of people: those who understand binary and those who don’t.',
  'Why did the computer get cold? It left its Windows open.',
  'I told my GPU a joke. It rendered it poorly.',
];
const facts = [
  'Octopuses have three hearts.',
  'A day on Venus is longer than its year.',
  'Honey can last for thousands of years when properly stored.',
  'A moth was found in a Harvard Mark II relay in 1947 and taped into its logbook.',
  'Sharks existed before trees.',
];
const s = [
  {
    name: 'eightball',
    description: 'Ask the magic eight ball',
    options: [txt('question', 'Your question')],
  },
  { name: 'coinflip', description: 'Flip a virtual coin' },
  {
    name: 'dice',
    description: 'Roll any number of dice (up to 20)',
    options: [
      num('sides', 'Sides per die', 2, 1000),
      { name: 'count', description: 'Dice count', type: 'integer' as const, min: 1, max: 20 },
    ],
  },
  {
    name: 'choose',
    description: 'Choose from comma-separated options',
    options: [txt('options', 'Choice A, Choice B, Choice C')],
  },
  {
    name: 'rps',
    description: 'Play rock-paper-scissors',
    options: [
      {
        name: 'pick',
        description: 'Your move',
        type: 'string' as const,
        required: true,
        choices: ['rock', 'paper', 'scissors'],
      },
    ],
  },
  {
    name: 'rate',
    description: 'Rate any topic out of 10',
    options: [txt('topic', 'What to rate')],
  },
  {
    name: 'ship',
    description: 'Compatibility game for two names',
    options: [txt('one', 'First name'), txt('two', 'Second name')],
  },
  { name: 'joke', description: 'Random programming joke' },
  { name: 'fact', description: 'Random interesting fact' },
  { name: 'compliment', description: 'Give someone a compliment', options: [usr(false)] },
  {
    name: 'number',
    description: 'Guess a number from 1 to 10',
    options: [num('guess', 'Your guess', 1, 10)],
  },
  { name: 'lucky', description: 'Get your lucky number for today' },
  { name: 'fortune', description: 'Get a friendly fortune' },
  { name: 'vibe', description: 'Find your current vibe' },
  { name: 'motivate', description: 'A bit of motivation' },
  { name: 'randomemoji', description: 'A random emoji' },
  { name: 'randomcolor', description: 'A random hex color' },
  {
    name: 'countdown',
    description: 'Count down from a number',
    options: [num('from', 'Starting number', 1, 30)],
  },
  {
    name: 'highlow',
    description: 'Predict a dice roll over or under 50',
    options: [
      {
        name: 'prediction',
        description: 'Your prediction',
        type: 'string' as const,
        required: true,
        choices: ['high', 'low'],
      },
    ],
  },
  { name: 'magicword', description: 'Choose a random magical word' },
  { name: 'rollcall', description: 'Suggest a fun nickname for a user', options: [usr()] },
];
const fortunes = [
  'Something great is coming.',
  'Your next edit is going to be fire.',
  'One small improvement goes a long way.',
  'Today is a good day to build something.',
];
export default {
  name: 'fun',
  description: 'Quick games, randomness and playful commands',
  subs: s,
  run: async (i, sub) => {
    const val = (name: string) => opt.s(i, name);
    switch (sub) {
      case 'eightball':
        return void (await say(i, `🎱 ${esc(val('question'))}\n**${pick(answers)}**`));
      case 'coinflip':
        return void (await say(i, `🪙 ${pick(['Heads', 'Tails'])}`));
      case 'dice': {
        const rolls = Array.from(
          { length: i.options.getInteger('count') ?? 1 },
          () => 1 + Math.floor(Math.random() * opt.int(i, 'sides')),
        );
        return void (await say(
          i,
          `🎲 ${rolls.join(' + ')} = **${rolls.reduce((a, b) => a + b, 0)}**`,
        ));
      }
      case 'choose': {
        const x = val('options')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return void (await say(
          i,
          x.length < 2 ? 'Provide at least two comma-separated options.' : `🎯 **${esc(pick(x))}**`,
        ));
      }
      case 'rps': {
        const player = val('pick'),
          bot = pick(['rock', 'paper', 'scissors']);
        const result =
          player === bot
            ? 'Draw!'
            : { rock: 'scissors', paper: 'rock', scissors: 'paper' }[player] === bot
              ? 'You win!'
              : 'I win!';
        return void (await say(i, `You: ${player} • Me: ${bot}\n**${result}**`));
      }
      case 'rate':
        return void (await say(
          i,
          `⭐ ${esc(val('topic'))}: **${Math.floor(Math.random() * 11)}/10**`,
        ));
      case 'ship': {
        const a = val('one'),
          b = val('two');
        return void (await say(
          i,
          `💜 ${esc(a)} + ${esc(b)}: **${Math.floor(Math.random() * 101)}%**`,
        ));
      }
      case 'joke':
        return void (await say(i, `😂 ${pick(jokes)}`));
      case 'fact':
        return void (await say(i, `🧠 ${pick(facts)}`));
      case 'compliment':
        return void (await say(
          i,
          `💜 ${i.options.getUser('user')?.username ?? 'You'}: ${pick(compliments)}`,
        ));
      case 'number': {
        const n = Math.floor(Math.random() * 10) + 1;
        return void (await say(
          i,
          `🎯 The number was **${n}**. ${opt.int(i, 'guess') === n ? 'Correct!' : 'Try again!'}`,
        ));
      }
      case 'lucky': {
        const num =
          ([...(i.user.id + new Date().toISOString().slice(0, 10))].reduce(
            (a, c) => a + c.charCodeAt(0),
            0,
          ) %
            99) +
          1;
        return void (await say(i, `🍀 Your lucky number today: **${num}**`));
      }
      case 'fortune':
        return void (await say(i, `🔮 ${pick(fortunes)}`));
      case 'vibe':
        return void (await say(
          i,
          `✨ Your vibe is **${pick(['cosmic', 'electric', 'cozy', 'locked in', 'chaotic good', 'unstoppable'])}**`,
        ));
      case 'motivate':
        return void (await say(
          i,
          `🔥 ${pick(['Keep making cool things.', 'Progress beats perfection.', 'A little practice every day adds up.', 'Ship it, learn, repeat.'])}`,
        ));
      case 'randomemoji':
        return void (await say(
          i,
          pick(['🐧', '💜', '🔥', '🗿', '🌌', '⚡', '🎮', '👾', '🎯', '💀']),
        ));
      case 'randomcolor':
        return void (await say(
          i,
          `🎨 #${Math.floor(Math.random() * 16777216)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase()}`,
        ));
      case 'countdown':
        return void (await say(
          i,
          Array.from({ length: opt.int(i, 'from') }, (_, index) =>
            String(opt.int(i, 'from') - index),
          ).join(' ') + ' 🚀',
        ));
      case 'highlow': {
        const n = 1 + Math.floor(Math.random() * 100);
        return void (await say(
          i,
          `🎲 Rolled **${n}**. ${(n > 50 ? 'high' : 'low') === val('prediction') ? 'You win!' : 'Not this time.'}`,
        ));
      }
      case 'magicword':
        return void (await say(
          i,
          `✨ ${pick(['Nebula', 'Hypernova', 'Quantum', 'Aurora', 'Pixel', 'Phantom', 'Void'])}`,
        ));
      case 'rollcall':
        return void (await say(
          i,
          `🏷️ ${opt.u(i, 'user').username}: nickname idea **${pick(['The Legend', 'The Speedrunner', 'The Architect', 'The Cosmic One', 'The Editor'])}**`,
        ));
    }
  },
} satisfies Group;
