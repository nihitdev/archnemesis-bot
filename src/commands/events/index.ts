import { actionGroup } from '../actions.js';
import { txt, num } from '../types.js';
import { say, esc } from '../../services/format.js';
import { recordId, owned } from '../../services/records.js';
const id = txt('id', 'Event ID');
export default actionGroup('events', 'Persistent community event planning and RSVP lists', [
  {
    name: 'create',
    description: 'Schedule a community event in UTC',
    options: [txt('title'), txt('utc', 'ISO timestamp, e.g. 2027-01-01T18:00:00Z')],
    execute: async (i, c) => {
      const at = Date.parse(i.options.getString('utc', true));
      if (!Number.isFinite(at) || at <= Date.now()) {
        await say(i, 'Enter a future ISO timestamp with a timezone.', true);
        return;
      }
      const key = recordId();
      c.db.put(i.guildId!, 'event', key, i.user.id, {
        title: i.options.getString('title', true),
        at,
        cancelled: false,
        capacity: 0,
      });
      await say(i, `Event ${key} scheduled for <t:${Math.floor(at / 1000)}:F>.`);
    },
  },
  {
    name: 'rsvp',
    description: 'RSVP going, maybe, or declined',
    options: [
      id,
      {
        name: 'response',
        description: 'Your attendance',
        type: 'string',
        required: true,
        choices: ['going', 'maybe', 'declined'],
      },
    ],
    execute: async (i, c) => {
      const key = i.options.getString('id', true),
        r = c.db.get(i.guildId!, 'event', key),
        response = i.options.getString('response', true);
      if (!r || r.data.cancelled || Number(r.data.at) < Date.now()) {
        await say(i, 'Event is unavailable or has already started.', true);
        return;
      }
      const rows = c.db
        .records(i.guildId!, `rsvp:${key}`)
        .filter((x) => x.data.response === 'going' && x.id !== i.user.id);
      if (
        response === 'going' &&
        Number(r.data.capacity) > 0 &&
        rows.length >= Number(r.data.capacity)
      ) {
        await say(i, 'The event is at capacity.', true);
        return;
      }
      c.db.put(i.guildId!, `rsvp:${key}`, i.user.id, i.user.id, { response });
      await say(i, 'RSVP saved.', true);
    },
  },
  {
    name: 'attendees',
    description: 'List event RSVPs',
    options: [id],
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, `rsvp:${i.options.getString('id', true)}`)
          .slice(0, 30)
          .map((r) => `<@${r.id}>: ${r.data.response}`)
          .join('\n') || 'No RSVPs.',
      );
    },
  },
  {
    name: 'info',
    description: 'Show event schedule and status',
    options: [id],
    execute: async (i, c) => {
      const r = c.db.get(i.guildId!, 'event', i.options.getString('id', true));
      await say(
        i,
        r
          ? `${esc(String(r.data.title))}\n<t:${Math.floor(Number(r.data.at) / 1000)}:F>\n${r.data.cancelled ? 'Cancelled' : 'Scheduled'} • Capacity: ${r.data.capacity || 'unlimited'}`
          : 'Event not found.',
      );
    },
  },
  {
    name: 'list',
    description: 'Show future events',
    execute: async (i, c) => {
      await say(
        i,
        c.db
          .records(i.guildId!, 'event')
          .filter((r) => !r.data.cancelled && Number(r.data.at) > Date.now())
          .slice(0, 20)
          .map(
            (r) =>
              `${r.id}: ${esc(String(r.data.title))} <t:${Math.floor(Number(r.data.at) / 1000)}:R>`,
          )
          .join('\n') || 'No upcoming events.',
      );
    },
  },
  {
    name: 'cancel',
    description: 'Cancel an event you host',
    options: [id],
    execute: async (i, c) => {
      const r = await owned(i, c, 'event', true);
      if (!r) return;
      c.db.put(i.guildId!, 'event', r.id, r.owner, { ...r.data, cancelled: true });
      await say(i, 'Event cancelled.', true);
    },
  },
  {
    name: 'reschedule',
    description: 'Move an event to a future time',
    options: [id, txt('utc', 'Future ISO timestamp')],
    execute: async (i, c) => {
      const r = await owned(i, c, 'event', true);
      if (!r) return;
      const at = Date.parse(i.options.getString('utc', true));
      if (!Number.isFinite(at) || at <= Date.now()) {
        await say(i, 'Enter a future ISO timestamp.', true);
        return;
      }
      c.db.put(i.guildId!, 'event', r.id, r.owner, { ...r.data, at });
      await say(i, 'Event rescheduled. Existing RSVPs were retained.', true);
    },
  },
  {
    name: 'capacity',
    description: 'Set the attendee limit; zero means unlimited',
    options: [id, num('limit', 'Maximum going RSVPs', 0, 10000)],
    execute: async (i, c) => {
      const r = await owned(i, c, 'event', true);
      if (!r) return;
      c.db.put(i.guildId!, 'event', r.id, r.owner, {
        ...r.data,
        capacity: i.options.getInteger('limit', true),
      });
      await say(i, 'Capacity saved. Existing RSVPs remain valid.', true);
    },
  },
  {
    name: 'mine',
    description: 'Show your upcoming RSVPs',
    execute: async (i, c) => {
      const events = c.db
        .records(i.guildId!, 'event')
        .filter(
          (r) => Number(r.data.at) > Date.now() && c.db.get(i.guildId!, `rsvp:${r.id}`, i.user.id),
        );
      await say(
        i,
        events
          .slice(0, 20)
          .map((r) => `${r.id}: ${esc(String(r.data.title))}`)
          .join('\n') || 'No RSVPs.',
        true,
      );
    },
  },
]);
