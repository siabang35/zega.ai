import React, { useState } from 'react';
import { 
  X, Check, DollarSign, FileText, Plus, Search, Calendar, Filter, 
  CheckCircle2, RefreshCw, ShieldCheck, Zap, ArrowUpRight, ArrowDownRight,
  Bot, ExternalLink
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

// 5. All Solana Transactions Table Modal
export function AllTransactionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const txList = [
    { tx: 'TX#7Gf8...n3dA', customer: 'Siti Aisyah', amount: '$25.00', status: 'Sukses', time: '2 menit lalu' },
    { tx: 'TX#3Hd9...m7kB', customer: 'Budi Santoso', amount: '$18.50', status: 'Sukses', time: '15 menit lalu' },
    { tx: 'TX#5Jk2...p9xC', customer: 'Dewi Lestari', amount: '$42.00', status: 'Sukses', time: '28 menit lalu' },
    { tx: 'TX#9Lm1...q4wO', customer: 'Rizky Pratama', amount: '$12.75', status: 'Pending', time: '35 menit lalu' },
    { tx: 'TX#1Xc3...v8zE', customer: 'Maya Putri', amount: '$35.00', status: 'Sukses', time: '1 jam lalu' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Semua Transaksi Solana Pay">
      <div className="space-y-3 text-xs">
        {txList.map((t, i) => (
          <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100">{t.tx}</h4>
              <p className="text-[10px] text-slate-400 font-medium">{t.customer} • {t.time}</p>
            </div>

            <div className="text-right space-y-1">
              <div className="font-black text-slate-900 dark:text-slate-100">{t.amount}</div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                t.status === 'Sukses' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
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

  const handleApply = () => {
    triggerToast(`Filter keuangan diterapkan: Currency=${selectedCurrency}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Filter Performa Keuangan">
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
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Terapkan Filter
        </button>
      </div>
    </ModalBase>
  );
}
