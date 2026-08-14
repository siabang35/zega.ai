'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Coins,
  FileText,
  QrCode,
  Zap,
} from 'lucide-react';

export interface PrivyWalletDashboardProps {
  userId?: string;
  onToast?: (message: string) => void;
}

interface WalletData {
  address: string;
  chain: string;
  privyUserId: string;
  walletType: string;
}

interface BalancesData {
  sol: string;
  lamports: string;
  tokens: Array<{
    mint: string;
    amount: string;
    decimals: number;
    uiAmount: number;
    symbol: string;
    name: string;
  }>;
}

interface TransactionItem {
  id: string;
  type: string;
  asset: string;
  amount: string;
  sender: string;
  recipient: string;
  status: string;
  signature?: string;
  createdAt: string;
}

export function PrivyWalletDashboard({ userId = 'user@zegaai.site', onToast }: PrivyWalletDashboardProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balances, setBalances] = useState<BalancesData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isSendOpen, setIsSendOpen] = useState<boolean>(false);
  const [sendAsset, setSendAsset] = useState<'SOL' | 'USDC'>('SOL');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Safe process.env extraction for Next.js browser context
  const getApiBase = () => {
    try {
      const env = (globalThis as any)?.process?.env || (import.meta as any)?.env;
      return env?.NEXT_PUBLIC_API_URL || env?.VITE_API_URL || '';
    } catch {
      return '';
    }
  };

  const apiBase = getApiBase();

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${apiBase}/api/wallet`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
        setBalances(data.balances);
      }

      const txRes = await fetch(`${apiBase}/api/wallet/transactions?limit=10`, {
        headers: { 'x-user-id': userId },
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      if (onToast) onToast('Alamat wallet berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreview = async () => {
    if (!recipient || !amount) return;
    try {
      setPreviewLoading(true);
      setTxError(null);
      const res = await fetch(`${apiBase}/api/transactions/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          recipient,
          amount,
          asset: sendAsset,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal membuat pratinjau transaksi.');
      }
      setPreview(data);
    } catch (err: any) {
      setTxError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteSend = async () => {
    if (!recipient || !amount) return;
    try {
      setSubmitting(true);
      setTxError(null);

      const endpoint = sendAsset === 'SOL' ? '/api/transactions/transfer' : '/api/transactions/token-transfer';
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'idempotency-key': `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        },
        body: JSON.stringify({
          recipient,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Transaksi gagal dieksekusi.');
      }

      if (onToast) onToast(`Withdraw ${sendAsset} Berhasil! Signature: ${data.signature?.substr(0, 8)}...`);
      setIsSendOpen(false);
      setRecipient('');
      setAmount('');
      setPreview(null);
      fetchWalletData();
    } catch (err: any) {
      setTxError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const truncateAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '';

  return (
    <div className="space-y-6">
      {/* Header & Wallet Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase">
                ZEGA Account Wallet
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected automatically
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              {wallet ? truncateAddress(wallet.address) : 'Memuat Wallet...'}
              {wallet?.address && (
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Salin Alamat Wallet"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              User Email: <span className="font-mono text-slate-300">{userId}</span> • Solana Devnet
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchWalletData}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => setIsSendOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw / Send
            </button>
          </div>
        </div>

        {/* Balances Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              SOL Balance
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {balances ? parseFloat(balances.sol).toFixed(4) : '0.0000'} <span className="text-sm font-normal text-indigo-300">SOL</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ≈ {balances ? (parseFloat(balances.sol) * 185).toFixed(2) : '0.00'} USD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-blue-400" />
              USDC Balance
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {balances?.tokens?.find((t) => t.symbol === 'USDC')?.uiAmount.toFixed(2) || '0.00'}{' '}
              <span className="text-sm font-normal text-blue-300">USDC</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Solana Devnet SPL Standard</div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Status Dompet Otonom
            </div>
            <div className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Non-Custodial Privy Enclave
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Terhubung otomatis dengan Email ZEGA</div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Riwayat Transaksi ZEGA Account
          </h3>
          <span className="text-xs text-slate-400">{transactions.length} Transaksi Terakhir</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Belum ada riwayat transaksi. Lakukan kirim atau deposit asset pertama Anda!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">
                      {tx.type} — {tx.amount} {tx.asset}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Ke: {truncateAddress(tx.recipient)} • {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      tx.status === 'CONFIRMED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tx.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {tx.status}
                  </span>

                  {tx.signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Lihat di Solana Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Deposit Asset ke ZEGA Account
              </h3>
              <button
                onClick={() => setIsDepositOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Kirim SOL atau SPL Token (USDC) dari exchange/wallet eksternal ke alamat Privy otomatis Anda di bawah ini:
              </p>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Alamat Solana Anda (Privy Managed)
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 select-all">
                  {wallet?.address || 'Memuat alamat...'}
                </div>
                <button
                  onClick={copyAddress}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Alamat Tersalin!' : 'Salin Alamat Wallet'}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Deposit akan otomatis terdeteksi & masuk ke saldo ZEGA Anda.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send / Withdraw Modal */}
      {isSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Withdraw / Send Asset
              </h3>
              <button
                onClick={() => {
                  setIsSendOpen(false);
                  setPreview(null);
                  setTxError(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {txError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txError}</span>
              </div>
            )}

            {/* Asset Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Pilih Asset</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSendAsset('SOL');
                    setPreview(null);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    sendAsset === 'SOL'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  SOL (Native)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendAsset('USDC');
                    setPreview(null);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    sendAsset === 'USDC'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  USDC (SPL Token)
                </button>
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Alamat Penerima Eksternal (Solana Base58)</label>
              <input
                type="text"
                placeholder="misal: 7xKX...9qLz"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setPreview(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Jumlah Transaksi</label>
              <input
                type="text"
                placeholder="misal: 0.1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPreview(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Preview Breakdown */}
            {preview && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  Pratinjau Estimasi Transaksi
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimasi Gas Fee:</span>
                  <span className="font-mono">{preview.estimatedFee?.networkFeeSol} SOL</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Diperlukan:</span>
                  <span className="font-mono font-bold text-white">
                    {preview.estimatedFee?.totalRequiredSol} SOL
                  </span>
                </div>
              </div>
            )}

            {/* Modal Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {!preview ? (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading || !recipient || !amount}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {previewLoading ? 'Memuat Pratinjau...' : 'Cek Estimasi Fee'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sign & Submit via Privy Enclave...
                    </>
                  ) : (
                    'Konfirmasi Withdraw via Privy'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
