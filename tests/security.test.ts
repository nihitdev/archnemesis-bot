import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  Collection,
  PermissionFlagsBits as P,
  PermissionsBitField,
  type Guild,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { Store } from '../src/database/store.js';
import { initializeGuild } from '../src/services/guilds.js';
import { checkPermissions, guardHierarchy } from '../src/middleware/guard.js';
import { Reminders } from '../src/jobs/reminders.js';
import { redact } from '../src/services/logger.js';
function guildMock(permission = P.ManageRoles) {
  const roles = new Collection<string, unknown>();
  let created = 0,
    assigned = 0;
  const highest = { comparePositionTo: () => 1, name: 'Integration' };
  const me = {
    id: 'bot',
    permissions: new PermissionsBitField(permission),
    roles: {
      highest,
      cache: new Collection(),
      add: async () => {
        assigned++;
      },
    },
  };
  const guild = {
    id: 'guild',
    channels: { fetch: async () => new Collection(), cache: new Collection() },
    members: { fetchMe: async () => me },
    roles: {
      fetch: async () => roles,
      create: async (data: Record<string, unknown>) => {
        created++;
        assert.equal(data.permissions, 0n);
        assert.equal(data.mentionable, false);
        const role = {
          ...data,
          id: 'role',
          permissions: new PermissionsBitField(0n),
          managed: false,
        };
        roles.set('role', role);
        return role;
      },
    },
  } as unknown as Guild;
  return { guild, me, roles, counts: () => ({ created, assigned }) };
}
test('role setup creates once, reuses saved role and isolates guild settings', async () => {
  const db = new Store(':memory:'),
    m = guildMock();
  try {
    assert.deepEqual(await initializeGuild(m.guild, db), []);
    await initializeGuild(m.guild, db);
    assert.equal(m.counts().created, 1);
    assert.equal(db.guild('guild').setupRoleId, 'role');
    assert.equal(db.guild('other').setupRoleId, null);
  } finally {
    db.close();
  }
});
test('role setup tolerates missing permissions and hierarchy failures', async () => {
  const db = new Store(':memory:');
  try {
    const denied = guildMock(0n);
    assert.match((await initializeGuild(denied.guild, db)).join(' '), /Manage Roles/);
    assert.equal(denied.counts().created, 0);
    const low = guildMock();
    low.me.roles.highest.comparePositionTo = () => 0;
    assert.match((await initializeGuild(low.guild, db)).join(' '), /above/);
    assert.equal(low.counts().assigned, 0);
  } finally {
    db.close();
  }
});
test('customized named setup role is preserved and permission-bearing role is not assigned', async () => {
  const db = new Store(':memory:'),
    m = guildMock();
  try {
    m.roles.set('custom', {
      id: 'custom',
      name: 'ARCHNEMESIS BOT',
      managed: false,
      permissions: new PermissionsBitField(P.Administrator),
    });
    assert.match((await initializeGuild(m.guild, db)).join(' '), /preserved/);
    assert.equal(m.counts().created, 0);
    assert.equal(m.counts().assigned, 0);
  } finally {
    db.close();
  }
});
test('local settings require caller Manage Guild but not bot Manage Guild; channel denial names exact permission', async () => {
  let reply = '';
  const i = {
    user: { id: 'actor' },
    guild: {
      members: {
        fetch: async () => ({ permissions: new PermissionsBitField(P.ManageGuild) }),
        fetchMe: async () => ({ permissions: new PermissionsBitField(0n) }),
      },
    },
    memberPermissions: new PermissionsBitField(P.ManageMessages),
    appPermissions: new PermissionsBitField(0n),
    reply: async (o: { content: string }) => {
      reply = o.content;
    },
  } as unknown as ChatInputCommandInteraction;
  assert.equal(await checkPermissions(i, P.ManageGuild), true);
  assert.equal(await checkPermissions(i, P.ManageMessages, P.ManageMessages, 'channel'), false);
  assert.match(reply, /bot.*Manage Messages/);
});
test('moderation cannot target caller or higher member', async () => {
  let target = 'actor';
  const member = { id: 'actor', roles: { highest: { comparePositionTo: () => 0 } } };
  const i = {
    user: { id: 'actor' },
    guild: {
      ownerId: 'owner',
      members: { fetch: async () => member, fetchMe: async () => ({ ...member, id: 'bot' }) },
    },
    options: { getUser: () => ({ id: target }), getRole: () => null },
    reply: async () => {},
  } as unknown as ChatInputCommandInteraction;
  assert.equal(await guardHierarchy(i), false);
  target = 'higher';
  assert.equal(await guardHierarchy(i), false);
});
test('transactions roll back and user records cannot cross guilds', () => {
  const db = new Store(':memory:');
  try {
    db.changeUser('a', 'u', (u) => (u.wallet = 500));
    assert.equal(db.user('b', 'u').wallet, 100);
    assert.throws(() =>
      db.transaction(() => {
        db.transfer('a', 'u', 'v', 50);
        throw new Error('rollback');
      }),
    );
    assert.equal(db.user('a', 'u').wallet, 500);
    assert.throws(() => db.changeUser('a', 'u', (u) => (u.wallet = -1)));
    assert.equal(db.user('a', 'u').wallet, 500);
    db.put('a', 'note', '1', 'u', { text: 'secret' });
    assert.equal(db.get('b', 'note', '1'), undefined);
  } finally {
    db.close();
  }
});
test('reminder cancellation is scoped to guild and owner', () => {
  const db = new Store(':memory:');
  try {
    const jobs = new Reminders(db);
    jobs.add({
      id: 'job',
      guildId: 'a',
      userId: 'u',
      channelId: 'ch',
      text: 'hello',
      at: Date.now() + 1000,
    });
    assert.equal(jobs.remove('u', 'job', 'b'), false);
    assert.equal(jobs.remove('v', 'job', 'a'), false);
    assert.equal(jobs.remove('u', 'job', 'a'), true);
  } finally {
    db.close();
  }
});
test('authorization strings are redacted', () => {
  assert.equal(redact('Bearer very-secret-value'), '[REDACTED AUTH]');
});

