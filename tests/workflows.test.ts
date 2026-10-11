import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  type ChatInputCommandInteraction,
  type Client,
  PermissionsBitField,
  PermissionFlagsBits as P,
  Collection,
} from 'discord.js';
import { Store } from '../src/database/store.js';
import { Reminders } from '../src/jobs/reminders.js';
import { loadGroups } from '../src/commands/loader.js';
import type { BotContext } from '../src/commands/types.js';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncCommands, commandPayload } from '../src/services/registration.js';
import type { REST } from 'discord.js';
import { handleInteraction } from '../src/services/interactions.js';
const groups = await loadGroups();
const context = (db: Store): BotContext => ({
  db,
  reminders: new Reminders(db),
  commands: groups,
  ownerIds: new Set(['owner']),
  started: Date.now(),
});
function interaction(
  command: string,
  sub: string,
  values: Record<string, unknown> = {},
  user = 'alice',
  guild = 'one',
) {
  const output: string[] = [];
  const i = {
    commandName: command,
    guildId: guild,
    channelId: 'channel',
    user: { id: user, username: user },
    guild: {
      id: guild,
      ownerId: 'owner',
      members: {
        fetch: async () => ({ permissions: new PermissionsBitField(P.Administrator) }),
        fetchMe: async () => ({ permissions: new PermissionsBitField(P.Administrator) }),
      },
    },
    memberPermissions: new PermissionsBitField(P.Administrator),
    appPermissions: new PermissionsBitField(P.Administrator),
    deferred: false,
    replied: false,
    options: {
      getSubcommand: () => sub,
      getString: (n: string) => values[n] ?? null,
      getInteger: (n: string) => values[n] ?? null,
      getBoolean: (n: string) => values[n] ?? null,
      getUser: (n: string) => (values[n] ? { id: values[n], username: values[n] } : null),
    },
    reply: async (o: { content?: string }) => {
      i.replied = true;
      output.push(o.content ?? '');
    },
    editReply: async (o: { content?: string }) => {
      output.push(o.content ?? '');
    },
    deferReply: async () => {
      i.deferred = true;
    },
    isChatInputCommand: () => true,
    isStringSelectMenu: () => false,
    isButton: () => false,
    isModalSubmit: () => false,
    isRepliable: () => true,
  };
  return { i: i as unknown as ChatInputCommandInteraction, output };
}
async function run(
  c: BotContext,
  group: string,
  sub: string,
  options: Record<string, unknown> = {},
  user = 'alice',
  guild = 'one',
) {
  const { i, output } = interaction(group, sub, options, user, guild);
  await groups.get(group)!.run(i, sub, c);
  assert.ok(output.length, `${group}/${sub} must acknowledge`);
  return output.join('\n');
}
test('poll ballots replace, retract, close and remain guild-isolated', async () => {
  const db = new Store(':memory:'),
    c = context(db);
  try {
    await run(c, 'polls', 'create', { question: 'Lunch?', choices: 'Soup|Rice' });
    const id = db.records('one', 'poll')[0].id;
    await run(c, 'polls', 'vote', { id, choice: 1 }, 'bob');
    await run(c, 'polls', 'vote', { id, choice: 2 }, 'bob');
    assert.equal(db.records('one', `ballot:${id}`).length, 1);
    assert.match(await run(c, 'polls', 'results', { id }), /Rice — 1/);
    await run(c, 'polls', 'vote', { id, choice: 1 }, 'eve', 'two');
    assert.equal(db.records('two', `ballot:${id}`).length, 0);
    await run(c, 'polls', 'close', { id });
    assert.match(await run(c, 'polls', 'vote', { id, choice: 1 }, 'carol'), /closed/);
    await run(c, 'polls', 'retract', { id }, 'bob');
    assert.equal(db.records('one', `ballot:${id}`).length, 0);
  } finally {
    db.close();
  }
});
test('giveaways deduplicate entries, prevent early draws and exclude previous winners on reroll', async () => {
  const db = new Store(':memory:'),
    c = context(db);
  try {
    await run(c, 'giveaways', 'create', { prize: 'A badge', minutes: 1 });
    const r = db.records('one', 'giveaway')[0],
      id = r.id;
    await run(c, 'giveaways', 'enter', { id }, 'bob');
    await run(c, 'giveaways', 'enter', { id }, 'bob');
    await run(c, 'giveaways', 'enter', { id }, 'carol');
    assert.equal(db.records('one', `entry:${id}`).length, 2);
    assert.match(await run(c, 'giveaways', 'draw', { id }), /not ended/);
    db.put('one', 'giveaway', id, r.owner, { ...r.data, ends: Date.now() - 1000 });
    await run(c, 'giveaways', 'draw', { id });
    await run(c, 'giveaways', 'reroll', { id });
    const winners = db.get('one', 'giveaway', id)!.data.winners as string[];
    assert.equal(winners.length, 2);
    assert.equal(new Set(winners).size, 2);
  } finally {
    db.close();
  }
});
test('event capacity and private records enforce owner and guild boundaries', async () => {
  const db = new Store(':memory:'),
    c = context(db);
  try {
    await run(c, 'events', 'create', {
      title: 'Meetup',
      utc: new Date(Date.now() + 86400000).toISOString(),
    });
    const id = db.records('one', 'event')[0].id;
    await run(c, 'events', 'capacity', { id, limit: 1 });
    await run(c, 'events', 'rsvp', { id, response: 'going' }, 'bob');
    assert.match(await run(c, 'events', 'rsvp', { id, response: 'going' }, 'carol'), /capacity/);
    await run(c, 'notes', 'add', { title: 'Secret', content: 'private body' });
    const note = db.records('one', 'note')[0].id;
    assert.doesNotMatch(await run(c, 'notes', 'read', { id: note }, 'bob'), /private body/);
    assert.doesNotMatch(await run(c, 'notes', 'list', {}, 'alice', 'two'), /Secret/);
    await run(c, 'tasks', 'add', { text: 'Do work' });
    const task = db.records('one', 'task')[0].id;
    await run(c, 'tasks', 'done', { id: task });
    assert.equal(db.get('one', 'task', task)!.data.done, true);
    await run(c, 'tasks', 'reopen', { id: task });
    assert.equal(db.get('one', 'task', task)!.data.done, false);
  } finally {
    db.close();
  }
});
test('legacy migration is atomic, repeat-safe, persistent and never modifies originals', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arch-migrate-'));
  try {
    const file = join(dir, 'bot.json'),
      json = JSON.stringify({
        guilds: { one: { levelsEnabled: false } },
        users: { 'one:alice': { wallet: 400 } },
      });
    writeFileSync(file, json);
    const db = new Store(join(dir, 'bot.sqlite'));
    assert.equal(db.user('one', 'alice').wallet, 400);
    db.changeUser('one', 'alice', (u) => (u.wallet = 500));
    db.close();
    const reopened = new Store(join(dir, 'bot.sqlite'));
    assert.equal(reopened.user('one', 'alice').wallet, 500);
    assert.equal(reopened.guild('one').levelsEnabled, false);
    assert.equal(readFileSync(file, 'utf8'), json);
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('reminders survive failure, retry without overlap, and remove only after successful delivery', async () => {
  const db = new Store(':memory:'),
    jobs = new Reminders(db);
  let fail = true,
    sent = 0;
  const bot = {
    guilds: {
      cache: new Collection([
        [
          'one',
          {
            channels: {
              fetch: async () => ({
                isTextBased: () => true,
                send: async () => {
                  if (fail) throw new Error('temporary');
                  sent++;
                },
              }),
            },
          },
        ],
      ]),
    },
  } as unknown as Client;
  try {
    jobs.add({
      id: 'r',
      guildId: 'one',
      channelId: 'ch',
      userId: 'alice',
      text: 'hello',
      at: Date.now() - 1,
    });
    await jobs.tick(bot);
    assert.equal(jobs.get('alice', 'one').length, 1);
    assert.equal(db.sql.prepare('SELECT attempts FROM jobs').get()!.attempts, 1);
    db.sql.prepare('UPDATE jobs SET due=0').run();
    fail = false;
    await Promise.all([jobs.tick(bot), jobs.tick(bot)]);
    assert.equal(sent, 1);
    assert.equal(jobs.get('alice', 'one').length, 0);
  } finally {
    await jobs.stop();
    db.close();
  }
});
test('global registration always happens even with an optional development guild', async () => {
  const calls: string[] = [];
  const rest = {
    put: async (route: string) => {
      calls.push(route);
    },
  } as unknown as REST;
  await syncCommands(rest, 'app', groups, 'dev');
  assert.deepEqual(calls, ['/applications/app/commands', '/applications/app/guilds/dev/commands']);
  const payload = commandPayload(groups);
  assert.ok(payload.length <= 100);
  for (const g of payload) {
    assert.ok(g.options!.length <= 25);
    assert.deepEqual(g.contexts, [0]);
  }
});
test('central routing rejects disabled modules and missing caller permission before mutation', async () => {
  const db = new Store(':memory:'),
    c = context(db);
  try {
    db.changeGuild('one', (g) => (g.disabledModules = ['polls']));
    let mock = interaction('polls', 'create', { question: 'x', choices: 'a|b' });
    await handleInteraction(mock.i, c);
    assert.match(mock.output.join(''), /disabled/);
    assert.equal(db.records('one', 'poll').length, 0);
    mock = interaction('setup', 'module', { name: 'polls', enabled: true });
    mock.i.guild!.members.fetch = async () =>
      ({ permissions: new PermissionsBitField(0n) }) as never;
    await handleInteraction(mock.i, c);
    assert.match(mock.output.join(''), /Manage Guild|Manage Server/);
    assert.deepEqual(db.guild('one').disabledModules, ['polls']);
  } finally {
    db.close();
  }
});

test('departed guild reminders cannot starve delivery in active guilds', async () => {
  const db = new Store(':memory:'),
    jobs = new Reminders(db);
  let sent = 0;
  const bot = {
    guilds: {
      cache: new Collection([
        [
          'active',
          {
            channels: {
              fetch: async () => ({
                isTextBased: () => true,
                send: async () => {
                  sent++;
                },
              }),
            },
          },
        ],
      ]),
    },
  } as unknown as Client;
  try {
    for (let n = 0; n < 25; n++)
      jobs.add({
        id: `old-${n}`,
        guildId: 'departed',
        channelId: 'ch',
        userId: 'alice',
        text: 'old',
        at: 1,
      });
    jobs.add({
      id: 'live',
      guildId: 'active',
      channelId: 'ch',
      userId: 'alice',
      text: 'live',
      at: 2,
    });
    await jobs.tick(bot);
    assert.equal(sent, 1);
    assert.equal(jobs.get('alice', 'departed').length, 25);
  } finally {
    await jobs.stop();
    db.close();
  }
});
