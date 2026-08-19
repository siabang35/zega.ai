const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = 'postgresql://postgres:K27f3786147%233786@db.ikxiclpvywxxnkcaldbx.supabase.co:5432/postgres';

console.log('[MIGRATION] Connecting to remote Supabase DB to fix table permissions...');

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

    const sqlPath = path.resolve(__dirname, '../../../supabase/migrations/20260820080000_fix_umkm_ai_assistant_chats_permission_denied.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[MIGRATION] SUCCESS! Applied 20260820080000_fix_umkm_ai_assistant_chats_permission_denied.sql to remote database!');
  } catch (err) {
    console.error('[MIGRATION] Error executing migration on remote database:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
