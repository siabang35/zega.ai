/**
 * ZEGA AI — Swarm Capability Registry
 *
 * Authorization-aware registry that maps swarm types to capabilities
 * and resolves which swarms a tenant has access to.
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * 1. Which capabilities exist across all swarm domains
 * 2. Which swarm type provides each capability
 * 3. Authorization filtering per tenant graph
 */

import { SupabaseService } from '../supabaseService.js';

// ─── Canonical Swarm Domain Types ────────────────────────────────────────────

export type SwarmDomain =
  | 'inventory'
  | 'sales'
  | 'product'
  | 'demand'
  | 'procurement'
  | 'operations';

export interface SwarmCapabilityDefinition {
  domain: SwarmDomain;
  name: string;
  description: string;
  capabilities: string[];
  systemPromptFragment: string;
}

export interface ResolvedSwarm {
  id: string;
  domain: SwarmDomain;
  name: string;
  status: string;
  capabilities: string[];
  organizationId: string;
  storeId: string;
}

// ─── Static Capability Definitions (Ground Truth) ───────────────────────────

export const SWARM_CAPABILITY_MAP: Record<SwarmDomain, SwarmCapabilityDefinition> = {
  inventory: {
    domain: 'inventory',
    name: 'Inventory Intelligence Swarm',
    description: 'Stock monitoring, low-stock detection, dead-stock analysis, demand forecasting, and reorder planning.',
    capabilities: [
      'inventory.read',
      'inventory.analysis',
      'inventory.stock_monitor',
      'inventory.low_stock',
      'inventory.dead_stock',
      'inventory.demand_forecast',
      'inventory.reorder',
      'inventory.write',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait persediaan barang, stok, inventaris, restok, dan prediksi kebutuhan barang.',
  },

  sales: {
    domain: 'sales',
    name: 'Sales Analytics Swarm',
    description: 'Revenue analysis, transaction trends, top-selling products, and channel performance.',
    capabilities: [
      'sales.read',
      'sales.analysis',
      'sales.revenue',
      'sales.trends',
      'sales.top_products',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait penjualan, omzet, tren transaksi, dan performa channel penjualan.',
  },

  product: {
    domain: 'product',
    name: 'Product Catalog Swarm',
    description: 'Product search, catalog management, pricing analysis, and category insights.',
    capabilities: [
      'product.read',
      'product.search',
      'product.analysis',
      'product.catalog',
      'product.pricing',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait katalog produk, pencarian produk, harga, dan kategori.',
  },

  demand: {
    domain: 'demand',
    name: 'Demand Forecasting Swarm',
    description: 'Demand projection, stockout risk prediction, and seasonal trend analysis.',
    capabilities: [
      'demand.forecast',
      'demand.analysis',
      'demand.seasonal',
      'demand.stockout_risk',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait proyeksi permintaan, prediksi risiko habis stok, dan analisis tren musiman.',
  },

  procurement: {
    domain: 'procurement',
    name: 'Procurement Advisory Swarm',
    description: 'Reorder recommendations, supplier analysis, purchase planning, and cost optimization.',
    capabilities: [
      'procurement.recommendation',
      'procurement.supplier',
      'procurement.planning',
      'procurement.cost_optimization',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait pembelian barang, rekomendasi supplier, perencanaan restok, dan optimisasi biaya pengadaan.',
  },

  operations: {
    domain: 'operations',
    name: 'Operations Intelligence Swarm',
    description: 'Overall store performance, KPI dashboard, business health scoring, and operational recommendations.',
    capabilities: [
      'operations.read',
      'operations.analysis',
      'operations.kpi',
      'operations.health_score',
      'operations.recommendations',
    ],
    systemPromptFragment: 'Anda menangani semua pertanyaan terkait performa operasional toko, KPI bisnis, skor kesehatan usaha, dan rekomendasi operasional.',
  },
};

// ─── Intent-to-Capability Mapping ───────────────────────────────────────────

/**
 * Fast keyword-based intent → capabilities resolver (Layer 1).
 * Returns the set of capabilities required to fulfill the user's request.
 */
export function resolveCapabilitiesFromKeywords(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const matched: Set<string> = new Set();

  // Inventory signals
  if (/stok|stock|inventar|persediaan|barang|sku|gudang|warehouse|item|unit/i.test(lower)) {
    matched.add('inventory.read');
    matched.add('inventory.analysis');
  }
  if (/menipis|habis|kritis|low.?stock|out.?of.?stock|running.?low|few.?left/i.test(lower)) {
    matched.add('inventory.low_stock');
  }
  if (/dead.?stock|menumpuk|tidak.?laku|stagnant|slow.?moving/i.test(lower)) {
    matched.add('inventory.dead_stock');
  }
  if (/restock|restok|reorder|isi.?ulang|pesan.?ulang|pengisian|replenish/i.test(lower)) {
    matched.add('inventory.reorder');
    matched.add('procurement.recommendation');
  }
  if (/update.?stok|ubah.?stok|perbarui.?stok|sesuai.?stok|change.?stock|set.?stock/i.test(lower)) {
    matched.add('inventory.write');
  }

  // Sales signals
  if (/penjualan|sales|omzet|revenue|transaksi|transaction|terjual|laku|order|sold/i.test(lower)) {
    matched.add('sales.read');
    matched.add('sales.analysis');
  }
  if (/tren|trend|naik|turun|pertumbuhan|growth/i.test(lower)) {
    matched.add('sales.trends');
  }
  if (/top.?sell|terlaris|paling.?laku|best.?sell/i.test(lower)) {
    matched.add('sales.top_products');
  }

  // Product signals
  if (/produk|product|katalog|catalog|harga|price|kategori|category/i.test(lower)) {
    matched.add('product.read');
    matched.add('product.analysis');
  }
  if (/cari.?produk|search.?product|temukan|find.?product/i.test(lower)) {
    matched.add('product.search');
  }

  // Demand signals
  if (/prediksi|forecast|proyeksi|estimasi|demand|kebutuhan/i.test(lower)) {
    matched.add('demand.forecast');
    matched.add('demand.analysis');
  }
  if (/stockout|risiko.?habis|akan.?habis|run.?out/i.test(lower)) {
    matched.add('demand.stockout_risk');
  }

  // Procurement signals
  if (/beli|purchase|supplier|pemasok|pengadaan|procurement|po\b/i.test(lower)) {
    matched.add('procurement.recommendation');
    matched.add('procurement.planning');
  }

  // Operations / General / Identity signals
  if (/kpi|performa|performance|dashboard|ringkasan|summary|overview|kesehatan|health|who.?are.?you|real.?model|real.?ai|what.?can.?you.?do/i.test(lower)) {
    matched.add('operations.read');
    matched.add('operations.analysis');
  }

  // If nothing matched, default to operations & inventory overview
  if (matched.size === 0) {
    matched.add('operations.read');
    matched.add('inventory.read');
  }

  return Array.from(matched);
}

/**
 * Maps a set of required capabilities to the swarm domains that provide them.
 */
export function resolveDomainsFromCapabilities(capabilities: string[]): SwarmDomain[] {
  const domains: Set<SwarmDomain> = new Set();

  for (const cap of capabilities) {
    for (const [domain, def] of Object.entries(SWARM_CAPABILITY_MAP)) {
      if (def.capabilities.includes(cap)) {
        domains.add(domain as SwarmDomain);
      }
    }
  }

  return Array.from(domains);
}

/**
 * Resolves authorized swarms for a tenant from the database.
 * Falls back to synthetic swarm entries if none are deployed yet.
 */
export async function resolveAuthorizedSwarms(
  tenantContext: { organizationId: string; storeId: string; userId?: string }
): Promise<ResolvedSwarm[]> {
  const supabase = SupabaseService.getClient();
  if (!supabase) {
    return getDefaultSwarms(tenantContext);
  }

  try {
    let swarmQuery = supabase
      .from('ai_swarms')
      .select('id, name, objective, status, configuration, organization_id, store_id')
      .eq('status', 'ACTIVE');

    if (tenantContext.storeId) {
      swarmQuery = swarmQuery.eq('store_id', tenantContext.storeId);
    } else if (tenantContext.organizationId) {
      swarmQuery = swarmQuery.eq('organization_id', tenantContext.organizationId);
    }

    const { data: swarms, error } = await swarmQuery;

    if (error || !swarms || swarms.length === 0) {
      return getDefaultSwarms(tenantContext);
    }

    return swarms.map((s: any) => {
      const domain = objectiveToDomain(s.objective);
      return {
        id: s.id,
        domain,
        name: s.name,
        status: s.status,
        capabilities: SWARM_CAPABILITY_MAP[domain]?.capabilities || [],
        organizationId: s.organization_id,
        storeId: s.store_id,
      };
    });
  } catch {
    return getDefaultSwarms(tenantContext);
  }
}

/**
 * Maps swarm objective strings to canonical SwarmDomain.
 */
function objectiveToDomain(objective: string): SwarmDomain {
  const lower = (objective || '').toLowerCase();
  if (lower.includes('inventory') || lower.includes('stock')) return 'inventory';
  if (lower.includes('sales') || lower.includes('revenue')) return 'sales';
  if (lower.includes('product') || lower.includes('catalog')) return 'product';
  if (lower.includes('demand') || lower.includes('forecast')) return 'demand';
  if (lower.includes('procurement') || lower.includes('supplier')) return 'procurement';
  if (lower.includes('operations') || lower.includes('general')) return 'operations';
  return 'operations';
}

/**
 * Returns default synthetic swarms when none are deployed.
 * This allows the universal chat to function immediately for new tenants.
 */
function getDefaultSwarms(
  ctx: { organizationId: string; storeId: string }
): ResolvedSwarm[] {
  return (Object.entries(SWARM_CAPABILITY_MAP) as [SwarmDomain, SwarmCapabilityDefinition][]).map(
    ([domain, def]) => ({
      id: `default-${domain}-${ctx.storeId.substring(0, 8)}`,
      domain,
      name: def.name,
      status: 'ACTIVE',
      capabilities: def.capabilities,
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
    })
  );
}
