const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.DIRECT_URL;

if (!dbUrl) {
  console.error('[MIGRATION] Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

console.log('[MIGRATION] Connecting to remote Supabase DB to apply migration...');

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('[MIGRATION] Connected successfully to remote database!');

    const targetMigration = process.argv[2] || '20260820090000_fix_anon_permissions_and_rpc_chats.sql';
    const sqlPath = path.resolve(__dirname, '../../../supabase/migrations', targetMigration);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log(`[MIGRATION] SUCCESS! Applied ${targetMigration} to database!`);
  } catch (err) {
    console.error('[MIGRATION] Error executing migration on database:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
