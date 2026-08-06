-- Migration 26: Enterprise Infrastructure Hub Realtime Schema & Data Seeding
-- Description: Comprehensive database schema, indexes, RLS policies, real-time channels, and seed data for enterprise infrastructure management.

-- 1. Create Nodes Table (128 Server Nodes)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    status VARCHAR(20) NOT NULL DEFAULT 'healthy', -- healthy, warning, critical
    cpu_usage_pct NUMERIC(5,2) DEFAULT 32.0,
    memory_usage_pct NUMERIC(5,2) DEFAULT 58.0,
    storage_usage_pct NUMERIC(5,2) DEFAULT 41.0,
    network_gbps NUMERIC(5,2) DEFAULT 28.0,
    ip_address VARCHAR(45),
    provider VARCHAR(50) DEFAULT 'AWS EC2',
    os_version VARCHAR(100) DEFAULT 'Ubuntu 24.04 LTS (Kernel 6.8)',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Services Table (42 Enterprise Microservices)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Core Services',
    status VARCHAR(20) NOT NULL DEFAULT 'Healthy', -- Healthy, Warning, Critical
    health_pct VARCHAR(20) DEFAULT '99.98%',
    uptime VARCHAR(50) DEFAULT '30d 12h',
    response_time_ms INT DEFAULT 120,
    region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    instances INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Alerts Table (Infrastructure Alert Queue)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    region VARCHAR(50) DEFAULT 'us-east-1',
    severity VARCHAR(20) DEFAULT 'Warning', -- Critical, Warning, Info
    metric_detail VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Telemetry History Table (Realtime Metric Streaming)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    cpu_pct NUMERIC(5,2) DEFAULT 32.0,
    memory_pct NUMERIC(5,2) DEFAULT 58.0,
    storage_pct NUMERIC(5,2) DEFAULT 41.0,
    network_pct NUMERIC(5,2) DEFAULT 28.0
);

