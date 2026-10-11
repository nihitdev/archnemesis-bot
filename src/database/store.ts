import { mkdirSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { UserError } from '../services/errors.js';
import { DatabaseSync } from 'node:sqlite';

export type Warning = { reason: string; moderatorId: string; at: number };
export type UserData = {
  xp: number;
  messages: number;
  lastXp: number;
  wallet: number;
  bank: number;
  lastDaily: number;
  lastWork: number;
  lastBeg: number;
  warnings: Warning[];
  inventory: string[];
  equipped: string | null;
};
export type GuildData = {
  levelsEnabled: boolean;
  levelChannel: string | null;
  modLogChannel: string | null;
  setupRoleId: string | null;
  roleColor: number;
  disabledModules: string[];
  active: boolean;
  setupWarning: string | null;
};
export type State = { users: Record<string, UserData>; guilds: Record<string, Partial<GuildData>> };
export const defaultUser = (): UserData => ({
  xp: 0,
  messages: 0,
  lastXp: 0,
  wallet: 100,
  bank: 0,
  lastDaily: 0,
  lastWork: 0,
  lastBeg: 0,
  warnings: [],
  inventory: [],
  equipped: null,
});
export const defaultGuild = (): GuildData => ({
  levelsEnabled: true,
  levelChannel: null,
  modLogChannel: null,
  setupRoleId: null,
  roleColor: 0x5865f2,
  disabledModules: [],
  active: true,
  setupWarning: null,
});
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100));
export const xpForLevel = (level: number) => Math.max(0, level) ** 2 * 100;
export type RecordData = {
  id: string;
  owner: string;
  data: Record<string, unknown>;
  created: number;
};

