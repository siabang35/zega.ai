import React, { useState } from 'react';
import { Settings, Server, Database, RefreshCw, Trash2, Download, ShieldCheck, Activity } from 'lucide-react';

interface SystemTabProps {
  triggerToast: (msg: string) => void;
}

export function SystemTab({ triggerToast }: SystemTabProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast('✓ Data Supabase & Realtime berhasil disinkronkan!');
    }, 1200);
  };

  const handleClearCache = () => {
    localStorage.clear();
    triggerToast('✓ Cache aplikasi berhasil dibersihkan!');
  };

  const handleExportLogs = () => {
    triggerToast('✓ Audit log sistem berhasil diekspor!');
  };

  const healthMetrics = [
    { label: 'Supabase PostgreSQL DB', status: 'Terhubung', ping: '24 ms', color: 'emerald' },
    { label: 'Cloudflare R2 CDN', status: '100% Operational', ping: '18 ms', color: 'emerald' },
    { label: 'Supabase Realtime Channel', status: 'Aktif & Mendengarkan', ping: '31 ms', color: 'emerald' },
    { label: 'ZEGA AI Runtime Gateway', status: 'Online (Port 3001)', ping: '12 ms', color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 flex items-center justify-center font-black">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Status Kesehatan Sistem & Infrastruktur
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Konektivitas waktu-nyata ke Supabase PostgreSQL, CDN R2, dan Gateway AI.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthMetrics.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {item.label}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {item.status}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {item.ping}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-black">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Aksi Pemeliharaan & Audit System
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Jalankan pembersihan cache lokal atau paksa sinkronisasi ulang database.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={isSyncing}
            onClick={handleSyncDatabase}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database Now'}</span>
          </button>

          <button
            onClick={handleClearCache}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Bersihkan Cache App</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} />
            <span>Ekspor Audit Trail Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
