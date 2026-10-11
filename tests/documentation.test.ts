import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { loadGroups } from '../src/commands/loader.js';
test('documented scripts, generated counts and AGPL package license agree with repository', async () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')),
    readme = readFileSync('README.md', 'utf8');
  for (const name of ['setup', 'dev', 'build', 'typecheck', 'test', 'lint']) {
    assert.ok(pkg.scripts[name]);
    assert.ok(readme.includes(`npm ${name === 'test' ? 'test' : `run ${name}`}`));
  }
  assert.equal(pkg.scripts.start, 'node dist/bot.js');
  assert.ok(readme.includes('npm start'));
  assert.equal(pkg.license, 'AGPL-3.0-only');
  assert.match(readFileSync('LICENSE', 'utf8'), /GNU AFFERO GENERAL PUBLIC LICENSE/);
  const groups = await loadGroups(),
    subs = [...groups.values()].flatMap((g) => g.subs),
    counts = JSON.parse(readFileSync('docs/command-counts.json', 'utf8'));
  assert.equal(counts.registered, subs.length);
  assert.equal(counts.counted, subs.filter((s) => !s.aliasOf && !s.informational).length);
  assert.equal(counts.groups, groups.size);
});
