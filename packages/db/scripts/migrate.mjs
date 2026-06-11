// Minimal forward-only SQL migration runner for `just migrate`.
// Applies packages/db/drizzle/*.sql in filename order, tracked in
// _tenderhook_migrations. Fails fast with a named-var error if
// DATABASE_URL is missing (TOOLS.md).
import console from 'node:console';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set — see TOOLS.md. Aborting migration.');
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

async function main() {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      'CREATE TABLE IF NOT EXISTS _tenderhook_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _tenderhook_migrations WHERE name = $1', [
        file,
      ]);
      if (rows.length > 0) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _tenderhook_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`apply  ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
