import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { loadGroups } from '../src/commands/loader.js';
import { generate } from '../src/commands/types.js';
import { levelFromXp, xpForLevel, Store } from '../src/database/store.js';
import { calculate } from '../src/services/math.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('valid Discord command names, unique subcommands and under Discord limits', async () => {
  const groups = await loadGroups();
  assert.ok(groups.size >= 10);
  let count = 0;
  for (const g of groups.values()) {
    assert.ok(/^[a-z0-9_-]{1,32}$/.test(g.name));
    assert.ok(g.subs.length <= 25);
    assert.equal(new Set(g.subs.map((s) => s.name)).size, g.subs.length);
    const json = generate(g).toJSON();
    assert.equal(json.name, g.name);
    for (const sub of g.subs) {
      assert.ok((sub.options?.length ?? 0) <= 25);
      assert.ok(/^[a-z0-9_-]{1,32}$/.test(sub.name));
    }
    count += g.subs.length;
  }
  assert.ok(count >= 300, `Expected >=300 registered actions, got ${count}`);
  const distinct = [...groups.values()]
    .flatMap((g) => g.subs)
    .filter((s) => !s.aliasOf && !s.informational);
  assert.ok(distinct.length >= 300, `Only ${distinct.length} distinct non-informational actions`);
});
test('XP progression is monotonic', () => {
  for (let i = 0; i < 100; i++) assert.equal(levelFromXp(xpForLevel(i)), i);
});
test('calculator parses safe arithmetic, rejects garbage', () => {
  assert.equal(calculate('2*(3+5)'), 16);
  assert.equal(calculate('2^3^2'), 512);
  assert.equal(calculate('-5+3'), -2);
  assert.throws(() => calculate('process.exit(0)'));
  assert.throws(() => calculate('5/0'));
});
test('local store persists updates and virtual coin transfers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'archnemesis-test-'));
  try {
    const path = join(dir, 'db.json'),
      db = new Store(path);
    assert.equal(db.user('server', 'alice').wallet, 100);
    assert.equal(db.transfer('server', 'alice', 'bob', 50), true);
    assert.equal(db.transfer('server', 'alice', 'bob', 9999), false);
    const reopened = new Store(path);
    assert.equal(reopened.user('server', 'bob').wallet, 150);
    assert.equal(reopened.user('server', 'alice').wallet, 50);
    reopened.close();
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
