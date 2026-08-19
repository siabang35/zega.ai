import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

console.log('[MIGRATION] Deploying 20260818000000_trusted_user_bootstrap_and_provisioning_fix.sql via IPv4 pooler IP with SNI...');

const dbUrl = process.env.DATABASE_URL;
const connectionConfig = dbUrl ? { connectionString: dbUrl } : {
  host: process.env.DB_HOST || 'db.ikxiclpvywxxnkcaldbx.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
  ssl: {
    rejectUnauthorized: false,
    servername: 'db.ikxiclpvywxxnkcaldbx.supabase.co'
  }
};

const client = new Client(connectionConfig);

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
