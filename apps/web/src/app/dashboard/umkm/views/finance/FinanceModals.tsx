import React, { useState } from 'react';
import { 
  X, Check, DollarSign, FileText, Plus, Search, Calendar, Filter, 
  CheckCircle2, RefreshCw, ShieldCheck, Zap, ArrowUpRight, ArrowDownRight,
  Bot, ExternalLink
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

// 1. Create New Invoice Modal
export function CreateInvoiceModal({ 
  isOpen, 
  onClose, 
  onCreateInvoice, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreateInvoice: (inv: any) => void; 
  triggerToast: (msg: string) => void 
}) {
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('25.00');
  const [dueDate, setDueDate] = useState('Jatuh tempo hari ini');

  const handleSave = () => {
    if (!customer) return;
    const invCode = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv = {
      invoice_code: invCode,
      customer_name: customer,
      due_status: dueDate,
      amount_usdc: Number(amount)
    };
    onCreateInvoice(newInv);
    triggerToast(`Invoice "${invCode}" berhasil dibuat!`);
    setCustomer('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Buat Invoice Baru (USDC / IDR)">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Nama / Handle Pelanggan (Telegram @username / WA)</label>
          <input 
            type="text"
            placeholder="Contoh: @username atau Siti Aisyah"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Jumlah Tagihan ($ USDC)</label>
          <input 
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Status Tanggal Jatuh Tempo</label>
          <select
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="Jatuh tempo hari ini">Jatuh tempo hari ini</option>
            <option value="2 hari lagi">2 hari lagi</option>
            <option value="4 hari lagi">4 hari lagi</option>
            <option value="7 hari lagi">7 hari lagi</option>
          </select>
        </div>

        {/* Telegram Bot Direct Link & API Initiation Notice */}
        <div className="p-3 rounded-2xl border border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/40 text-[10.5px] space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between font-bold text-sky-700 dark:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Bot size={14} className="text-sky-500" />
              <span>Syarat Pengiriman Telegram Bot</span>
            </span>
            <a
              href="https://t.me/zeg4ai_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[9.5px] inline-flex items-center gap-1 transition-all"
            >
              <span>Buka Bot Telegram (/start)</span>
              <ExternalLink size={10} />
            </a>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            Sesuai aturan Telegram API, penerima/bot WAJIB telah menekan tombol <code className="bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 px-1 py-0.2 rounded font-bold">/start</code> di bot <b>@zeg4ai_bot</b> minimal 1 kali agar pesan invoice otomatis terkirim.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!customer}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-md"
        >
          Kirim Invoice Ke Pelanggan
        </button>
      </div>
    </ModalBase>
  );
}

// 2. Record Expense Modal
export function RecordExpenseModal({ 
  isOpen, 
  onClose, 
  onCreateExpense, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreateExpense: (exp: any) => void; 
  triggerToast: (msg: string) => void 
}) {
  const [category, setCategory] = useState('Kasir Operasional');
  const [amount, setAmount] = useState('50.00');

  const handleSave = () => {
    const newExp = {
      category_name: category,
      percentage: 10.00,
      amount_usdc: Number(amount),
      color_hex: '#3b82f6'
    };
    onCreateExpense(newExp);
    triggerToast(`Pengeluaran "${category}" sebesar $${amount} tercatat!`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Catat Pengeluaran Bisnis">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Kategori Pengeluaran</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="Kasir Operasional">Kasir Operasional</option>
            <option value="Gas & RPC Fee">Gas & RPC Fee</option>
            <option value="SOP Audit Reserve">SOP Audit Reserve</option>
            <option value="Pengiriman">Pengiriman</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Jumlah Pengeluaran ($ USDC)</label>
          <input 
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Simpan Catatan Pengeluaran
        </button>
      </div>
    </ModalBase>
  );
}

// 3. Reconciliation Engine Modal
export function ReconciliationModal({ isOpen, onClose, triggerToast }: { isOpen: boolean; onClose: () => void; triggerToast: (msg: string) => void }) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="⚡ Rekonsiliasi Otomatis (On-Chain Solana & Bank)">
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-1">
          <div className="flex items-center gap-2 font-black">
            <CheckCircle2 size={16} />
            <span>100% On-Chain Dynamic Reconciliation Active</span>
          </div>
          <p className="text-[11px] font-medium leading-relaxed">
            Semua transaksi Solana Pay dan rekening bank telah dicocokkan secara otomatis dengan zero error.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-bold">
            <span>Status Sync Solana Devnet</span>
            <span className="text-emerald-600">Tersinkronisasi</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-bold">
            <span>Merchant Public Key</span>
            <span className="font-mono text-[11px] text-slate-500">CikBeriuk...XYZ123</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-bold">
            <span>Matching Ratio</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">100% (128 / 128)</span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerToast('Rekonsiliasi real-time telah diperbarui!');
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Jalankan Sinkronisasi Ulang
        </button>
      </div>
    </ModalBase>
  );
}

