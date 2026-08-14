import React, { useState } from 'react';
import { 
  X, Check, Megaphone, Sparkles, Calendar, Filter, TrendingUp, 
  Users, DollarSign, Image as ImageIcon, Plus, ArrowUpRight, BarChart2, ShieldCheck, Zap, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../../../../../i18n/translations';

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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

// 0. Deploy Marketing Swarm Modal
export function DeployMarketingSwarmModal({
  isOpen,
  onClose,
  onDeploy,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (swarm: any) => void;
  triggerToast: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const models = [
    {
      name: '9Router-Auto-Cost-Optimizer',
      provider: '9Router Layer 5 Engine',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/9router.png',
      badge: '9Router Auto-Router',
      desc: m.model9RouterDesc || 'Rute cerdas otomatis memilih LLM paling efisien untuk campaign marketing & copywriting.'
    },
    {
      name: 'ZeroClaw-Edge-Gateway',
      provider: 'ZeroClaw Edge Swarm',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
      badge: 'ZeroClaw Edge',
      desc: m.modelZeroClawDesc || 'Micro-agent ultra cepat < 50ms untuk otomatisasi respon promo WhatsApp & DM.'
    },
    {
      name: 'meta-llama/llama-3.3-70b-instruct',
      provider: 'Llama 3.3 Foundation',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
      badge: 'Meta Llama 3.3',
      desc: m.modelLlamaDesc || 'Model 70B parameter untuk riset pasar, segmentasi audiens & narasi campaign mendalam.'
    },
    {
      name: '9router/qwen-2.5-coder-32b',
      provider: 'Qwen AI Foundation',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
      badge: 'Qwen 2.5 Coder',
      desc: m.modelQwenDesc || 'Optimasi skrip iklan video TikTok & hook visual berkonversi tinggi.'
    },
    {
      name: 'deepseek/deepseek-r1-distill-llama-70b',
      provider: 'DeepSeek Reasoning AI',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
      badge: 'DeepSeek R1',
      desc: m.modelDeepSeekDesc || 'Analisis logika ROAS, efisiensi budget iklan & prediksi CAC (Cost Per Acquisition).'
    },
    {
      name: 'anthropic/claude-3.5-sonnet',
      provider: 'Anthropic AI',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/claude.webp',
      badge: 'Claude 3.5 Sonnet',
      desc: m.modelClaudeDesc || 'Penulisan draf email & pesan copywriting persuasif berstandar enterprise.'
    }
  ];

  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [swarmName, setSwarmName] = useState(m.defaultSwarmName || 'Omnichannel Growth Swarm');
  const [focus, setFocus] = useState(m.defaultFocus || 'WhatsApp & Instagram Promo Automation');

  const handleDeploy = () => {
    onDeploy({
      swarm_name: swarmName,
      model_engine: selectedModel.name,
      model_provider: selectedModel.provider,
      execution_gateway: selectedModel.gateway,
      cdn_icon_url: selectedModel.icon,
      campaign_focus: focus,
      success_rate: 99.85,
      latency_ms: Math.floor(Math.random() * 80) + 120
    });
    const toastPattern = m.swarmDeployedToast || '🚀 AI Marketing Swarm "{name}" ({badge}) berhasil dideploy!';
    triggerToast(toastPattern.replace('{name}', swarmName).replace('{badge}', selectedModel.badge));
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.deploySwarmModalTitle || '🤖 Deploy Real AI Marketing Swarm'}>
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.swarmNameLabel || 'Nama Marketing Swarm'}</label>
          <input
            type="text"
            value={swarmName}
            onChange={(e) => setSwarmName(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.optimizationFocusLabel || 'Fokus Optimization'}</label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">{m.selectAiModelEngineRealtime || 'Pilih Model AI Engine Realtime'}</label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {models.map((mod, i) => (
              <div
                key={i}
                onClick={() => setSelectedModel(mod)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedModel.name === mod.name
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <img
                  src={mod.icon}
                  alt={mod.name}
                  className="size-7 rounded-lg object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{mod.badge}</span>
                    <span className="text-[9px] font-bold text-orange-500 uppercase">{mod.provider}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleDeploy}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          <Zap size={16} /> {m.deployModelEngineSwarmBtn || 'Deploy Model Engine Swarm'}
        </button>
      </div>
    </ModalBase>
  );
}

// 1. Create New Campaign Modal
export function CreateCampaignModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (campaign: any) => void; 
  triggerToast: (msg: string) => void 
}) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const [name, setName] = useState('');
  const [range, setRange] = useState('5 Agt - 31 Agt 2026');
  const [revenue, setRevenue] = useState('1500000');
  const [modelEngine, setModelEngine] = useState('9Router-Auto-Cost-Optimizer');

  const handleSave = () => {
    if (!name) return;
    const newCamp = {
      campaign_name: name,
      date_range: range,
      reach_text: '12.5K',
      leads_count: 45,
      revenue: Number(revenue),
      roas_text: '2.5x',
      status: m.statusAktif || 'Aktif',
      image_url: '/design/dashboard_umkm/marketing/promo_skincare.jpeg'
    };
    onCreate(newCamp);
    triggerToast(`Campaign "${name}" (${modelEngine}) berhasil dibuat & dijalankan!`);
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.createCampaignModalTitle || 'Buat Campaign Marketing Baru'}>
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.campaignNameLabel || 'Nama Campaign'}</label>
          <input 
            type="text"
            placeholder={m.campaignNamePlaceholder || 'Contoh: Promo Tanggal Kembar 8.8'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.campaignPeriodLabel || 'Periode Campaign'}</label>
          <input 
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.targetRevenueLabel || 'Target Revenue (Rp)'}</label>
          <input 
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.modelExecutionEngineLabel || 'Model AI Execution Engine'}</label>
          <select
            value={modelEngine}
            onChange={(e) => setModelEngine(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="9Router-Auto-Cost-Optimizer">9Router Auto-Cost Optimizer (Dynamic Failover)</option>
            <option value="ZeroClaw-Edge-Gateway">ZeroClaw Micro-Agent Gateway (&lt;50ms)</option>
            <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
            <option value="9router/qwen-2.5-coder-32b">Qwen 2.5 Coder 32B</option>
            <option value="deepseek/deepseek-r1-distill-llama-70b">DeepSeek R1 Reasoning AI</option>
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={!name}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-md"
        >
          {m.launchCampaignBtn || 'Luncurkan Campaign'}
        </button>
      </div>
    </ModalBase>
  );
}

