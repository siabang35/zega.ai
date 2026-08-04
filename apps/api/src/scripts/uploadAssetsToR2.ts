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

const PUBLIC_ASSETS_DIR = path.resolve(__dirname, '../../../web/public/assets');

async function uploadDirectory(dir: string, baseFolder = 'assets') {
  if (!fs.existsSync(dir)) {
    logger.error(`[R2BatchUploader] Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(PUBLIC_ASSETS_DIR, fullPath);
    const r2Key = `${baseFolder}/${relativePath.replace(/\\/g, '/')}`;

    if (entry.isDirectory()) {
      await uploadDirectory(fullPath, baseFolder);
    } else if (entry.isFile()) {
      const fileBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(entry.name).toLowerCase();

      let contentType = 'application/octet-stream';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';

      const forceUpload = process.env.FORCE_UPLOAD === 'true' || process.argv.includes('--force');
      if (!forceUpload) {
        const exists = await R2StorageService.checkObjectExists(r2Key);
        if (exists) {
          logger.info(`[R2BatchUploader] ⏭️ Skipped (Already on CDN): ${r2Key}`);
          continue;
        }
      }

      logger.info(`[R2BatchUploader] Uploading ${entry.name} -> Key: ${r2Key}`);
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
  }
}

async function run() {
  logger.info('[R2BatchUploader] Starting batch upload of all public assets to Cloudflare R2 CDN...');
  await uploadDirectory(PUBLIC_ASSETS_DIR, 'assets');
  logger.info('[R2BatchUploader] 🎉 Batch asset upload to Cloudflare R2 CDN completed successfully!');
}

run().catch((err) => {
  logger.error({ err }, '[R2BatchUploader] Script execution error');
});
