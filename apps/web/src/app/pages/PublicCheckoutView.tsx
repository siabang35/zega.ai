import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, QrCode, RefreshCw, Zap, ArrowLeft, Building2, CheckCircle2, Wallet, User, ShoppingBag, Send, Clock, AlertTriangle, X } from 'lucide-react';
import { PrivyWalletService } from '../services/privyWalletService';
import { getR2CdnUrl, getUsdcSvgFallback, getSolanaSvgFallback } from '../utils/cdn';

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

const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export function PublicCheckoutView({ onBack }: PublicCheckoutViewProps) {
  // Purely dynamic initial state — zero hardcoded mockup fallbacks
  const [params, setParams] = useState<CheckoutParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dual Currency Asset Selection ('USDC' | 'SOL') - Enterprise Solana Pay Spec Standard
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'SOL'>('USDC');

  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPayUrl, setCopiedPayUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'settled_exact' | 'settled_underpaid' | 'settled_overpaid'>('pending');
  const [settlementDetails, setSettlementDetails] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // 5-Minute Session Timer (300 Seconds Countdown)
  const [timeLeft, setTimeLeft] = useState(300);
  const [isExpired, setIsExpired] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [loadError, setLoadError] = useState<string | null>(null);

  // 🛡️ ZERO-TRUST CANONICAL INVOICE RESOLUTION BY REFERENCE
  useEffect(() => {
    let isMounted = true;
    async function loadCanonicalCheckout() {
      if (typeof window === 'undefined') return;
      setIsLoading(true);
      setLoadError(null);

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const ref = searchParams.get('reference') || searchParams.get('ref');

        if (!ref) {
          if (isMounted) {
            setLoadError('Alamat tagihan tidak valid: Reference key tidak ditemukan.');
            setIsLoading(false);
          }
          return;
        }

        const apiBase = typeof window !== 'undefined' && window.location.hostname.includes('zegaai.site')
          ? 'https://zega-ai.onrender.com'
          : (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:3001' : '');

        // Fetch Canonical Invoice from Backend by Reference Key (Ignores all tampered URL parameters!)
        const res = await fetch(`${apiBase}/v1/zeroclaw/checkout?reference=${encodeURIComponent(ref)}`);

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.canonicalInvoice) {
            const inv = json.canonicalInvoice;
            if (isMounted) {
              setParams({
                reference: inv.reference,
                amount: String(inv.amount),
                recipient: inv.merchant_wallet,
                description: inv.description,
                customer: inv.customer_target || '@customer',
                target: inv.customer_target || '@customer',
                channel: (inv.customer_target || '').startsWith('+') ? 'whatsapp' : 'telegram',
                tier: inv.tenant_id && inv.tenant_id.includes('enterprise') ? 'enterprise' : 'umkm',
              });
              setIsLoading(false);
              return;
            }
          }
        }

        // 🛡️ FAIL-CLOSED SECURITY GATE: If canonical lookup fails, DO NOT trust URL parameters for amount/recipient!
        if (isMounted) {
          setLoadError('Tagihan tidak ditemukan atau telah kadaluarsa di server.');
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError('Gagal memuat data tagihan dari server. Silakan muat ulang halaman.');
          setIsLoading(false);
        }
      }
    }

    loadCanonicalCheckout();
    return () => { isMounted = false; };
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

  // Enterprise Standard Solana Pay Specification URI
  // Includes `spl-token` mint address for USDC so mobile wallets (Solflare/Phantom) open as USDC transfer!
  const solanaPayUrl = params
    ? selectedCurrency === 'USDC'
      ? `solana:${params.recipient}?amount=${parseFloat(params.amount).toFixed(2)}&spl-token=${DEVNET_USDC_MINT}&reference=${params.reference}&label=${encodeURIComponent('ZEGA Pay Checkout')}&message=${encodeURIComponent(params.description)}&memo=${encodeURIComponent(params.reference)}`
      : `solana:${params.recipient}?amount=${parseFloat(params.amount).toFixed(4)}&reference=${params.reference}&label=${encodeURIComponent('ZEGA Pay Checkout')}&message=${encodeURIComponent(params.description)}&memo=${encodeURIComponent(params.reference)}`
    : '';

  // Solflare Deep Link Specification with dynamic spl-token parameter
  const solflareTransferUrl = params
    ? selectedCurrency === 'USDC'
      ? `https://solflare.com/ul/v1/transfer?recipient=${params.recipient}&amount=${parseFloat(params.amount).toFixed(2)}&spl-token=${DEVNET_USDC_MINT}&memo=${encodeURIComponent(params.reference)}`
      : `https://solflare.com/ul/v1/transfer?recipient=${params.recipient}&amount=${parseFloat(params.amount).toFixed(4)}&memo=${encodeURIComponent(params.reference)}`
    : '';
  const phantomUniversalUrl = `https://phantom.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://zegaai.site')}`;
  const backpackUniversalUrl = `https://backpack.app/ul/browse/${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://zegaai.site')}`;
  const okxUniversalUrl = `https://www.okx.com/download?deeplink=${encodeURIComponent(solanaPayUrl)}`;
  const qrImageUrl = solanaPayUrl
    ? `https://quickchart.io/qr?text=${encodeURIComponent(solanaPayUrl)}&size=600&format=png`
    : '';

  // Real-time Solana On-Chain Settlement Poller (Active for 5 minutes with Tab Visibility Protection)
  useEffect(() => {
    if (isExpired || !params?.reference || paymentStatus === 'settled_exact' || paymentStatus === 'settled_overpaid') return;

    let intervalId: any = null;

    const pollSettlement = async () => {
      // 🛡️ Tab Visibility Guard: Skip network request if user switched tabs
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const apiBase = typeof window !== 'undefined' && window.location.hostname.includes('zegaai.site')
          ? 'https://zega-ai.onrender.com'
          : (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:3001' : '');

        const res = await fetch(`${apiBase}/v1/zeroclaw/settlement/check?reference=${encodeURIComponent(params.reference)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.settled) {
            setPaymentStatus(json.settlementStatus || 'settled_exact');
            setSettlementDetails(json.data || { signature: json.signature, status: 'completed' });
            setIsPolling(false);
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch { /* graceful fallback */ }
    };

    pollSettlement();
    // Adaptive 5-second polling interval (prevents rate limiting)
    intervalId = setInterval(pollSettlement, 5000);

    return () => clearInterval(intervalId);
  }, [params?.reference, isExpired, paymentStatus]);

  const handleCopyWallet = () => {
    if (!params?.recipient) return;
    // 🛡️ OWASP Anti-Clipboard Poisoning: Strip zero-width unicode spaces & non-printable characters
    const cleanWallet = params.recipient
      .trim()
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0]/g, '');

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanWallet)) {
      triggerToast('⚠️ Gagal: Format alamat wallet tidak terverifikasi Base58!');
      return;
    }

    try {
      navigator.clipboard.writeText(cleanWallet);
      setCopiedWallet(true);
      const checksumBadge = `${cleanWallet.slice(0, 4)}...${cleanWallet.slice(-4)}`;
      triggerToast(`🟢 Wallet Disalin (${checksumBadge} - Terverifikasi OWASP Base58)`);
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

  // Primary Action Button Handler: Direct 1-Click Professional Web3 Wallet Trigger
  const handleSinglePayButton = async () => {
    if (isExpired) {
      triggerToast('⏰ Sesi checkout telah kadaluarsa (5 min). Silakan minta invoice baru.');
      return;
    }

    // 1. Copy Solana Pay URI to clipboard immediately
    if (solanaPayUrl) {
      try {
        await navigator.clipboard.writeText(solanaPayUrl);
      } catch { /* proceed */ }
    }

    // 2. Check for in-browser injected Solana Web3 Wallet (Phantom / Solflare / Backpack)
    const win = typeof window !== 'undefined' ? (window as any) : null;
    const solanaWallet = win?.solana || win?.phantom?.solana || win?.solflare;

    if (solanaWallet && typeof solanaWallet.connect === 'function') {
      try {
        triggerToast('🟢 Menghubungkan ke Wallet Solana...');
        const resp = await solanaWallet.connect();
        const pubkeyStr = resp?.publicKey ? resp.publicKey.toString() : (solanaWallet.publicKey ? solanaWallet.publicKey.toString() : '');
        triggerToast(`⚡ Wallet Terhubung (${pubkeyStr.slice(0, 6)}...)! Memproses Solana Pay...`);

        // If deep link browse or transfer is available
        if (solflareTransferUrl && win?.solflare?.isSolflare) {
          window.open(solflareTransferUrl, '_blank');
        }
        return;
      } catch (err: any) {
        triggerToast(`⚠️ Batal / Gagal konek wallet: ${err.message || 'Dibatalkan'}`);
      }
    }

    // 3. Mobile / Deep-Link Trigger Scheme (Direct Launch)
    if (solanaPayUrl) {
      triggerToast('⚡ Link Solana Pay Disalin! Membuka Wallet Mobile...');
      try {
        // Safe trigger using dynamic link click to prevent desktop browser navigation resets
        const link = document.createElement('a');
        link.href = solanaPayUrl;
        link.rel = 'noopener';
        link.click();
      } catch {
        // Fallback to Phantom browse URL
        window.open(phantomUniversalUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      setIsWalletModalOpen(true);
    }
  };

  const launchWalletApp = (url: string, name: string) => {
    if (solanaPayUrl) {
      try {
        navigator.clipboard.writeText(solanaPayUrl);
        triggerToast(`⚡ Solana Pay URI Tersalin! Membuka ${name}...`);
      } catch { /* proceed */ }
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setIsWalletModalOpen(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-md bg-slate-900/90 border border-rose-500/40 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400 border border-rose-500/30 shadow-lg">
            <AlertTriangle className="size-8 animate-bounce" />
          </div>
          <h2 className="text-lg font-black text-white mb-2 uppercase tracking-wide">Tagihan Tidak Tersedia / Invalid</h2>
          <p className="text-xs text-rose-300/90 mb-6 leading-relaxed font-medium">
            {loadError}
          </p>
          <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 text-left">
            <div className="flex items-center gap-2 font-bold text-slate-300 mb-1">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>ZEGA Zero-Trust Security Policy</span>
            </div>
            <p>• Data tagihan hanya dapat diterbitkan oleh server terverifikasi.</p>
            <p>• Perubahan parameter URL secara manual diabaikan demi keamanan transaksi.</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Kembali
            </button>
          )}
        </div>
      </div>
    );
  }

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

      {/* Mobile Web3 Wallet Selector Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Pilih Wallet Pembayaran</h3>
              </div>
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => launchWalletApp(phantomUniversalUrl, 'Phantom Wallet')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 text-white text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-mono font-black">👻</div>
                  <span>Phantom Wallet</span>
                </div>
                <ExternalLink className="size-4 text-purple-400" />
              </button>

              <button
                onClick={() => launchWalletApp(solflareTransferUrl, 'Solflare Wallet')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-white text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 font-mono font-black">🔥</div>
                  <span>Solflare Wallet</span>
                </div>
                <ExternalLink className="size-4 text-amber-400" />
              </button>

              <button
                onClick={() => launchWalletApp(backpackUniversalUrl, 'Backpack Wallet')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 text-white text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300 font-mono font-black">🎒</div>
                  <span>Backpack Wallet</span>
                </div>
                <ExternalLink className="size-4 text-rose-400" />
              </button>

              <button
                onClick={() => launchWalletApp(okxUniversalUrl, 'OKX Web3 Wallet')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-sky-500/30 text-white text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 font-mono font-black">🖤</div>
                  <span>OKX Web3 Wallet</span>
                </div>
                <ExternalLink className="size-4 text-sky-400" />
              </button>

              <button
                onClick={handleCopyPayUrl}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all"
              >
                <Zap className="size-4" />
                <span>1-Click Copy Solana Pay URI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-2xl flex items-center justify-center shadow-xl ${params.tier === 'enterprise'
            ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-sky-500 shadow-indigo-500/25'
            : 'bg-gradient-to-br from-[#ff6b35] via-emerald-600 to-teal-500 shadow-emerald-500/25'
            }`}>
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              {params.tier === 'enterprise' ? 'ZEGA PAY ENTERPRISE' : 'ZEGA PAY WEB3'}
              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${params.tier === 'enterprise'
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
          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${isExpired
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
            {isExpired ? 'EXPIRED' : formatCountdown(timeLeft)}
          </div>
        </div>

        {/* Real-time Status Badge Banner (Exact, Underpaid, Overpaid) */}
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
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">PEMBAYARAN BERHASIL & LUNAS (EXACT)</p>
                <p className="text-[11px] text-emerald-400/90 font-medium">Lunas 100% & Terkonfirmasi On-Chain di Solana</p>
                {(() => {
                  const rawSig = settlementDetails?.signature || settlementDetails?.tx_signature;
                  const isValidTxSig = typeof rawSig === 'string' && /^[1-9A-HJ-NP-Za-km-z]{70,96}$/.test(rawSig.trim());
                  if (!isValidTxSig) return null;
                  const cleanSig = rawSig.trim();
                  return (
                    <a
                      href={`https://explorer.solana.com/tx/${cleanSig}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono underline text-emerald-300 hover:text-white"
                    >
                      <span>Tx Signature: {cleanSig.slice(0, 16)}...</span>
                      <ExternalLink className="size-3" />
                    </a>
                  );
                })()}
              </div>
            </div>
          ) : paymentStatus === 'settled_underpaid' ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 shadow-lg">
              <AlertTriangle className="size-6 flex-shrink-0 text-amber-400 animate-bounce" />
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-300">PEMBAYARAN KURANG (BELUM LUNAS)</p>
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    Kurang: {settlementDetails?.shortageAmount ? settlementDetails.shortageAmount.toFixed(2) : '0.00'} {selectedCurrency}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium mt-1">
                  Tagihan belum lunas. Silakan transfer sisa kekurangannya sebesar <strong className="text-white underline">{settlementDetails?.shortageAmount ? settlementDetails.shortageAmount.toFixed(2) : ''} {selectedCurrency}</strong> agar pesanan dapat diproses.
                </p>
              </div>
            </div>
          ) : paymentStatus === 'settled_overpaid' ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/20 border border-teal-500/50 text-teal-200 shadow-lg">
              <CheckCircle2 className="size-6 flex-shrink-0 text-teal-300 animate-bounce" />
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-teal-300">PESANAN LUNAS (KELEBIHAN BAYAR)</p>
                  <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                    Refund: +{settlementDetails?.excessAmount ? settlementDetails.excessAmount.toFixed(2) : '0.00'} {selectedCurrency}
                  </span>
                </div>
                <p className="text-[11px] text-teal-200/90 font-medium mt-1">
                  Pembayaran lunas! Kelebihan pembayaran sebesar <strong className="text-white font-bold">+{settlementDetails?.excessAmount ? settlementDetails.excessAmount.toFixed(2) : ''} {selectedCurrency}</strong> telah didaftarkan untuk pengembalian dana (refund) otomatis.
                </p>
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
          <div className={`relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-slate-800/80 group transition-all duration-300 ${isExpired ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-[1.02]'
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

          {/* Enterprise Dual Asset Currency Selector (USDC vs SOL) */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wallet className="size-3.5 text-indigo-400" />
                <span>Asset Pembayaran (Solana Pay Spec)</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedCurrency === 'USDC' ? 'SPL Token' : 'Native SOL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedCurrency('USDC');
                  triggerToast('⚡ Solana Pay URI diset ke USDC (SPL Token)');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${selectedCurrency === 'USDC'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg border border-emerald-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <img
                  src={getR2CdnUrl('/assets/logo/usdc.webp', true)}
                  alt="USDC Logo"
                  className="size-4.5 rounded-full object-contain shadow-xs"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('cdn.zegaai.site')) {
                      target.src = '/assets/logo/usdc.webp';
                    } else {
                      target.src = getUsdcSvgFallback();
                    }
                  }}
                />
                <span>USDC (SPL)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCurrency('SOL');
                  triggerToast('⚡ Solana Pay URI diset ke Native SOL');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${selectedCurrency === 'SOL'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <img
                  src={getR2CdnUrl('/assets/logo/solana.png', true)}
                  alt="Solana Logo"
                  className="size-4.5 rounded-full object-contain shadow-xs"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('cdn.zegaai.site')) {
                      target.src = '/assets/logo/solana.png';
                    } else {
                      target.src = getSolanaSvgFallback();
                    }
                  }}
                />
                <span>SOL (Native)</span>
              </button>
            </div>
          </div>

          {/* Merchant Wallet */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className={`size-3.5 ${params.tier === 'enterprise' ? 'text-indigo-400' : 'text-emerald-400'}`} />
              <span>Merchant Wallet</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {params.recipient.slice(0, 4)}...{params.recipient.slice(-4)}
              </span>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="text-[11px] font-mono font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                title="Copy Merchant Wallet (OWASP Base58 Verified)"
              >
                {copiedWallet ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-indigo-400" />}
                <span className="max-w-[110px] truncate">{params.recipient.slice(0, 6)}...{params.recipient.slice(-4)}</span>
              </button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Nominal Tagihan</span>
            <span className="text-lg font-black text-emerald-400 tracking-tight">
              {parseFloat(params.amount).toFixed(selectedCurrency === 'USDC' ? 2 : 4)} <span className="text-xs font-semibold text-slate-400">{selectedCurrency}</span>
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
            className={`w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl shadow-2xl transition-all cursor-pointer border text-sm font-black ${isExpired
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
