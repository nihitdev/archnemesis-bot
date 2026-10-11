import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt, usr } from '../types.js';
import { say, esc } from '../../services/format.js';
const id = txt('id', 'Case ID');
export default actionGroup(
  'cases',
  'Persistent moderation case history',
  [
    {
      name: 'view',
      description: 'View a recorded moderation case',
      userPermissions: P.ModerateMembers,
      options: [id],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'case', i.options.getString('id', true));
        await say(i, r ? JSON.stringify(r, null, 2) : 'Case not found.', true);
      },
    },
    {
      name: 'recent',
      description: 'List recent moderation cases',
      userPermissions: P.ModerateMembers,
      execute: async (i, c) => {
        await say(
          i,
          c.db
            .records(i.guildId!, 'case')
            .slice(0, 20)
            .map((r) => `${r.id}: ${esc(String(r.data.summary))}`)
            .join('\n') || 'No cases.',
          true,
        );
      },
    },
    {
      name: 'member',
      description: 'Find cases for a member',
      userPermissions: P.ModerateMembers,
      options: [usr()],
      execute: async (i, c) => {
        const user = i.options.getUser('user', true).id;
        await say(
          i,
          c.db
            .records(i.guildId!, 'case')
            .filter((r) => r.data.target === user)
            .slice(0, 20)
            .map((r) => `${r.id}: ${esc(String(r.data.summary))}`)
            .join('\n') || 'No cases.',
          true,
        );
      },
    },
    {
      name: 'annotate',
      description: 'Append a staff note without altering original case evidence',
      userPermissions: P.ModerateMembers,
      options: [id, txt('note')],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'case', i.options.getString('id', true));
        if (!r) {
          await say(i, 'Case not found.', true);
          return;
        }
        const notes = (r.data.notes ?? []) as unknown[];
        if (notes.length >= 50) {
          await say(i, 'Case annotation limit reached.', true);
          return;
        }
        c.db.put(i.guildId!, 'case', r.id, r.owner, {
          ...r.data,
          notes: [
            ...notes,
            { actor: i.user.id, text: i.options.getString('note', true), at: Date.now() },
          ],
        });
        await say(i, 'Annotation added.', true);
      },
    },
    {
      name: 'resolve',
      description: 'Mark a moderation case reviewed',
      userPermissions: P.ModerateMembers,
      options: [id],
      execute: async (i, c) => {
        const r = c.db.get(i.guildId!, 'case', i.options.getString('id', true));
        if (!r) {
          await say(i, 'Case not found.', true);
          return;
        }
        c.db.put(i.guildId!, 'case', r.id, r.owner, {
          ...r.data,
          resolved: true,
          reviewer: i.user.id,
        });
        await say(i, 'Case marked reviewed.', true);
      },
    },
  ],
  P.ModerateMembers,
);
