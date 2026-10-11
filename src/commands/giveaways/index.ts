import { randomInt } from 'node:crypto';
import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt, num } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Giveaway ID');
export default actionGroup(
  'giveaways',
  'Server giveaways with persistent entries and random drawing',
  [
    {
      name: 'create',
      description: 'Open a giveaway for an announced prize',
      userPermissions: P.ManageGuild,
      options: [txt('prize'), num('minutes', 'Entry window', 1, 10080)],
      execute: async (i, c) => {
        const key = recordId();
        c.db.put(i.guildId!, 'giveaway', key, i.user.id, {
          prize: i.options.getString('prize', true),
          ends: Date.now() + i.options.getInteger('minutes', true) * 60000,
          state: 'open',
          winners: [],
        });
        await say(
          i,
          `Giveaway ${key}: ${esc(i.options.getString('prize', true))}. Enter with /giveaways enter. The host uses /giveaways draw after entries close.`,
        );
      },
    },
    {
      name: 'enter',
      description: 'Enter an open giveaway once',
      options: [id],
      execute: async (i, c) => {
        const key = i.options.getString('id', true),
          r = c.db.get(i.guildId!, 'giveaway', key);
        if (!r || r.data.state !== 'open' || Number(r.data.ends) <= Date.now()) {
          await say(i, 'Giveaway unavailable or entries closed.', true);
          return;
        }
        c.db.put(i.guildId!, `entry:${key}`, i.user.id, i.user.id, {});
        await say(i, 'Your entry is registered.', true);
      },
    },
    {
      name: 'leave',
      description: 'Withdraw your entry',
      options: [id],
      execute: async (i, c) => {
        await say(
          i,
          c.db.delete(i.guildId!, `entry:${i.options.getString('id', true)}`, i.user.id)
            ? 'Entry withdrawn.'
            : 'Entry not found.',
          true,
        );
      },
    },
    {
      name: 'draw',
      description: 'Draw a random winner after the entry window ends',
      userPermissions: P.ManageGuild,
      options: [id],
      execute: async (i, c) => {
        const r = await owned(i, c, 'giveaway', true);
        if (!r) return;
        if (r.data.state !== 'open' || Number(r.data.ends) > Date.now()) {
          await say(i, 'This giveaway has not ended or was already drawn.', true);
          return;
        }
        const entries = c.db.records(i.guildId!, `entry:${r.id}`);
        if (!entries.length) {
          await say(i, 'No entries yet. Cancel the giveaway or extend its entry window.', true);
          return;
        }
        const winner = entries[randomInt(entries.length)].id;
        c.db.put(i.guildId!, 'giveaway', r.id, r.owner, {
          ...r.data,
          state: 'drawn',
          winners: [winner],
        });
        await say(i, `Winner: <@${winner}> — ${esc(String(r.data.prize))}`);
      },
    },
    {
      name: 'reroll',
      description: 'Draw a different winner from remaining entrants',
      userPermissions: P.ManageGuild,
      options: [id],
      execute: async (i, c) => {
        const r = await owned(i, c, 'giveaway', true);
        if (!r) return;
        const previous = r.data.winners as string[],
          entries = c.db
            .records(i.guildId!, `entry:${r.id}`)
            .filter((e) => !previous.includes(e.id));
        if (r.data.state !== 'drawn' || !entries.length) {
          await say(i, 'No eligible reroll entrants or the giveaway has not been drawn.', true);
          return;
        }
        const winner = entries[randomInt(entries.length)].id;
        c.db.put(i.guildId!, 'giveaway', r.id, r.owner, {
          ...r.data,
          winners: [...previous, winner],
        });
        await say(i, `New winner: <@${winner}>`);
      },
    },
    {
      name: 'cancel',
      description: 'Cancel a giveaway without drawing',
      userPermissions: P.ManageGuild,
      options: [id],
      execute: async (i, c) => {
        const r = await owned(i, c, 'giveaway', true);
        if (!r) return;
        c.db.put(i.guildId!, 'giveaway', r.id, r.owner, { ...r.data, state: 'cancelled' });
        await say(i, 'Giveaway cancelled.', true);
      },
    },
    {
      name: 'extend',
      description: 'Extend an open giveaway entry window',
      userPermissions: P.ManageGuild,
      options: [id, num('minutes', 'Additional minutes', 1, 10080)],
      execute: async (i, c) => {
        const r = await owned(i, c, 'giveaway', true);
        if (!r) return;
        if (r.data.state !== 'open') {
          await say(i, 'Only open giveaways may be extended.', true);
          return;
        }
        c.db.put(i.guildId!, 'giveaway', r.id, r.owner, {
          ...r.data,
          ends:
            Math.max(Date.now(), Number(r.data.ends)) +
            i.options.getInteger('minutes', true) * 60000,
        });
        await say(i, 'Entry window extended.', true);
      },
    },
    {
      name: 'info',
      description: 'Show prize, entry count and winners',
      options: [id],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'giveaway', i.options.getString('id', true));
        await say(
          i,
          r
            ? `${esc(String(r.data.prize))} — ${r.data.state}\nEntries: ${c.db.records(i.guildId!, `entry:${r.id}`).length}\nEnds: <t:${Math.floor(Number(r.data.ends) / 1000)}:F>\nWinners: ${(r.data.winners as string[]).join(', ') || 'none'}`
            : 'Giveaway not found.',
        );
      },
    },
    {
      name: 'list',
      description: 'List recent server giveaways',
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'giveaway')
            .slice(0, 20)
            .map((r) => `${r.id} — ${esc(String(r.data.prize))} (${r.data.state})`)
            .join('\n') || 'No giveaways.',
        );
      },
    },
  ],
);
