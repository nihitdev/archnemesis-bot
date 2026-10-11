import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandSubcommandBuilder,
  ChannelType,
  InteractionContextType,
  ApplicationIntegrationType,
} from 'discord.js';
import type { Store } from '../database/store.js';
import type { Reminders } from '../jobs/reminders.js';

export type BotContext = {
  db: Store;
  reminders: Reminders;
  started: number;
  ownerIds: Set<string>;
  commands: Map<string, Group>;
};
export type Option = {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'user' | 'role' | 'channel';
  required?: boolean;
  min?: number;
  max?: number;
  autocomplete?: boolean;
  choices?: readonly string[];
};
export type Sub = {
  name: string;
  description: string;
  options?: Option[];
  userPermissions?: bigint;
  botPermissions?: bigint;
  scope?: 'guild' | 'channel';
  aliasOf?: string;
  informational?: boolean;
  opensModal?: boolean;
};
export type Group = {
  name: string;
  description: string;
  subs: Sub[];
  defaultPermissions?: bigint;
  run: (i: ChatInputCommandInteraction, sub: string, ctx: BotContext) => Promise<void>;
};
export function generate(group: Group): SlashCommandBuilder {
  const b = new SlashCommandBuilder()
    .setName(group.name)
    .setDescription(group.description)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
  if (group.defaultPermissions !== undefined)
    b.setDefaultMemberPermissions(group.defaultPermissions);
  for (const s of group.subs) {
    b.addSubcommand((c: SlashCommandSubcommandBuilder) => {
      c.setName(s.name).setDescription(s.description);
      for (const o of s.options ?? []) {
        switch (o.type) {
          case 'string':
            c.addStringOption((x) => {
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required);
              if (o.autocomplete) x.setAutocomplete(true);
              if (o.choices) x.addChoices(...o.choices.map((value) => ({ name: value, value })));
              if (o.min !== undefined) x.setMinLength(o.min);
              if (o.max !== undefined) x.setMaxLength(o.max);
              return x;
            });
            break;
          case 'integer':
            c.addIntegerOption((x) => {
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required);
              if (o.min !== undefined) x.setMinValue(o.min);
              if (o.max !== undefined) x.setMaxValue(o.max);
              return x;
            });
            break;
          case 'number':
            c.addNumberOption((x) => {
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required);
              if (o.min !== undefined) x.setMinValue(o.min);
              if (o.max !== undefined) x.setMaxValue(o.max);
              return x;
            });
            break;
          case 'user':
            c.addUserOption((x) =>
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required),
            );
            break;
          case 'role':
            c.addRoleOption((x) =>
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required),
            );
            break;
          case 'boolean':
            c.addBooleanOption((x) =>
              x.setName(o.name).setDescription(o.description).setRequired(!!o.required),
            );
            break;
          case 'channel':
            c.addChannelOption((x) =>
              x
                .setName(o.name)
                .setDescription(o.description)
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(!!o.required),
            );
            break;
        }
      }
      return c;
    });
  }
  return b;
}
export const opt = {
  s: (i: ChatInputCommandInteraction, n: string) => i.options.getString(n, true),
  sn: (i: ChatInputCommandInteraction, n: string) => i.options.getString(n),
  int: (i: ChatInputCommandInteraction, n: string) => i.options.getInteger(n, true),
  intn: (i: ChatInputCommandInteraction, n: string) => i.options.getInteger(n),
  n: (i: ChatInputCommandInteraction, n: string) => i.options.getNumber(n, true),
  u: (i: ChatInputCommandInteraction, n: string) => i.options.getUser(n, true),
  un: (i: ChatInputCommandInteraction, n: string) => i.options.getUser(n),
  r: (i: ChatInputCommandInteraction, n: string) => i.options.getRole(n, true),
  ch: (i: ChatInputCommandInteraction, n: string) => i.options.getChannel(n, true),
};
export const txt = (name = 'text', desc = 'Text to process'): Option => ({
  name,
  description: desc,
  type: 'string',
  required: true,
  max: 1600,
});
export const num = (name: string, desc: string, min = 1, max = 1000000): Option => ({
  name,
  description: desc,
  type: 'integer',
  required: true,
  min,
  max,
});
export const usr = (required = true): Option => ({
  name: 'user',
  description: 'Discord user',
  type: 'user',
  required,
});
