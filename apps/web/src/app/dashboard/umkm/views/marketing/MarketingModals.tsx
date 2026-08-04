import React, { useState } from 'react';
import { 
  X, Check, Megaphone, Sparkles, Calendar, Filter, TrendingUp, 
  Users, DollarSign, Image as ImageIcon, Plus, ArrowUpRight, BarChart2, ShieldCheck, Zap 
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
  const [name, setName] = useState('');
  const [range, setRange] = useState('5 Agt - 31 Agt 2026');
  const [revenue, setRevenue] = useState('1500000');

  const handleSave = () => {
    if (!name) return;
    const newCamp = {
      campaign_name: name,
      date_range: range,
      reach_text: '12.5K',
      leads_count: 45,
      revenue: Number(revenue),
      roas_text: '2.5x',
      status: 'Aktif',
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80'
    };
    onCreate(newCamp);
    triggerToast(`Campaign "${name}" berhasil dibuat!`);
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Buat Campaign Marketing Baru">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Nama Campaign</label>
          <input 
            type="text"
            placeholder="Contoh: Promo Tanggal Kembar 8.8"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Periode Campaign</label>
          <input 
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Target Revenue (Rp)</label>
          <input 
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-md"
        >
          Luncurkan Campaign
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
    <ModalBase isOpen={isOpen} onClose={onClose} title="✨ Buat Konten Marketing dengan AI">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Judul / Topik Konten</label>
          <input 
            type="text"
            placeholder="Contoh: Promo Spesial Skincare Glowing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Platform Tujuan</label>
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
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Generate Konten AI
        </button>
      </div>
    </ModalBase>
  );
}

// 3. All Channels Modal
export function AllChannelsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const channels = [
    { name: 'WhatsApp Business', reach: '56.2K', eng: '6.8%', leads: 198, conv: '3.5%', color: 'bg-emerald-500' },
    { name: 'Instagram Direct', reach: '32.8K', eng: '8.2%', leads: 132, conv: '4.1%', color: 'bg-purple-500' },
    { name: 'Shopee Feed & Live', reach: '18.6K', eng: '5.6%', leads: 76, conv: '3.2%', color: 'bg-orange-500' },
    { name: 'TikTok Shop Messaging', reach: '12.4K', eng: '9.1%', leads: 50, conv: '4.0%', color: 'bg-cyan-500' },
    { name: 'Email Marketing', reach: '5.4K', eng: '4.2%', leads: 28, conv: '2.6%', color: 'bg-blue-500' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Performa Per Channel">
      <div className="space-y-3 text-xs">
        {channels.map((c, i) => (
          <div key={i} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center font-bold">
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full ${c.color}`} />
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
  const campaigns = [
    { name: 'Promo Agustus', range: '22 Jun - 22 Jul', reach: '45.2K', leads: 182, rev: 'Rp2.450.000', roas: '3.8x', status: 'Aktif' },
    { name: 'Diskon Spesial Minggu Ini', range: '15 Jul - 31 Jul', reach: '32.1K', leads: 128, rev: 'Rp1.620.000', roas: '2.9x', status: 'Aktif' },
    { name: 'Bundle Hemat', range: '10 Jul - 24 Jul', reach: '23.6K', leads: 84, rev: 'Rp780.000', roas: '2.1x', status: 'Aktif' },
    { name: 'Launching Produk Baru', range: '1 Jul - 20 Jul', reach: '18.9K', leads: 46, rev: 'Rp350.000', roas: '1.6x', status: 'Selesai' },
    { name: 'Remarketing Customer', range: '1 Jul - 31 Jul', reach: '7.6K', leads: 16, rev: 'Rp0', roas: '-', status: 'Aktif' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Daftar Semua Marketing Campaign">
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
                c.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
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
  const ranges = [
    { label: 'Hari Ini (Today)', val: '5 Agt 2026' },
    { label: '7 Hari Terakhir', val: '29 Jul - 5 Agt 2026' },
    { label: '30 Hari Terakhir', val: '6 Jul - 5 Agt 2026' },
    { label: 'Bulan Ini (Juli 2026)', val: '1 Jul - 31 Jul 2026' },
    { label: 'Bulan Lalu (Juni 2026)', val: '1 Jun - 30 Jun 2026' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pilih Periode Marketing">
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
  const [selectedChannel, setSelectedChannel] = useState('All');

  const handleApply = () => {
    triggerToast(`Filter marketing diterapkan: Channel=${selectedChannel}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Filter Performa Marketing">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Filter Channel</label>
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
          Terapkan Filter
        </button>
      </div>
    </ModalBase>
  );
}
