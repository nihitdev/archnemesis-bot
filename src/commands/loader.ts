import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { applyPolicies } from './policies.js';
import type { Group } from './types.js';
export async function loadGroups(): Promise<Map<string, Group>> {
  const dir = dirname(fileURLToPath(import.meta.url)),
    map = new Map<string, Group>();
  for (const folder of readdirSync(dir, { withFileTypes: true })
    .filter((x) => x.isDirectory())
    .map((x) => x.name)
    .sort()) {
    const mod = await import(
      pathToFileURL(join(dir, folder, import.meta.url.endsWith('.ts') ? 'index.ts' : 'index.js'))
        .href
    );
    const g = mod.default as Group;
    if (!g || !g.name || map.has(g.name))
      throw new Error(`Invalid/duplicate command group: ${folder}`);
    if (
      typeof g.run !== 'function' ||
      !g.subs.length ||
      new Set(g.subs.map((s) => s.name)).size !== g.subs.length
    )
      throw new Error(`Invalid command handlers: ${folder}`);
    if (g.subs.length > 25) throw new Error(`${g.name} exceeds Discord's 25-subcommand limit`);
    applyPolicies(g);
    map.set(g.name, g);
  }
  if (map.size > 100) throw new Error('Too many top-level application commands');
  return map;
}
