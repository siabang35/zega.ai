import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Parse .env natively
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

import { zeroclawRoutes } from './routes/v1/zeroclaw.routes.js';
import Fastify from 'fastify';

async function testLiveApiKeys() {
  console.log('===============================================================');
  console.log('⚡ TESTING REAL LIVE LLM PROVIDER API KEYS FROM .ENV');
  console.log('===============================================================');
  console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ PRESENT' : '❌ MISSING');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ PRESENT' : '❌ MISSING');
  console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ PRESENT' : '❌ MISSING');
  console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '✅ PRESENT' : '❌ MISSING');

  const app = Fastify({ logger: false });
  await app.register(zeroclawRoutes, { prefix: '/v1/zeroclaw' });
  await app.ready();

  const providers = ['groq', 'openrouter', 'huggingface', 'jatevo', '9router'];

  for (const provider of providers) {
    console.log(`\n🔍 Executing Prompt via Live Provider: [${provider.toUpperCase()}]...`);
    const start = Date.now();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/zeroclaw/agent/execute',
        payload: {
          prompt: `Hello from ZeroClaw Solana Agent. Summarize in 1 short sentence what you do.`,
          preferredModel: provider
        }
      });
      const body = JSON.parse(res.body);
      const latency = Date.now() - start;
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Model Used: ${body.modelUsed}`);
      console.log(`  Latency: ${latency}ms`);
      console.log(`  Response Output:\n  "${body.response.replace(/\n/g, ' ')}"`);
    } catch (err: any) {
      console.error(`  ❌ Failed for ${provider}:`, err.message);
    }
  }

  await app.close();
  console.log('\n===============================================================');
  console.log('✅ LIVE REAL-TIME API KEY TEST COMPLETED SUCCESSFULLY!');
  console.log('===============================================================');
}

testLiveApiKeys().catch(console.error);
