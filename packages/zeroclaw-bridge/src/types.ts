/**
 * @zega/zeroclaw-bridge — Type Definitions
 *
 * TypeScript interfaces derived from the upstream ZeroClaw v0.8.x
 * Rust gateway source code (zeroclaw-gateway crate).
 *
 * References:
 *   - crates/zeroclaw-gateway/src/lib.rs        (handle_health, handle_pair)
 *   - crates/zeroclaw-gateway/src/api_pairing.rs (DeviceInfo, PairingStore)
 *   - crates/zeroclaw-gateway/src/api_webhook.rs (WebhookBody)
 *   - crates/zeroclaw-gateway/src/version.rs     (VersionCheckResponse)
 */

// ── Health ──────────────────────────────────────────────────────────────

/** GET /health response from ZeroClaw gateway. */
export interface HealthResponse {
  status: 'ok' | 'error';
  paired: boolean;
  require_pairing: boolean;
  runtime: RuntimeHealth;
}

export interface RuntimeHealth {
  uptime_seconds?: number;
  components?: Record<string, ComponentHealth>;
}

export interface ComponentHealth {
  status: 'ok' | 'error';
  updated_at?: string;
  last_ok?: string;
  last_error?: string | null;
  restart_count?: number;
}

/** GET /api/health extended response (requires bearer token). */
export interface ApiHealthResponse {
  status: 'ok' | 'error';
  version?: string;
  paired: boolean;
  runtime: RuntimeHealth;
  sessions?: { active: number; total: number };
  channels?: string[];
}

// ── Pairing ─────────────────────────────────────────────────────────────

/**
 * POST /pair response.
 * Upstream: lib.rs handle_pair() → returns { paired, persisted, token, message }
 */
export interface PairResponse {
  paired: boolean;
  persisted?: boolean;
  token?: string;
  message?: string;
  error?: string;
  retry_after?: number;
}

/**
 * POST /api/pair (enhanced) body.
 * Upstream: api_pairing.rs submit_pairing_enhanced()
 */
export interface PairRequestBody {
  code: string;
  device_name?: string;
  device_type?: string;
}

/**
 * Device info from the upstream DeviceRegistry.
 * Upstream: api_pairing.rs DeviceInfo struct
 */
export interface DeviceInfo {
  id: string;
  name?: string | null;
  device_type?: string | null;
  paired_at: string;
  last_seen: string;
  ip_address?: string | null;
  capabilities?: string[] | null;
}

/** GET /api/devices response */
export interface DeviceListResponse {
  devices: DeviceInfo[];
  count: number;
}

// ── Webhook ─────────────────────────────────────────────────────────────

/**
 * POST /webhook body.
 * Upstream: lib.rs WebhookBody { message: String }
 */
export interface WebhookRequestBody {
  message: string;
}

/**
 * POST /webhook query parameters.
 * Upstream: lib.rs WebhookQuery { agent: Option<String> }
 */
export interface WebhookQuery {
  agent?: string;
}

/** POST /webhook response (variable shape but always includes response text). */
export interface WebhookResponse {
  response: string;
  session_id?: string;
  model?: string;
  [key: string]: unknown;
}

// ── Version ─────────────────────────────────────────────────────────────

/**
 * GET /api/version/check response.
 * Upstream: version.rs VersionCheckResponse
 */
export interface VersionCheckResponse {
  current_version: string;
  latest_version?: string;
  is_newer: boolean;
  tag?: string;
  error?: string;
}

// ── Sessions ────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
}

// ── Config ──────────────────────────────────────────────────────────────

export interface ConfigPropResponse {
  path: string;
  value?: unknown;
  populated?: boolean;
  is_secret?: boolean;
  type?: string;
}

// ── Bridge Client Options ───────────────────────────────────────────────

export interface ZeroClawBridgeOptions {
  /**
   * Base URL of the ZeroClaw gateway.
   * Default: 'http://127.0.0.1:4242'
   */
  gatewayUrl?: string;

  /**
   * Pre-existing bearer token from a previous pairing session.
   * If provided, the client skips pairing and uses this token directly.
   */
  bearerToken?: string;

  /**
   * Request timeout in milliseconds.
   * Default: 5000 (5 seconds)
   */
  timeoutMs?: number;

