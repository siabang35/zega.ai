import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, QrCode, RefreshCw, Zap, ArrowLeft, Building2, CheckCircle2, Wallet, X, User, ShoppingBag, Send } from 'lucide-react';

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
    amount: '0.24',
    recipient: DEFAULT_RECIPIENT_WALLET,
    description: 'pay a snack (0.24 USDC)',
    customer: '@slzyoung',
    target: '@slzyoung',
    channel: 'telegram',
    tier: 'umkm'
  });

  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPayUrl, setCopiedPayUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'settled_exact' | 'settled_underpaid' | 'settled_overpaid'>('pending');
  const [settlementDetails, setSettlementDetails] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Parse URL query parameters safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const ref = searchParams.get('reference') || searchParams.get('ref') || 'RefDSP_DEVNET';
        const amt = searchParams.get('amount') || '0.24';
        const rawRec = searchParams.get('recipient');
        const desc = searchParams.get('description') || searchParams.get('memo') || 'pay a snack';
        const targetVal = searchParams.get('target') || searchParams.get('username') || searchParams.get('phone') || '@slzyoung';
        const customerVal = searchParams.get('customer') || searchParams.get('user') || targetVal;
        const ch = searchParams.get('channel') || (targetVal.startsWith('+') ? 'whatsapp' : 'telegram');
        const tierParam = searchParams.get('tier') || 'umkm';

        const validRecipient = isValidBase58SolanaAddress(rawRec) ? rawRec!.trim() : DEFAULT_RECIPIENT_WALLET;

        setParams({
          reference: ref,
          amount: amt,
          recipient: validRecipient,
          description: desc,
          customer: customerVal,
          target: targetVal,
          channel: ch,
          tier: tierParam === 'enterprise' ? 'enterprise' : 'umkm'
        });
      } catch (err) {
        /* Fallback to default params */
      }
    }
  }, []);

  const solanaPayUrl = `solana:${params.recipient}?amount=${parseFloat(params.amount).toFixed(2)}&spl-token=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&reference=${params.reference}`;
  const solflareTransferUrl = `https://solflare.com/ul/v1/transfer?recipient=${params.recipient}&amount=${parseFloat(params.amount).toFixed(2)}`;
  const phantomUniversalUrl = `https://phantom.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://zegaai.site')}`;
  const backpackUniversalUrl = `https://backpack.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://zegaai.site')}`;
  const okxUniversalUrl = `https://www.okx.com/download?deeplink=${encodeURIComponent(solanaPayUrl)}`;
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(solanaPayUrl)}&size=600&format=png`;

  // Real-time Solana On-Chain Settlement Poller
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
    try {
      navigator.clipboard.writeText(solanaPayUrl);
      setCopiedPayUrl(true);
      triggerToast('⚡ Link Solana Pay URI Berhasil Disalin!');
      setTimeout(() => setCopiedPayUrl(false), 2500);
    } catch {
      triggerToast('⚠️ Gagal menyalin link Solana Pay.');
    }
  };

  // Universal Safe Wallet Launchers (Prevents In-App Webview Crashes/Auto-Close)
  const handleLaunchWallet = (walletType: 'phantom' | 'solflare' | 'backpack' | 'okx' | 'copy_uri') => {
    if (walletType === 'copy_uri') {
      handleCopyPayUrl();
      setIsWalletModalOpen(false);
      return;
    }

    if (typeof window !== 'undefined') {
      handleCopyPayUrl();
      if (walletType === 'phantom') {
        triggerToast('👻 Membuka Phantom App / menyalin Solana URI...');
        window.open(phantomUniversalUrl, '_blank', 'noopener,noreferrer');
      } else if (walletType === 'solflare') {
        triggerToast('🟣 Membuka Solflare App...');
        window.open(solflareTransferUrl, '_blank', 'noopener,noreferrer');
      } else if (walletType === 'backpack') {
        triggerToast('🎒 Membuka Backpack Wallet...');
        window.open(backpackUniversalUrl, '_blank', 'noopener,noreferrer');
      } else if (walletType === 'okx') {
        triggerToast('🌐 Membuka OKX Wallet...');
        window.open(okxUniversalUrl, '_blank', 'noopener,noreferrer');
      }
    }
    setIsWalletModalOpen(false);
  };

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
      <div className="w-full max-w-md flex items-center justify-between mb-5 z-10">
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
        {/* Real-time Status Badge Banner */}
        <div className="mb-5">
          {paymentStatus === 'settled_exact' ? (
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
          <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-slate-800/80 group transition-all duration-300 hover:scale-[1.02]">
            <img
              src={qrImageUrl}
              alt="Solana Pay QR Code"
              className="size-56 sm:size-64 object-contain rounded-xl"
            />
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
              <span>Merchant</span>
            </span>
            <span className="text-xs font-bold text-white">
              {params.tier === 'enterprise' ? 'ZEGA AI Enterprise Terminal' : 'ZEGA Pay Merchant'}
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

        {/* Copy Wallet & Multi-Wallet Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-95 text-sm font-black text-white shadow-2xl transition-all cursor-pointer active:scale-[0.98] border border-white/20"
          >
            <Wallet className="size-5" />
            <span>Buka di Wallet (Phantom / Solflare / OKX)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyWallet}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-[0.99]"
            >
              {copiedWallet ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-indigo-400" />}
              <span>{copiedWallet ? 'Tersalin!' : 'Copy Wallet'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPayUrl}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-[0.99]"
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

      {/* Multi-Wallet Launcher Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Pilih Web3 Wallet</h3>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pilih aplikasi wallet Web3 Anda untuk melakukan transfer otomatis atau salin link Solana Pay.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleLaunchWallet('phantom')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-800 hover:from-purple-900/80 border border-purple-500/30 text-xs font-bold text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">👻</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Phantom Wallet</p>
                    <p className="text-[10px] text-purple-300/70 font-normal">Deep Link Direct / Mobile</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleLaunchWallet('solflare')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/60 to-slate-800 hover:from-orange-900/80 border border-orange-500/30 text-xs font-bold text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🟣</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Solflare Wallet</p>
                    <p className="text-[10px] text-orange-300/70 font-normal">Instant Solana Transfer URL</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleLaunchWallet('backpack')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-800 hover:from-red-900/80 border border-red-500/30 text-xs font-bold text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎒</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Backpack Wallet</p>
                    <p className="text-[10px] text-red-300/70 font-normal">xNFT & Universal App Link</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleLaunchWallet('okx')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-xs font-bold text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">OKX Web3 Wallet</p>
                    <p className="text-[10px] text-slate-400 font-normal">Multi-Chain Web3 Universal</p>
                  </div>
                </div>
                <ExternalLink className="size-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleLaunchWallet('copy_uri')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-indigo-500/40 text-xs font-bold text-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="size-4 text-amber-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-indigo-300">Copy Solana Pay URI</p>
                    <p className="text-[10px] text-slate-400 font-normal">Salin URI untuk aplikasi wallet apapun</p>
                  </div>
                </div>
                <Copy className="size-4 text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
