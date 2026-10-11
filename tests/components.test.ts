import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { PermissionFlagsBits as P, PermissionsBitField, type Interaction } from 'discord.js';
import { Store } from '../src/database/store.js';
import { Reminders } from '../src/jobs/reminders.js';
import { loadGroups } from '../src/commands/loader.js';
import { handleInteraction } from '../src/services/interactions.js';
import { consumeRateLimit } from '../src/middleware/guard.js';
import { renderCard } from '../src/services/images.js';
import sharp from 'sharp';
import { libraryTracks, trackPath } from '../src/services/audio.js';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const groups = await loadGroups();
function component(kind: string, customId: string, user = 'component-user') {
  const output: unknown[] = [];
  const i = {
    customId,
    user: { id: user },
    guildId: 'component-guild',
    memberPermissions: new PermissionsBitField(P.ManageGuild),
    guild: {
      id: 'component-guild',
      members: { fetch: async () => ({ permissions: new PermissionsBitField(P.ManageGuild) }) },
    },
    values: ['xp-off'],
    fields: { getTextInputValue: () => 'Community idea' },
    commandName: 'tags',
    options: { getFocused: () => 'wel' },
    isRepliable: () => kind !== 'autocomplete',
    isStringSelectMenu: () => kind === 'select',
    isButton: () => kind === 'button',
    isModalSubmit: () => kind === 'modal',
    isAutocomplete: () => kind === 'autocomplete',
    isChatInputCommand: () => false,
    reply: async (o: unknown) => {
      output.push(o);
    },
    editReply: async (o: unknown) => {
      output.push(o);
    },
    deferUpdate: async () => {},
    respond: async (o: unknown) => {
      output.push(o);
    },
  };
  return { i: i as unknown as Interaction, output };
}
test('buttons, modals and autocomplete perform real scoped operations', async () => {
  const db = new Store(':memory:'),
    c = {
      db,
      reminders: new Reminders(db),
      commands: groups,
      ownerIds: new Set<string>(),
      started: Date.now(),
    };
  try {
    db.put('component-guild', 'suggestion', 'idea', 'owner', { idea: 'Idea', status: 'open' });
    let m = component('button', 'suggestion-vote:idea:yes');
    await handleInteraction(m.i, c);
    assert.equal(
      db.get('component-guild', 'suggestion-vote:idea', 'component-user')!.data.support,
      true,
    );
    m = component('modal', 'suggestion:compose');
    await handleInteraction(m.i, c);
    assert.equal(db.records('component-guild', 'suggestion').length, 2);
    db.put('component-guild', 'tag', 'welcome', 'owner', { content: 'Hi' });
    db.put('other', 'tag', 'welcome-secret', 'owner', { content: 'Secret' });
    m = component('autocomplete', '');
    await handleInteraction(m.i, c);
    assert.deepEqual(m.output[0], [{ name: 'welcome', value: 'welcome' }]);
  } finally {
    db.close();
  }
});
test('setup select menus validate ownership and expiry before saving', async () => {
  const db = new Store(':memory:'),
    c = {
      db,
      reminders: new Reminders(db),
      commands: groups,
      ownerIds: new Set<string>(),
      started: Date.now(),
    };
  try {
    let m = component('select', `setup:someone-else:${Date.now()}`);
    await handleInteraction(m.i, c);
    assert.equal(db.guild('component-guild').levelsEnabled, true);
    m = component('select', 'setup:component-user:0');
    await handleInteraction(m.i, c);
    assert.equal(db.guild('component-guild').levelsEnabled, true);
    m = component('select', `setup:component-user:${Date.now()}`);
    await handleInteraction(m.i, c);
    assert.equal(db.guild('component-guild').levelsEnabled, false);
  } finally {
    db.close();
  }
});
test('burst limits reject spam and expire without crossing guilds', () => {
  for (let n = 0; n < 8; n++) assert.equal(consumeRateLimit('rate-guild', 'rate-user', 1000), true);
  assert.equal(consumeRateLimit('rate-guild', 'rate-user', 1001), false);
  assert.equal(consumeRateLimit('other-guild', 'rate-user', 1001), true);
  assert.equal(consumeRateLimit('rate-guild', 'rate-user', 12000), true);
});
test('meme renderer creates valid PNG pixels and escapes XML input', async () => {
  const image = await renderCard('meme', '<script> & hello', 'Reality');
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 800);
  assert.equal(metadata.height, 800);
});
test('audio library rejects traversal, symlinks and unlisted files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arch-audio-'));
  try {
    writeFileSync(join(dir, 'clip.ogg'), 'test');
    writeFileSync(join(dir, 'secret.txt'), 'private');
    symlinkSync(join(dir, 'secret.txt'), join(dir, 'unsafe.ogg'));
    assert.deepEqual(libraryTracks(dir), ['clip.ogg']);
    assert.equal(trackPath('clip.ogg', dir), join(dir, 'clip.ogg'));
    assert.throws(() => trackPath('../secret.txt', dir));
    assert.throws(() => trackPath('unsafe.ogg', dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