// 2. Create AI Content Modal
export function CreateContentModal({ 
  isOpen, 
  onClose, 
  onCreateContent, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreateContent: (item: any) => void; 
  triggerToast: (msg: string) => void 
}) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [type, setType] = useState('Instagram Post');

  const unsplashImages = [
    '/design/dashboard_umkm/marketing/promo_skincare.jpeg',
    '/design/dashboard_umkm/marketing/instagram_story.jpeg',
    '/design/dashboard_umkm/marketing/discount.jpeg',
    '/design/dashboard_umkm/marketing/tiktok_video.jpeg'
  ];

  const handleGenerate = () => {
    if (!title) return;
    const randomImg = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
    const newItem = {
      title,
      platform,
      content_type: type,
      image_url: randomImg
    };
    onCreateContent(newItem);
    triggerToast(`AI Konten "${title}" berhasil dibuat!`);
    setTitle('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.createContentModalTitle || '✨ Buat Konten Marketing dengan AI'}>
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.contentTitleTopicLabel || 'Judul / Topik Konten'}</label>
          <input 
            type="text"
            placeholder="Contoh: Promo Spesial Skincare Glowing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{m.targetPlatformLabel || 'Platform Tujuan'}</label>
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setType(`${e.target.value} Post`);
            }}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Shopee">Shopee</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!title}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> {m.generateAiContentBtn || 'Generate Konten AI'}
        </button>
      </div>
    </ModalBase>
  );
}

