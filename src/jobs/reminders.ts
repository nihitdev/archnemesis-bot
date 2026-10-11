import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Client } from 'discord.js';
import { Store } from '../database/store.js';
import { UserError } from '../services/errors.js';
import { log } from '../services/logger.js';
export type Reminder = {
  id: string;
  userId: string;
  channelId: string;
  guildId: string;
  text: string;
  at: number;
};
export class Reminders {
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  constructor(private db: Store) {
    const legacy = resolve(dirname(db.filename), 'reminders.json');
    if (
      db.filename !== ':memory:' &&
      existsSync(legacy) &&
      !db.sql.prepare("SELECT 1 FROM metadata WHERE key='reminder-import'").get()
    ) {
      const rows = JSON.parse(readFileSync(legacy, 'utf8')) as Reminder[];
      db.transaction(() => {
        for (const r of rows) this.insert(r);
        db.sql.prepare('INSERT INTO metadata VALUES(?,?)').run('reminder-import', '1');
      });
    }
  }
  add(r: Reminder) {
    if (this.get(r.userId, r.guildId).length >= 50)
      throw new UserError('Maximum 50 active reminders per member per server');
    this.insert(r);
  }
  private insert(r: Reminder) {
    this.db.sql
      .prepare('INSERT OR IGNORE INTO jobs(guild,id,user,channel,text,due) VALUES(?,?,?,?,?,?)')
      .run(r.guildId, r.id, r.userId, r.channelId, r.text, r.at);
  }
  get(userId: string, guildId: string): Reminder[] {
    return this.db.sql
      .prepare("SELECT * FROM jobs WHERE guild=? AND user=? AND status='pending' ORDER BY due")
      .all(guildId, userId)
      .map((r) => ({
        id: String(r.id),
        userId: String(r.user),
        channelId: String(r.channel),
        guildId: String(r.guild),
        text: String(r.text),
        at: Number(r.due),
      }));
  }
  remove(userId: string, id: string, guildId: string) {
    return (
      this.db.sql
        .prepare('DELETE FROM jobs WHERE guild=? AND user=? AND id=?')
        .run(guildId, userId, id).changes > 0
    );
  }
  start(bot: Client) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick(bot).catch((error) => log('error', 'reminder_tick', { error }));
    }, 15000);
    this.timer.unref();
  }
  tick(bot: Client): Promise<void> {
    if (this.running) return this.running;
    this.running = this.deliver(bot).finally(() => (this.running = undefined));
    return this.running;
  }
  private async deliver(bot: Client) {
    const activeGuilds = [...bot.guilds.cache.keys()].filter((id) => {
      const g = this.db.guild(id);
      return g.active && !g.disabledModules.includes('reminders');
    });
    if (!activeGuilds.length) return;
    const rows = this.db.sql
      .prepare(
        `SELECT * FROM jobs WHERE guild IN (${activeGuilds.map(() => '?').join(',')}) AND status='pending' AND due<=? ORDER BY due LIMIT 20`,
      )
      .all(...activeGuilds, Date.now());
    for (const r of rows) {
      if (!this.db.guild(String(r.guild)).active) continue;
      try {
        const guild = bot.guilds.cache.get(String(r.guild));
        if (!guild) continue;
        const channel = await guild.channels.fetch(String(r.channel));
        if (!channel?.isTextBased() || !('send' in channel))
          throw new Error('Reminder channel was deleted or is not text-based');
        await channel.send({
          content: `⏰ <@${r.user}> reminder: ${String(r.text).slice(0, 1600)}`,
          allowedMentions: { parse: [], users: [String(r.user)] },
        });
        this.db.sql.prepare('DELETE FROM jobs WHERE guild=? AND id=?').run(r.guild, r.id);
      } catch (error) {
        const attempts = Number(r.attempts) + 1;
        this.db.sql
          .prepare('UPDATE jobs SET attempts=?,due=?,status=? WHERE guild=? AND id=?')
          .run(
            attempts,
            Date.now() + Math.min(3600000, 30000 * 2 ** attempts),
            attempts >= 8 ? 'failed' : 'pending',
            r.guild,
            r.id,
          );
        log('warn', 'reminder_delivery_failed', { id: r.id, error });
      }
    }
  }
  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.running;
  }
}
