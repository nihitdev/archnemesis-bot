import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  Collection,
  PermissionsBitField,
  PermissionFlagsBits as P,
  type MessageReaction,
  type User,
} from 'discord.js';
import { Store } from '../src/database/store.js';
import { applyReactionRole } from '../src/services/reactionroles.js';
import { updateStarboard } from '../src/services/community.js';
function communityMock() {
  let adds = 0,
    removes = 0,
    sends = 0,
    edits = 0;
  const role = { id: 'role', managed: false, permissions: new PermissionsBitField(0n) };
  const member = {
    roles: {
      cache: new Collection(),
      add: async () => {
        adds++;
      },
      remove: async () => {
        removes++;
      },
    },
  };
  const post = {
    id: 'post',
    edit: async () => {
      edits++;
    },
    delete: async () => {},
  };
  const target = {
    id: 'target',
    isTextBased: () => true,
    send: async () => {
      sends++;
      return post;
    },
    messages: { fetch: async () => post },
  };
  let publicChannel = true;
  const source = {
    permissionsFor: () => new PermissionsBitField(publicChannel ? P.ViewChannel : 0n),
  };
  const guild = {
    id: 'guild',
    roles: { everyone: { id: 'guild' }, fetch: async () => role },
    members: {
      fetch: async () => member,
      fetchMe: async () => ({
        permissions: new PermissionsBitField(P.ManageRoles),
        roles: { highest: { comparePositionTo: () => 1 } },
      }),
    },
    channels: {
      cache: new Collection(),
      fetch: async (id?: string) => (id ? target : new Collection()),
    },
  };
  const reaction = {
    partial: false,
    emoji: { name: '⭐', id: null },
    count: 3,
    message: {
      id: 'message',
      partial: false,
      guild,
      author: { id: 'author', bot: false },
      channelId: 'source',
      channel: source,
      url: 'https://discord.com/channels/guild/source/message',
    },
  };
  return {
    reaction: reaction as unknown as MessageReaction,
    user: { id: 'user', bot: false } as User,
    role,
    counts: () => ({ adds, removes, sends, edits }),
    privateChannel: () => {
      publicChannel = false;
    },
  };
}
test('reaction-role grants are tracked, removed on opt-out and reject newly privileged roles', async () => {
  const db = new Store(':memory:'),
    m = communityMock();
  try {
    db.put('guild', 'selfrole', 'role', 'admin', {});
    db.put('guild', 'reactionrole', 'message:⭐', 'admin', { role: 'role', enabled: true });
    await applyReactionRole(m.reaction, m.user, db, true);
    assert.equal(m.counts().adds, 1);
    await applyReactionRole(m.reaction, m.user, db, false);
    assert.equal(m.counts().removes, 1);
    m.role.permissions = new PermissionsBitField(P.Administrator);
    await applyReactionRole(m.reaction, m.user, db, true);
    assert.equal(m.counts().adds, 1);
  } finally {
    db.close();
  }
});
test('starboard creates once, updates counts and rejects private sources', async () => {
  const db = new Store(':memory:'),
    m = communityMock();
  try {
    db.put('guild', 'config', 'starboard', 'admin', {
      channel: 'target',
      threshold: 3,
      enabled: true,
    });
    await updateStarboard(m.reaction, m.user, db);
    await updateStarboard(m.reaction, m.user, db);
    assert.equal(m.counts().sends, 1);
    assert.equal(m.counts().edits, 1);
    m.privateChannel();
    db.delete('guild', 'star', 'message');
    await updateStarboard(m.reaction, m.user, db);
    assert.equal(m.counts().sends, 1);
  } finally {
    db.close();
  }
});
