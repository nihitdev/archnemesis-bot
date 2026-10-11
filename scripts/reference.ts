import { writeFileSync, mkdirSync } from 'node:fs';
import { loadGroups } from '../src/commands/loader.js';
import { permissionNames } from '../src/middleware/guard.js';
const groups = await loadGroups(),
  all = [...groups.values()].flatMap((g) => g.subs.map((s) => ({ group: g.name, ...s }))),
  distinct = all.filter((s) => !s.aliasOf && !s.informational);
mkdirSync('docs', { recursive: true });
const lines = [
  '# Command reference',
  '',
  `${all.length} registered slash actions in ${groups.size} groups. ${distinct.length} counted actions after excluding declared aliases and informational-only actions. All registered actions have dispatch/acknowledgement smoke tests; this is not equivalent to live Discord verification.`,
  '',
  'Each command is server-scoped. Modules may be disabled with `/setup module`. Permission names below apply at runtime; Discord default visibility applies to the top-level group.',
  '',
];
for (const group of groups.values()) {
  lines.push(
    `## /${group.name}`,
    '',
    group.description,
    '',
    '| Action | Description | Caller permissions | Bot permissions | Counted |',
    '| --- | --- | --- | --- | --- |',
  );
  for (const s of group.subs)
    lines.push(
      `| ${s.name} | ${s.description.replaceAll('|', '/')} | ${permissionNames(s.userPermissions ?? 0n) || 'None'} | ${permissionNames(s.botPermissions ?? 0n) || 'None'} | ${s.aliasOf ? `Alias of ${s.aliasOf}` : s.informational ? 'Informational' : 'Yes'} |`,
    );
  lines.push('');
}
writeFileSync('docs/COMMANDS.md', lines.join('\n') + '\n');
writeFileSync(
  'docs/command-counts.json',
  JSON.stringify(
    {
      registered: all.length,
      groups: groups.size,
      counted: distinct.length,
      excluded: all.filter((s) => s.aliasOf || s.informational).map((s) => `${s.group}/${s.name}`),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `${all.length} registered; ${distinct.length} counted; ${groups.size} groups. Reference generated.`,
);
