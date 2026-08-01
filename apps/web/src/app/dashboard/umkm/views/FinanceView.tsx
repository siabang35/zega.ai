import React, { useState } from 'react';
import { 
  DollarSign, Scale, TrendingUp, ChevronDown, Sparkles, X, ArrowRight, QrCode, ExternalLink
} from 'lucide-react';
import { ZeroClawTerminalView } from '../../enterprise/views/ZeroClawTerminalView';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

interface FinanceViewProps {
  triggerToast?: (msg: string) => void;
  isGuest?: boolean;
  userEmail?: string;
  userName?: string;
}

export function FinanceView({ triggerToast, isGuest, userEmail, userName }: FinanceViewProps) {
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [activeFinanceTab, setActiveFinanceTab] = useState<'overview' | 'zeroclaw'>('overview');
  const [currencyMode, setCurrencyMode] = useState<'USDC' | 'IDR'>('USDC');
  const [liveStreamRows, setLiveStreamRows] = useState<Array<{
    tx: string;
    amountUsdc: number;
    channel: string;
    memo: string;
    status: string;
    slot: string;
  }>>([
    {
      tx: '2q1pkkE8RpBGvLrsAhZuBpuM5ZJucFXzzQLaAsDYrpzUJ6HdLgF2aP4ANM2Rn1bZKkshiXQ8Bqrw15D1FeNNo3NV',
      amountUsdc: 15.00,
      channel: 'WhatsApp (zeroclaw_channel)',
      memo: 'Pay for Product (Cafe Latte x2)',
      status: 'Finalized',
      slot: 'Slot 480320796',
    },
    {
      tx: '2Uy1TaYUh3uzg7VC9tMjnX6DQqVBudf1SiDyB3YQkMFr2T9meEvcdrrbD9LRZydeAqwJPoU8cmfE3NBH3G7ivxqG',
      amountUsdc: 30.50,
      channel: 'Kasir Solana Pay QR',
      memo: 'Kasir QR Settlement',
      status: 'Finalized',
      slot: 'Slot 480320796',
    },
    {
      tx: 'i7ibEze7spGBEuxuE7thysYp2WCXR2eYwMuXy58GUqkJgFt8Rw4X1E5jyWj9ckg3ASEPeVyGDQcGAcRH6e2hpto',
      amountUsdc: 25.00,
      channel: 'Agent Swarm Micro-Pay',
      memo: 'SOP Refund Approval',
      status: 'Finalized',
      slot: 'Slot 480271732',
    },
  ]);
  const [gatewayStatus, setGatewayStatus] = useState<string>('Connecting...');

  // Fetch real-time ZeroClaw status and Devnet signatures
  React.useEffect(() => {
    let isMounted = true;
    const fetchRealtimeData = async () => {
      try {
        const [statusRes, rpcRes] = await Promise.allSettled([
          fetch('/v1/zeroclaw/status').then(r => r.json()),
          fetch('/v1/zeroclaw/solana-rpc').then(r => r.json())
        ]);

        if (isMounted && statusRes.status === 'fulfilled' && statusRes.value?.success) {
          const st = statusRes.value.data?.state;
          setGatewayStatus(st?.bridgeStatus || 'Gateway Active');
        }

        if (isMounted && rpcRes.status === 'fulfilled' && rpcRes.value?.success && Array.isArray(rpcRes.value.signatures)) {
          const sigs = rpcRes.value.signatures.slice(0, 5);
          if (sigs.length > 0) {
            const mapped = sigs.map((s: any, idx: number) => ({
              tx: s.signature || `sig_${idx}`,
              amountUsdc: idx === 0 ? 15.00 : idx === 1 ? 30.50 : idx === 2 ? 25.00 : 0.05 * (idx + 1),
              channel: idx === 0 ? 'WhatsApp (zeroclaw_channel)' : idx === 1 ? 'Kasir Solana Pay QR' : 'Agent Swarm Micro-Pay',
              memo: s.memo ? `Memo: ${s.memo}` : idx === 0 ? 'Pay for Product (Cafe Latte)' : idx === 1 ? 'Kasir QR Settlement' : 'Agent Micro-Pay',
              status: s.confirmationStatus ? (s.confirmationStatus.charAt(0).toUpperCase() + s.confirmationStatus.slice(1)) : 'Finalized',
              slot: `Slot ${s.slot || 480320796}`,
            }));
            setLiveStreamRows(mapped);
          }
        }
      } catch (err) {
        console.warn('ZeroClaw FinanceView polling fallback:', err);
      }
    };

    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Chart.js Cash Flow Multi-Line Data (Revenue vs Expense)
  const cashFlowData = {
    labels: ['1 Jul', '8 Jul', '15 Jul', '22 Jul', '29 Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: [1.2, 2.5, 1.8, 3.2, 2.8],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Expense',
        data: [0.6, 1.1, 0.9, 1.4, 1.2],
        borderColor: '#f97316',
        backgroundColor: '#f97316',
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const cashFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.3)' },
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10 },
          callback: (val: any) => `Rp${val}M`
        },
      },
    },
  };

  // Chart.js Doughnut Data for Expense Breakdown
  const expenseData = {
    labels: ['Produk', 'Marketing', 'Operasional', 'Pengiriman', 'Lainnya'],
    datasets: [
      {
        data: [40, 25, 15, 10, 10],
        backgroundColor: ['#3b82f6', '#f97316', '#a855f7', '#10b981', '#64748b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const expenseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Finance & Solana Payment Terminal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelola keuangan bisnis UMKM & Kasir Solana Pay berbasis AI Agent.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Currency Switcher (USDC / IDR - Rate: 1 USD = Rp 18,000) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setCurrencyMode('USDC');
                if (triggerToast) triggerToast('Currency: USDC ($)');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                currencyMode === 'USDC'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              USDC ($)
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrencyMode('IDR');
                if (triggerToast) triggerToast('Currency: IDR (Rp 18.000 / USD)');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                currencyMode === 'IDR'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              IDR (Rp)
            </button>
          </div>

          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setActiveFinanceTab('overview')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeFinanceTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Finance Overview
            </button>
            <button
              onClick={() => setActiveFinanceTab('zeroclaw')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeFinanceTab === 'zeroclaw'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <QrCode size={13} />
              ZeroClaw Solana Pay Terminal 🦀
            </button>
          </div>
        </div>
      </div>

      {/* Render selected view */}
      {activeFinanceTab === 'zeroclaw' ? (
        <ZeroClawTerminalView onTriggerToast={triggerToast || (() => {})} isGuest={isGuest} userEmail={userEmail} userName={userName} />
      ) : (
        <>

      {/* 4 Metric Cards - Dynamic USDC / IDR (1 USD = Rp 18,000) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currencyMode === 'IDR' ? 'Rp13.500.000' : '$750.00 USDC'}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 18% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Expense</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currencyMode === 'IDR' ? 'Rp6.250.000' : '$347.22 USDC'}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 12% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Profit</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Scale size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {currencyMode === 'IDR' ? 'Rp7.250.000' : '$402.78 USDC'}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 24% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Profit Margin</span>
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">53.7%</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 5% vs last month</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Cash Flow Chart & Expense Breakdown Doughnut */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Cash Flow Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Cash Flow</h3>
            <span className="text-[10px] font-bold text-slate-400">Daily ∨</span>
          </div>
          <div className="h-56">
            <Line data={cashFlowData} options={cashFlowOptions} />
          </div>
        </div>

        {/* Expense Breakdown Doughnut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-none">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Expense Breakdown</h3>
          <div className="h-44 relative flex items-center justify-center">
            <Doughnut data={expenseData} options={expenseOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-medium">Total</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {currencyMode === 'IDR' ? 'Rp6.25M' : '$347.22'}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-medium pt-1">
            <div className="flex justify-between"><span>Produk</span><span className="font-bold text-blue-600">40% ({currencyMode === 'IDR' ? 'Rp2.5M' : '$138.89'})</span></div>
            <div className="flex justify-between"><span>Marketing</span><span className="font-bold text-orange-600">25% ({currencyMode === 'IDR' ? 'Rp1.5M' : '$83.33'})</span></div>
            <div className="flex justify-between"><span>Operasional</span><span className="font-bold text-purple-600">15% ({currencyMode === 'IDR' ? 'Rp937K' : '$52.08'})</span></div>
            <div className="flex justify-between"><span>Pengiriman</span><span className="font-bold text-emerald-600">10% ({currencyMode === 'IDR' ? 'Rp625K' : '$34.72'})</span></div>
            <div className="flex justify-between"><span>Lainnya</span><span className="font-bold text-slate-600">10% ({currencyMode === 'IDR' ? 'Rp625K' : '$34.72'})</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Outstanding Invoices + AI Finance Assistant Card */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>ZeroClaw Solana Pay Settlement Stream</span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Devnet Live 📡
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFinanceTab('zeroclaw')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open Terminal →
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {liveStreamRows.map((row, i) => {
              const formattedAmt =
                currencyMode === 'IDR'
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.amountUsdc * 18000)
                  : `${row.amountUsdc.toFixed(2)} USDC`;

              return (
                <div key={i} className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-none">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{formattedAmt}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {row.status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {row.memo}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {row.slot}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate max-w-[280px]">
                      Tx: {row.tx}
                    </div>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${row.tx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-[10px] font-semibold flex items-center gap-1 transition-all self-end sm:self-center cursor-pointer shadow-none"
                  >
                    <span>Solana Explorer</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Finance Assistant Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between z-10">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" /> AI Finance Assistant
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">Active</span>
          </div>

          <div className="space-y-2 py-3 my-1">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              AI menemukan <span className="font-bold text-slate-900 dark:text-slate-100">8 penghematan</span> yang bisa dihemat.
            </p>
            <div className="p-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Potensi Penghematan</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-base">Rp1.050.000</span>
            </div>
          </div>

          <button 
            onClick={() => triggerToast?.('Viewing AI finance recommendations...')}
            className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-orange-500 hover:text-orange-500 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles size={14} className="text-orange-500" /> Lihat Rekomendasi
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
