import { actionGroup } from '../actions.js';
import { txt } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Task ID');
export default actionGroup('tasks', 'Private persistent personal task lists per server', [
  {
    name: 'add',
    description: 'Add a task to your list',
    options: [txt('text')],
    execute: async (i, c) => {
      const key = recordId();
      c.db.put(i.guildId!, 'task', key, i.user.id, {
        text: i.options.getString('text', true),
        done: false,
        priority: 'normal',
        due: null,
      });
      await say(i, `Task added: ${key}`, true);
    },
  },
  {
    name: 'list',
    description: 'Show your open tasks',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'task', i.user.id)
          .filter((r) => !r.data.done)
          .slice(0, 25)
          .map(
            (r) =>
              `${r.id} [${r.data.priority}]: ${esc(String(r.data.text))}${r.data.due ? ` <t:${Math.floor(Number(r.data.due) / 1000)}:R>` : ''}`,
          )
          .join('\n') || 'No open tasks.',
        true,
      );
    },
  },
  {
    name: 'done',
    description: 'Mark a task complete',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      c.db.put(i.guildId!, 'task', r.id, r.owner, { ...r.data, done: true });
      await say(i, 'Task completed.', true);
    },
  },
  {
    name: 'reopen',
    description: 'Reopen a completed task',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      c.db.put(i.guildId!, 'task', r.id, r.owner, { ...r.data, done: false });
      await say(i, 'Task reopened.', true);
    },
  },
  {
    name: 'edit',
    description: 'Edit task text',
    options: [id, txt('text')],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      c.db.put(i.guildId!, 'task', r.id, r.owner, {
        ...r.data,
        text: i.options.getString('text', true),
      });
      await say(i, 'Task updated.', true);
    },
  },
  {
    name: 'priority',
    description: 'Set a task’s priority',
    options: [
      id,
      {
        name: 'priority',
        description: 'Priority',
        type: 'string',
        required: true,
        choices: ['low', 'normal', 'high'],
      },
    ],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      c.db.put(i.guildId!, 'task', r.id, r.owner, {
        ...r.data,
        priority: i.options.getString('priority', true),
      });
      await say(i, 'Priority saved.', true);
    },
  },
  {
    name: 'due',
    description: 'Set a task deadline in UTC',
    options: [id, txt('utc', 'ISO timestamp')],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      const due = Date.parse(i.options.getString('utc', true));
      if (!Number.isFinite(due)) {
        await say(i, 'Invalid timestamp.', true);
        return;
      }
      c.db.put(i.guildId!, 'task', r.id, r.owner, { ...r.data, due });
      await say(
        i,
        'Deadline saved. Tasks do not send reminders; use /utility remind for notifications.',
        true,
      );
    },
  },
  {
    name: 'delete',
    description: 'Delete a task',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'task');
      if (!r) return;
      c.db.delete(i.guildId!, 'task', r.id);
      await say(i, 'Task deleted.', true);
    },
  },
  {
    name: 'completed',
    description: 'Show completed tasks',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'task', i.user.id)
          .filter((r) => r.data.done)
          .slice(0, 25)
          .map((r) => `${r.id}: ${esc(String(r.data.text))}`)
          .join('\n') || 'No completed tasks.',
        true,
      );
    },
  },
]);
