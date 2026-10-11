import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Note ID');
export default actionGroup('notes', 'Private server-scoped personal notes', [
  {
    name: 'add',
    description: 'Save a private note',
    options: [txt('title'), txt('content')],
    execute: async (i, c) => {
      const key = recordId();
      c.db.put(i.guildId!, 'note', key, i.user.id, {
        title: i.options.getString('title', true),
        content: i.options.getString('content', true),
      });
      await say(i, `Saved note ${key}.`, true);
    },
  },
  {
    name: 'read',
    description: 'Read one of your private notes',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'note');
      if (r) await say(i, `${esc(String(r.data.title))}\n${String(r.data.content)}`, true);
    },
  },
  {
    name: 'edit',
    description: 'Replace the content of a note',
    options: [id, txt('content')],
    execute: async (i, c) => {
      const r = await owned(i, c, 'note');
      if (!r) return;
      c.db.put(i.guildId!, 'note', r.id, r.owner, {
        ...r.data,
        content: i.options.getString('content', true),
      });
      await say(i, 'Note updated.', true);
    },
  },
  {
    name: 'delete',
    description: 'Delete one of your notes',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'note');
      if (!r) return;
      c.db.delete(i.guildId!, 'note', r.id);
      await say(i, 'Note deleted.', true);
    },
  },
  {
    name: 'list',
    description: 'List your notes in this server',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'note', i.user.id)
          .slice(0, 30)
          .map((r) => `${r.id}: ${esc(String(r.data.title))}`)
          .join('\n') || 'No notes.',
        true,
      );
    },
  },
  {
    name: 'search',
    description: 'Search your notes',
    options: [txt('query')],
    execute: async (i, c) => {
      const q = i.options.getString('query', true).toLowerCase();
      await say(
        i,
        c.db
          .records(i.guildId!, 'note', i.user.id)
          .filter((r) => `${r.data.title} ${r.data.content}`.toLowerCase().includes(q))
          .slice(0, 20)
          .map((r) => `${r.id}: ${esc(String(r.data.title))}`)
          .join('\n') || 'No matching notes.',
        true,
      );
    },
  },
]);
