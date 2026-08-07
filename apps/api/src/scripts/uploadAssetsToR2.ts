import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { R2StorageService } from '../services/r2StorageService.js';
import pino from 'pino';

const logger = pino({ name: 'R2BatchUploader' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native Node.js 20 environment loader
try {
  process.loadEnvFile(path.resolve(__dirname, '../../../.env'));
} catch (e) {
  try {
    process.loadEnvFile();
  } catch (err) {}
}

const PUBLIC_DIR = path.resolve(__dirname, '../../../web/public');

async function uploadFileToR2(filePath: string) {
  if (!fs.existsSync(filePath)) {
    logger.error(`[R2BatchUploader] File not found: ${filePath}`);
    return;
  }

  const relativePath = path.relative(PUBLIC_DIR, filePath);
  const r2Key = relativePath.replace(/\\/g, '/');
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.json') contentType = 'application/json';
  else if (ext === '.mp4') contentType = 'video/mp4';
  else if (ext === '.webm') contentType = 'video/webm';

  logger.info(`[R2BatchUploader] Uploading ${path.basename(filePath)} -> Key: ${r2Key}`);
  const result = await R2StorageService.uploadFile({
    key: r2Key,
    content: fileBuffer,
    contentType,
  });

  if (result.success) {
    logger.info(`[R2BatchUploader] ✅ Success: ${result.url}`);
  } else {
    logger.error(`[R2BatchUploader] ❌ Failed: ${r2Key}`);
  }
}

async function uploadDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    logger.error(`[R2BatchUploader] Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await uploadDirectory(fullPath);
    } else if (entry.isFile()) {
      await uploadFileToR2(fullPath);
    }
  }
}

async function run() {
  logger.info('[R2BatchUploader] Starting batch upload of public assets to Cloudflare R2 CDN...');
  
  const targetArg = process.argv[2];
  if (targetArg && fs.existsSync(targetArg)) {
    const stat = fs.statSync(targetArg);
    if (stat.isDirectory()) {
      logger.info(`[R2BatchUploader] Target directory upload specified: ${targetArg}`);
      await uploadDirectory(targetArg);
    } else {
      logger.info(`[R2BatchUploader] Target file upload specified: ${targetArg}`);
      await uploadFileToR2(targetArg);
    }
  } else {
    const assetsDir = path.join(PUBLIC_DIR, 'assets');
    const designDir = path.join(PUBLIC_DIR, 'design');
    
    if (fs.existsSync(assetsDir)) await uploadDirectory(assetsDir);
    if (fs.existsSync(designDir)) await uploadDirectory(designDir);
  }
  
  logger.info('[R2BatchUploader] 🎉 Asset upload to Cloudflare R2 CDN completed successfully!');
}

run().catch((err) => {
  logger.error({ err }, '[R2BatchUploader] Script execution error');
});
