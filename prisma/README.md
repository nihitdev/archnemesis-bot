# Legacy directory

Prisma is not used. Persistence is implemented with Node's built-in SQLite module in `src/database/store.ts`, including WAL, migration markers and non-destructive legacy JSON import. No database server is required.
