-- ═══════════════════════════════════════════════════════════════════════
-- ZeroClaw SOP Human Approval Checkpoints & Real-Time Sync Schema
-- Adds: zeroclaw_checkpoints for SOP approval gates and injection flags
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS zeroclaw_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  customer_channel TEXT NOT NULL DEFAULT 'WhatsApp',
  amount_usdc NUMERIC(16, 4) NOT NULL DEFAULT 0.00,
  recipient_address TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  injection_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  sop_name TEXT DEFAULT 'refund-approval',
  daemon_run_id TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexing for ultra-fast query performance ──
CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_status ON zeroclaw_checkpoints(status);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_created ON zeroclaw_checkpoints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_user ON zeroclaw_checkpoints(user_id);

-- ── RLS Policies ──
ALTER TABLE zeroclaw_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public service role can manage zeroclaw_checkpoints" ON zeroclaw_checkpoints;
CREATE POLICY "Public service role can manage zeroclaw_checkpoints" ON zeroclaw_checkpoints
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Real-Time Publication for Supabase Realtime WebSocket listeners
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zeroclaw_checkpoints;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
