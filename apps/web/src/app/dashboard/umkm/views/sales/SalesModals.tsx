import React, { useState } from 'react';
import { 
  X, Check, DollarSign, Target, Calendar, Filter, Sparkles, TrendingUp, 
  ShoppingBag, ArrowUpRight, Award, RefreshCw, BarChart2, Zap, HelpCircle, User, ShieldCheck
} from 'lucide-react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalBase({ isOpen, onClose, title, children }: ModalBaseProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// 1. Set Sales Goal Modal
export function SetGoalModal({ 
  isOpen, 
  onClose, 
  currentGoal, 
  onSaveGoal, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentGoal: number; 
  onSaveGoal: (val: number) => void; 
  triggerToast: (msg: string) => void 
}) {
  const [target, setTarget] = useState(currentGoal || 20000000);

  const handleSave = () => {
    onSaveGoal(target);
    triggerToast(`Sales goal berhasil diperbarui menjadi Rp${target.toLocaleString('id-ID')}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Atur Target Penjualan Bulanan">
      <div className="space-y-4 text-xs">
        <p className="text-slate-500 dark:text-slate-400">Tentukan target pendapatan bulanan untuk memotivasi tim sales dan AI Assistant Anda.</p>
        
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Target Pendapatan (Rp)</label>
          <div className="relative">
            <input 
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              step={1000000}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-800 dark:text-orange-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Target size={14} className="text-orange-500" />
            <span>Target Saat Ini: Rp{target.toLocaleString('id-ID')}</span>
          </div>
          <p className="text-[11px]">Progres pencapaian Anda saat ini akan dihitung secara otomatis secara real-time.</p>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Simpan Target Baru
        </button>
      </div>
    </ModalBase>
  );
}

// 2. Date Range Filter Modal
export function DateFilterModal({ 
  isOpen, 
  onClose, 
  onSelectRange, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelectRange: (label: string) => void; 
  triggerToast: (msg: string) => void 
}) {
  const ranges = [
    { label: 'Hari Ini (Today)', val: '4 Agt 2026' },
    { label: '7 Hari Terakhir', val: '28 Jul - 4 Agt 2026' },
    { label: '30 Hari Terakhir', val: '5 Jul - 4 Agt 2026' },
    { label: 'Bulan Ini (Juli 2026)', val: '1 Jul - 31 Jul 2026' },
    { label: 'Bulan Lalu (Juni 2026)', val: '1 Jun - 30 Jun 2026' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pilih Rentang Waktu Penjualan">
      <div className="space-y-2 text-xs">
        {ranges.map((r, i) => (
          <button
            key={i}
            onClick={() => {
              onSelectRange(r.val);
              triggerToast(`Periode data diubah ke: ${r.val}`);
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-slate-100 font-bold cursor-pointer transition-all"
          >
            <span>{r.label}</span>
            <span className="text-[11px] font-medium text-slate-400">{r.val}</span>
          </button>
        ))}
      </div>
    </ModalBase>
  );
}

// 3. Advanced Filter Modal
export function FilterModal({ 
  isOpen, 
  onClose, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  triggerToast: (msg: string) => void 
}) {
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const handleApply = () => {
    triggerToast(`Filter diterapkan: Channel=${selectedChannel}, Status=${selectedStatus}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Filter Penjualan Lanjutan">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Filter Channel Sales</label>
          <div className="grid grid-cols-2 gap-2">
            {['All', 'WhatsApp', 'Shopee', 'Instagram', 'TikTok'].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                  selectedChannel === ch 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Status Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {['All', 'Lunas', 'Menunggu', 'Refund'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                  selectedStatus === st 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Terapkan Filter
        </button>
      </div>
    </ModalBase>
  );
}

// 4. Help Info Modal
export function HelpInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Panduan & Metrik Revenue Over Time">
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <BarChart2 size={14} className="text-orange-500" />
            <span>Bagaimana Revenue Dihitung?</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Grafik Revenue Over Time menampilkan akumulasi total transaksi pembayaran yang telah dikonfirmasi (Lunas) dari semua saluran (WhatsApp, Shopee, Instagram, TikTok) secara real-time via Supabase WebSockets.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Verifikasi Pembayaran Otomatis</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            AI Assistant ZEGA memverifikasi setiap transaksi pembayaran dan memperbarui metrik penjualan tanpa perlu input manual.
          </p>
        </div>
      </div>
    </ModalBase>
  );
}

// 5. All Top Products Modal
export function AllProductsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const products = [
    { rank: 1, name: 'Paket Skincare Basic', sold: 32, rev: 'Rp3.840.000', trend: '↑ 16%' },
    { rank: 2, name: 'Paket Skincare Premium', sold: 24, rev: 'Rp3.576.000', trend: '↑ 12%' },
    { rank: 3, name: 'Serum Brightening', sold: 18, rev: 'Rp2.160.000', trend: '↑ 8%' },
    { rank: 4, name: 'Face Wash', sold: 16, rev: 'Rp1.276.000', trend: '↑ 4%' },
    { rank: 5, name: 'Moisturizer', sold: 12, rev: 'Rp1.020.000', trend: '↑ 6%' },
    { rank: 6, name: 'Sunscreen Gel SPF50', sold: 10, rev: 'Rp850.000', trend: '↑ 5%' },
    { rank: 7, name: 'Toner Hydra Boosting', sold: 8, rev: 'Rp780.000', trend: '↑ 3%' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Lengkap Produk Terlaris">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <span className="col-span-5">Produk</span>
          <span className="col-span-3 text-center">Terjual</span>
          <span className="col-span-4 text-right">Revenue</span>
        </div>

        {products.map((p) => (
          <div key={p.rank} className="grid grid-cols-12 items-center p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="col-span-5 flex items-center gap-2">
              <span className="font-extrabold text-orange-500 w-4">{p.rank}.</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
            </div>
            <span className="col-span-3 text-center font-bold text-slate-600 dark:text-slate-300">{p.sold} unit</span>
            <div className="col-span-4 text-right">
              <div className="font-black text-slate-900 dark:text-slate-100">{p.rev}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{p.trend}</div>
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 6. All Channels Modal
export function AllChannelsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const channels = [
    { 
      name: 'WhatsApp Business API', 
      pct: '45%', 
      amount: 'Rp6.100.000', 
      color: 'bg-emerald-500', 
      icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
      fallback: '/assets/logo/whatsapp-for-business.webp'
    },
    { 
      name: 'Shopee Seller Store', 
      pct: '30%', 
      amount: 'Rp4.100.000', 
      color: 'bg-orange-500', 
      icon: 'https://cdn.zegaai.site/assets/logo/shopee.png',
      fallback: '/assets/logo/shopee.png'
    },
    { 
      name: 'Instagram Direct', 
      pct: '15%', 
      amount: 'Rp2.000.000', 
      color: 'bg-purple-500', 
      icon: 'https://cdn.zegaai.site/assets/logo/instagram.png',
      fallback: '/assets/logo/instagram.png'
    },
    { 
      name: 'TikTok Shop Messaging', 
      pct: '10%', 
      amount: 'Rp1.300.000', 
      color: 'bg-cyan-500', 
      icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp',
      fallback: '/assets/logo/tiktok.webp'
    },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Rincian Penjualan Per Channel">
      <div className="space-y-3 text-xs">
        {channels.map((c, i) => (
          <div key={i} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center font-bold">
              <div className="flex items-center gap-2">
                <img 
                  src={c.icon} 
                  onError={(e: any) => { e.target.onerror = null; e.target.src = c.fallback; }}
                  alt={c.name} 
                  className="size-4.5 object-contain rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700" 
                />
                <span className="text-slate-900 dark:text-slate-100">{c.name}</span>
              </div>
              <span className="font-black text-slate-900 dark:text-slate-100">{c.amount}</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={`h-full ${c.color}`} style={{ width: c.pct }} />
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 7. AI Report Modal
export function AiReportModal({ 
  isOpen, 
  onClose,
  insights = [] 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  insights?: any[];
}) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan AI Business Growth & Insights Realtime">
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 border border-orange-200/80 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold">
            <Sparkles size={16} />
            <span>Rekomendasi AI Sales Optimization Swarm</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Hasil analisa real-time dari 9Router Layer 5 Model Router Engine dan ZeroClaw Edge Daemon memperkirakan pertumbuhan omset signifikan jika strategi di bawah diterapkan.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Rekomendasi AI Real-time ({insights.length} Insights):</span>
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {insights.map((ins: any, idx: number) => (
              <div key={ins.id || idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={ins.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'} alt="AI Logo" className="size-5 rounded-lg object-contain bg-white p-0.5" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{ins.headline}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-600 border border-orange-200 dark:border-orange-900/60">
                    {ins.model_engine || '9Router'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{ins.content}</p>
                {ins.action_suggestion && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    💡 Aksi AI: {ins.action_suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}

// 8. Deploy Real AI Model Sales Swarm Modal
export function DeploySalesSwarmModal({
  isOpen,
  onClose,
  onDeploySwarm,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploySwarm: (modelPayload: any) => Promise<void>;
  triggerToast: (msg: string) => void;
}) {
  const [selectedEngine, setSelectedEngine] = useState('9Router-Auto-Cost-Optimizer');
  const [insightType, setInsightType] = useState('forecast');
  const [customHeadline, setCustomHeadline] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const realModels = [
    {
      engine: '9Router-Auto-Cost-Optimizer',
      provider: '9router/gpt-4o-mini',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/9router.png',
      desc: 'Layer 5 Intelligent Cost-Optimized Router Engine with sub-200ms latency.'
    },
    {
      engine: 'ZeroClaw-Edge-Daemon',
      provider: 'zeroclaw/daemon-v0.5.3',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
      desc: 'High-throughput edge daemon executing localized sales forecasting.'
    },
    {
      engine: 'ZEGA-Swarm-Llama-3.3-70B',
      provider: '9router/llama-3.3-70b',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
      desc: 'Flagship open-weights enterprise intelligence model for sales analytics.'
    },
    {
      engine: 'Qwen-2.5-Coder-32B',
      provider: '9router/qwen-2.5-coder-32b',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
      desc: 'Specialized analytical engine for sales revenue & invoice generation.'
    },
    {
      engine: 'DeepSeek-R1-Reasoning',
      provider: '9router/deepseek-r1',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
      desc: 'Advanced reasoning engine for complex multi-channel conversion analysis.'
    },
    {
      engine: 'Claude-3.5-Sonnet',
      provider: '9router/claude-3.5-sonnet',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/claude.webp',
      desc: 'Premium natural language model for generating sales copy & strategy.'
    }
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    const chosen = realModels.find(m => m.engine === selectedEngine) || realModels[0];

    const modelPayload = {
      model_engine: chosen.engine,
      model_provider: chosen.provider,
      execution_gateway: chosen.gateway,
      cdn_icon_url: chosen.icon,
      insight_type: insightType,
      headline: customHeadline.trim() || `Sales AI Forecast (${chosen.engine})`,
      content: `AI Model ${chosen.engine} menganalisis data omset real-time dan menyarankan penguatan strategi promosi di channel utama.`,
      action_suggestion: `Deploy alokasi iklan otomatis via 9Router Router Engine.`
    };

    await onDeploySwarm(modelPayload);
    setIsDeploying(false);
    triggerToast(`Real AI Model Swarm Deployed: ${chosen.engine}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Deploy Real AI Sales Swarm & Model Engine">
      <div className="space-y-4 text-xs">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Pilih Real AI Model Engine yang terhubung langsung ke Supabase WebSockets & Cloudflare R2 CDN untuk menghasilkan prediksi sales real-time.
        </p>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Pilih Real AI Model Engine:</label>
          <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
            {realModels.map((m) => (
              <button
                key={m.engine}
                type="button"
                onClick={() => setSelectedEngine(m.engine)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  selectedEngine === m.engine 
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-1 ring-orange-500' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <img src={m.icon} alt={m.engine} className="size-7 rounded-xl object-contain bg-white p-1 border border-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">{m.engine}</span>
                    <span className="text-[9px] font-mono text-slate-400">{m.provider}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Judul Prediksi AI Custom (Opsional):</label>
          <input
            type="text"
            value={customHeadline}
            onChange={(e) => setCustomHeadline(e.target.value)}
            placeholder="mis. Prediksi Kenaikan Omset Harian 25%"
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-orange-500 text-xs"
          />
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDeploying ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
          <span>{isDeploying ? 'Deploying Model Swarm...' : 'Deploy Real AI Sales Swarm'}</span>
        </button>
      </div>
    </ModalBase>
  );
}

