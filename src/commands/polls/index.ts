import { actionGroup } from '../actions.js';
import { txt, num } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Poll ID');
export default actionGroup('polls', 'Persistent multiple-choice polls and ballots', [
  {
    name: 'create',
    description: 'Create a poll with 2–10 pipe-separated choices',
    options: [txt('question'), txt('choices', 'Separate choices with |')],
    execute: async (i, c) => {
      const choices = i.options
        .getString('choices', true)
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (choices.length < 2 || choices.length > 10 || new Set(choices).size !== choices.length) {
        await say(i, 'Provide 2–10 unique choices separated by |.', true);
        return;
      }
      const key = recordId();
      c.db.put(i.guildId!, 'poll', key, i.user.id, {
        question: i.options.getString('question', true),
        choices,
        closed: false,
      });
      await say(
        i,
        `Poll ${key}: ${esc(i.options.getString('question', true))}\n${choices.map((v, n) => `${n + 1}. ${esc(v)}`).join('\n')}\nVote using /polls vote.`,
      );
    },
  },
  {
    name: 'vote',
    description: 'Cast or replace your ballot',
    options: [id, num('choice', 'Choice number', 1, 10)],
    execute: async (i, c) => {
      const key = i.options.getString('id', true),
        row = c.db.get(i.guildId!, 'poll', key),
        choice = i.options.getInteger('choice', true);
      if (!row || row.data.closed || choice > (row.data.choices as string[]).length) {
        await say(i, 'Poll unavailable, closed, or choice invalid.', true);
        return;
      }
      c.db.put(i.guildId!, `ballot:${key}`, i.user.id, i.user.id, { choice });
      await say(i, 'Your ballot was saved.', true);
    },
  },
  {
    name: 'results',
    description: 'Show vote totals for each choice',
    options: [id],
    execute: async (i, c) => {
      const key = i.options.getString('id', true),
        row = c.db.get(i.guildId!, 'poll', key);
      if (!row) {
        await say(i, 'Poll not found.', true);
        return;
      }
      const ballots = c.db.records(i.guildId!, `ballot:${key}`);
      await say(
        i,
        `${esc(String(row.data.question))} (${row.data.closed ? 'closed' : 'open'})\n${(row.data.choices as string[]).map((v, n) => `${n + 1}. ${esc(v)} — ${ballots.filter((b) => b.data.choice === n + 1).length}`).join('\n')}`,
      );
    },
  },
  {
    name: 'retract',
    description: 'Remove your ballot',
    options: [id],
    execute: async (i, c) => {
      await say(
        i,
        c.db.delete(i.guildId!, `ballot:${i.options.getString('id', true)}`, i.user.id)
          ? 'Ballot removed.'
          : 'You have not voted in that poll.',
        true,
      );
    },
  },
  {
    name: 'close',
    description: 'Close your poll to further votes',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'poll', true);
      if (!r) return;
      c.db.put(i.guildId!, 'poll', r.id, r.owner, { ...r.data, closed: true });
      await say(i, 'Poll closed.', true);
    },
  },
  {
    name: 'reopen',
    description: 'Reopen a closed poll',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'poll', true);
      if (!r) return;
      c.db.put(i.guildId!, 'poll', r.id, r.owner, { ...r.data, closed: false });
      await say(i, 'Poll reopened.', true);
    },
  },
  {
    name: 'list',
    description: 'List recent polls in this server',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'poll')
          .slice(0, 20)
          .map(
            (r) =>
              `${r.id} — ${esc(String(r.data.question))} (${r.data.closed ? 'closed' : 'open'})`,
          )
          .join('\n') || 'No polls.',
      );
    },
  },
  {
    name: 'myvote',
    description: 'Show your private ballot',
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, `ballot:${i.options.getString('id', true)}`, i.user.id);
      await say(i, r ? `Your choice: ${r.data.choice}` : 'You have not voted.', true);
    },
  },
]);
