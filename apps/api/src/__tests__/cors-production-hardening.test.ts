import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import { registerPlugins } from '../plugins/index.js';
import { umkmRoutes } from '../routes/v1/umkm.routes.js';
import { enterpriseRoutes } from '../routes/v1/enterprise.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSourceFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, `../${relativePath}`), 'utf-8');
}

describe('Production CORS Hardening & Preflight Bypass', () => {

  describe('Static Source Code Security Invariants', () => {
    it('plugins/index.ts defines canonical ZEGA_ALLOWED_HEADERS array including x-zega-timestamp', () => {
      const pluginsSrc = readSourceFile('plugins/index.ts');
      assert.ok(pluginsSrc.includes('ZEGA_ALLOWED_HEADERS'), 'Must define ZEGA_ALLOWED_HEADERS array');
      assert.ok(pluginsSrc.includes("'x-zega-timestamp'"), 'Must contain x-zega-timestamp in allowed headers');
      assert.ok(pluginsSrc.includes("'x-zega-anti-tamper-sig'"), 'Must contain x-zega-anti-tamper-sig in allowed headers');
      assert.ok(pluginsSrc.includes("'X-ZEGA-Timestamp'"), 'Must contain X-ZEGA-Timestamp in allowed headers');
    });

    it('plugins/index.ts enforces explicit production origins without wildcard reflection', () => {
      const pluginsSrc = readSourceFile('plugins/index.ts');
      assert.ok(pluginsSrc.includes('https://www.zegaai.site'), 'Must explicitly allow https://www.zegaai.site');
      assert.ok(pluginsSrc.includes('https://zegaai.site'), 'Must explicitly allow https://zegaai.site');
      assert.ok(pluginsSrc.includes('https://zega-ai.onrender.com'), 'Must explicitly allow https://zega-ai.onrender.com');
      assert.ok(!pluginsSrc.includes("origin: true"), 'Must NOT use origin: true reflection');
    });

    it('plugins/index.ts sets Vary: Origin header on all requests', () => {
      const pluginsSrc = readSourceFile('plugins/index.ts');
      assert.ok(pluginsSrc.includes("reply.header('Vary', 'Origin')"), 'Must set Vary: Origin header');
    });

    it('umkm.routes.ts includes preflight OPTIONS bypass in onRequest hook', () => {
      const src = readSourceFile('routes/v1/umkm.routes.ts');
      assert.ok(src.includes("if (request.method === 'OPTIONS') return;"), 'umkmRoutes must bypass OPTIONS preflight');
    });

    it('enterprise.routes.ts includes preflight OPTIONS bypass in onRequest hook', () => {
      const src = readSourceFile('routes/v1/enterprise.routes.ts');
      assert.ok(src.includes("if (request.method === 'OPTIONS') return;"), 'enterpriseRoutes must bypass OPTIONS preflight');
    });

    it('all transactional & wallet routes include preflight OPTIONS bypass in onRequest hook', () => {
      const routeFiles = [
        'routes/v1/apiWallet.routes.ts',
        'routes/v1/wallet.routes.ts',
        'routes/v1/withdrawal.routes.ts',
        'routes/v1/payment.routes.ts',
        'routes/v1/invoice.routes.ts',
        'routes/v1/transaction.routes.ts',
      ];

      for (const file of routeFiles) {
        const src = readSourceFile(file);
        assert.ok(
          src.includes("if (request.method === 'OPTIONS') return;"),
          `${file} must bypass OPTIONS preflight`
        );
      }
    });
  });

  describe('Fastify Transport Layer Integration', () => {
    it('OPTIONS /v1/umkm/copilot/chat responds 200/204 with valid CORS headers for https://www.zegaai.site', async () => {
      const app = Fastify({ logger: false });
      await registerPlugins(app);
      await app.register(umkmRoutes, { prefix: '/v1/umkm' });

      const res = await app.inject({
        method: 'OPTIONS',
        url: '/v1/umkm/copilot/chat',
        headers: {
          origin: 'https://www.zegaai.site',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization, content-type, x-zega-timestamp, x-zega-anti-tamper-sig',
        },
      });

      assert.equal(res.statusCode === 200 || res.statusCode === 204, true, `Expected status 200/204, got ${res.statusCode}`);
      assert.equal(res.headers['access-control-allow-origin'], 'https://www.zegaai.site');
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
      assert.ok(
        (res.headers['access-control-allow-headers'] as string)?.toLowerCase().includes('x-zega-timestamp'),
        'Access-Control-Allow-Headers must include x-zega-timestamp'
      );
      assert.equal(res.headers['vary'], 'Origin');
      await app.close();
    });

    it('OPTIONS /v1/enterprise/copilot/chat responds 200/204 with valid CORS headers', async () => {
      const app = Fastify({ logger: false });
      await registerPlugins(app);
      await app.register(enterpriseRoutes, { prefix: '/v1/enterprise' });

      const res = await app.inject({
        method: 'OPTIONS',
        url: '/v1/enterprise/copilot/chat',
        headers: {
          origin: 'https://www.zegaai.site',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization, content-type, x-zega-timestamp',
        },
      });

      assert.equal(res.statusCode === 200 || res.statusCode === 204, true);
      assert.equal(res.headers['access-control-allow-origin'], 'https://www.zegaai.site');
      await app.close();
    });

    it('OPTIONS from unauthorized origin https://evil-attacker.site is rejected', async () => {
      const app = Fastify({ logger: false });
      await registerPlugins(app);
      await app.register(umkmRoutes, { prefix: '/v1/umkm' });

      const res = await app.inject({
        method: 'OPTIONS',
        url: '/v1/umkm/copilot/chat',
        headers: {
          origin: 'https://evil-attacker.site',
          'access-control-request-method': 'POST',
        },
      });

      assert.notEqual(res.headers['access-control-allow-origin'], 'https://evil-attacker.site');
      await app.close();
    });

    it('POST /v1/umkm/copilot/chat without JWT bearer token is still blocked with 401 Unauthorized', async () => {
      const app = Fastify({ logger: false });
      await registerPlugins(app);
      await app.register(umkmRoutes, { prefix: '/v1/umkm' });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/umkm/copilot/chat',
        headers: {
          origin: 'https://www.zegaai.site',
          'content-type': 'application/json',
        },
        payload: { message: 'Hello' },
      });

      assert.equal(res.statusCode, 401, 'POST without auth must return 401 Unauthorized');
      await app.close();
    });
  });
});
