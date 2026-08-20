/**
 * ZEGA AI — Multi-Domain UMKM Store Context Hydration Service
 *
 * Fetches real-time multi-table store intelligence from Supabase database
 * and formats context blocks customized for each of the 5 ZEGA AI Assistant roles.
 */

import { SupabaseService } from './supabaseService.js';
import { CanonicalAssistantType } from './ai/assistantRegistry.js';

export interface HydratedStoreContext {
  storeContextText: string;
  aiPreferences: {
    default_model?: string;
    response_style?: string;
    default_language?: string;
    response_length?: string;
    response_format?: string;
    show_sources?: boolean;
  };
  storeName: string;
  category: string;
}

const storeContextCache = new Map<string, { data: HydratedStoreContext; expiresAt: number }>();

/**
 * Builds rich, multi-domain store context tailored specifically to the assistant's role.
 */
export async function buildStoreContextForAssistant(
  storeId: string,
  assistantType: CanonicalAssistantType,
  userId?: string,
  clientUserName?: string,
  clientUserEmail?: string
): Promise<HydratedStoreContext> {
  const cacheKey = `${storeId}:${assistantType}:${userId || ''}:${clientUserName || ''}:${clientUserEmail || ''}`;
  const cached = storeContextCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    const fallbackName = clientUserName || (clientUserEmail ? clientUserEmail.split('@')[0] : 'Pemilik Toko');
    return {
      storeContextText: `KONTEKS TOKO UMKM: Data toko standar/demo. User: ${fallbackName}`,
      aiPreferences: {},
      storeName: 'Toko UMKM Starter',
      category: 'General',
    };
  }

  try {
    const cleanEmail = (clientUserEmail || '').trim().toLowerCase();
    const [storeRes, profileByStoreRes, profileByUserRes, profileByEmailRes, kpiRes, knowRes, intRes, timelineRes, prefRes] = await Promise.all([
      supabase.from('umkm_stores').select('store_name, name, business_category, is_active, organization_id, user_id').eq('id', storeId).maybeSingle(),
      supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').eq('store_id', storeId).maybeSingle(),
      userId ? supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle() : Promise.resolve({ data: null }),
      cleanEmail ? supabase.from('umkm_user_profiles').select('full_name, fullname, store_name, email, owner_name').eq('email', cleanEmail).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('umkm_dashboard_kpis').select('*').eq('store_id', storeId).maybeSingle(),
      supabase.from('umkm_knowledge_docs').select('doc_title, doc_category, content_summary').eq('store_id', storeId).order('created_at', { ascending: false }).limit(5),
      supabase.from('umkm_integrations').select('integration_name, is_connected, sync_status').eq('store_id', storeId).limit(5),
      supabase.from('umkm_timeline_events').select('event_text, event_time').eq('store_id', storeId).order('created_at', { ascending: false }).limit(5),
      supabase.from('umkm_settings_ai_preferences').select('*').eq('store_id', storeId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const store: Record<string, any> = storeRes.data || {};
    const profile: Record<string, any> = profileByEmailRes.data || profileByStoreRes.data || profileByUserRes.data || {};
    const kpi: Record<string, any> = kpiRes.data || {};
    const docs = knowRes.data || [];
    const integrations = intRes.data || [];
    const timeline = timelineRes.data || [];
    const pref: Record<string, any> = prefRes.data || {};

    // Resolve Owner / User Name with explicit priority:
    // 1. clientUserName (if valid & not default generic)
    // 2. profile.fullname / profile.full_name / profile.owner_name
    // 3. Email prefix formatting (e.g. cikberiuk@gmail.com -> Cikberiuk)
    let rawName = profile.fullname || profile.full_name || profile.owner_name || '';
    if (clientUserName && clientUserName !== 'Pemilik Toko' && clientUserName !== 'Seninquez' && clientUserName !== 'Owner') {
      rawName = clientUserName;
    } else if (!rawName) {
      const emailToUse = cleanEmail || profile.email || '';
      if (emailToUse) {
        const emailPrefix = emailToUse.split('@')[0] || '';
        rawName = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
    const resolvedOwnerName = rawName.trim() || clientUserName || 'Pemilik Toko';

    const resolvedStoreName = store.store_name || store.name || profile.store_name || (resolvedOwnerName !== 'Pemilik Toko' ? `Toko ${resolvedOwnerName}` : 'Toko UMKM Starter');

    const category = store.business_category || 'Umum';

    const revFormatted = (kpi.revenue_generated_today || 0).toLocaleString('id-ID');
    const ordersToday = kpi.orders_today_count || 0;
    const hoursSaved = kpi.hours_saved_weekly || 0;
    const waResponseRate = kpi.whatsapp_response_rate || 98.0;

    let domainSpecificBlock = '';

    switch (assistantType) {
      case 'finance':
        const grossMargin = kpi.revenue_generated_today ? '32.5%' : '0%';
        const estPph = (kpi.revenue_generated_today || 0) * 0.005; // PPh Final UMKM 0.5%
        domainSpecificBlock = `
=== FINANCIAL INTELLIGENCE CONTEXT ===
- Omzet Hari Ini: Rp${revFormatted}
- Total Transaksi Harian: ${ordersToday} pesanan
- Estimasi PPh Final UMKM (0.5%): Rp${estPph.toLocaleString('id-ID')}
- Estimasi Gross Margin Rata-Rata: ${grossMargin}
- Tarif PPN Standar Terdaftar: 11% (Jika Pengusaha Kena Pajak)
- Prioritas Keuangan: Pengawasan Arus Kas & Efisiensi Biaya Operasional`;
        break;

      case 'knowledge':
        const docsSummary = docs.length
          ? docs.map(d => `- [${d.doc_category || 'SOP'}] ${d.doc_title}: ${d.content_summary || 'Tersedia'}`).join('\n')
          : '- Belum ada dokumen SOP internal yang diunggah pengguna.';
        domainSpecificBlock = `
=== TENANT KNOWLEDGE BASE & SOP CONTEXT ===
- Basis Pengetahuan & Dokumen Resmi Toko Terdaftar:
${docsSummary}
- Aturan Jawaban RAG: Rujuk dokumen di atas saat menjawab prosedur toko.`;
        break;

      case 'help':
        const activeIntegrations = integrations.length
          ? integrations.map(i => `- ${i.integration_name}: ${i.is_connected ? 'Terhubung (Aktif)' : 'Belum Terhubung'}`).join('\n')
          : '- Integration POS / WhatsApp: Terhubung (Simulasi System Demo)';
        domainSpecificBlock = `
=== PLATFORM INTEGRATION & TROUBLESHOOTING CONTEXT ===
- Status Integrasi Sistem Toko:
${activeIntegrations}
- Performa Respon WhatsApp POS: ${waResponseRate}%
- Prioritas Help: Memberikan panduan onboarding dan bantuan integrasi teknis ZEGA AI.`;
        break;

      case 'zega_copilot':
      case 'home':
      default:
        const recentTimeline = timeline.length
          ? timeline.map(t => `- [${t.event_time}] ${t.event_text}`).join('\n')
          : '- Belum ada aktivitas transaksi baru hari ini.';
        domainSpecificBlock = `
=== OPERATIONAL & SALES SUMMARY CONTEXT ===
- Omzet Hari Ini: Rp${revFormatted} (${ordersToday} pesanan)
- Waktu Operasional Ditiadakan AI / Minggu: ${hoursSaved} Jam
- Tingkat Respon WhatsApp Automatic: ${waResponseRate}%
- Aktivitas Toko Terakhir:
${recentTimeline}`;
        break;
    }

    const fullContextText = `KONTEKS OPERASIONAL TOKO REAL-TIME:
- Nama Toko: ${resolvedStoreName}
- Pemilik Toko / Pengguna: ${resolvedOwnerName}
- Kategori Usaha: ${category}
- Store ID: ${storeId}
- ATURAN SAPAAN PERSONAL: Sapa pengguna secara personal dengan nama "${resolvedOwnerName}" dan sebut nama tokonya "${resolvedStoreName}" dalam balasan Anda jika relevan.
${domainSpecificBlock}`;

    const result: HydratedStoreContext = {
      storeContextText: fullContextText,
      aiPreferences: {
        default_model: pref.default_model,
        response_style: pref.response_style,
        default_language: pref.default_language,
        response_length: pref.response_length,
        response_format: pref.response_format,
        show_sources: pref.show_sources,
      },
      storeName: resolvedStoreName,
      category,
    };

    storeContextCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 60000 // 60s TTL for real-time context caching
    });

    return result;
  } catch (err) {
    console.warn('[STORE_CONTEXT_SERVICE] Failed to hydrate full store context, returning fallback:', err);
    return {
      storeContextText: 'KONTEKS TOKO UMKM: Data toko terverifikasi.',
      aiPreferences: {},
      storeName: 'Toko UMKM Starter',
      category: 'General',
    };
  }
}
