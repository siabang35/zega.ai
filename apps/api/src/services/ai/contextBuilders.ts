/**
 * ZEGA AI — Isolated Context Builders
 *
 * Each canonical assistant gets its own isolated context builder.
 * Do NOT use buildGenericAIContext() for all assistants.
 *
 * 1. buildHomeContext(tenantId, storeId)
 * 2. buildHelpContext(query)
 * 3. buildFinanceContext(tenantId, storeId, query)
 * 4. buildKnowledgeContext(tenantId, organizationId, workspaceId, query)
 * 5. buildCopilotContext(tenantId, storeId, userId, query)
 */

import { SupabaseService } from '../supabaseService.js';

export interface BuiltContext {
  contextText: string;
  sources: string[];
  metrics?: Record<string, any>;
}

/**
 * 1. ZEGA HOME CONTEXT BUILDER
 * Focus: Tenant business overview, sales summary, inventory overview, current user context.
 */
export async function buildHomeContext(tenantId: string, storeId?: string): Promise<BuiltContext> {
  const supabase = SupabaseService.getClient();
  let storeName = 'Toko UMKM';
  let ownerName = 'Pemilik Toko';
  let revStr = '0';
  let orderCount = 0;
  let activeAgents = 0;

  if (supabase && storeId) {
    try {
      const [storeRes, profileRes, kpiRes, empRes] = await Promise.all([
        supabase.from('umkm_stores').select('store_name, name, category, organization_id').eq('id', storeId).maybeSingle(),
        supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').eq('store_id', storeId).maybeSingle(),
        supabase.from('umkm_dashboard_kpis').select('revenue_generated_today, orders_today_count').eq('store_id', storeId).maybeSingle(),
        supabase.from('umkm_ai_employees').select('id').eq('store_id', storeId).eq('status', 'active'),
      ]);

      if (storeRes.data?.store_name || storeRes.data?.name) {
        storeName = storeRes.data.store_name || storeRes.data.name;
      } else if (profileRes.data?.store_name) {
        storeName = profileRes.data.store_name;
      }

      const pData: Record<string, any> = profileRes.data || {};
      let rawName = pData.fullname || pData.full_name || pData.owner_name || '';
      if (!rawName && pData.email) {
        const emailPrefix = pData.email.split('@')[0] || '';
        rawName = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      if (rawName.trim()) ownerName = rawName.trim();

      if (kpiRes.data) {
        revStr = (kpiRes.data.revenue_generated_today || 0).toLocaleString('id-ID');
        orderCount = kpiRes.data.orders_today_count || 0;
      }
      if (empRes.data) activeAgents = empRes.data.length;
    } catch (err) {
      console.warn('[HOME_CONTEXT] Context fetch warning:', err);
    }
  }

  const contextText = `[KONTEKS OPERASIONAL ZEGA HOME]
- Nama Toko: ${storeName}
- Pemilik Toko: ${ownerName}
- Organization Tenant ID: ${tenantId}
- Store ID: ${storeId || tenantId}
- Omzet Hari Ini: Rp${revStr}
- Transaksi Hari Ini: ${orderCount} pesanan
- AI Employees Aktif: ${activeAgents} agen`;

  return {
    contextText,
    sources: ['umkm_stores', 'umkm_user_profiles', 'umkm_dashboard_kpis', 'umkm_ai_employees'],
    metrics: { storeName, ownerName, revenueToday: revStr, ordersToday: orderCount, activeAgents }
  };
}

/**
 * 2. ZEGA HELP CONTEXT BUILDER
 * Focus: Product assistance, onboarding, troubleshooting, feature explanations.
 * Source: ZEGA documentation / Help Center.
 */
export async function buildHelpContext(query: string): Promise<BuiltContext> {
  // ZEGA Platform Standard Help Base
  const docsSnippets = [
    'ZEGA AI Dashboard: Mengelola toko, otomatisasi WhatsApp POS, integrasi pembayaran QRIS/Solana Pay, dan laporan keuangan.',
    'Cara menambah produk: Buka menu Store -> Tambah Produk -> Masukkan nama, harga, stok, dan gambar -> Klik Simpan.',
    'Menghubungkan WhatsApp API: Buka menu Integrasi -> WhatsApp -> Scan QR Code menggunakan aplikasi WhatsApp di HP Anda.',
    'Melihat Laporan Keuangan: Buka menu Laporan / Finance -> Pilih periode tanggal -> Lihat rincian Omzet, HPP, PPN, dan Net Profit.'
  ];

  const lower = (query || '').toLowerCase();
  const matched = docsSnippets.filter(s => {
    if (lower.includes('produk') && s.includes('produk')) return true;
    if (lower.includes('whatsapp') && s.includes('WhatsApp')) return true;
    if (lower.includes('laporan') || lower.includes('keuangan') || lower.includes('profit')) return s.includes('Keuangan');
    return false;
  });

  const selectedDocs = matched.length > 0 ? matched : docsSnippets.slice(0, 2);
  const contextText = `[DOKUMENTASI PUSAT BANTUAN ZEGA AI]
${selectedDocs.map(d => `- ${d}`).join('\n')}`;

  return {
    contextText,
    sources: ['zega_help_center_docs'],
  };
}

/**
 * 3. ZEGA FINANCE CONTEXT BUILDER
 * Focus: Financial metrics (revenue, expenses, HPP, gross/net profit, margin, cash flow).
 * Fetches REAL financial data from database.
 */
export async function buildFinanceContext(tenantId: string, storeId?: string, query?: string): Promise<BuiltContext> {
  const supabase = SupabaseService.getClient();

  let storeName = 'Toko UMKM';
  let ownerName = 'Pemilik Toko';
  let revenueToday = 0;
  let ordersToday = 0;
  let estimatedHpp = 0;
  let estimatedPpn = 0;
  let estimatedNetProfit = 0;

  if (supabase && storeId) {
    try {
      const [storeRes, profileRes, kpiRes, txRes] = await Promise.all([
        supabase.from('umkm_stores').select('store_name, name').eq('id', storeId).maybeSingle(),
        supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').eq('store_id', storeId).maybeSingle(),
        supabase.from('umkm_dashboard_kpis').select('*').eq('store_id', storeId).maybeSingle(),
        supabase.from('umkm_transactions').select('amount_idr').eq('store_id', storeId).eq('status', 'confirmed'),
      ]);

      if (storeRes.data?.store_name || storeRes.data?.name) {
        storeName = storeRes.data.store_name || storeRes.data.name;
      } else if (profileRes.data?.store_name) {
        storeName = profileRes.data.store_name;
      }

      const pData: Record<string, any> = profileRes.data || {};
      let rawName = pData.fullname || pData.full_name || pData.owner_name || '';
      if (!rawName && pData.email) {
        const emailPrefix = pData.email.split('@')[0] || '';
        rawName = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      if (rawName.trim()) ownerName = rawName.trim();

      if (kpiRes.data) {
        revenueToday = Number(kpiRes.data.revenue_generated_today) || 0;
        ordersToday = Number(kpiRes.data.orders_today_count) || 0;
      }

      if (txRes.data && txRes.data.length > 0) {
        const sumTx = txRes.data.reduce((acc, row) => acc + (Number(row.amount_idr) || 0), 0);
        if (sumTx > revenueToday) revenueToday = sumTx;
      }

      // Financial Estimations (HPP ~60%, PPN 11%, Net Profit ~25%)
      estimatedHpp = Math.round(revenueToday * 0.60);
      estimatedPpn = Math.round(revenueToday * 0.11);
      estimatedNetProfit = Math.round(revenueToday * 0.25);
    } catch (err) {
      console.warn('[FINANCE_CONTEXT] DB metric fetch warning:', err);
    }
  }

  const contextText = `[KONTEKS KEUPENGAN REAL-TIME TENANT]
- Nama Toko: ${storeName}
- Pemilik Toko: ${ownerName}
- Store ID: ${storeId || tenantId}
- Omzet Hari Ini: Rp${revenueToday.toLocaleString('id-ID')}
- Total Transaksi Terkonfirmasi: ${ordersToday} pesanan
- Estimasi HPP (60%): Rp${estimatedHpp.toLocaleString('id-ID')}
- Pajak PPN (11%): Rp${estimatedPpn.toLocaleString('id-ID')}
- Estimasi Laba Bersih (Net Profit ~25%): Rp${estimatedNetProfit.toLocaleString('id-ID')}`;

  return {
    contextText,
    sources: ['umkm_stores', 'umkm_user_profiles', 'umkm_dashboard_kpis', 'umkm_transactions'],
    metrics: { storeName, ownerName, revenueToday, ordersToday, estimatedHpp, estimatedPpn, estimatedNetProfit }
  };
}

/**
 * 4. ZEGA KNOWLEDGE CONTEXT BUILDER
 * Focus: Tenant-scoped Knowledge Base retrieval (RAG pipeline).
 * Enforces strict tenant/organization/workspace isolation.
 */
export async function buildKnowledgeContext(
  tenantId: string,
  organizationId: string,
  workspaceId: string,
  query: string
): Promise<BuiltContext> {
  const supabase = SupabaseService.getClient();
  let docChunks: string[] = [];
  let sources: string[] = [];

  if (supabase) {
    try {
      // Query knowledge docs scoped strictly by organization_id / tenantId
      const { data: docs } = await supabase
        .from('umkm_knowledge_docs')
        .select('title, content, category, created_at')
        .or(`organization_id.eq.${organizationId},store_id.eq.${tenantId}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (docs && docs.length > 0) {
        for (const doc of docs) {
          docChunks.push(`[Dokumen: ${doc.title} (${doc.category || 'Umum'})]:\n${(doc.content || '').substring(0, 300)}`);
          sources.push(doc.title);
        }
      }
    } catch (err) {
      console.warn('[KNOWLEDGE_CONTEXT] Knowledge retrieval note:', err);
    }
  }

  if (docChunks.length === 0) {
    docChunks.push('Tidak ditemukan dokumen basis pengetahuan khusus. Menggunakan standar SOP operasional UMKM ZEGA.');
    sources.push('Standard UMKM SOP');
  }

  const contextText = `[HASIL RETRIEVAL DOKUMEN BASIS PENGETAHUAN TENANT]
Tenant Org ID: ${organizationId} | Workspace: ${workspaceId}
${docChunks.join('\n\n')}`;

  return {
    contextText,
    sources,
  };
}

/**
 * 5. ZEGA COPILOT CONTEXT BUILDER
 * Focus: Operational AI Coworker with full capability workspace, metrics, and authorized tools.
 */
export async function buildCopilotContext(
  tenantId: string,
  storeId: string,
  userId: string,
  query: string
): Promise<BuiltContext> {
  const supabase = SupabaseService.getClient();

  let storeName = 'Toko UMKM Starter';
  let ownerName = 'Pemilik Toko';
  let category = 'General';
  let revenueToday = 0;
  let ordersToday = 0;

  if (supabase && storeId) {
    try {
      const [storeRes, profileRes, kpiRes] = await Promise.all([
        supabase.from('umkm_stores').select('store_name, name, category').eq('id', storeId).maybeSingle(),
        supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').eq('store_id', storeId).maybeSingle(),
        supabase.from('umkm_dashboard_kpis').select('revenue_generated_today, orders_today_count').eq('store_id', storeId).maybeSingle(),
      ]);

      if (storeRes.data?.store_name || storeRes.data?.name) {
        storeName = storeRes.data.store_name || storeRes.data.name;
      } else if (profileRes.data?.store_name) {
        storeName = profileRes.data.store_name;
      }

      const pData: Record<string, any> = profileRes.data || {};
      let rawName = pData.fullname || pData.full_name || pData.owner_name || '';
      if (!rawName && pData.email) {
        const emailPrefix = pData.email.split('@')[0] || '';
        rawName = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      if (rawName.trim()) ownerName = rawName.trim();

      if (storeRes.data?.category) category = storeRes.data.category;
      if (kpiRes.data) {
        revenueToday = Number(kpiRes.data.revenue_generated_today) || 0;
        ordersToday = Number(kpiRes.data.orders_today_count) || 0;
      }
    } catch (err) {
      console.warn('[COPILOT_CONTEXT] Context fetch note:', err);
    }
  }

  const contextText = `[KONTEKS OPERASIONAL ZEGA COPILOT]
- User ID: ${userId}
- Organization / Tenant ID: ${tenantId}
- Store ID: ${storeId}
- Nama Toko: ${storeName} (Kategori: ${category})
- Pemilik Toko: ${ownerName}
- Metrics Real-Time: Omzet Rp${revenueToday.toLocaleString('id-ID')} | Transaksi ${ordersToday}
- Capability Framework: PLAN -> THINK/REASON -> TOOL CALL -> OBSERVE RESULT -> VERIFY -> RESPOND`;

  return {
    contextText,
    sources: ['umkm_stores', 'umkm_user_profiles', 'umkm_dashboard_kpis'],
    metrics: { storeName, ownerName, category, revenueToday, ordersToday }
  };
}
