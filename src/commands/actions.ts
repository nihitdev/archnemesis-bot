import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotContext, Group, Sub } from './types.js';
export type Action = Sub & {
  execute: (i: ChatInputCommandInteraction, c: BotContext) => Promise<void>;
};
export function actionGroup(
  name: string,
  description: string,
  actions: Action[],
  defaultPermissions?: bigint,
): Group {
  const handlers = new Map(actions.map((a) => [a.name, a.execute]));
  if (handlers.size !== actions.length) throw new Error(`Duplicate actions in ${name}`);
  return {
    name,
    description,
    defaultPermissions,
    subs: actions.map(({ execute: _, ...s }) => s),
    run: async (i, sub, c) => {
      const fn = handlers.get(sub);
      if (!fn) throw new Error(`Unknown action ${name}/${sub}`);
      await fn(i, c);
    },
  };
}
