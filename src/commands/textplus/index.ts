import type { Group } from '../types.js';
import { txt, opt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { rest, extraTransform } from '../text/index.js';
export default {
  name: 'textplus',
  description: 'More text transforms, encoding and counters',
  subs: rest.map(([name, description]) => ({
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
      await say(i, esc(extraTransform(sub, opt.s(i, 'text'), i.options.getInteger('times') ?? 2)));
    } catch (e) {
      await say(i, `❌ ${String(e)}`, true);
    }
  },
} satisfies Group;
