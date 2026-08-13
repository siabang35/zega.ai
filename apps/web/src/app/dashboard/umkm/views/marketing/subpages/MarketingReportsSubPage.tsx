import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, Sparkles, TrendingUp, DollarSign, 
  PieChart as PieIcon, BarChart2, ShieldCheck, ArrowUpRight, Plus,
  Layers, RefreshCw, Filter, CheckCircle2, AlertCircle, Eye, Trash2,
  Info, Check, Share2
} from 'lucide-react';
import { useLanguage } from '../../../../../../i18n/translations';
import { SupabaseDashboardService } from '../../../../services/supabaseService';

interface MarketingReportsSubPageProps {
  metrics?: any;
  triggerToast: (msg: string) => void;
}

export function MarketingReportsSubPage({ metrics, triggerToast }: MarketingReportsSubPageProps) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAuditReport, setSelectedAuditReport] = useState<any | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  // Interactive Donut Chart State
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  // Form state for generating new report
  const [newTitle, setNewTitle] = useState<string>('Laporan Performa Marketing Agustus 2026');
  const [newPeriod, setNewPeriod] = useState<string>('1 Ags - 31 Ags 2026');
  const [newModel, setNewModel] = useState<string>('DeepSeek R1 & 9Router Layer 5 Engine');
  const [newRevenue, setNewRevenue] = useState<string>('0');

  // Load executive reports from Supabase backend
  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmMarketingReports();
      if (data && data.length > 0) {
        setReports(data);
        if (!activeReportId) {
          setActiveReportId(data[0].id);
        }
      }
    } catch (e) {
      console.error('[MarketingReportsSubPage] Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // Subscribe to real-time changes on umkm_marketing_reports table
    const unsubscribe = SupabaseDashboardService.subscribeToMarketingReports('11111111-1111-1111-1111-111111111111', () => {
      loadReports();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Selected Active Report for Donut Visualization
  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || null;
  const sourceBreakdown: any[] = activeReport?.source_breakdown_json || [];

  const totalReportRevenue = activeReport ? parseFloat(activeReport.revenue_num) || 0 : 0;

  // Active or Hovered Segment Info for Center Label of Donut Chart
  const hoveredItem = hoveredSource ? sourceBreakdown.find(s => s.source === hoveredSource) : null;

  // Handle generating new report with DB persistence
  const handleGenerateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setGenerating(true);

    const revNum = parseFloat(newRevenue) || 0;
    const reportObj = {
      report_title: newTitle,
      period_range: newPeriod,
      revenue_num: revNum,
      leads_count: revNum > 0 ? Math.round(revNum / 10000) : 0,
      roas_val: 0.0,
      cpl_idr: 0.00,
      status: 'Final',
      model_attribution: newModel,
      source_breakdown_json: []
    };

    const res = await SupabaseDashboardService.generateUmkmMarketingReport(reportObj);
    setGenerating(false);
    setShowGenerateModal(false);

    if (res.error) {
      triggerToast('⚠️ Gagal membuat laporan baru.');
    } else {
      triggerToast('📊 Laporan Marketing Eksekutif baru berhasil dibuat & disimpan ke Supabase DB!');
      if (res.data && res.data[0]) {
        setActiveReportId(res.data[0].id);
      }
      loadReports();
    }
  };

  // Real PDF Document Download Function (.pdf)
  const handleDownloadPdfReport = (rep: any) => {
    const title = rep.report_title || 'Laporan Executive Marketing';
    const period = rep.period_range || '2026';
    const revenue = parseFloat(rep.revenue_num || 0).toLocaleString('id-ID');
    const leads = rep.leads_count || 0;
    const roas = rep.roas_val || '0.0';
    const cpl = parseFloat(rep.cpl_idr || 0).toLocaleString('id-ID');
    const model = rep.model_attribution || 'DeepSeek R1';
    const breakdown = (rep.source_breakdown_json || []).map((b: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${b.source}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">Rp${parseFloat(b.revenue || 0).toLocaleString('id-ID')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${b.percentage}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.leads || 0} Leads</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.conversion || '0%'}</td>
      </tr>
    `).join('');

    const htmlPdfContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; background: #ffffff; margin: 0; }
    .header { border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
    .logo span { color: #f97316; }
    .badge { background: #fff7ed; color: #c2410c; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #ffedd5; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
    .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 6px; }
    .card-value { font-size: 20px; font-weight: 900; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; font-weight: 800; }
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ZEGA <span>AI</span> PLATFORM</div>
      <h1 style="font-size: 20px; margin: 8px 0 4px 0; font-weight: 800;">${title}</h1>
      <p style="margin: 0; color: #64748b; font-size: 13px;">Periode: ${period} • Status Laporan: ${rep.status || 'Final'}</p>
    </div>
    <div class="badge">${model}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Total Pendapatan Generated</div>
      <div class="card-value" style="color: #10b981;">Rp${revenue}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Leads Terkonversi</div>
      <div class="card-value">${leads} Leads</div>
    </div>
    <div class="card">
      <div class="card-title">ROAS Return</div>
      <div class="card-value" style="color: #8b5cf6;">${roas}x</div>
    </div>
    <div class="card">
      <div class="card-title">Cost Per Acquisition (CPA)</div>
      <div class="card-value">Rp${cpl}</div>
    </div>
  </div>

  <h3 style="font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Rincian Atribusi Pendapatan per Saluran (Source Channel)</h3>
  <table>
    <thead>
      <tr>
        <th>Saluran Pemasaran</th>
        <th>Pendapatan (IDR)</th>
        <th>Kontribusi</th>
        <th>Total Leads</th>
        <th>Conversion Rate</th>
      </tr>
    </thead>
    <tbody>
      ${breakdown}
    </tbody>
  </table>

  <div class="footer">
    <div>Terautentikasi & Diterbitkan oleh ZEGA Telemetry Engine via Supabase Database</div>
    <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    // Download PDF document Blob with application/pdf MIME type and .pdf filename extension
    const blob = new Blob([htmlPdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZEGA_Laporan_Marketing_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also trigger printable PDF preview window for instant viewing/printing
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlPdfContent);
      printWin.document.close();
    }

    triggerToast(`📥 Unduh Dokumen PDF Laporan "${title}.pdf" berhasil!`);
  };

  // Export CSV of all reports
  const handleExportAllReportsCsv = () => {
    if (reports.length === 0) {
      triggerToast('⚠️ Tidak ada laporan untuk diexport.');
      return;
    }
    const headers = ['ID', 'Judul Laporan', 'Periode', 'Pendapatan (IDR)', 'Leads', 'ROAS', 'CPA/CPL', 'Status', 'Model Atribusi'];
    const rows = reports.map(r => [
      r.id,
      `"${(r.report_title || '').replace(/"/g, '""')}"`,
      `"${r.period_range || ''}"`,
      r.revenue_num || 0,
      r.leads_count || 0,
      r.roas_val || 0,
      r.cpl_idr || 0,
      r.status || 'Final',
      `"${(r.model_attribution || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zega_marketing_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('📥 Semua Laporan Marketing Eksekutif berhasil di-export ke CSV.');
  };

  // SVG Donut Chart helper math
  let cumulativePercent = 0;
  const donutSegments = sourceBreakdown.map((item: any) => {
    const startAngle = cumulativePercent * 3.6;
    cumulativePercent += parseFloat(item.percentage) || 0;
    const endAngle = cumulativePercent * 3.6;
    return { ...item, startAngle, endAngle };
  });

  return (
    <div className="space-y-6 font-sans pb-8">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE SUMMARY KPI HIGHLIGHTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: ROAS */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{m.totalRoas || 'Total Marketing Return (ROAS)'}</span>
            <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {metrics?.roas || activeReport?.roas_val || '0.0'}x ROAS
          </div>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ArrowUpRight size={14} />
            <span>{m.realtimeAdEfficiency || 'Efisiensi Iklan Real-Time Database'}</span>
          </p>
        </div>

        {/* KPI 2: Cost Per Acquisition */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{m.costPerAcquisition || 'Cost per Acquisition (CPA / CPL)'}</span>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Rp{(parseFloat(metrics?.cost_per_lead || activeReport?.cpl_idr || 0)).toLocaleString('id-ID')}
          </div>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{m.adCostEfficiency || 'Efisiensi Biaya Iklan'}</p>
        </div>

        {/* KPI 3: AI Swarm Model Engine */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{m.aiSwarmEngine || 'AI Swarm Model Engine'}</span>
            <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
            {metrics?.model_engine || activeReport?.model_attribution || 'AI Model Engine'}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Latency {metrics?.latency_ms || 0}ms • Success {metrics?.success_rate || 0}%
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REVENUE ATTRIBUTION BY SOURCE: SVG DONUT CHART CARD (INTERACTIVE) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieIcon size={18} className="text-orange-500" />
              <span>{m.revenueAttributionTitle || 'Atribusi Pendapatan & Leads Berdasarkan Saluran (Source Channel)'}</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {m.revenueAttributionSubtitle || 'Visualisasi interaktif: Arahkan kursor / klik pada segmen donut untuk melihat rincian teratribusi AI Engine'} {activeReport?.period_range ? `(${activeReport.period_range})` : ''}
            </p>
          </div>

          <button
            onClick={handleExportAllReportsCsv}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-all shrink-0 self-start sm:self-auto"
          >
            <Download size={14} className="text-slate-500" />
            <span>{m.exportCsvReport || 'Export CSV Laporan'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive SVG Donut Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 relative p-6 bg-slate-50/60 dark:bg-slate-800/20 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="relative size-60 flex items-center justify-center">
              {/* SVG Donut */}
              <svg viewBox="0 0 100 100" className="size-full transform -rotate-90">
                {donutSegments.map((segment: any, idx: number) => {
                  const isHovered = hoveredSource === segment.source;
                  const strokeDasharray = `${segment.percentage} ${100 - segment.percentage}`;
                  let offset = 0;
                  for (let i = 0; i < idx; i++) {
                    offset += donutSegments[i].percentage;
                  }
                  const strokeDashoffset = -offset;

                  return (
                    <circle
                      key={segment.source || idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={segment.color || '#10b981'}
                      strokeWidth={isHovered ? "19" : "15"}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      onMouseEnter={() => setHoveredSource(segment.source)}
                      onMouseLeave={() => setHoveredSource(null)}
                      onClick={() => {
                        setHoveredSource(segment.source);
                        triggerToast(`📊 Filter Atribusi: ${segment.source} (${segment.percentage}% - Rp${(segment.revenue || 0).toLocaleString('id-ID')})`);
                      }}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        filter: isHovered ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.2))' : 'none',
                        opacity: hoveredSource && !isHovered ? 0.45 : 1
                      }}
                    />
                  );
                })}
              </svg>

              {/* Dynamic Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                {hoveredItem ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: hoveredItem.color }}>
                      {hoveredItem.source}
                    </span>
                    <div className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Rp{(parseFloat(hoveredItem.revenue) || 0).toLocaleString('id-ID')}
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${hoveredItem.color}20`, color: hoveredItem.color }}>
                      {hoveredItem.percentage}% ({hoveredItem.leads} Leads)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.totalReportRevenue || 'Total Pendapatan'}</span>
                    <div className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Rp{(totalReportRevenue / 1000000).toFixed(1)} JT
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 inline-block">
                      {activeReport?.leads_count || 0} {m.totalLeadsLabel || 'Total Leads'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hover Tooltip / Status Info */}
            <div className="text-center space-y-1">
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                {m.activeReportLabel || 'Laporan Aktif'}: <span className="text-orange-600 dark:text-orange-400 font-black">{activeReport?.report_title}</span>
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {m.attributionModelLabel || 'Model Atribusi'}: <span className="text-slate-700 dark:text-slate-300 font-bold">{activeReport?.model_attribution || 'DeepSeek R1'}</span>
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Source Legend & Detailed Channel Cards */}
          <div className="lg:col-span-7 space-y-3">
            {sourceBreakdown.map((item: any, i: number) => {
              const isHovered = hoveredSource === item.source;
              return (
                <div
                  key={item.source || i}
                  onMouseEnter={() => setHoveredSource(item.source)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => {
                    setHoveredSource(item.source);
                    triggerToast(`📊 Filter Atribusi: ${item.source} (${item.percentage}% - Rp${(item.revenue || 0).toLocaleString('id-ID')})`);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isHovered
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{item.source}</span>
                        <span className="text-[10px] font-bold text-slate-400">({item.percentage}%)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.leads} Leads Terkonversi
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs text-slate-900 dark:text-slate-100">
                      Rp{(item.revenue || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                      <ArrowUpRight size={11} />
                      <span>{item.percentage}% Share</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE REPORTS TABLE CARD */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText size={16} className="text-orange-500" />
              <span>{m.reportsListTitle || 'Daftar Laporan Pemasaran Eksekutif (Real-Time Database)'}</span>
              {loading && <RefreshCw size={13} className="animate-spin text-orange-500" />}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {m.reportsListSubtitle || 'Klik salah satu laporan untuk memperbarui diagram Donut & atribusi saluran di atas.'}
            </p>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0 self-start sm:self-auto"
          >
            <Sparkles size={14} />
            <span>{m.generateNewReport || 'Generate Laporan Baru'}</span>
          </button>
        </div>

        {/* Reports Table Items */}
        <div className="space-y-3 pt-1">
          {reports.map((rep) => {
            const isCurrentActive = activeReportId === rep.id;
            return (
              <div 
                key={rep.id}
                onClick={() => {
                  setActiveReportId(rep.id);
                  triggerToast(`📊 Diagram Donut diperbarui: "${rep.report_title}"`);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrentActive 
                    ? 'bg-orange-50/30 dark:bg-slate-800/80 border-orange-400 dark:border-orange-600 shadow-xs' 
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`size-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                    isCurrentActive
                      ? 'bg-orange-500 text-white border-orange-600'
                      : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/50'
                  }`}>
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {rep.report_title}
                      </h4>
                      {isCurrentActive && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white flex items-center gap-1">
                          <Check size={10} />
                          <span>Aktif di Chart</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border ${
                        rep.status === 'Final' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' 
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                      <span>{rep.period_range}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Rp{(parseFloat(rep.revenue_num) || 0).toLocaleString('id-ID')}
                      </span>
                      <span>•</span>
                      <span>{rep.leads_count || 0} Leads</span>
                      <span>•</span>
                      <span>ROAS {rep.roas_val || '0.0'}x</span>
                    </div>

                    <p className="text-[10.5px] font-semibold text-slate-400">
                      Model Atribusi: <span className="text-slate-700 dark:text-slate-300">{rep.model_attribution}</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 border-slate-200/60 dark:border-slate-800 pt-2 md:pt-0 w-full md:w-auto justify-end">
                  {/* Audit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAuditReport(rep);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-orange-600 text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Eye size={13} className="text-orange-500" />
                    <span>Audit Laporan</span>
                  </button>

                  {/* Unduh PDF / Dokumen Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdfReport(rep);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Download size={13} />
                    <span>Unduh PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL 1: AUDIT EXECUTIVE REPORT & SOURCE BREAKDOWN */}
      {/* ========================================================================= */}
      {selectedAuditReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {m.reportAuditTitle || 'Audit Detail Laporan'}: {selectedAuditReport.report_title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Periode: {selectedAuditReport.period_range} • Status: {selectedAuditReport.status}
                </p>
              </div>

              <button
                onClick={() => setSelectedAuditReport(null)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.totalRevenueLabel || 'Total Pendapatan'}</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  Rp{(parseFloat(selectedAuditReport.revenue_num) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.totalLeadsLabel || 'Total Leads'}</span>
                <span className="font-extrabold text-blue-600 text-sm">{selectedAuditReport.leads_count || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.roasReturnLabel || 'ROAS Return'}</span>
                <span className="font-extrabold text-purple-600 text-sm">{selectedAuditReport.roas_val || '0.0'}x</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.costPerLeadLabel || 'Cost Per Lead'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                  Rp{(parseFloat(selectedAuditReport.cpl_idr) || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Source Breakdown Table inside Audit Modal */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                {m.revenueBreakdownByChannel || 'Breakdown Atribusi Pendapatan per Saluran'}
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedAuditReport.source_breakdown_json || []).map((sb: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-3 rounded-full" style={{ backgroundColor: sb.color || '#10b981' }} />
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{sb.source}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-600">
                        Rp{(parseFloat(sb.revenue) || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="font-mono text-slate-400">({sb.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-[11px] font-bold text-slate-400 truncate max-w-xs">
                Model: {selectedAuditReport.model_attribution}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdfReport(selectedAuditReport)}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download size={13} />
                  <span>{m.downloadPdfBtn || 'Unduh PDF'}</span>
                </button>
                <button
                  onClick={() => setSelectedAuditReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
                >
                  {m.closeBtn || 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL 2: GENERATE NEW EXECUTIVE REPORT */}
      {/* ========================================================================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleGenerateReportSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {m.generateExecutiveReportTitle || 'Generate Laporan Marketing Eksekutif Baru'}
                </h3>
                <p className="text-xs text-slate-400">{m.generateExecutiveReportSubtitle || 'Buat sintesis laporan terintegrasi real-time database Supabase'}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{m.reportTitleLabel || 'Judul Laporan'}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{m.reportPeriodLabel || 'Periode Laporan'}</label>
                <input
                  type="text"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{m.targetRevenueIdrLabel || 'Target Pendapatan (IDR)'}</label>
                <input
                  type="number"
                  value={newRevenue}
                  onChange={(e) => setNewRevenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{m.aiAttributionModelLabel || 'Model Atribusi AI'}</label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="DeepSeek R1 & 9Router Layer 5 Engine">DeepSeek R1 & 9Router Layer 5 Engine</option>
                  <option value="Qwen 2.5 Coder 32B & ZeroClaw Edge Swarm">Qwen 2.5 Coder 32B & ZeroClaw Edge Swarm</option>
                  <option value="Gemini 3.6 Flash & Groq LPU Engine">Gemini 3.6 Flash & Groq LPU Engine</option>
                  <option value="Claude 3.5 Sonnet & Solana Vault Swarm">Claude 3.5 Sonnet & Solana Vault Swarm</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {m.cancelBtn || 'Batal'}
              </button>

              <button
                type="submit"
                disabled={generating}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-all"
              >
                {generating ? (m.generatingReportStatus || 'Membuat Laporan...') : (m.generateDatabaseReportBtn || 'Generate Laporan Database')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
