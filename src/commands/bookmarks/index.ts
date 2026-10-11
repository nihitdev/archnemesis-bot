import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Bookmark ID');
export default actionGroup('bookmarks', 'Private links and labels saved per server', [
  {
    name: 'save',
    description: 'Save an HTTPS link with a label',
    options: [txt('url'), txt('label')],
    execute: async (i, c) => {
      let url: URL;
      try {
        url = new URL(i.options.getString('url', true));
      } catch {
        await say(i, 'Enter a valid HTTPS URL.', true);
        return;
      }
      if (url.protocol !== 'https:' || url.username || url.password) {
        await say(i, 'Only HTTPS URLs without embedded credentials are accepted.', true);
        return;
      }
      const key = recordId();
      c.db.put(i.guildId!, 'bookmark', key, i.user.id, {
        url: url.href,
        label: i.options.getString('label', true),
      });
      await say(i, `Bookmark saved: ${key}`, true);
    },
  },
  {
    name: 'list',
    description: 'List your saved links',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'bookmark', i.user.id)
          .slice(0, 20)
          .map((r) => `${r.id}: ${esc(String(r.data.label))}`)
          .join('\n') || 'No bookmarks.',
        true,
      );
    },
  },
  {
    name: 'open',
    description: 'Show one of your saved links',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'bookmark');
      if (r) await say(i, `${esc(String(r.data.label))}: <${String(r.data.url)}>`, true);
    },
  },
  {
    name: 'delete',
    description: 'Remove a bookmark',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'bookmark');
      if (!r) return;
      c.db.delete(i.guildId!, 'bookmark', r.id);
      await say(i, 'Bookmark deleted.', true);
    },
  },
  {
    name: 'label',
    description: 'Change a bookmark’s label',
    options: [id, txt('label')],
    execute: async (i, c) => {
      const r = await owned(i, c, 'bookmark');
      if (!r) return;
      c.db.put(i.guildId!, 'bookmark', r.id, r.owner, {
        ...r.data,
        label: i.options.getString('label', true),
      });
      await say(i, 'Label updated.', true);
    },
  },
  {
    name: 'search',
    description: 'Search your saved labels and URLs',
    options: [txt('query')],
    execute: async (i, c) => {
      const q = i.options.getString('query', true).toLowerCase();
      await say(
        i,
        c.db
          .records(i.guildId!, 'bookmark', i.user.id)
          .filter((r) => `${r.data.label} ${r.data.url}`.toLowerCase().includes(q))
          .slice(0, 20)
          .map((r) => `${r.id}: ${esc(String(r.data.label))}`)
          .join('\n') || 'No matches.',
        true,
      );
    },
  },
]);
