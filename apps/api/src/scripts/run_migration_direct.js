import fs from 'fs';
import path from 'path';
import dns from 'dns';
import dotenv from 'dotenv';
import pkg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pkg;

const hosts = [
  'ikxiclpvywxxnkcaldbx.supabase.co',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com'
];

async function deploy() {
  const sqlPath = path.resolve(__dirname, '../../../supabase/migrations/20260821030000_fix_product_creation_42883_and_rpc_signatures.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  for (const host of hosts) {
    for (const port of [5432, 6543]) {
      console.log(`Attempting migration execution on ${host}:${port}...`);
      const client = new Client({
        host,
        port,
        user: host.includes('pooler') ? 'postgres.ikxiclpvywxxnkcaldbx' : 'postgres',
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
        database: 'postgres',
        ssl: { rejectUnauthorized: false, servername: host },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`Connected successfully to ${host}:${port}!`);
        await client.query(sql);
        console.log(`✅ SUCCESS! Migration 20260821030000 executed cleanly on ${host}:${port}!`);
        await client.end();
        return;
      } catch (err) {
        console.log(`Failed on ${host}:${port}:`, err.message);
        try { await client.end(); } catch {}
      }
    }
  }

  // Fallback: try connecting via IPv4 resolved from DNS lookup of ikxiclpvywxxnkcaldbx.supabase.co
  dns.lookup('ikxiclpvywxxnkcaldbx.supabase.co', { family: 4 }, async (err, address) => {
    if (err) {
      console.error('DNS Lookup Error for ikxiclpvywxxnkcaldbx.supabase.co:', err);
      process.exit(1);
    }
    console.log(`Attempting IPv4 fallback connection to ${address}:5432...`);
    const client = new Client({
      host: address,
      port: 5432,
      user: 'postgres',
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
      database: 'postgres',
      ssl: { rejectUnauthorized: false, servername: 'ikxiclpvywxxnkcaldbx.supabase.co' },
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      console.log(`Connected successfully to ${address}:5432!`);
      await client.query(sql);
      console.log(`✅ SUCCESS! Migration 20260821030000 executed cleanly on ${address}:5432!`);
      await client.end();
    } catch (ex) {
      console.error(`Failed IPv4 direct connection to ${address}:`, ex.message);
      process.exit(1);
    }
  });
}

deploy().catch(console.error);
