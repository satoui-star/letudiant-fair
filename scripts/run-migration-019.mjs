import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
}

const sql = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '019_add_interview_status.sql'),
  'utf8',
);

const connStr = (process.env.POSTGRES_URL || '').replace('?sslmode=require', '?sslmode=no-verify');
const client = new pg.Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected to database');
  await client.query(sql);
  console.log('✅ Migration 019 applied successfully');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
