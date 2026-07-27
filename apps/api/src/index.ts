import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// ─── Middleware ───────────────────────────────────────────
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Health Check ────────────────────────────────────────
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'ZEGA AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes ──────────────────────────────────────────
app.get('/api/v1/health', (c) => {
  return c.json({ status: 'healthy' })
})

// ─── Start Server ────────────────────────────────────────
const port = Number(process.env.PORT) || 3001

console.log(`🚀 ZEGA AI API running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