// 3. All Channels Modal
export function AllChannelsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const channels = [
    { 
      name: 'WhatsApp Business API', 
      reach: '56.2K', 
      eng: '6.8%', 
      leads: 198, 
      conv: '3.5%', 
      icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
      fallback: '/assets/logo/whatsapp-for-business.webp'
    },
    { 
      name: 'Instagram Direct', 
      reach: '32.8K', 
      eng: '8.2%', 
      leads: 132, 
      conv: '4.1%', 
      icon: 'https://cdn.zegaai.site/assets/logo/instagram.png',
      fallback: '/assets/logo/instagram.png'
    },
    { 
      name: 'Shopee Feed & Live', 
      reach: '18.6K', 
      eng: '5.6%', 
      leads: 76, 
      conv: '3.2%', 
      icon: 'https://cdn.zegaai.site/assets/logo/shopee.png',
      fallback: '/assets/logo/shopee.png'
    },
    { 
      name: 'TikTok Shop Messaging', 
      reach: '12.4K', 
      eng: '9.1%', 
      leads: 50, 
      conv: '4.0%', 
      icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp',
      fallback: '/assets/logo/tiktok.webp'
    },
    { 
      name: 'Email Marketing', 
      reach: '5.4K', 
      eng: '4.2%', 
      leads: 28, 
      conv: '2.6%', 
      icon: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
      fallback: '/assets/logo/zegalogo.png'
    },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.allChannelsModalTitle || 'Laporan Performa Per Channel'}>
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
              <span className="font-black text-slate-900 dark:text-slate-100">{c.leads} Leads</span>
            </div>

            <div className="grid grid-cols-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Reach: {c.reach}</span>
              <span>Eng: {c.eng}</span>
              <span className="text-right">Conv: {c.conv}</span>
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 4. All Campaigns Modal
export function AllCampaignsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const campaigns = [
    { name: 'Promo Agustus', range: '22 Jun - 22 Jul', reach: '45.2K', leads: 182, rev: 'Rp2.450.000', roas: '3.8x', status: m.statusAktif || 'Aktif' },
    { name: 'Diskon Spesial Minggu Ini', range: '15 Jul - 31 Jul', reach: '32.1K', leads: 128, rev: 'Rp1.620.000', roas: '2.9x', status: m.statusAktif || 'Aktif' },
    { name: 'Bundle Hemat', range: '10 Jul - 24 Jul', reach: '23.6K', leads: 84, rev: 'Rp780.000', roas: '2.1x', status: m.statusAktif || 'Aktif' },
    { name: 'Launching Produk Baru', range: '1 Jul - 20 Jul', reach: '18.9K', leads: 46, rev: 'Rp350.000', roas: '1.6x', status: m.statusSelesai || 'Selesai' },
    { name: 'Remarketing Customer', range: '1 Jul - 31 Jul', reach: '7.6K', leads: 16, rev: 'Rp0', roas: '-', status: m.statusAktif || 'Aktif' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.allCampaignsModalTitle || 'Daftar Semua Marketing Campaign'}>
      <div className="space-y-3 text-xs">
        {campaigns.map((c, i) => (
          <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{c.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium">{c.range} • {c.reach} reach • {c.leads} leads</p>
            </div>

            <div className="text-right space-y-1">
              <div className="font-black text-slate-900 dark:text-slate-100">{c.rev}</div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                c.status === (m.statusAktif || 'Aktif') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 5. Date Filter Modal
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
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const ranges = [
    { label: 'Hari Ini (Today)', val: '5 Agt 2026' },
    { label: '7 Hari Terakhir', val: '29 Jul - 5 Agt 2026' },
    { label: '30 Hari Terakhir', val: '6 Jul - 5 Agt 2026' },
    { label: 'Bulan Ini (Juli 2026)', val: '1 Jul - 31 Jul 2026' },
    { label: 'Bulan Lalu (Juni 2026)', val: '1 Jun - 30 Jun 2026' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.dateFilterModalTitle || 'Pilih Periode Marketing'}>
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

// 6. Advanced Filter Modal
export function FilterModal({ 
  isOpen, 
  onClose, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  triggerToast: (msg: string) => void 
}) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const [selectedChannel, setSelectedChannel] = useState('All');

  const handleApply = () => {
    triggerToast(`Filter marketing diterapkan: Channel=${selectedChannel}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.filterModalTitle || 'Filter Performa Marketing'}>
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">{m.filterAll || 'Filter Channel'}</label>
          <div className="grid grid-cols-2 gap-2">
            {['All', 'WhatsApp', 'Instagram', 'Shopee', 'TikTok', 'Email'].map((ch) => (
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

        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          {m.applyFilterBtn || 'Terapkan Filter'}
        </button>
      </div>
    </ModalBase>
  );
}

// 7. All Activities Telemetry Modal
export function AllActivitiesModal({
  isOpen,
  onClose,
  activities = []
}: {
  isOpen: boolean;
  onClose: () => void;
  activities: any[];
}) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={m.allActivitiesModalTitle || '⚡ Semua Log Aktivitas Realtime'}>
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-extrabold text-indigo-950 dark:text-indigo-200">Supabase Realtime Stream</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
            {activities.length} Events Logged
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {activities.map((act, i) => (
            <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="size-7 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5 border border-orange-200 dark:border-orange-800">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug">{act.title}</p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Gateway: ZeroClaw-Edge</span>
                  <span>{act.time_ago}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}
