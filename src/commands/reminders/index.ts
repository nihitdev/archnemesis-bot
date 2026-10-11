import { actionGroup } from '../actions.js';
import { txt, num } from '../types.js';
import { say } from '../../services/format.js';
import { recordId } from '../../services/records.js';
const id = txt('id', 'Reminder ID');
export default actionGroup('reminders', 'Inspect and reschedule persistent reminders', [
  {
    name: 'at',
    description: 'Schedule a reminder at a UTC timestamp',
    options: [txt('utc', 'Future ISO timestamp'), txt('message')],
    execute: async (i, c) => {
      const at = Date.parse(i.options.getString('utc', true));
      if (!Number.isFinite(at) || at <= Date.now() || at > Date.now() + 366 * 86400000) {
        await say(i, 'Use a future timestamp within one year.', true);
        return;
      }
      const key = recordId();
      c.reminders.add({
        id: key,
        guildId: i.guildId!,
        channelId: i.channelId,
        userId: i.user.id,
        text: i.options.getString('message', true),
        at,
      });
      await say(i, `Reminder ${key} scheduled for <t:${Math.floor(at / 1000)}:F>.`, true);
    },
  },
  {
    name: 'snooze',
    description: 'Move a reminder forward from now',
    options: [id, num('minutes', 'Minutes from now', 1, 10080)],
    execute: async (i, c) => {
      const result = c.db.sql
        .prepare("UPDATE jobs SET due=? WHERE guild=? AND id=? AND user=? AND status='pending'")
        .run(
          Date.now() + i.options.getInteger('minutes', true) * 60000,
          i.guildId!,
          i.options.getString('id', true),
          i.user.id,
        );
      await say(i, result.changes ? 'Reminder rescheduled.' : 'Pending reminder not found.', true);
    },
  },
  {
    name: 'edit',
    description: 'Change reminder text',
    options: [id, txt('message')],
    execute: async (i, c) => {
      const result = c.db.sql
        .prepare('UPDATE jobs SET text=? WHERE guild=? AND id=? AND user=?')
        .run(
          i.options.getString('message', true),
          i.guildId!,
          i.options.getString('id', true),
          i.user.id,
        );
      await say(i, result.changes ? 'Reminder updated.' : 'Reminder not found.', true);
    },
  },
  {
    name: 'failed',
    description: 'List your reminders that exhausted delivery retries',
    execute: async (i, c) => {
      const rows = c.db.sql
        .prepare(
          "SELECT id,attempts FROM jobs WHERE guild=? AND user=? AND status='failed' LIMIT 30",
        )
        .all(i.guildId!, i.user.id);
      await say(
        i,
        rows.map((r) => `${r.id} — ${r.attempts} failed attempts`).join('\n') ||
          'No failed reminders.',
        true,
      );
    },
  },
  {
    name: 'retry',
    description: 'Retry a failed reminder in this channel',
    options: [id],
    execute: async (i, c) => {
      const result = c.db.sql
        .prepare(
          "UPDATE jobs SET status='pending',attempts=0,due=?,channel=? WHERE guild=? AND id=? AND user=? AND status='failed'",
        )
        .run(
          Date.now() + 15000,
          i.channelId,
          i.guildId!,
          i.options.getString('id', true),
          i.user.id,
        );
      await say(
        i,
        result.changes ? 'Retry scheduled in this channel.' : 'Failed reminder not found.',
        true,
      );
    },
  },
  {
    name: 'move',
    description: 'Move one of your reminders to the current channel',
    options: [id],
    execute: async (i, c) => {
      const result = c.db.sql
        .prepare('UPDATE jobs SET channel=? WHERE guild=? AND id=? AND user=?')
        .run(i.channelId, i.guildId!, i.options.getString('id', true), i.user.id);
      await say(i, result.changes ? 'Reminder moved.' : 'Reminder not found.', true);
    },
  },
]);