export class Store {
  readonly sql: DatabaseSync;
  readonly filename: string;
  private depth = 0;
  constructor(filename = process.env.DATABASE_PATH ?? resolve('data/bot.sqlite')) {
    // A caller using the old JSON filename gets a sibling SQLite file, never a destructive overwrite.
    this.filename = filename.endsWith('.json') ? filename.replace(/\.json$/, '.sqlite') : filename;
    if (this.filename !== ':memory:')
      mkdirSync(dirname(this.filename), { recursive: true, mode: 0o700 });
    this.sql = new DatabaseSync(this.filename);
    this.sql.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    this.sql.exec(`CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS guilds(id TEXT PRIMARY KEY,data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users(guild TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(guild,id));
      CREATE TABLE IF NOT EXISTS records(guild TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,owner TEXT NOT NULL,data TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(guild,kind,id));
      CREATE INDEX IF NOT EXISTS records_owner ON records(guild,kind,owner);
      CREATE TABLE IF NOT EXISTS jobs(guild TEXT NOT NULL,id TEXT NOT NULL,user TEXT NOT NULL,channel TEXT NOT NULL,text TEXT NOT NULL,due INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',PRIMARY KEY(guild,id));
      CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status,due);
      CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      INSERT OR IGNORE INTO migrations VALUES(1);
      CREATE INDEX IF NOT EXISTS users_xp ON users(guild,json_extract(data,'$.xp') DESC);
      CREATE INDEX IF NOT EXISTS users_wealth ON users(guild,(json_extract(data,'$.wallet')+json_extract(data,'$.bank')) DESC);
      INSERT OR IGNORE INTO migrations VALUES(2);`);
    if (this.filename !== ':memory:') chmodSync(this.filename, 0o600);
    const legacy = filename.endsWith('.json') ? filename : resolve(dirname(filename), 'bot.json');
    if (
      this.filename !== ':memory:' &&
      existsSync(legacy) &&
      !this.sql.prepare("SELECT 1 FROM metadata WHERE key='legacy-import'").get()
    ) {
      const state = JSON.parse(readFileSync(legacy, 'utf8')) as State;
      this.transaction(() => {
        for (const [id, data] of Object.entries(state.guilds ?? {}))
          this.sql
            .prepare('INSERT OR IGNORE INTO guilds VALUES(?,?)')
            .run(id, JSON.stringify({ ...defaultGuild(), ...data }));
        for (const [key, data] of Object.entries(state.users ?? {})) {
          const [guild, id] = key.split(':');
          if (!guild || !id) throw new Error('Invalid legacy user key; original file retained');
          this.sql
            .prepare('INSERT OR IGNORE INTO users VALUES(?,?,?)')
            .run(guild, id, JSON.stringify({ ...defaultUser(), ...data }));
        }
        this.sql.prepare('INSERT INTO metadata VALUES(?,?)').run('legacy-import', '1');
      });
    }
  }
  transaction<T>(fn: () => T): T {
    const savepoint = `nested_${this.depth}`;
    this.sql.exec(this.depth ? `SAVEPOINT ${savepoint}` : 'BEGIN IMMEDIATE');
    this.depth++;
    try {
      const result = fn();
      this.depth--;
      this.sql.exec(this.depth ? `RELEASE ${savepoint}` : 'COMMIT');
      return result;
    } catch (error) {
      this.depth--;
      this.sql.exec(this.depth ? `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}` : 'ROLLBACK');
      throw error;
    }
  }
  user(guild: string, id: string): UserData {
    const row = this.sql.prepare('SELECT data FROM users WHERE guild=? AND id=?').get(guild, id);
    return row ? { ...defaultUser(), ...JSON.parse(String(row.data)) } : defaultUser();
  }
  guild(id: string): GuildData {
    const row = this.sql.prepare('SELECT data FROM guilds WHERE id=?').get(id);
    return row ? { ...defaultGuild(), ...JSON.parse(String(row.data)) } : defaultGuild();
  }
  changeUser(guild: string, id: string, fn: (u: UserData) => void): UserData {
    return this.transaction(() => {
      const u = this.user(guild, id);
      fn(u);
      for (const n of [u.wallet, u.bank, u.xp, u.messages])
        if (!Number.isSafeInteger(n) || n < 0)
          throw new Error('Balance and XP must be nonnegative safe integers');
      this.sql
        .prepare(
          'INSERT INTO users VALUES(?,?,?) ON CONFLICT(guild,id) DO UPDATE SET data=excluded.data',
        )
        .run(guild, id, JSON.stringify(u));
      return u;
    });
  }
  changeGuild(id: string, fn: (g: GuildData) => void): GuildData {
    return this.transaction(() => {
      const g = this.guild(id);
      fn(g);
      this.sql
        .prepare('INSERT INTO guilds VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data')
        .run(id, JSON.stringify(g));
      return g;
    });
  }
  transfer(guild: string, from: string, to: string, amount: number): boolean {
    return this.transaction(() => {
      if (
        from === to ||
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        this.user(guild, from).wallet < amount
      )
        return false;
      this.changeUser(guild, from, (u) => (u.wallet -= amount));
      this.changeUser(guild, to, (u) => (u.wallet += amount));
      return true;
    });
  }
  leaders(
    guild: string,
    sortBy: 'xp' | 'wallet' | 'wealth',
    limit = 10,
  ): Array<{ id: string; value: number }> {
    const expression =
      sortBy === 'wealth'
        ? "json_extract(data,'$.wallet')+json_extract(data,'$.bank')"
        : `json_extract(data,'$.${sortBy}')`;
    return this.sql
      .prepare(
        `SELECT id,${expression} AS value FROM users WHERE guild=? ORDER BY value DESC,id LIMIT ?`,
      )
      .all(guild, limit)
      .map((r) => ({ id: String(r.id), value: Number(r.value) }));
  }
  put(guild: string, kind: string, id: string, owner: string, data: Record<string, unknown>) {
    if (!this.get(guild, kind, id)) {
      if (
        ['note', 'task', 'bookmark', 'suggestion', 'poll', 'event', 'giveaway'].includes(kind) &&
        Number(
          this.sql
            .prepare('SELECT COUNT(*) AS n FROM records WHERE guild=? AND kind=? AND owner=?')
            .get(guild, kind, owner)!.n,
        ) >= 100
      )
        throw new UserError(
          'Limit reached: 100 records per member in this feature. Remove older records before adding more.',
        );
      if (
        /^(ballot:|entry:|rsvp:|suggestion-vote:)/.test(kind) &&
        Number(
          this.sql
            .prepare('SELECT COUNT(*) AS n FROM records WHERE guild=? AND kind=?')
            .get(guild, kind)!.n,
        ) >= 1000
      )
        throw new UserError('This activity has reached its 1000-participant limit.');
    }
    this.sql
      .prepare(
        'INSERT INTO records VALUES(?,?,?,?,?,?) ON CONFLICT(guild,kind,id) DO UPDATE SET owner=excluded.owner,data=excluded.data',
      )
      .run(guild, kind, id, owner, JSON.stringify(data), Date.now());
  }
  get(guild: string, kind: string, id: string): RecordData | undefined {
    const r = this.sql
      .prepare('SELECT * FROM records WHERE guild=? AND kind=? AND id=?')
      .get(guild, kind, id);
    return r
      ? {
          id: String(r.id),
          owner: String(r.owner),
          data: JSON.parse(String(r.data)),
          created: Number(r.created),
        }
      : undefined;
  }
  records(guild: string, kind: string, owner?: string): RecordData[] {
    const rows =
      owner === undefined
        ? this.sql
            .prepare(
              'SELECT * FROM records WHERE guild=? AND kind=? ORDER BY created DESC LIMIT 1000',
            )
            .all(guild, kind)
        : this.sql
            .prepare(
              'SELECT * FROM records WHERE guild=? AND kind=? AND owner=? ORDER BY created DESC LIMIT 1000',
            )
            .all(guild, kind, owner);
    return rows.map((r) => ({
      id: String(r.id),
      owner: String(r.owner),
      data: JSON.parse(String(r.data)),
      created: Number(r.created),
    }));
  }
  delete(guild: string, kind: string, id: string) {
    return (
      this.sql.prepare('DELETE FROM records WHERE guild=? AND kind=? AND id=?').run(guild, kind, id)
        .changes > 0
    );
  }
  deleteGuild(guild: string) {
    this.transaction(() => {
      for (const table of ['users', 'records', 'jobs'])
        this.sql.prepare(`DELETE FROM ${table} WHERE guild=?`).run(guild);
      this.sql.prepare('DELETE FROM guilds WHERE id=?').run(guild);
    });
  }
  userCount() {
    return Number(this.sql.prepare('SELECT COUNT(*) AS n FROM users').get()!.n);
  }
  guildCount() {
    return Number(this.sql.prepare('SELECT COUNT(*) AS n FROM guilds').get()!.n);
  }
  close() {
    this.sql.close();
  }
}
