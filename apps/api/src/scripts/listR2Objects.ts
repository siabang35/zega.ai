import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import pino from 'pino';

const logger = pino({ name: 'R2Inspector' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native Node 20 env loader
try {
  process.loadEnvFile(path.resolve(__dirname, '../../../.env'));
} catch (e) {
  try { process.loadEnvFile(); } catch (err) {}
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
const bucket = process.env.R2_BUCKET_NAME || 'zega-ai';
const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://cdn.zegaai.site';

if (!accountId || !accessKeyId || !secretAccessKey) {
  logger.error('[R2Inspector] Missing R2 credentials in environment.');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

async function inspectR2Bucket() {
  logger.info(`[R2Inspector] 🔍 Auditing Cloudflare R2 Bucket: [${bucket}] ...`);
  
  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
    })
  );

  const contents = response.Contents || [];
  logger.info(`[R2Inspector] 📦 Total Objects Found: ${contents.length}`);
  
  const folders: Record<string, number> = {};

  for (const obj of contents) {
    const key = obj.Key || '';
    const size = obj.Size || 0;
    const parts = key.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    
    folders[folder] = (folders[folder] || 0) + 1;
    
    logger.info(`  • [${size} bytes] Key: ${key} -> ${publicDomain}/${key}`);
  }

  logger.info('\n--- FOLDER STRUCTURE SUMMARY ---');
  for (const [folderName, count] of Object.entries(folders)) {
    logger.info(`  📁 ${folderName}/ : ${count} items`);
  }
}

inspectR2Bucket().catch((err) => {
  logger.error({ err }, '[R2Inspector] Audit failed');
});