  /**
   * Maximum number of retry attempts for transient failures.
   * Default: 2
   */
  maxRetries?: number;

  /**
   * Device name sent during pairing (stored in upstream DeviceRegistry).
   * Default: 'ZEGA AI Bridge'
   */
  deviceName?: string;

  /**
   * Device type sent during pairing.
   * Default: 'api-bridge'
   */
  deviceType?: string;

  /**
   * User-Agent header sent with all requests.
   */
  userAgent?: string;
}

// ── Connection State ────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'paired' | 'error';

export interface BridgeState {
  status: ConnectionStatus;
  gatewayUrl: string;
  daemonVersion: string | null;
  paired: boolean;
  lastHealthCheck: string | null;
  lastError: string | null;
  uptimeSeconds: number | null;
  components: Record<string, ComponentHealth>;
}

// ── Supported Versions ──────────────────────────────────────────────────

export interface VersionCompatibility {
  minVersion: string;
  maxVersion: string;
  currentVersion: string | null;
  compatible: boolean;
  message: string;
}

// ── MCP Server Types ────────────────────────────────────────────────────

export interface McpServerConfig {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  status: 'connected' | 'disconnected' | 'error';
  toolCount?: number;
}

export interface McpToolCallRequest {
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface McpToolCallResponse {
  server: string;
  tool: string;
  result: unknown;
  latencyMs: number;
}

// ── Relationship Memory Types ───────────────────────────────────────────

export type MemoryNodeType =
  | 'client'
  | 'contact'
  | 'interaction'
  | 'pattern'
  | 'decision'
  | 'lesson'
  | 'expert'
  | 'technology';

export type MemoryRelationType =
  | 'uses'
  | 'replaces'
  | 'extends'
  | 'authored_by'
  | 'applies_to'
  | 'manages_client'
  | 'contact_of'
  | 'interacted_with';

export interface MemoryNode {
  id: string;
  nodeType: MemoryNodeType;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  userId?: string;
}

export interface MemoryEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relation: MemoryRelationType;
  createdAt: string;
}

export interface MemoryCaptureRequest {
  action: 'capture';
  node_type: MemoryNodeType;
  title: string;
  content: string;
  tags?: string[];
}

export interface MemoryRelateRequest {
  action: 'relate';
  from_id: string;
  to_id: string;
  relation: MemoryRelationType;
}

export interface MemorySearchRequest {
  action: 'search' | 'graph_neighbors' | 'client_network' | 'interaction_log';
  query?: string;
  node_id?: string;
  client_id?: string;
  limit?: number;
}

// ── SOP Lifecycle Types ─────────────────────────────────────────────────

export type SopRunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface SopDefinition {
  name: string;
  description: string;
  version: string;
  triggerTypes: string[];
  stepCount: number;
}

export interface SopRun {
  id: string;
  sopName: string;
  status: SopRunStatus;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string;
  pendingApproval?: boolean;
  checkpointId?: string;
}

export interface SopTriggerRequest {
  sopName: string;
  triggerType?: 'manual' | 'cron' | 'channel';
  payload?: Record<string, unknown>;
}

export interface SopApprovalRequest {
  runId: string;
  decision: 'approve' | 'deny';
  reason?: string;
}

// ── DeFi Guardian Types ─────────────────────────────────────────────────

export interface TokenPrice {
  mint: string;
  symbol: string;
  price: number;
  changePct24h: number;
  source: 'jupiter' | 'switchboard';
  updatedAt: string;
}

export interface DeFiAlert {
  id: string;
  tokenMint: string;
  thresholdPct: number;
  direction: 'above' | 'below';
  enabled: boolean;
  lastTriggered?: string;
}

export interface PortfolioSummary {
  solBalance: number;
  usdcBalance: number;
  totalValueUsd: number;
  positions: TokenPrice[];
  alerts: DeFiAlert[];
}

// ── Blinks / Solana Actions Types ───────────────────────────────────────

export interface SolanaActionPreview {
  icon: string;
  title: string;
  description: string;
  label: string;
  links?: {
    actions: Array<{
      label: string;
      href: string;
    }>;
  };
}

export interface SolanaActionPostRequest {
  account: string;
}

export interface SolanaActionPostResponse {
  transaction: string; // base64-encoded unsigned transaction
  message: string;
}
