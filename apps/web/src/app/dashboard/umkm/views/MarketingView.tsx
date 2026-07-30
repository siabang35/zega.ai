import React from 'react';
import { 
  Megaphone, Plus, TrendingUp, TrendingDown, Users, DollarSign, 
  Instagram, Video, MessageSquare, Sparkles, ChevronDown, ArrowUpRight 
} from 'lucide-react';

interface MarketingViewProps {
  triggerToast: (msg: string) => void;
}

export function MarketingView({ triggerToast }: MarketingViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">MARKETING</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Semua aktivitas marketing Anda dalam satu tempat.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>This Month</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button 
            onClick={() => triggerToast('Buat Campaign Baru')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Buat Campaign
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Reach</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">125.4K</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +12% vs last month
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Engagement Rate</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><Megaphone size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">7.8%</div>
            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <TrendingDown size={12} /> -1.2% vs last month
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Leads Generated</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Sparkles size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">456</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +23% vs last month
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Revenue from Campaign</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp5.200.000</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +18% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart + Top Campaigns */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Performance Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Performa Over Time</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-500" /> Reach</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-purple-500" /> Engagement Rate</span>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
              <path d="M 0 90 Q 60 20, 120 70 T 240 30 T 360 80 T 400 10" fill="none" stroke="#3b82f6" strokeWidth="3" />
              <path d="M 0 105 Q 60 50, 120 90 T 240 60 T 360 95 T 400 35" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2">
            <span>1 Jul</span><span>8 Jul</span><span>15 Jul</span><span>22 Jul</span><span>29 Jul</span>
          </div>
        </div>

        {/* Top Campaigns Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Campaigns</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { name: 'Promo Agustus', reach: '45.2K', eng: '8.3%', rev: 'Rp2.450.000' },
              { name: 'Diskon Spesial Minggu Ini', reach: '32.1K', eng: '7.1%', rev: 'Rp1.620.000' },
              { name: 'Bundle Hemat', reach: '23.6K', eng: '6.5%', rev: 'Rp780.000' },
              { name: 'Launching Produk Baru', reach: '18.9K', eng: '9.2%', rev: 'Rp350.000' },
              { name: 'Remarketing Customer', reach: '7.6K', eng: '5.6%', rev: 'Rp0' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="truncate">
                  <h4 className="font-bold text-[11px] truncate">{c.name}</h4>
                  <span className="text-[10px] text-slate-400">Reach: {c.reach} • Eng: {c.eng}</span>
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.rev}</span>
              </div>
            ))}
          </div>
          <button onClick={() => triggerToast('Viewing all campaigns')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Campaign &gt;</button>
        </div>
      </div>

      {/* Bottom Section: AI Content Created & AI Recommendation */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">AI Content Created</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Instagram Posts', val: '12', inc: '+20%', icon: Instagram, color: 'text-pink-500' },
              { label: 'Instagram Stories', val: '25', inc: '+15%', icon: Instagram, color: 'text-purple-500' },
              { label: 'TikTok Videos', val: '8', inc: '+14%', icon: Video, color: 'text-cyan-500' },
              { label: 'WhatsApp Templates', val: '7', inc: '+18%', icon: MessageSquare, color: 'text-emerald-500' },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Icon size={18} className={c.color} />
                    <span className="text-[10px] font-bold text-emerald-600">{c.inc}</span>
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">{c.val}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{c.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="lg:col-span-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
              <Sparkles size={16} /> AI Recommendation
            </div>
            <h4 className="font-bold text-sm leading-snug">
              Postingan dengan tema "Promo Agustus" berkinerja tinggi.
            </h4>
            <p className="text-xs text-orange-100 leading-relaxed">
              Buat 3 variasi konten baru dengan tema serupa untuk meningkatkan reach.
            </p>
          </div>
          <button 
            onClick={() => triggerToast('AI Content Generator Launched')} 
            className="w-full py-2.5 rounded-2xl bg-white text-orange-600 font-bold text-xs shadow-md hover:bg-orange-50 cursor-pointer"
          >
            Buat Konten Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
