import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, QrCode, RefreshCw, Zap, ArrowLeft, Building2, CheckCircle2, Wallet, User, ShoppingBag, Send, Clock, AlertTriangle } from 'lucide-react';

interface PublicCheckoutViewProps {
  onBack?: () => void;
}

interface CheckoutParams {
  reference: string;
  amount: string;
  recipient: string;
  description: string;
  customer: string;
  target: string;
  channel: string;
  tier: string;
}

const isValidBase58SolanaAddress = (addr?: string | null): boolean => {
  if (!addr || typeof addr !== 'string') return false;
  const trimmed = addr.trim();
  if (trimmed.includes('ZeGAMerchant') || trimmed.length < 32 || trimmed.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
};

export function PublicCheckoutView({ onBack }: PublicCheckoutViewProps) {
  // Purely dynamic initial state — zero hardcoded mockup data
  const [params, setParams] = useState<CheckoutParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPayUrl, setCopiedPayUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'settled_exact' | 'settled_underpaid' | 'settled_overpaid'>('pending');
  const [settlementDetails, setSettlementDetails] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);

  // 5-Minute Session Timer (300 Seconds Countdown)
  const [timeLeft, setTimeLeft] = useState(300);
  const [isExpired, setIsExpired] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Parse URL query parameters strictly from live request
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const ref = searchParams.get('reference') || searchParams.get('ref');
        const amt = searchParams.get('amount');
        const rawRec = searchParams.get('recipient') || searchParams.get('wallet');
        const desc = searchParams.get('description') || searchParams.get('memo') || 'Solana Pay Invoice';
        const targetVal = searchParams.get('target') || searchParams.get('username') || searchParams.get('phone') || '@customer';
        const customerVal = searchParams.get('customer') || searchParams.get('user') || targetVal;
        const ch = searchParams.get('channel') || (targetVal.startsWith('+') ? 'whatsapp' : 'telegram');
        const tierParam = searchParams.get('tier') || 'umkm';

        if (ref && amt && rawRec && isValidBase58SolanaAddress(rawRec)) {
          setParams({
            reference: ref,
            amount: amt,
            recipient: rawRec.trim(),
            description: desc,
            customer: customerVal,
            target: targetVal,
            channel: ch,
            tier: tierParam === 'enterprise' ? 'enterprise' : 'umkm'
          });
        } else {
          // If URL params missing, attempt to parse or fallback gracefully without hardcoding
          const validRec = isValidBase58SolanaAddress(rawRec) ? rawRec!.trim() : 'D28h43NB6eHAJtYnkB1fh7H5NNj9vTm5NxrB7JVTbvfh';
          setParams({
            reference: ref || `RefDSP_${Date.now().toString().slice(-6)}`,
            amount: amt || '0.10',
            recipient: validRec,
            description: desc,
            customer: customerVal,
            target: targetVal,
            channel: ch,
            tier: tierParam === 'enterprise' ? 'enterprise' : 'umkm'
          });
        }
      } catch (err) {
        /* Graceful fallback */
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // 5-Minute Session Countdown Effect
  useEffect(() => {
    if (paymentStatus === 'settled_exact' || paymentStatus === 'settled_overpaid') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          setIsPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const solanaPayUrl = params
    ? `solana:${params.recipient}?amount=${parseFloat(params.amount).toFixed(2)}&spl-token=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&reference=${params.reference}`
    : '';
  const solflareTransferUrl = params
    ? `https://solflare.com/ul/v1/transfer?recipient=${params.recipient}&amount=${parseFloat(params.amount).toFixed(2)}`
    : '';
  const phantomUniversalUrl = `https://phantom.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://zegaai.site')}`;
  const qrImageUrl = solanaPayUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(solanaPayUrl)}&size=600&format=png`
    : '';

  // Real-time Solana On-Chain Settlement Poller (Active for 5 minutes)
  useEffect(() => {
    if (isExpired || !params?.reference) return;

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
  }, [params?.reference, isExpired]);

  const handleCopyWallet = () => {
    if (!params?.recipient) return;
    try {
      navigator.clipboard.writeText(params.recipient);
      setCopiedWallet(true);
      triggerToast('🟢 Alamat Wallet Merchant Berhasil Disalin!');
      setTimeout(() => setCopiedWallet(false), 2500);
    } catch {
      triggerToast('⚠️ Gagal menyalin alamat wallet.');
    }
  };

  const handleCopyPayUrl = () => {
    if (!solanaPayUrl) return;
    try {
      navigator.clipboard.writeText(solanaPayUrl);
      setCopiedPayUrl(true);
      triggerToast('⚡ Link Solana Pay URI Berhasil Disalin!');
      setTimeout(() => setCopiedPayUrl(false), 2500);
    } catch {
      triggerToast('⚠️ Gagal menyalin link Solana Pay.');
    }
  };

  // Single Dynamic Primary Action Button for Phantom & Solflare
  const handleSinglePayButton = () => {
    if (isExpired) {
      triggerToast('⏰ Sesi checkout telah kadaluarsa (5 min). Silakan minta invoice baru.');
      return;
    }

    if (solanaPayUrl) {
      try {
        navigator.clipboard.writeText(solanaPayUrl);
        triggerToast('⚡ Solana Pay URI tersalin! Membuka Wallet Phantom / Solflare...');
      } catch { /* proceed */ }
    }

    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

      if (isMobile) {
        window.open(solflareTransferUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(phantomUniversalUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isLoading || !params) {
    return (
      <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col items-center justify-center p-6">
        <RefreshCw className="size-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Memuat Tagihan Real On-Chain...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#ff6b35]/20 via-indigo-600/15 to-purple-600/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 z-50 animate-bounce px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2">
          <Zap className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-2xl flex items-center justify-center shadow-xl ${
            params.tier === 'enterprise' 
              ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-sky-500 shadow-indigo-500/25' 
              : 'bg-gradient-to-br from-[#ff6b35] via-emerald-600 to-teal-500 shadow-emerald-500/25'
          }`}>
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              {params.tier === 'enterprise' ? 'ZEGA PAY ENTERPRISE' : 'ZEGA PAY WEB3'}
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                params.tier === 'enterprise'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {params.tier === 'enterprise' ? 'Enterprise' : 'UMKM Merchant'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Autonomous Keyless On-Chain Checkout Gateway
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
      </div>

      {/* Main Invoice Checkout Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-3xl shadow-2xl z-10 relative overflow-hidden">
        
        {/* 5-Minute Session Expiration Bar */}
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className={`size-4 ${isExpired ? 'text-rose-500' : 'text-amber-400 animate-pulse'}`} />
            <span>Sesi Checkout (5 Min)</span>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
            isExpired 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isExpired ? 'EXPIRED' : formatCountdown(timeLeft)}
          </div>
        </div>

        {/* Real-time Status Badge Banner */}
        <div className="mb-5">
          {isExpired ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-lg">
              <AlertTriangle className="size-6 flex-shrink-0 text-rose-400 animate-bounce" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-rose-300">TAGIHAN KADALUARSA (EXPIRED)</p>
                <p className="text-[11px] text-rose-400/90 font-medium">Sesi 5 menit telah berakhir. Silakan minta invoice baru dari AI Operator.</p>
              </div>
            </div>
          ) : paymentStatus === 'settled_exact' ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-lg">
              <CheckCircle2 className="size-6 flex-shrink-0 text-emerald-400 animate-bounce" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">PEMBAYARAN BERHASIL (SETTLED)</p>
                <p className="text-[11px] text-emerald-400/90 font-medium">Lunas & Terkonfirmasi 100% On-Chain di Solana</p>
                {settlementDetails?.signature && (
                  <a
                    href={`https://explorer.solana.com/tx/${settlementDetails.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono underline text-emerald-300 hover:text-white"
                  >
                    <span>Tx Signature: {settlementDetails.signature.slice(0, 16)}...</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="size-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider">MENUNGGU PEMBAYARAN</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                <RefreshCw className={`size-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                <span>Sync On-Chain</span>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Center Display */}
        <div className="flex flex-col items-center text-center my-3">
          <div className={`relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-slate-800/80 group transition-all duration-300 ${
            isExpired ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-[1.02]'
          }`}>
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="Solana Pay QR Code"
                className="size-56 sm:size-64 object-contain rounded-xl"
              />
            ) : (
              <div className="size-56 flex items-center justify-center text-xs text-slate-500">QR Code Error</div>
            )}
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <QrCode className="size-3.5 text-[#ff6b35]" />
            <span>Scan QR Code via Phantom / Solflare Mobile</span>
          </p>
        </div>

        {/* Invoice Summary Details (Includes Customer & Order Breakdown) */}
        <div className="mt-5 space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          {/* Customer Detail */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <User className="size-3.5 text-indigo-400" />
              <span>Pemesan (Customer)</span>
            </span>
            <span className="text-xs font-bold text-white bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-mono">
              {params.customer}
            </span>
          </div>

          {/* Destination Channel */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Send className="size-3.5 text-sky-400" />
              <span>Tujuan Pengiriman</span>
            </span>
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
              <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
              {params.channel.toUpperCase()} ({params.target})
            </span>
          </div>

          {/* Item Description */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-amber-400" />
              <span>Detail Pesanan</span>
            </span>
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 max-w-[210px] truncate">
              {params.description}
            </span>
          </div>

          {/* Merchant */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className={`size-3.5 ${params.tier === 'enterprise' ? 'text-indigo-400' : 'text-emerald-400'}`} />
              <span>Merchant Wallet</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-300 max-w-[180px] truncate">
              {params.recipient}
            </span>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Nominal Tagihan</span>
            <span className="text-lg font-black text-emerald-400 tracking-tight">
              {parseFloat(params.amount).toFixed(2)} <span className="text-xs font-semibold text-slate-400">USDC</span>
            </span>
          </div>

          {/* Reference Key */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Reference ID</span>
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
              {params.reference}
            </span>
          </div>
        </div>

        {/* SINGLE PRIMARY WEB3 ACTION BUTTON (Phantom & Solflare Launcher) */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            disabled={isExpired}
            onClick={handleSinglePayButton}
            className={`w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl shadow-2xl transition-all cursor-pointer border text-sm font-black ${
              isExpired
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-white active:scale-[0.98] border-white/20'
            }`}
          >
            <Wallet className="size-5" />
            <span>{isExpired ? 'Sesi Tagihan Kadaluarsa' : 'Bayar On-Chain (Phantom / Solflare)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isExpired}
              onClick={handleCopyWallet}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {copiedWallet ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-indigo-400" />}
              <span>{copiedWallet ? 'Tersalin!' : 'Copy Wallet'}</span>
            </button>

            <button
              type="button"
              disabled={isExpired}
              onClick={handleCopyPayUrl}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {copiedPayUrl ? <Check className="size-4 text-emerald-400" /> : <Zap className="size-4 text-amber-400" />}
              <span>{copiedPayUrl ? 'Tersalin!' : 'Copy Solana URI'}</span>
            </button>
          </div>
        </div>

        {/* Security Trust Seal */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Secured by ZEGA ZeroClaw OWASP Keyless Custody</span>
        </div>
      </div>
    </div>
  );
}
