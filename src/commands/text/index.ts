import type { Group } from '../types.js';
import { txt, opt } from '../types.js';
import { say } from '../../services/format.js';
const names: [string, string][] = [
  ['upper', 'UPPERCASE conversion'],
  ['lower', 'lowercase conversion'],
  ['title', 'Title Case conversion'],
  ['sentence', 'Sentence case conversion'],
  ['reverse', 'Reverse a string'],
  ['flip', 'Reverse every word'],
  ['alternating', 'aLtErNaTiNg CaSe'],
  ['mock', 'mOcKiNg CaSe'],
  ['clap', 'Add 👏 between words'],
  ['space', 'Space out characters'],
  ['dash', 'Join words with dashes'],
  ['underscore', 'Join words with underscores'],
  ['slug', 'Make URL-friendly slug'],
  ['spoiler', 'Wrap text as spoiler'],
  ['quote', 'Format a blockquote'],
  ['code', 'Wrap text as inline code'],
  ['bold', 'Wrap text as Discord bold'],
  ['italic', 'Wrap text as Discord italic'],
  ['strike', 'Discord strikethrough'],
  ['underline', 'Discord underline'],
  ['rot13', 'ROT13 encode or decode'],
  ['binary', 'Turn text into UTF-8 binary'],
  ['unbinary', 'Decode binary bytes into text'],
  ['base64', 'Encode base64'],
  ['unbase64', 'Decode base64'],
  ['morse', 'Morse code encoder'],
  ['unmorse', 'Morse code decoder'],
  ['words', 'Count words'],
  ['characters', 'Count Unicode characters'],
  ['lines', 'Count lines'],
  ['sort', 'Sort lines alphabetically'],
  ['unique', 'Remove duplicate lines'],
  ['shuffle', 'Shuffle words'],
  ['acronym', 'Make an acronym'],
  ['initials', 'Get initials'],
  ['palindrome', 'Check whether text is a palindrome'],
  ['repeat', 'Repeat the text up to 10 times'],
  ['trim', 'Trim extra whitespace'],
  ['swapcase', 'Swap lowercase and uppercase'],
  ['hex', 'UTF-8 text to hexadecimal'],
  ['unhex', 'Decode UTF-8 hexadecimal'],
  ['urlencode', 'Percent-encode text'],
  ['urldecode', 'Decode percent-encoded text'],
];
const alpha: Record<string, string> = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
};
const inverse = Object.fromEntries(Object.entries(alpha).map(([k, v]) => [v, k]));
function transform(k: string, s: string, n: number): string {
  const ws = s.split(/\s+/).filter(Boolean),
    chars = Array.from(s);
  switch (k) {
    case 'upper':
      return s.toUpperCase();
    case 'lower':
      return s.toLowerCase();
    case 'title':
      return s.toLowerCase().replace(/\b\p{L}/gu, (v) => v.toUpperCase());
    case 'sentence':
      return s.toLowerCase().replace(/(^|[.!?]\s+)\p{L}/gu, (v) => v.toUpperCase());
    case 'reverse':
      return chars.reverse().join('');
    case 'flip':
      return ws.map((w) => Array.from(w).reverse().join('')).join(' ');
    case 'alternating':
    case 'mock':
      return chars.map((v, i) => (i % 2 ? v.toUpperCase() : v.toLowerCase())).join('');
    case 'clap':
      return ws.join(' 👏 ');
    case 'space':
      return chars.join(' ');
    case 'dash':
      return ws.join('-');
    case 'underscore':
      return ws.join('_');
    case 'slug':
      return s
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    case 'spoiler':
      return `||${s.replace(/\|\|/g, '| |')}||`;
    case 'quote':
      return s
        .split('\n')
        .map((x) => '> ' + x)
        .join('\n');
    case 'code':
      return '`' + s.replace(/`/g, 'ˋ') + '`';
    case 'bold':
      return `**${s.replace(/\*/g, '')}**`;
    case 'italic':
      return `*${s.replace(/\*/g, '')}*`;
    case 'strike':
      return `~~${s.replace(/~/g, '')}~~`;
    case 'underline':
      return `__${s.replace(/_/g, '')}__`;
    case 'rot13':
      return s.replace(/[a-z]/gi, (x) =>
        String.fromCharCode(x.charCodeAt(0) + (x.toLowerCase() <= 'm' ? 13 : -13)),
      );
    case 'binary':
      return [...Buffer.from(s, 'utf8')].map((x) => x.toString(2).padStart(8, '0')).join(' ');
    case 'unbinary': {
      const bytes = s.trim().split(/\s+/);
      if (bytes.some((x) => !/^[01]{8}$/.test(x)))
        throw Error('Expected space-separated groups of eight 0s/1s.');
      return Buffer.from(bytes.map((x) => parseInt(x, 2))).toString('utf8');
    }
    case 'base64':
      return Buffer.from(s).toString('base64');
    case 'unbase64': {
      if (!/^[a-z0-9+/=\s]+$/i.test(s) || s.replace(/\s/g, '').length % 4 !== 0)
        throw Error('Invalid Base64 text.');
      return Buffer.from(s, 'base64').toString('utf8');
    }
    case 'morse':
      return s
        .toLowerCase()
        .split(' ')
        .map((w) =>
          Array.from(w)
            .map((ch) => alpha[ch] ?? '?')
            .join(' '),
        )
        .join(' / ');
    case 'unmorse':
      return s
        .split(' / ')
        .map((w) =>
          w
            .split(/\s+/)
            .map((ch) => inverse[ch] ?? '?')
            .join(''),
        )
        .join(' ');
    case 'words':
      return `${ws.length} words`;
    case 'characters':
      return `${chars.length} characters`;
    case 'lines':
      return `${s.split(/\r?\n/).length} lines`;
    case 'sort':
      return s
        .split(/\r?\n/)
        .sort((a, b) => a.localeCompare(b))
        .join('\n');
    case 'unique':
      return [...new Set(s.split(/\r?\n/))].join('\n');
    case 'shuffle':
      return ws
        .map((x) => [Math.random(), x] as const)
        .sort((a, b) => a[0] - b[0])
        .map((x) => x[1])
        .join(' ');
    case 'acronym':
      return ws
        .map((w) => Array.from(w)[0] ?? '')
        .join('')
        .toUpperCase();
    case 'initials':
      return ws.map((w) => (Array.from(w)[0] ?? '').toUpperCase()).join('. ');
    case 'palindrome': {
      const v = s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      return v === Array.from(v).reverse().join('') ? '✅ Palindrome' : '❌ Not a palindrome';
    }
    case 'repeat':
      return Array(n).fill(s).join(' ');
    case 'trim':
      return s.trim().replace(/\s+/g, ' ');
    case 'swapcase':
      return chars.map((x) => (x === x.toUpperCase() ? x.toLowerCase() : x.toUpperCase())).join('');
    case 'hex':
      return Buffer.from(s, 'utf8').toString('hex');
    case 'unhex': {
      if (!/^(?:[\da-f]{2})+$/i.test(s))
        throw Error('Expected an even number of hexadecimal digits.');
      return Buffer.from(s, 'hex').toString('utf8');
    }
    case 'urlencode':
      return encodeURIComponent(s);
    case 'urldecode':
      return decodeURIComponent(s);
  }
  throw new Error(`Unknown text operation: ${k}`);
}
export default {
  name: 'text',
  description: '43 useful text and formatting tools',
  // Discord allows only 25 subcommands in a root group; split into /text and /textplus below.
  subs: names.slice(0, 24).map(([name, description]) => ({
    name,
    description,
    options: [
      txt(),
      ...(name === 'repeat'
        ? [
            {
              name: 'times',
              description: 'Repeat count (1-10)',
              type: 'integer' as const,
              required: false,
              min: 1,
              max: 10,
            },
          ]
        : []),
    ],
  })),
  run: async (i, sub) => {
    try {
      await say(
        i,
        transform(sub, opt.s(i, 'text'), i.options.getInteger('times') ?? 2).replace(
          /@/g,
          '@\u200b',
        ),
      );
    } catch (e) {
      await say(i, `❌ ${String(e)}`, true);
    }
  },
} satisfies Group;
export const rest = names.slice(24);
export const extraTransform = transform;
