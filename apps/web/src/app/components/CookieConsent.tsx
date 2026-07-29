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
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[480px] z-[9999999] transition-all duration-350 ${
        animateOut ? 'translate-y-8 opacity-0 scale-95 blur-xs' : 'translate-y-0 opacity-100 scale-100'
      }`}
      style={{ animation: animateOut ? undefined : 'cookieSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
    >
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-5 md:p-6 font-sans shadow-2xl dark:shadow-black/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300">

        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Cookie size={15} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Cookie Preferences
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                We use cookies to improve your experience
              </p>
            </div>
          </div>
          <button
            onClick={handleRejectOptional}
            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          ZEGA AI uses essential cookies for platform functionality. We also use optional cookies for analytics and personalization.
          Read our{' '}
          <button onClick={onNavigatePrivacy} className="font-medium text-slate-900 dark:text-slate-200 underline underline-offset-2 hover:text-[#e05638] dark:hover:text-[#e05638] transition-colors cursor-pointer">
            Privacy Policy
          </button>{' '}
          and{' '}
          <button onClick={onNavigateTerms} className="font-medium text-slate-900 dark:text-slate-200 underline underline-offset-2 hover:text-[#e05638] dark:hover:text-[#e05638] transition-colors cursor-pointer">
            Terms of Service
          </button>.
        </p>

        {/* Expandable Preferences */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span>Customize preferences</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2.5 animate-fadeIn">
            {/* Necessary */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Essential</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Required for core platform functionality</p>
              </div>
              <input type="checkbox" checked disabled className="size-4 accent-[#e05638] rounded cursor-not-allowed opacity-60" />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Analytics</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Help us understand platform usage patterns</p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="size-4 accent-[#e05638] rounded cursor-pointer"
              />
            </label>

            {/* Marketing */}
            <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Personalization</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Provide tailored recommendations and content</p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="size-4 accent-[#e05638] rounded cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            onClick={handleRejectOptional}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer"
          >
            Reject Optional
          </button>
          {expanded && (
            <button
              onClick={handleAcceptSelected}
              className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="h-9 px-5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer active:scale-[0.98]"
          >
            Accept All
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          0%   { transform: translateY(32px) scale(0.96); opacity: 0; filter: blur(4px); }
          100% { transform: translateY(0) scale(1);       opacity: 1; filter: blur(0px); }
        }
      `}</style>
    </div>,
    document.body
  );
}