-- 5. Create FinOps Cloud Spend Table
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT '2026-08',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Inter-Datacenter Bandwidth Table (Top Talkers)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_bandwidth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_region VARCHAR(50) NOT NULL,
    destination_region VARCHAR(50) NOT NULL,
    transfer_tb NUMERIC(5,2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Resource Inventory Summary Table
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL UNIQUE,
    count_active INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Security & Compliance Posture Table
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_security_posture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    score_pct NUMERIC(5,2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Ping Diagnostics Table (Map Tools - ICMP Latency Tracking)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_ping_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_region VARCHAR(50) NOT NULL DEFAULT 'us-east-1',
    target_region VARCHAR(50) NOT NULL,
    latency_ms INT NOT NULL,
    packet_loss_pct NUMERIC(5,2) DEFAULT 0.00,
    jitter_ms NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'success', -- success, timeout, packet_loss
    overlay_mode VARCHAR(20) DEFAULT 'latency', -- health, latency, traffic
    initiated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create Traceroute Logs Table (Map Tools - Hop-by-Hop Path Analysis)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_traceroute_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_region VARCHAR(50) NOT NULL,
    target_region VARCHAR(50) NOT NULL,
    hop_count INT NOT NULL DEFAULT 0,
    total_latency_ms INT NOT NULL DEFAULT 0,
    hops JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'completed', -- completed, in_progress, failed
    initiated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create Node Discovery Table (Map Tools - Automated Infrastructure Scanning)
CREATE TABLE IF NOT EXISTS enterprise_infrastructure_node_discovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(50) NOT NULL,
    discovered_nodes INT NOT NULL DEFAULT 0,
    new_nodes INT DEFAULT 0,
    removed_nodes INT DEFAULT 0,
    scan_duration_ms INT DEFAULT 0,
    scan_type VARCHAR(30) DEFAULT 'full', -- full, incremental, targeted
    cdn_edge_nodes INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed', -- completed, in_progress, failed
    initiated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ultra-high performance querying
CREATE INDEX IF NOT EXISTS idx_infra_nodes_region ON enterprise_infrastructure_nodes(region);
CREATE INDEX IF NOT EXISTS idx_infra_services_status ON enterprise_infrastructure_services(status);
CREATE INDEX IF NOT EXISTS idx_infra_alerts_status ON enterprise_infrastructure_alerts(status);
CREATE INDEX IF NOT EXISTS idx_infra_telemetry_time ON enterprise_infrastructure_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_infra_ping_target ON enterprise_infrastructure_ping_diagnostics(target_region);
CREATE INDEX IF NOT EXISTS idx_infra_ping_time ON enterprise_infrastructure_ping_diagnostics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_infra_traceroute_time ON enterprise_infrastructure_traceroute_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_infra_discovery_region ON enterprise_infrastructure_node_discovery(region);
CREATE INDEX IF NOT EXISTS idx_infra_discovery_time ON enterprise_infrastructure_node_discovery(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE enterprise_infrastructure_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_bandwidth ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_security_posture ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_ping_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_traceroute_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_infrastructure_node_discovery ENABLE ROW LEVEL SECURITY;

-- Create Public Read Policies
CREATE POLICY "Public Read Infra Nodes" ON enterprise_infrastructure_nodes FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Services" ON enterprise_infrastructure_services FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Alerts" ON enterprise_infrastructure_alerts FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Telemetry" ON enterprise_infrastructure_telemetry FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Costs" ON enterprise_infrastructure_costs FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Bandwidth" ON enterprise_infrastructure_bandwidth FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Inventory" ON enterprise_infrastructure_inventory FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Security" ON enterprise_infrastructure_security_posture FOR SELECT USING (true);
CREATE POLICY "Public Read Infra Ping" ON enterprise_infrastructure_ping_diagnostics FOR SELECT USING (true);
CREATE POLICY "Public Insert Infra Ping" ON enterprise_infrastructure_ping_diagnostics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Infra Traceroute" ON enterprise_infrastructure_traceroute_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Infra Traceroute" ON enterprise_infrastructure_traceroute_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Infra Discovery" ON enterprise_infrastructure_node_discovery FOR SELECT USING (true);
CREATE POLICY "Public Insert Infra Discovery" ON enterprise_infrastructure_node_discovery FOR INSERT WITH CHECK (true);

-- Register all tables with Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_nodes;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_services;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_alerts;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_telemetry;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_costs;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_bandwidth;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_inventory;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_security_posture;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_ping_diagnostics;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_traceroute_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE enterprise_infrastructure_node_discovery;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- SEED DATA
-- Seed Services
INSERT INTO enterprise_infrastructure_services (service_name, category, status, health_pct, uptime, response_time_ms, region, instances)
VALUES 
    ('API Gateway', 'Edge Routing', 'Healthy', '99.98%', '30d 12h', 120, 'us-east-1', 4),
    ('Vector Database', 'AI Intelligence', 'Healthy', '99.98%', '30d 12h', 98, 'ap-southeast-1', 3),
    ('Redis Cache', 'In-Memory DB', 'Healthy', '99.99%', '30d 12h', 1, 'us-east-1', 6),
    ('SupabaseDB', 'Relational DB', 'Healthy', '99.95%', '30d 12h', 45, 'eu-west-1', 2),
    ('MCP Orchestrator', 'AI Workforce', 'Healthy', '99.98%', '30d 12h', 112, 'ap-southeast-1', 3),
    ('AI Inference', 'LLM Engine', 'Warning', '98.21%', '12d 6h', 352, 'us-east-1', 5),
    ('Workflow Engine', 'Automation', 'Healthy', '99.97%', '30d 12h', 156, 'eu-west-1', 3)
ON CONFLICT DO NOTHING;

-- Seed Alerts
INSERT INTO enterprise_infrastructure_alerts (title, target_resource, region, severity, metric_detail, status)
VALUES
    ('High memory usage on api-gateway-04', 'api-gateway-04', 'us-east-1', 'Warning', 'Memory 85%', 'active'),
    ('CPU usage high on worker-db-02', 'worker-db-02', 'us-west-1', 'Warning', 'CPU 89%', 'active'),
    ('Disk space low on redis-cache-01', 'redis-cache-01', 'us-east-1', 'Info', 'Disk 15%', 'active'),
    ('Network latency increased in eu-west-1', 'Multiple Nodes', 'eu-west-1', 'Info', 'Latency 310ms', 'active'),
    ('Database slow query detected', 'supabase-db', 'eu-west-1', 'Warning', 'Response 1.2s', 'active')
ON CONFLICT DO NOTHING;

-- Seed FinOps Costs
INSERT INTO enterprise_infrastructure_costs (category, amount_usd, percentage)
VALUES
    ('Compute', 11052.18, 45.0),
    ('Storage', 5648.90, 23.0),
    ('Network', 3684.06, 15.0),
    ('Database', 2456.04, 10.0),
    ('Others', 1719.22, 7.0)
ON CONFLICT DO NOTHING;

-- Seed Bandwidth (Top Talkers)
INSERT INTO enterprise_infrastructure_bandwidth (source_region, destination_region, transfer_tb)
VALUES
    ('us-east-1', 'ap-southeast-1', 2.45),
    ('ap-southeast-1', 'us-east-1', 1.82),
    ('us-east-1', 'eu-west-1', 1.12),
    ('eu-west-1', 'us-east-1', 0.95),
    ('ap-northeast-1', 'us-east-1', 0.72)
ON CONFLICT DO NOTHING;

-- Seed Inventory
INSERT INTO enterprise_infrastructure_inventory (resource_type, count_active)
VALUES
    ('Virtual Machines', 128),
    ('Containers', 96),
    ('Databases', 32),
    ('Volumes', 68),
    ('Load Balancers', 18),
    ('Kubernetes Clusters', 6)
ON CONFLICT (resource_type) DO UPDATE SET count_active = EXCLUDED.count_active;

-- Seed Security Posture
INSERT INTO enterprise_infrastructure_security_posture (metric_name, score_pct)
VALUES
    ('Patch Compliance', 98.60),
    ('Security Groups', 94.20),
    ('Encryption Coverage', 100.00),
    ('Backup Success Rate', 99.70)
ON CONFLICT (metric_name) DO UPDATE SET score_pct = EXCLUDED.score_pct;

-- Seed Ping Diagnostics (baseline latency measurements)
INSERT INTO enterprise_infrastructure_ping_diagnostics (source_region, target_region, latency_ms, packet_loss_pct, jitter_ms, status, overlay_mode)
VALUES
    ('us-east-1', 'ap-southeast-1', 165, 0.00, 2.30, 'success', 'latency'),
    ('us-east-1', 'eu-west-1', 85, 0.00, 1.10, 'success', 'latency'),
    ('us-east-1', 'ap-northeast-1', 142, 0.00, 3.50, 'success', 'latency'),
    ('us-east-1', 'sa-east-1', 120, 0.10, 2.80, 'success', 'latency'),
    ('ap-southeast-1', 'eu-west-1', 195, 0.00, 4.20, 'success', 'latency'),
    ('eu-west-1', 'ap-northeast-1', 210, 0.20, 5.10, 'success', 'latency'),
    ('ap-northeast-1', 'sa-east-1', 280, 0.30, 6.40, 'success', 'latency')
ON CONFLICT DO NOTHING;

-- Seed Traceroute Logs
INSERT INTO enterprise_infrastructure_traceroute_logs (source_region, target_region, hop_count, total_latency_ms, hops, status)
VALUES
    ('us-east-1', 'ap-southeast-1', 12, 165, '[{"hop":1,"ip":"10.0.1.1","ms":1},{"hop":2,"ip":"72.14.232.1","ms":8},{"hop":3,"ip":"108.170.236.1","ms":22},{"hop":12,"ip":"13.212.1.1","ms":165}]'::jsonb, 'completed'),
    ('us-east-1', 'eu-west-1', 8, 85, '[{"hop":1,"ip":"10.0.1.1","ms":1},{"hop":2,"ip":"72.14.232.1","ms":8},{"hop":8,"ip":"52.95.1.1","ms":85}]'::jsonb, 'completed'),
    ('us-east-1', 'ap-northeast-1', 14, 142, '[{"hop":1,"ip":"10.0.1.1","ms":1},{"hop":2,"ip":"72.14.232.1","ms":8},{"hop":14,"ip":"35.72.1.1","ms":142}]'::jsonb, 'completed')
ON CONFLICT DO NOTHING;

-- Seed Node Discovery (latest scan results per region)
INSERT INTO enterprise_infrastructure_node_discovery (region, discovered_nodes, new_nodes, removed_nodes, scan_duration_ms, scan_type, cdn_edge_nodes, status)
VALUES
    ('us-east-1', 42, 2, 0, 3200, 'full', 12, 'completed'),
    ('ap-southeast-1', 28, 1, 0, 2800, 'full', 8, 'completed'),
    ('eu-west-1', 24, 0, 1, 2400, 'full', 6, 'completed'),
    ('ap-northeast-1', 18, 0, 0, 1900, 'full', 5, 'completed'),
    ('sa-east-1', 16, 1, 0, 2100, 'full', 4, 'completed')
ON CONFLICT DO NOTHING;
