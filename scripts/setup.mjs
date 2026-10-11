#!/usr/bin/env node
import { existsSync, writeFileSync, chmodSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
let hideInput = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!hideInput) stdout.write(chunk);
    done();
  },
});
const rl = createInterface({ input: stdin, output, terminal: Boolean(stdin.isTTY) });
console.log('🐧 ARCHNEMESIS BOT — first-time setup');
console.log('Create a bot at https://discord.com/developers/applications');
console.log('Never share your bot token. The resulting .env is ignored by Git.');
if (existsSync('.env')) {
  const answer = (await rl.question('\n.env already exists. Overwrite it? [y/N] '))
    .trim()
    .toLowerCase();
  if (answer !== 'y') {
    console.log('Keeping existing .env.');
    rl.close();
    process.exit(0);
  }
}
stdout.write('\nPaste DISCORD_TOKEN (input hidden): ');
hideInput = true;
const token = (await rl.question('')).trim();
hideInput = false;
stdout.write('\n');
const guild = (
  await rl.question('Development guild ID (optional; press Enter for public operation): ')
).trim();
const owner = (await rl.question('Your Discord user ID for /developer (optional): ')).trim();
rl.close();
if (!token || token.includes('\n') || token.includes('\r')) {
  console.error('Missing or invalid token. No file written.');
  process.exitCode = 1;
} else if (guild && !/^\d{17,21}$/.test(guild)) {
  console.error('Invalid server ID. No file written.');
  process.exitCode = 1;
} else if (owner && !/^\d{17,21}$/.test(owner)) {
  console.error('Invalid operator user ID. No file written.');
  process.exitCode = 1;
} else {
  const enc = (x) => x.replace(/[\r\n"\\]/g, '');
  writeFileSync(
    '.env',
    `DISCORD_TOKEN=${enc(token)}\nDEV_GUILD_ID=${enc(guild)}\nDEV_USER_IDS=${enc(owner)}\n`,
    { encoding: 'utf8', mode: 0o600 },
  );
  chmodSync('.env', 0o600);
  console.log(
    '\n✅ Saved .env. Invite the bot with bot + applications.commands scopes, then run `npm run build && npm start`.',
  );
}
