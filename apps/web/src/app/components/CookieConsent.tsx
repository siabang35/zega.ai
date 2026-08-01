import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';

const CONSENT_KEY = 'zega_cookie_consent';
const CONSENT_VERSION = '1.0';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  version: string;
  timestamp: string;
}

function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch { return null; }
}

export function CookieConsent({ onNavigatePrivacy, onNavigateTerms }: { onNavigatePrivacy?: () => void; onNavigateTerms?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const saveConsent = (consent: ConsentState) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 350);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAcceptSelected = () => {
    saveConsent({
      necessary: true,
      analytics,
      marketing,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[460px] z-[9999999] transition-all duration-350 ${
        animateOut ? 'translate-y-8 opacity-0 scale-95 blur-xs' : 'translate-y-0 opacity-100 scale-100'
      }`}
      style={{ animation: animateOut ? undefined : 'cookieSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl p-5 md:p-6 font-sans shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-[2.5px] before:bg-gradient-to-r before:from-emerald-500 before:via-teal-500 before:to-indigo-500">

        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9.5 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/25 dark:from-amber-500/25 dark:to-orange-500/25 border border-amber-500/35 dark:border-amber-400/35 shadow-xs shadow-amber-500/10 shrink-0">
              <Cookie size={17} className="text-amber-600 dark:text-amber-400 drop-shadow-[0_1px_4px_rgba(245,158,11,0.4)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Cookie Preferences
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                We use cookies to optimize platform performance
              </p>
            </div>
          </div>
          <button
            onClick={handleRejectOptional}
            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-sans">
          ZEGA AI uses essential cookies for core security & workflow orchestration. We also use optional cookies for analytics.
          Read our{' '}
          <button onClick={onNavigatePrivacy} className="font-semibold text-slate-900 dark:text-slate-200 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
            Privacy Policy
          </button>{' '}
          and{' '}
          <button onClick={onNavigateTerms} className="font-semibold text-slate-900 dark:text-slate-200 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
            Terms of Service
          </button>.
        </p>

        {/* Expandable Preferences */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span>Customize preferences</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 animate-fadeIn">
            {/* Necessary */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 px-3.5 py-2.5">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Essential</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Required for security and authentication</p>
              </div>
              <input type="checkbox" checked disabled className="size-4 accent-emerald-500 rounded cursor-not-allowed opacity-60" />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 px-3.5 py-2.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Analytics</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Helps us monitor agent performance</p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="size-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            {/* Marketing */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 px-3.5 py-2.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Personalization</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tailored workflow recommendations</p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="size-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4.5 flex items-center justify-end gap-2">
          <button
            onClick={handleRejectOptional}
            className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Reject Optional
          </button>
          {expanded && (
            <button
              onClick={handleAcceptSelected}
              className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="h-9 px-4.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
          >
            Accept All
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