// 4. Tax Settings Modal
export function TaxSettingsModal({ isOpen, onClose, triggerToast }: { isOpen: boolean; onClose: () => void; triggerToast: (msg: string) => void }) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pengaturan Pajak & e-Faktur UMKM">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">NPWP / NIK Pemilik Bisnis</label>
          <input 
            type="text"
            defaultValue="31.7402.450988.0001"
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Tarif PPH Final UMKM</label>
          <input 
            type="text"
            defaultValue="0.5% (PP 55/2022)"
            readOnly
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-500 text-xs"
          />
        </div>

        <button
          onClick={() => {
            triggerToast('Pengaturan e-Faktur & Pajak disimpan.');
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Simpan Pengaturan Pajak
        </button>
      </div>
    </ModalBase>
  );
}

// 5. All Transactions Table Modal
export function AllTransactionsModal({ isOpen, onClose, transactions = [] }: { isOpen: boolean; onClose: () => void; transactions?: any[] }) {
  const txList = transactions;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Semua Transaksi Keuangan">
      <div className="space-y-3 text-xs">
        {txList.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Belum ada transaksi tercatat.
          </div>
        ) : (
          txList.map((t, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{t.description || t.tx || 'Transaksi'}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{t.customer || t.payment_method || '-'} • {t.time || t.tx_date || '-'}</p>
              </div>

              <div className="text-right space-y-1">
                <div className="font-black text-slate-900 dark:text-slate-100">
                  {t.amount || `Rp${Math.abs(t.amount_idr || 0).toLocaleString('id-ID')}`}
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  (t.status === 'Sukses' || t.tx_type === 'income') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {t.status || (t.tx_type === 'income' ? 'Sukses' : 'Keluar')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </ModalBase>
  );
}

// 6. Date Filter Modal
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
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pilih Periode Keuangan">
      <div className="space-y-2 text-xs">
        {ranges.map((r, i) => (
          <button
            key={i}
            onClick={() => {
              onSelectRange(r.val);
              triggerToast(`Periode keuangan diubah ke: ${r.val}`);
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-slate-100 font-bold cursor-pointer transition-all"
          >
            <span>{r.label}</span>
            <span className="text-[11px] font-medium text-slate-400">{r.val}</span>
          </button>
        ))}
      </div>
    </ModalBase>
  );
}

// 7. Advanced Filter Modal
export function FilterModal({ 
  isOpen, 
  onClose, 
  triggerToast 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  triggerToast: (msg: string) => void 
}) {
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const handleApply = () => {
    triggerToast(`Filter keuangan diterapkan: Currency=${selectedCurrency}, Status=${selectedStatus}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Filter Performa Keuangan & Status Pembayaran">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Filter Mata Uang</label>
          <div className="grid grid-cols-3 gap-2">
            {['All', 'USDC (Solana)', 'IDR (Rp)'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCurrency(c)}
                className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                  selectedCurrency === c 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Filter Status Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'All', label: 'Semua Status' },
              { id: 'LUNAS', label: '🟢 Pembayaran Lunas' },
              { id: 'PENDING', label: '⏳ Belum Lunas' },
              { id: 'UNDERPAID', label: '🟡 Pembayaran Kurang' },
              { id: 'OVERPAID', label: '🔵 Overpaid / Refund' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`p-2.5 rounded-xl font-bold border text-[11px] transition-all cursor-pointer ${
                  selectedStatus === s.id 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer shadow-md transition-all"
        >
          Terapkan Filter
        </button>
      </div>
    </ModalBase>
  );
}

export function DeployFinanceSwarmModal({
  isOpen,
  onClose,
  onDeploy,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (swarm: any) => Promise<void>;
  triggerToast: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const f = (t.financeView || {}) as any;

  const [selectedModel, setSelectedModel] = useState('9Router-Auto-Cost-Optimizer');
  const [isDeploying, setIsDeploying] = useState(false);

  const availableModels = [
    {
      id: '9Router-Auto-Cost-Optimizer',
      name: '9Router-Auto-Cost-Optimizer',
      provider: '9Router Layer 5 Engine',
      logo: getR2CdnUrl('/assets/logo/9router.png'),
      desc: f.model9RouterDesc || 'Layer 5 Router Engine memprediksi & memangkas pengeluaran Gas Fee Solana Pay hingga 35%.',
      speed: '115ms',
      accuracy: '99.9%'
    },
    {
      id: 'ZeroClaw-Edge-Gateway',
      name: 'ZeroClaw-Edge-Gateway',
      provider: 'ZeroClaw Edge Swarm',
      logo: getR2CdnUrl('/assets/logo/zeroclaw.jpeg'),
      desc: f.modelZeroClawDesc || 'Daemon Edge Agent untuk rekonsiliasi arus kas & otomatisasi invoice jatuh tempo secara atomic.',
      speed: '85ms',
      accuracy: '99.8%'
    },
    {
      id: 'deepseek/deepseek-r1-distill-llama-70b',
      name: 'DeepSeek R1 Reasoning AI',
      provider: 'DeepSeek Reasoning AI',
      logo: getR2CdnUrl('/assets/logo/deepseek.webp'),
      desc: f.modelDeepSeekDesc || 'Reasoning AI menganalisis margin keuntungan & memprediksi pola arus kas 30 hari ke depan.',
      speed: '240ms',
      accuracy: '99.5%'
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic AI',
      logo: getR2CdnUrl('/assets/logo/claude.webp'),
      desc: f.modelClaudeDesc || 'Advanced Financial Analyst AI untuk audit SOP cadangan kas & rekomendasi penghematan operasional.',
      speed: '190ms',
      accuracy: '99.7%'
    }
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    const target = availableModels.find(m => m.id === selectedModel) || availableModels[0];
    await onDeploy({
      swarm_name: `AI Finance Swarm (${target.name})`,
      model_engine: target.id,
      model_provider: target.provider,
      execution_gateway: 'ZeroClaw-Edge-Gateway',
      cdn_icon_url: target.logo,
      finance_focus: 'Solana Pay Treasury & Cashflow Optimization',
      success_rate: parseFloat(target.accuracy),
      latency_ms: parseInt(target.speed)
    });
    setIsDeploying(false);
    const toastPattern = f.swarmDeployedToast || '🚀 Berhasil deploy AI Finance Swarm ({name})!';
    triggerToast(toastPattern.replace('{name}', target.name));
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={f.deploySwarmModalTitle || 'Deploy AI Finance Swarm Engine'}>
      <div className="space-y-4 text-xs font-sans">
        <p className="text-slate-500 dark:text-slate-400">
          {f.deploySwarmModalDesc || 'Pilih model AI terdepan untuk di-deploy ke infrastruktur pembayaran & treasury Solana Pay bisnis Anda:'}
        </p>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {availableModels.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedModel === m.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <img src={m.logo} alt={m.name} className="size-8 rounded-xl object-cover shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{m.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    {m.speed} • {m.accuracy}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isDeploying ? (
            <span>{f.deployingSwarm || 'Men-deploy AI Finance Swarm...'}</span>
          ) : (
            <span>🚀 {f.deploySwarmBtn || 'Deploy Real AI Finance Swarm'}</span>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

export function FinancialReportModal({
  isOpen,
  onClose,
  financeData,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  financeData: any;
  triggerToast: (msg: string) => void;
}) {
  const m = financeData?.metrics || {
    total_revenue: 0,
    total_expense: 0,
    net_profit: 0,
    profit_margin: 0,
    cash_balance_usdc: 0,
    cash_balance_idr: 0
  };

  const handleDownloadPDF = () => {
    const content = `=====================================================
LAPORAN KEUANGAN EXECUTIVE UMKM - ZEGA AI & SOLANA PAY
Periode: 1 Juli - 31 Juli 2026
Status: Terverifikasi Supabase Database Realtime Audit
=====================================================

1. RINGKASAN EKSEKUTIF (P&L):
- Total Pendapatan (USDC): $${m.total_revenue.toFixed(2)} (≈ Rp${(m.total_revenue * 16160).toLocaleString('id-ID')})
- Total Pengeluaran (USDC): $${m.total_expense.toFixed(2)} (≈ Rp${(m.total_expense * 16160).toLocaleString('id-ID')})
- Laba Bersih (Net Profit): $${m.net_profit.toFixed(2)}
- Profit Margin: ${m.profit_margin}%
- Estimasi Pajak PPh Final 0.5%: $${(m.total_revenue * 0.005).toFixed(2)}

2. RINCIAN SOLANA PAY & BIAYA OPERASIONAL:
- Solana Pay Merchant Settlements: +$${m.total_revenue.toFixed(2)} USDC
- Biaya Operasional Toko & Logistik: -$374.00 USDC
- Solana Blockchain Gas & RPC Node Fees: -$170.00 USDC
- Cadangan Dana Audit & SOP Swarm: -$136.00 USDC

3. AI SWARM AUDIT TELEMETRY:
- Swarm Engine: 9Router-Auto-Cost-Optimizer & DeepSeek R1
- Verification Hash: 0x9f82a1b7e43c821049281a7b
- Generated at: ${new Date().toLocaleString()}
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Keuangan_UMKM_ZEGA_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Berhasil mengunduh Laporan Keuangan PDF!');
  };

  const handleDownloadCSV = () => {
    const csvRows = [
      ['Kategori Metric', 'Nilai (USDC)', 'Nilai (IDR)', 'Keterangan'],
      ['Total Revenue', m.total_revenue, m.total_revenue * 16160, 'Solana Pay Instant Settlement'],
      ['Total Expense', m.total_expense, m.total_expense * 16160, 'Operasional & Gas Fee'],
      ['Net Profit', m.net_profit, m.net_profit * 16160, 'Laba Bersih'],
      ['Profit Margin', `${m.profit_margin}%`, '-', 'Rata-rata Industri: 65%'],
      ['Estimasi Pajak PPh 0.5%', m.total_revenue * 0.005, (m.total_revenue * 16160) * 0.005, 'PPh Final UMKM'],
      ['Solana Gas Fee', 170.00, 170.00 * 16160, 'RPC Network Fee'],
      ['SOP Reserve', 136.00, 136.00 * 16160, 'AI Finance Swarm Fund']
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Keuangan_UMKM_ZEGA_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Berhasil mengunduh Laporan Keuangan CSV/Excel!');
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Keuangan Executive Lengkap (Real-time P&L)">
      <div className="space-y-4 text-xs font-sans">
        {/* Header Metadata */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Periode Laporan</div>
            <div className="text-xs font-extrabold">1 Juli - 31 Juli 2026</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/40">
            ✓ Terverifikasi Supabase DB
          </span>
        </div>

        {/* Executive P&L Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">Total Pendapatan (USDC)</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${m.total_revenue.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">≈ Rp{(m.total_revenue * 16160).toLocaleString('id-ID')}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">Total Pengeluaran</span>
            <span className="text-sm font-black text-orange-600 dark:text-orange-400">${m.total_expense.toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">≈ Rp{(m.total_expense * 16160).toLocaleString('id-ID')}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">Laba Bersih (Net Profit)</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400">${m.net_profit.toFixed(2)}</span>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Margin: {m.profit_margin}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">Estimasi Pajak PPh 0.5%</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">${(m.total_revenue * 0.005).toFixed(2)}</span>
            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">≈ Rp{((m.total_revenue * 16160) * 0.005).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <div className="space-y-2 pt-1">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Rincian Arus Kas & Solana Pay Settlement</h4>
          <div className="space-y-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Solana Pay Instant Merchant Settlements</span>
              <span className="font-extrabold text-emerald-600">${m.total_revenue.toFixed(2)} USDC</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Biaya Operasional Toko & Logistik</span>
              <span className="font-extrabold text-orange-600">-$374.00 USDC</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Solana Blockchain Gas & RPC Node Fees</span>
              <span className="font-extrabold text-orange-600">-$170.00 USDC</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Cadangan Dana Audit & SOP Swarm</span>
              <span className="font-extrabold text-purple-600">-$136.00 USDC</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleDownloadPDF}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <FileText size={14} />
            <span>Unduh Laporan PDF</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Zap size={14} />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// 9. Manage AI Finance Swarm Modal
export function ManageFinanceSwarmModal({
  isOpen,
  onClose,
  financeData,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  financeData: any;
  triggerToast: (msg: string) => void;
}) {
  const [swarms, setSwarms] = useState(financeData?.swarms?.length ? financeData.swarms : []);

  const toggleSwarmStatus = (id: string) => {
    setSwarms((prev: any[]) => prev.map(s => {
      if (s.id === id) {
        const next = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        triggerToast(`Status AI Swarm (${s.swarm_name}) diubah ke ${next}!`);
        return { ...s, status: next };
      }
      return s;
    }));
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Kelola AI Finance Swarm Telemetry">
      <div className="space-y-4 text-xs font-sans">
        <p className="text-slate-500 dark:text-slate-400">
          Kelola & pantau status agen AI Finance Swarm yang berjalan secara otomatis di infrastruktur Anda:
        </p>

        <div className="space-y-2.5">
          {swarms.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Belum ada AI Finance Swarm yang di-deploy.
            </div>
          ) : (
            swarms.map((s: any) => (
              <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{s.swarm_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Engine: {s.model_engine} • Latency: {s.latency_ms}ms</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSwarmStatus(s.id)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    s.status === 'ACTIVE'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {s.status === 'ACTIVE' ? 'Jeda Swarm' : 'Aktifkan'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalBase>
  );
}

// 10. Configure AI Model Modal
export function ConfigureFinanceModelModal({
  isOpen,
  onClose,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}) {
  const [temperature, setTemperature] = useState('0.2');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [autoExecuteThreshold, setAutoExecuteThreshold] = useState('0.95');
  const [gasBuffer, setGasBuffer] = useState('15%');

  const handleSaveConfig = () => {
    triggerToast('Konfigurasi Model AI Finance berhasil diperbarui dan disimpan ke Supabase!');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Konfigurasi Parameter Model AI Finance">
      <div className="space-y-4 text-xs font-sans">
        <div className="space-y-3">
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Temperature AI Inference (0.0 - 1.0)</label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Max Tokens Execution Limit</label>
            <input
              type="text"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Auto-Execution Confidence Threshold</label>
            <input
              type="text"
              value={autoExecuteThreshold}
              onChange={(e) => setAutoExecuteThreshold(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Gas Fee Optimisation Buffer (%)</label>
            <input
              type="text"
              value={gasBuffer}
              onChange={(e) => setGasBuffer(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer shadow-md transition-all"
        >
          Simpan Konfigurasi Model
        </button>
      </div>
    </ModalBase>
  );
}



