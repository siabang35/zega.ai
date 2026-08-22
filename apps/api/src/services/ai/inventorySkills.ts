/**
 * ZEGA AI — Inventory Skills System
 *
 * First-class skill definitions mapping high-level inventory intelligence tasks
 * to controlled inventory tools and specialized agent prompts.
 */

export interface InventorySkillDefinition {
  id: string;
  name: string;
  category: 'MONITORING' | 'FORECASTING' | 'ANALYSIS' | 'ADVISORY' | 'REPORTING';
  description: string;
  requiredTools: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export const INVENTORY_SKILLS: Record<string, InventorySkillDefinition> = {
  'inventory.read': {
    id: 'inventory.read',
    name: 'Baca Catalog & Data Stok',
    category: 'MONITORING',
    description: 'Mengambil catalog produk dan data ketersediaan stok fisik secara realtime.',
    requiredTools: ['inventory.list_products', 'inventory.get_product'],
    inputSchema: { category: 'string', status: 'string', limit: 'number' },
    outputSchema: { total: 'number', products: 'array' },
  },
  'inventory.analyze': {
    id: 'inventory.analyze',
    name: 'Analisis Kesehatan Stok',
    category: 'ANALYSIS',
    description: 'Menganalisis rasio stok sehat, nilai modal mengendap, dan performa turnover produk.',
    requiredTools: ['inventory.get_stock_metrics', 'inventory.get_sales_velocity'],
    inputSchema: {},
    outputSchema: { stockHealthScore: 'number', metrics: 'object' },
  },
  'inventory.monitor': {
    id: 'inventory.monitor',
    name: 'Pemantauan Stok Realtime',
    category: 'MONITORING',
    description: 'Memantau pergerakan stok harian dan memberikan peringatan dini persediaan kritis.',
    requiredTools: ['inventory.get_stock_metrics', 'inventory.get_low_stock_products'],
    inputSchema: {},
    outputSchema: { lowStockCount: 'number', criticalItems: 'array' },
  },
  'inventory.forecast': {
    id: 'inventory.forecast',
    name: 'Proyeksi Kebutuhan & Permintaan',
    category: 'FORECASTING',
    description: 'Memproyeksikan estimasi hari menuju stok habis (days until stockout) berdasarkan tren penjualan.',
    requiredTools: ['inventory.forecast_demand'],
    inputSchema: { daysAhead: 'number' },
    outputSchema: { stockoutRisk: 'string', forecast: 'array' },
  },
  'inventory.detect_low_stock': {
    id: 'inventory.detect_low_stock',
    name: 'Deteksi Stok Menipis (Low-Stock)',
    category: 'MONITORING',
    description: 'Identifikasi produk yang telah melewati ambang batas persediaan minimum.',
    requiredTools: ['inventory.get_low_stock_products'],
    inputSchema: { threshold: 'number' },
    outputSchema: { lowStockItems: 'array' },
  },
  'inventory.detect_dead_stock': {
    id: 'inventory.detect_dead_stock',
    name: 'Deteksi Stok Mati (Dead-Stock)',
    category: 'ANALYSIS',
    description: 'Mendeteksi produk yang tidak mengalami penjualan dan mengendapkan modal usaha.',
    requiredTools: ['inventory.detect_dead_stock'],
    inputSchema: { minStock: 'number', maxSold: 'number' },
    outputSchema: { deadStockCount: 'number', tiedUpCapitalIdr: 'number', deadStockItems: 'array' },
  },
  'inventory.detect_fast_moving': {
    id: 'inventory.detect_fast_moving',
    name: 'Deteksi Produk Terlaris (Fast-Moving)',
    category: 'ANALYSIS',
    description: 'Identifikasi produk beromzet tinggi dan kecepatan perputaran cepat.',
    requiredTools: ['inventory.get_sales_velocity'],
    inputSchema: { fastThreshold: 'number' },
    outputSchema: { fastMovingProducts: 'array' },
  },
  'inventory.detect_slow_moving': {
    id: 'inventory.detect_slow_moving',
    name: 'Deteksi Produk Lambat (Slow-Moving)',
    category: 'ANALYSIS',
    description: 'Identifikasi produk dengan perputaran lambat yang memerlukan evaluasi harga/promosi.',
    requiredTools: ['inventory.get_sales_velocity'],
    inputSchema: { slowThreshold: 'number' },
    outputSchema: { slowMovingProducts: 'array' },
  },
  'inventory.detect_anomaly': {
    id: 'inventory.detect_anomaly',
    name: 'Deteksi Anomali Inventaris',
    category: 'MONITORING',
    description: 'Mendeteksi lonjakan/penurunan mendadak pada konsumsi stok atau perbedaan fisik.',
    requiredTools: ['inventory.get_stock_metrics', 'inventory.get_sales_velocity'],
    inputSchema: {},
    outputSchema: { anomalies: 'array' },
  },
  'inventory.reorder_recommendation': {
    id: 'inventory.reorder_recommendation',
    name: 'Rekomendasi Restok Ulang (Reorder)',
    category: 'ADVISORY',
    description: 'Menghitung saran jumlah pesanan barang ulang dan prioritas restok.',
    requiredTools: ['inventory.get_reorder_recommendations'],
    inputSchema: { targetSafetyDays: 'number' },
    outputSchema: { recommendations: 'array', totalEstimatedInvestmentIdr: 'number' },
  },
  'inventory.report': {
    id: 'inventory.report',
    name: 'Laporan Inventaris Komprehensif',
    category: 'REPORTING',
    description: 'Menyusun ringkasan eksekutif kesehatan inventaris, analisis nilai persediaan, dan rekomendasi aksi.',
    requiredTools: ['inventory.get_stock_metrics', 'inventory.get_low_stock_products', 'inventory.detect_dead_stock', 'inventory.get_reorder_recommendations'],
    inputSchema: {},
    outputSchema: { executiveSummary: 'string', actionPlan: 'array' },
  },
};
