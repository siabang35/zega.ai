import React, { useState } from 'react';
import { Sparkles, X, Bot, Download, CheckCircle2, ArrowRight, Layers, FileText } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface CustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

export function CustomReportModal({ isOpen, onClose, triggerToast }: CustomReportModalProps) {
  const [domain, setDomain] = useState('executive');
  const [horizon, setHorizon] = useState('30d');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    triggerToast('🤖 Generating Custom AI Intelligence Report via ZEGA 9Router Layer-5 Model...');
    try {
      const title = customTitle || `Laporan Custom AI (${domain.toUpperCase()} - ${horizon})`;
      const result = await SupabaseDashboardService.generateCustomReport(title, domain, horizon);
      setReportResult(result);
      triggerToast('✨ Custom AI Report generated successfully!');
    } catch (e) {
      console.error(e);
      triggerToast('❌ Error generating custom report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Custom AI Report Engine <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 font-extrabold">9Router AI</span>
              </h3>
              <p className="text-xs text-slate-500">Buat laporan bisnis otomatis berbasis telemetry & model AI real-time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!reportResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Laporan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Analisis Kinerja Penjualan Q3 & Proyeksi Q4"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-orange-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fokus Domain Bisnis</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 'executive', name: 'Executive Digest', desc: 'Ringkasan performa toko' },
                    { id: 'sales', name: 'Sales & Conversion', desc: 'Pipeline & deal closing' },
                    { id: 'marketing', name: 'Marketing & Campaign', desc: 'ROI channel & engagement' },
                    { id: 'store', name: 'Store & Inventory', desc: 'Stok, kategori & PO' },
                    { id: 'finance', name: 'Finance & P&L', desc: 'Cash flow & margin' },
                    { id: 'customers', name: 'Customers & LTV', desc: 'Retensi & RFM segment' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDomain(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        domain === item.id
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Rentang Waktu Analysis Horizon</label>
                <div className="flex gap-2">
                  {['7d', '30d', '90d', '1y'].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        horizon === h
                          ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {h === '7d' ? '7 Hari' : h === '30d' ? '30 Hari' : h === '90d' ? '3 Bulan' : '1 Tahun'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Generated Report View */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white uppercase">{reportResult.domain} AI REPORT</span>
                  <span className="text-[10px] font-mono text-slate-400">{reportResult.ai_model}</span>
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{reportResult.title}</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{reportResult.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">Temuan Kunci AI (Key Findings)</h5>
                <div className="space-y-2">
                  {reportResult.findings?.map((f: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{f.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action Items */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">Rekomendasi Tindakan AI</h5>
                <div className="space-y-2">
                  {reportResult.actions?.map((a: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-orange-100 text-orange-700">{a.priority}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.action}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          {!reportResult ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Bot className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {loading ? 'Generasi AI...' : 'Jalankan Custom AI Report'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setReportResult(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
                Buat Laporan Lain
              </button>
              <button
                onClick={() => { triggerToast('📄 Custom AI Report diekspor ke PDF!'); onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Download size={16} /> Ekspor PDF / JSON
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
