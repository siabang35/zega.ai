-- ═══════════════════════════════════════════════════════════════════════
-- ZeroClaw Memory Graph & SOP Tables Migration
-- Adds: memory nodes/edges, SOP run persistence, DeFi alert storage
-- ═══════════════════════════════════════════════════════════════════════

-- ── Relationship Memory: Knowledge Graph Nodes ──
CREATE TABLE IF NOT EXISTS zeroclaw_memory_nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('client','contact','interaction','pattern','decision','lesson','expert','technology')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Relationship Memory: Knowledge Graph Edges ──
CREATE TABLE IF NOT EXISTS zeroclaw_memory_edges (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL REFERENCES zeroclaw_memory_nodes(id) ON DELETE CASCADE,
  to_node_id TEXT NOT NULL REFERENCES zeroclaw_memory_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL CHECK (relation IN ('uses','replaces','extends','authored_by','applies_to','manages_client','contact_of','interacted_with')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SOP Run State Persistence ──
CREATE TABLE IF NOT EXISTS zeroclaw_sop_runs (
  id TEXT PRIMARY KEY,
  sop_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL CHECK (status IN ('pending','running','paused','completed','failed','cancelled')) DEFAULT 'pending',
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL DEFAULT 1,
  pending_approval BOOLEAN DEFAULT FALSE,
  checkpoint_id TEXT,
  steps_json JSONB DEFAULT '[]'::JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── DeFi Price Alert Preferences ──
CREATE TABLE IF NOT EXISTS zeroclaw_defi_alerts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token_mint TEXT NOT NULL,
  token_symbol TEXT DEFAULT '',
  threshold_pct NUMERIC NOT NULL DEFAULT 5.0,
  direction TEXT NOT NULL CHECK (direction IN ('above','below')) DEFAULT 'below',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_memory_nodes_type ON zeroclaw_memory_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_memory_nodes_user ON zeroclaw_memory_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_edges_from ON zeroclaw_memory_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_memory_edges_to ON zeroclaw_memory_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_sop_runs_name ON zeroclaw_sop_runs(sop_name);
CREATE INDEX IF NOT EXISTS idx_sop_runs_status ON zeroclaw_sop_runs(status);
CREATE INDEX IF NOT EXISTS idx_defi_alerts_user ON zeroclaw_defi_alerts(user_id);

-- ── RLS Policies ──
ALTER TABLE zeroclaw_memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zeroclaw_memory_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE zeroclaw_sop_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zeroclaw_defi_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own memory nodes" ON zeroclaw_memory_nodes;
CREATE POLICY "Users can manage own memory nodes" ON zeroclaw_memory_nodes
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage own memory edges" ON zeroclaw_memory_edges;
CREATE POLICY "Users can manage own memory edges" ON zeroclaw_memory_edges
  FOR ALL USING (
    from_node_id IN (SELECT id FROM zeroclaw_memory_nodes WHERE user_id = auth.uid() OR user_id IS NULL)
    OR to_node_id IN (SELECT id FROM zeroclaw_memory_nodes WHERE user_id = auth.uid() OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can view own SOP runs" ON zeroclaw_sop_runs;
CREATE POLICY "Users can view own SOP runs" ON zeroclaw_sop_runs
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage own DeFi alerts" ON zeroclaw_defi_alerts;
CREATE POLICY "Users can manage own DeFi alerts" ON zeroclaw_defi_alerts
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);
