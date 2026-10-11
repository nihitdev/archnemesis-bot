import {
  PermissionFlagsBits as P,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Suggestion ID');
export default actionGroup('suggestions', 'Collect and review community suggestions', [
  {
    name: 'compose',
    description: 'Submit a suggestion through a text form',
    opensModal: true,
    aliasOf: 'suggestions/submit',
    execute: async (i) => {
      await i.showModal(
        new ModalBuilder()
          .setCustomId('suggestion:compose')
          .setTitle('Suggest a server improvement')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('idea')
                .setLabel('Your idea')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1600),
            ),
          ),
      );
    },
  },
  {
    name: 'panel',
    description: 'Post voting buttons for an open suggestion',
    userPermissions: P.ManageGuild,
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'suggestion', i.options.getString('id', true));
      if (!r || r.data.status !== 'open') {
        await say(i, 'Open suggestion not found.', true);
        return;
      }
      const ch = i.channel;
      if (!ch?.isTextBased() || !('send' in ch)) {
        await say(i, 'Use a server text channel.', true);
        return;
      }
      await ch.send({
        content: esc(String(r.data.idea)),
        allowedMentions: { parse: [] },
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`suggestion-vote:${r.id}:yes`)
              .setLabel('Support')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`suggestion-vote:${r.id}:no`)
              .setLabel('Oppose')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
      await say(i, 'Voting panel posted.', true);
    },
  },
  {
    name: 'submit',
    description: 'Submit a server improvement idea',
    options: [txt('idea')],
    execute: async (i, c) => {
      const key = recordId();
      c.db.put(i.guildId!, 'suggestion', key, i.user.id, {
        idea: i.options.getString('idea', true),
        status: 'open',
        reason: '',
      });
      await say(i, `Suggestion ${key} submitted.`);
    },
  },
  {
    name: 'vote',
    description: 'Support or oppose an open suggestion',
    options: [
      id,
      { name: 'support', description: 'Support this suggestion?', type: 'boolean', required: true },
    ],
    execute: async (i, c) => {
      const key = i.options.getString('id', true),
        r = c.db.get(i.guildId!, 'suggestion', key);
      if (!r || r.data.status !== 'open') {
        await say(i, 'Open suggestion not found.', true);
        return;
      }
      c.db.put(i.guildId!, `suggestion-vote:${key}`, i.user.id, i.user.id, {
        support: i.options.getBoolean('support', true),
      });
      await say(i, 'Vote saved.', true);
    },
  },
  {
    name: 'view',
    description: 'Read a suggestion and its vote totals',
    options: [id],
    execute: async (i, c) => {
      const key = i.options.getString('id', true),
        r = c.db.get(i.guildId!, 'suggestion', key),
        votes = c.db.records(i.guildId!, `suggestion-vote:${key}`);
      await say(
        i,
        r
          ? `${esc(String(r.data.idea))}\n${r.data.status} — ${esc(String(r.data.reason))}\nSupport: ${votes.filter((v) => v.data.support).length} • Oppose: ${votes.filter((v) => !v.data.support).length}`
          : 'Suggestion not found.',
      );
    },
  },
  {
    name: 'list',
    description: 'List recent server suggestions',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'suggestion')
          .slice(0, 20)
          .map((r) => `${r.id}: ${esc(String(r.data.idea))} (${r.data.status})`)
          .join('\n') || 'No suggestions.',
      );
    },
  },
  {
    name: 'decide',
    description: 'Accept or decline a suggestion with a public reason',
    userPermissions: P.ManageGuild,
    options: [
      id,
      {
        name: 'status',
        description: 'Decision',
        type: 'string',
        required: true,
        choices: ['accepted', 'declined'],
      },
      txt('reason'),
    ],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'suggestion', i.options.getString('id', true));
      if (!r) {
        await say(i, 'Suggestion not found.', true);
        return;
      }
      c.db.put(i.guildId!, 'suggestion', r.id, r.owner, {
        ...r.data,
        status: i.options.getString('status', true),
        reason: i.options.getString('reason', true),
      });
      await say(i, 'Decision saved.');
    },
  },
  {
    name: 'withdraw',
    description: 'Withdraw your own open suggestion',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'suggestion');
      if (!r) return;
      if (r.data.status !== 'open') {
        await say(i, 'Only open suggestions can be withdrawn.', true);
        return;
      }
      c.db.put(i.guildId!, 'suggestion', r.id, r.owner, { ...r.data, status: 'withdrawn' });
      await say(i, 'Suggestion withdrawn.', true);
    },
  },
]);
