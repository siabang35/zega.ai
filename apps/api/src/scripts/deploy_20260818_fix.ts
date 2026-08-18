import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

console.log('[MIGRATION] Deploying 20260818000000_trusted_user_bootstrap_and_provisioning_fix.sql via IPv4 pooler IP with SNI...');

const client = new Client({
  host: '52.74.252.201',
  port: 6543,
  user: 'postgres',
  password: 'K27f3786147#3786',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
    servername: 'db.ikxiclpvywxxnkcaldbx.supabase.co'
  }
});

async function run() {
  try {
    await client.connect();
    console.log('[MIGRATION] Connected to PostgreSQL database successfully!');

    const sqlPath = path.resolve(process.cwd(), '../../supabase/migrations/20260818000000_trusted_user_bootstrap_and_provisioning_fix.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[MIGRATION] Successfully executed migration 20260818000000_trusted_user_bootstrap_and_provisioning_fix.sql!');
  } catch (err) {
    console.error('[MIGRATION] Error deploying migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
