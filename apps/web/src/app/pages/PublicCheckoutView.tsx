import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, QrCode, RefreshCw, Zap, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

interface PublicCheckoutViewProps {
  onBack?: () => void;
}

const DEFAULT_RECIPIENT_WALLET = 'D28h43NB6eHAJtYnkB1fh7H5NNj9vTm5NxrB7JVTbvfh';

const isValidBase58SolanaAddress = (addr?: string | null): boolean => {
  if (!addr || typeof addr !== 'string') return false;
  const trimmed = addr.trim();
  if (trimmed.includes('ZeGAMerchant') || trimmed.length < 32 || trimmed.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
};

export function PublicCheckoutView({ onBack }: PublicCheckoutViewProps) {
  const [params, setParams] = useState({
    reference: 'RefDSP_DEVNET',
    amount: '15.00',
    recipient: DEFAULT_RECIPIENT_WALLET,
    description: 'Pesanan Produk (ZEGA Enterprise Merchant)',
    channel: 'telegram',
    tier: 'umkm'
  });

  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPayUrl, setCopiedPayUrl] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'settled_exact' | 'settled_underpaid' | 'settled_overpaid'>('pending');
  const [settlementDetails, setSettlementDetails] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Parse URL query parameters with strict Base58 validation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('reference') || searchParams.get('ref') || 'RefDSP_DEVNET';
      const amt = searchParams.get('amount') || '15.00';
      const rawRec = searchParams.get('recipient');
      const desc = searchParams.get('description') || searchParams.get('memo') || 'Pesanan Produk (ZEGA AI)';
      const ch = searchParams.get('channel') || 'telegram';
      const tierParam = searchParams.get('tier') || 'umkm';

      const validRecipient = isValidBase58SolanaAddress(rawRec) ? rawRec!.trim() : DEFAULT_RECIPIENT_WALLET;

      setParams({
        reference: ref,
        amount: amt,
        recipient: validRecipient,
        description: desc,
        channel: ch,
        tier: tierParam === 'enterprise' ? 'enterprise' : 'umkm'
      });
    }
  }, []);

  const solanaPayUrl = `solana:${params.recipient}?amount=${parseFloat(params.amount).toFixed(2)}&spl-token=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&reference=${params.reference}`;
  const solflareTransferUrl = `https://solflare.com/ul/v1/transfer?recipient=${params.recipient}&amount=${parseFloat(params.amount).toFixed(2)}`;
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(solanaPayUrl)}&size=600&format=png`;

  // Real-time Solana On-Chain Settlement Poller (No auto-close, keeps page persistent)
  useEffect(() => {
    let intervalId: any = null;

    const pollSettlement = async () => {
      try {
        const apiBase = typeof window !== 'undefined' && (window.location.hostname.includes('zegaai.site') || window.location.hostname.includes('render.com'))
          ? 'https://zega-ai.onrender.com'
          : '';

        const res = await fetch(`${apiBase}/v1/zeroclaw/settlement/list?isDemo=false`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const found = json.data.find((evt: any) =>
              evt.signature?.includes(params.reference) ||
              evt.memo?.includes(params.reference) ||
              evt.id?.includes(params.reference)
            );

            if (found) {
              setPaymentStatus(found.settlementStatus || 'settled_exact');
              setSettlementDetails(found);
              setIsPolling(false);
              clearInterval(intervalId);
            }
          }
        }
      } catch { /* graceful fallback */ }
    };

    pollSettlement();
    intervalId = setInterval(pollSettlement, 3000);

    return () => clearInterval(intervalId);
  }, [params.reference]);

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(params.recipient);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleCopyPayUrl = () => {
    navigator.clipboard.writeText(solanaPayUrl);
    setCopiedPayUrl(true);
    setTimeout(() => setCopiedPayUrl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#ff6b35]/20 via-indigo-600/10 to-purple-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className={`size-9 rounded-xl flex items-center justify-center shadow-lg ${
            params.tier === 'enterprise' 
              ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-sky-500 shadow-indigo-500/20' 
              : 'bg-gradient-to-br from-[#ff6b35] via-emerald-600 to-teal-500 shadow-emerald-500/20'
          }`}>
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              {params.tier === 'enterprise' ? 'ZEGA PAY ENTERPRISE' : 'ZEGA PAY UMKM'}
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                params.tier === 'enterprise'
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {params.tier === 'enterprise' ? '🛡️ Enterprise Scale' : '🛒 UMKM Web3'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {params.tier === 'enterprise' ? 'Verified Corporate AI Merchant' : 'Verified UMKM Local Merchant'}
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
      </div>

      {/* Main Invoice Checkout Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl z-10 relative overflow-hidden">
        {/* Real-time Status Badge Banner */}
        <div className="mb-6">
          {paymentStatus === 'settled_exact' ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="size-5 flex-shrink-0 animate-bounce" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">PEMBAYARAN BERHASIL (SETTLED 100%)</p>
                <p className="text-[11px] text-emerald-300/80">Lunas & Terverifikasi On-Chain di Solana Devnet</p>
                {settlementDetails?.signature && (
                  <a
                    href={`https://explorer.solana.com/tx/${settlementDetails.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono underline text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Tx: {settlementDetails.signature.slice(0, 16)}...</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="size-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider">MENUNGGU PEMBAYARAN</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
                <RefreshCw className={`size-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                <span>Polling On-Chain</span>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Center Display */}
        <div className="flex flex-col items-center text-center my-4">
          <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-slate-800 group transition-transform hover:scale-[1.02]">
            <img
              src={qrImageUrl}
              alt="Solana Pay QR Code"
              className="size-56 sm:size-64 object-contain rounded-xl"
            />
            <div className="absolute inset-0 rounded-3xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <QrCode className="size-3.5 text-[#ff6b35]" />
            <span>Pindai Gambar QR di atas via Phantom / Solflare Mobile</span>
          </p>
        </div>

        {/* Invoice Summary Details */}
        <div className="mt-6 space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Merchant</span>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Building2 className={`size-3.5 ${params.tier === 'enterprise' ? 'text-indigo-400' : 'text-emerald-400'}`} />
              {params.tier === 'enterprise' ? 'ZEGA AI Enterprise Terminal' : 'ZEGA Pay UMKM Merchant'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Deskripsi Pesanan</span>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
              {params.description}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Total Nominal</span>
            <span className="text-lg font-black text-emerald-400 tracking-tight">
              {parseFloat(params.amount).toFixed(2)} <span className="text-xs font-semibold text-slate-400">USDC</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Reference ID</span>
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {params.reference}
            </span>
          </div>
        </div>

        {/* Copy Wallet & Solana Pay URI Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleCopyWallet}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <Building2 className="size-4 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
              <span className="truncate font-mono text-[11px]">{params.recipient}</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400 flex-shrink-0 font-sans text-xs font-bold">
              {copiedWallet ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy Wallet</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleCopyPayUrl}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <Zap className="size-4 text-amber-400 flex-shrink-0" />
              <span className="truncate font-mono text-[11px]">solana:{params.recipient.substring(0, 10)}...</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 flex-shrink-0 font-sans text-xs font-bold">
              {copiedPayUrl ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy Solana URI</span>
                </>
              )}
            </div>
          </button>

          {/* Dual Wallet Action Launchers (Phantom & Solflare) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={solanaPayUrl}
              className="flex items-center justify-center gap-1.5 p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-xs font-extrabold text-white shadow-xl hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>👻 Buka di Phantom</span>
              <ExternalLink className="size-3.5" />
            </a>

            <a
              href={solflareTransferUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-500 text-xs font-extrabold text-white shadow-xl hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>🟣 Buka di Solflare</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Security Trust Seal */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Secured by ZEGA ZeroClaw OWASP Multi-Layer Validation</span>
        </div>
      </div>
    </div>
  );
}