test('a partially failed softban records the remaining ban and gives recovery instructions', async () => {
  const { loadGroups } = await import('../src/commands/loader.js');
  const { Reminders } = await import('../src/jobs/reminders.js');
  const commands = await loadGroups(),
    db = new Store(':memory:');
  let banned = false,
    output = '';
  const member = {
    id: 'actor',
    permissions: new PermissionsBitField(P.BanMembers),
    roles: { highest: { comparePositionTo: () => 1 } },
  };
  const raw = {
    guildId: 'guild',
    user: { id: 'actor', username: 'Staff' },
    guild: {
      id: 'guild',
      ownerId: 'owner',
      members: {
        fetch: async () => member,
        fetchMe: async () => ({ ...member, id: 'bot' }),
        ban: async () => {
          banned = true;
        },
        unban: async () => {
          throw new Error('unban unavailable');
        },
      },
    },
    options: {
      getSubcommand: () => 'softban',
      getUser: () => ({ id: 'target', username: 'Member' }),
      getRole: () => null,
      getString: () => null,
    },
    deferred: false,
    deferReply: async () => {
      raw.deferred = true;
    },
    editReply: async (o: { content: string }) => {
      output = o.content;
    },
  };
  try {
    await commands
      .get('moderation')!
      .run(raw as unknown as ChatInputCommandInteraction, 'softban', {
        db,
        reminders: new Reminders(db),
        commands,
        ownerIds: new Set(),
        started: Date.now(),
      });
    assert.equal(banned, true);
    assert.match(output, /remains banned/);
    assert.match(output, /unban/);
    assert.equal(db.records('guild', 'case')[0].data.action, 'softban-partial');
  } finally {
    db.close();
  }
});
