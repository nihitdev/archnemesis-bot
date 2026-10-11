import { PermissionFlagsBits as P } from 'discord.js';
import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
const name = { ...txt('name', 'Tag name'), max: 50, autocomplete: true };
export default actionGroup('tags', 'Reusable server text snippets', [
  {
    name: 'create',
    description: 'Create a unique server tag',
    userPermissions: P.ManageGuild,
    options: [name, txt('content')],
    execute: async (i, c) => {
      const key = i.options.getString('name', true).toLowerCase();
      if (c.db.get(i.guildId!, 'tag', key)) {
        await say(i, 'A tag with that name already exists.', true);
        return;
      }
      c.db.put(i.guildId!, 'tag', key, i.user.id, {
        content: i.options.getString('content', true),
        uses: 0,
      });
      await say(i, `Created tag ${esc(key)}.`, true);
    },
  },
  {
    name: 'show',
    description: 'Post a saved tag',
    options: [name],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'tag', i.options.getString('name', true).toLowerCase());
      if (!r) {
        await say(i, 'Tag not found.', true);
        return;
      }
      c.db.put(i.guildId!, 'tag', r.id, r.owner, { ...r.data, uses: Number(r.data.uses) + 1 });
      await say(i, String(r.data.content));
    },
  },
  {
    name: 'edit',
    description: 'Replace a tag’s content',
    userPermissions: P.ManageGuild,
    options: [name, txt('content')],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'tag', i.options.getString('name', true).toLowerCase());
      if (!r) {
        await say(i, 'Tag not found.', true);
        return;
      }
      c.db.put(i.guildId!, 'tag', r.id, r.owner, {
        ...r.data,
        content: i.options.getString('content', true),
      });
      await say(i, 'Tag updated.', true);
    },
  },
  {
    name: 'delete',
    description: 'Delete a server tag',
    userPermissions: P.ManageGuild,
    options: [name],
    execute: async (i, c) => {
      await say(
        i,
        c.db.delete(i.guildId!, 'tag', i.options.getString('name', true).toLowerCase())
          ? 'Tag deleted.'
          : 'Tag not found.',
        true,
      );
    },
  },
  {
    name: 'list',
    description: 'List server tags',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'tag')
          .slice(0, 50)
          .map((r) => esc(r.id))
          .join(', ') || 'No tags.',
      );
    },
  },
  {
    name: 'search',
    description: 'Find tags by name or content',
    options: [txt('query')],
    execute: async (i, c) => {
      const q = i.options.getString('query', true).toLowerCase();
      await say(
        i,
        c.db
          .records(i.guildId!, 'tag')
          .filter((r) => `${r.id} ${r.data.content}`.toLowerCase().includes(q))
          .slice(0, 20)
          .map((r) => esc(r.id))
          .join(', ') || 'No matching tags.',
      );
    },
  },
  {
    name: 'info',
    description: 'Show tag author, creation time and usage',
    options: [name],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'tag', i.options.getString('name', true).toLowerCase());
      await say(
        i,
        r
          ? `${esc(r.id)} • by <@${r.owner}> • uses: ${r.data.uses}\nCreated <t:${Math.floor(r.created / 1000)}:F>`
          : 'Tag not found.',
      );
    },
  },
  {
    name: 'rename',
    description: 'Rename a tag without losing its usage count',
    userPermissions: P.ManageGuild,
    options: [name, txt('newname')],
    execute: async (i, c) => {
      const key = i.options.getString('name', true).toLowerCase(),
        next = i.options.getString('newname', true).toLowerCase(),
        r = c.db.get(i.guildId!, 'tag', key);
      if (!r || next.length > 50 || c.db.get(i.guildId!, 'tag', next)) {
        await say(i, 'Source missing, new name too long, or destination already exists.', true);
        return;
      }
      c.db.transaction(() => {
        c.db.put(i.guildId!, 'tag', next, r.owner, r.data);
        c.db.delete(i.guildId!, 'tag', key);
      });
      await say(i, 'Tag renamed.', true);
    },
  },
]);
