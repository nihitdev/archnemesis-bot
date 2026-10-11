import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  Collection,
  PermissionsBitField,
  PermissionFlagsBits as P,
  ChannelType,
  REST,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { loadGroups } from '../src/commands/loader.js';
import type { BotContext, Sub } from '../src/commands/types.js';
import { Store } from '../src/database/store.js';
import { Reminders } from '../src/jobs/reminders.js';
const groups = await loadGroups();
const gid = '111111111111111111',
  uid = '222222222222222222',
  targetId = '333333333333333333',
  cid = '444444444444444444',
  rid = '555555555555555555',
  mid = '666666666666666666',
  botId = '777777777777777777';
const all = new PermissionsBitField(P.Administrator);
function fixture(group: string, sub: Sub, db: Store) {
  const outputs: unknown[] = [],
    calls: string[] = [];
  const user = {
    id: uid,
    username: 'Alice',
    bot: false,
    createdTimestamp: 1600000000000,
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatar.png',
    bannerURL: () => 'https://cdn.discordapp.com/banner.png',
  };
  const target = { ...user, id: targetId, username: 'Bob' };
  const highest = { name: 'Highest', position: 10, comparePositionTo: () => 1 };
  const role = {
    id: rid,
    name: 'Cosmetic',
    managed: false,
    position: 1,
    permissions: new PermissionsBitField(0n),
    mentionable: false,
    members: new Collection(),
    setName: async () => {
      calls.push('role-name');
    },
    setColor: async () => {
      calls.push('role-color');
    },
    setHoist: async () => {
      calls.push('role-hoist');
    },
    setMentionable: async () => {
      calls.push('role-mentionable');
    },
    comparePositionTo: () => 1,
  };
  const member = {
    id: targetId,
    user: target,
    permissions: all,
    joinedTimestamp: 1700000000000,
    roles: {
      highest,
      cache: new Collection(),
      add: async () => {
        calls.push('role-add');
      },
      remove: async () => {
        calls.push('role-remove');
      },
    },
    kick: async () => {
      calls.push('kick');
    },
    timeout: async () => {
      calls.push('timeout');
    },
    setNickname: async () => {
      calls.push('nickname');
    },
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatar.png',
  };
  const message = {
    id: mid,
    url: `https://discord.com/channels/${gid}/${cid}/${mid}`,
    react: async (emoji: string) => ({ emoji: { name: emoji, id: null } }),
    edit: async () => {
      calls.push('message-edit');
    },
    delete: async () => {
      calls.push('message-delete');
    },
  };
  const channel = {
    id: cid,
    name: 'general',
    type: ChannelType.GuildText,
    createdTimestamp: 1600000000000,
    isTextBased: () => true,
    permissionsFor: () => all,
    messages: { fetch: async () => message },
    send: async () => {
      calls.push('send');
      return message;
    },
    permissionOverwrites: {
      cache: new Collection(),
      edit: async () => {
        calls.push('overwrite');
      },
    },
    bulkDelete: async () => new Collection([['a', message]]),
    setRateLimitPerUser: async () => {
      calls.push('slowmode');
    },
    setTopic: async () => {
      calls.push('topic');
    },
    setName: async () => {
      calls.push('channel-name');
    },
    setNSFW: async () => {
      calls.push('nsfw');
    },
    setPosition: async () => {
      calls.push('position');
    },
  };
  const channels = new Collection([[cid, channel]]),
    roles = new Collection([[rid, role]]);
  const guild = {
    id: gid,
    name: 'Test server',
    ownerId: '999999999999999999',
    memberCount: 2,
    createdTimestamp: 1500000000000,
    premiumTier: 0,
    premiumSubscriptionCount: 0,
    available: true,
    members: {
      fetch: async (id: string) => ({ ...member, id, user: id === uid ? user : target }),
      fetchMe: async () => ({ ...member, id: botId }),
      ban: async () => {
        calls.push('ban');
      },
      unban: async () => {
        calls.push('unban');
      },
    },
    roles: {
      everyone: { id: gid },
      cache: roles,
      fetch: async (id?: string) => (id ? role : roles),
      create: async () => role,
    },
    channels: {
      cache: channels,
      fetch: async (id?: string) => (id ? channel : channels),
      create: async () => channel,
    },
    emojis: { cache: new Collection() },
    iconURL: () => 'https://cdn.discordapp.com/icon.png',
    bannerURL: () => null,
    splashURL: () => null,
    fetchAuditLogs: async () => ({ entries: new Collection() }),
    autoModerationRules: {
      create: async () => ({ id: 'rule' }),
      fetch: async (id?: string) =>
        id
          ? {
              name: 'Rule',
              triggerType: 1,
              enabled: true,
              exemptRoles: new Collection(),
              exemptChannels: new Collection(),
              triggerMetadata: { keywordFilter: ['word'] },
            }
          : new Collection(),
      edit: async () => {
        calls.push('automod-edit');
      },
      delete: async () => {
        calls.push('automod-delete');
      },
    },
  };
  const values: Record<string, unknown> = {};
  for (const o of sub.options ?? []) {
    if (o.type === 'string') values[o.name] = o.choices?.[0] ?? 'sample';
    else if (o.type === 'integer' || o.type === 'number') values[o.name] = Math.max(o.min ?? 1, 1);
    else if (o.type === 'boolean') values[o.name] = true;
    else if (o.type === 'user') values[o.name] = target;
    else if (o.type === 'role') values[o.name] = role;
    else values[o.name] = channel;
  }
  Object.assign(values, {
    id: 'record',
    utc: new Date(Date.now() + 86400000).toISOString(),
    choices: 'First|Second',
    choice: 1,
    minutes: 1,
    limit: 3,
    query: 'sample',
    expression: '2+2',
    hex: '5865f2',
    userid: targetId,
    emoji: '⭐',
    link: `https://discord.com/channels/${gid}/${cid}/${mid}`,
    url: 'https://example.com',
    confirm: gid,
  });
  if (group === 'textplus')
    values.text =
      (
        {
          unbase64: 'SGVsbG8=',
          unmorse: '... --- ...',
          unhex: '4869',
          urldecode: 'hello%20world',
        } as Record<string, string>
      )[sub.name] ?? 'Hello world';
  if (group === 'text') values.text = sub.name === 'unbinary' ? '01001000 01101001' : 'Hello world';
  if (group === 'utility') {
    if (sub.name === 'snowflake') values.id = uid;
    if (sub.name === 'choose') values.options = 'First,Second';
    if (sub.name === 'cancelreminder') values.id = 'reminder';
  }
  if (group === 'fun' && sub.name === 'choose') values.options = 'First,Second';
  if (group === 'setup' && sub.name === 'module') values.name = 'economy';
  if (group === 'tags') values.name = 'sample';
  const i = {
    commandName: group,
    guildId: gid,
    guild,
    channelId: cid,
    channel,
    user,
    memberPermissions: all,
    appPermissions: all,
    deferred: false,
    replied: false,
    client: {
      user: { ...user, id: botId },
      ws: { ping: 10 },
      guilds: { cache: new Collection([[gid, guild]]) },
      users: { fetch: async () => target },
    },
    options: {
      getSubcommand: () => sub.name,
      getString: (n: string) => values[n] ?? null,
      getInteger: (n: string) => values[n] ?? null,
      getNumber: (n: string) => values[n] ?? null,
      getBoolean: (n: string) => values[n] ?? null,
      getUser: (n: string) => values[n] ?? null,
      getRole: (n: string) => values[n] ?? null,
      getChannel: (n: string) => values[n] ?? null,
    },
    reply: async (o: unknown) => {
      i.replied = true;
      outputs.push(o);
    },
    editReply: async (o: unknown) => {
      outputs.push(o);
    },
    followUp: async (o: unknown) => {
      outputs.push(o);
    },
    deferReply: async () => {
      i.deferred = true;
    },
    fetchReply: async () => message,
    showModal: async (o: unknown) => {
      i.replied = true;
      outputs.push(o);
    },
  };
  const ctx: BotContext = {
    db,
    reminders: new Reminders(db),
    commands: groups,
    ownerIds: new Set([uid]),
    started: Date.now(),
  };
  for (const [kind, data] of Object.entries({
    poll: { question: 'Q', choices: ['First', 'Second'], closed: false },
    giveaway: {
      prize: 'Badge',
      ends: 0,
      state: sub.name === 'reroll' ? 'drawn' : 'open',
      winners: [],
    },
    event: { title: 'Meet', at: Date.now() + 86400000, cancelled: false, capacity: 0 },
    note: { title: 'Note', content: 'Body' },
    task: { text: 'Task', done: false, priority: 'normal' },
    bookmark: { url: 'https://example.com', label: 'Link' },
    suggestion: { idea: 'Idea', status: 'open', reason: '' },
    ticket: { subject: 'Help', state: 'closed', channel: cid },
    case: { summary: 'Warning', notes: [] },
  }))
    db.put(gid, kind, 'record', uid, data);
  db.put(gid, 'tag', 'sample', uid, { content: 'Tag body', uses: 0 });
  db.put(gid, 'entry:record', targetId, targetId, {});
  db.put(gid, 'selfrole', rid, uid, {});
  db.put(gid, 'reactionrole', 'record', uid, { role: rid, channel: cid, enabled: true });
  db.put(gid, 'channel-lock', cid, uid, { previous: null });
  for (const kind of ['tickets', 'welcome', 'starboard', 'logging'])
    db.put(gid, 'config', kind, uid, {
      role: rid,
      channel: cid,
      enabled: true,
      threshold: 3,
      template: 'Welcome {user}',
    });
  db.changeUser(gid, uid, (u) => {
    u.wallet = 100000;
    u.bank = 1000;
    u.inventory = ['cat'];
  });
  ctx.reminders.add({
    id: 'reminder',
    guildId: gid,
    userId: uid,
    channelId: cid,
    text: 'Reminder',
    at: Date.now() + 60000,
  });
  return { i: i as unknown as ChatInputCommandInteraction, ctx, outputs, calls };
}
// These are handler/acknowledgement smoke tests. Stateful workflow assertions live in workflows.test.ts.
for (const group of groups.values())
  for (const sub of group.subs) {
    test(`handler dispatch and acknowledgement: /${group.name} ${sub.name}`, async () => {
      const db = new Store(':memory:');
      const f = fixture(group.name, sub, db);
      const original = REST.prototype.put;
      // The operator sync handler must never make an actual Discord request in tests.
      if (group.name === 'developer' && sub.name === 'sync') REST.prototype.put = async () => [];
      try {
        await group.run(f.i, sub.name, f.ctx);
        assert.ok(f.outputs.length, `Missing response: ${group.name}/${sub.name}`);
        const serialized = JSON.stringify(f.outputs);
        assert.doesNotMatch(
          serialized,
          /Unknown operation|Something went wrong|not implemented|TODO/,
        );
      } finally {
        REST.prototype.put = original;
        db.close();
      }
    });
  }
