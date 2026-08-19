import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('[MIGRATION] Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

console.log('[MIGRATION] Connecting to remote Supabase DB to apply 20260820070000_harden_all_umkm_tables_authenticated_rls.sql...');

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('[MIGRATION] Connected successfully to remote Supabase database!');

    const sqlPath = path.resolve(__dirname, '../../../../supabase/migrations/20260820070000_harden_all_umkm_tables_authenticated_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[MIGRATION] SUCCESS! Applied 20260820070000_harden_all_umkm_tables_authenticated_rls.sql to remote database!');
  } catch (err: any) {
    console.error('[MIGRATION] Error executing migration on remote database:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
