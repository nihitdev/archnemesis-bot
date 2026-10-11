import { loadGroups } from '../src/commands/loader.js';
const groups = await loadGroups();
let sum = 0;
for (const group of groups.values()) {
  console.log(`/${group.name} — ${group.subs.length} subcommands`);
  console.log(group.subs.map((x) => `  /${group.name} ${x.name}`).join('\n'));
  sum += group.subs.length;
}
console.log(`\nTOTAL: ${sum} registered slash actions in ${groups.size} groups`);
