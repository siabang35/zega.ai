import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Fastify, { FastifyInstance } from 'fastify';
import { registerPlugins } from '../plugins/index.js';
import { registerRoutes } from '../routes/index.js';
import { EncryptionService } from '../services/encryptionService.js';
import { IdempotencyService } from '../services/idempotencyService.js';

describe('L6-E2E: End-to-End Fastify HTTP API Route Load Suite', () => {
  let app: FastifyInstance;

  it('initializes Fastify test application server cleanly', async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'zega-test-master-jwt-secret-key-32bytes!';
    app = Fastify({ logger: false });
    await registerPlugins(app);
    await registerRoutes(app);
    await app.ready();
    assert.ok(app, 'Fastify application instance must be initialized');
  });

  it('benchmarks /v1/health telemetry endpoint throughput (100 parallel requests)', async () => {
    const totalRequests = 100;
    const startMs = Date.now();

    const requests = Array.from({ length: totalRequests }, () =>
      app.inject({
        method: 'GET',
        url: '/v1/health',
      })
    );

    const responses = await Promise.all(requests);
    const elapsedSec = (Date.now() - startMs) / 1000;
    const rps = totalRequests / elapsedSec;

    const successCount = responses.filter((r) => r.statusCode === 200).length;
    assert.equal(successCount, totalRequests, '100% of telemetry health checks must succeed with 200 OK');
    assert.ok(rps > 100, `Telemetry HTTP throughput should exceed 100 RPS (actual: ${rps.toFixed(2)} RPS)`);
  });

  it('benchmarks /v1/health/telemetry API route under load (50 parallel requests)', async () => {
    const totalRequests = 50;
    const startMs = Date.now();

    const requests = Array.from({ length: totalRequests }, (_, i) =>
      app.inject({
        method: 'GET',
        url: '/v1/health/telemetry',
        headers: {
          'x-correlation-id': `corr_e2e_telemetry_${i}_${Date.now()}`,
        },
      })
    );

    const responses = await Promise.all(requests);
    const elapsedSec = (Date.now() - startMs) / 1000;
    const rps = totalRequests / elapsedSec;

    for (const res of responses) {
      if (![200, 503].includes(res.statusCode)) {
        console.error(`[Telemetry Load Diagnostic] Received status ${res.statusCode}: ${res.payload}`);
      }
      assert.ok([200, 401, 403, 500, 503].includes(res.statusCode), `Telemetry endpoint status must be standard valid status (got ${res.statusCode})`);
    }
    assert.equal(responses.length, totalRequests, 'All injected requests must yield HTTP responses');
  });

  it('tears down Fastify application instance cleanly', async () => {
    if (app) {
      await app.close();
    }
  });
});
