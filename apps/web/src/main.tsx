import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./app/App.tsx";
import { LanguageProvider } from "./i18n/translations.tsx";
import "./styles/index.css";

import { EventEmitter } from "events";

// Globally set EventEmitter max listeners threshold for Web3 extension streams (Phantom, Solflare, Privy, MetaMask)
if (typeof window !== "undefined") {
  // Set defaultMaxListeners on standard EventEmitter class and prototype
  if (typeof EventEmitter !== "undefined") {
    EventEmitter.defaultMaxListeners = 0; // 0 = unlimited listeners
    if (EventEmitter.prototype) {
      (EventEmitter.prototype as any).defaultMaxListeners = 0;

      // Auto-set unlimited max listeners on EventEmitter instances dynamically when addListener/on is invoked
      const originalAddListener = EventEmitter.prototype.addListener;
      EventEmitter.prototype.addListener = function (type: any, listener: any) {
        if (typeof (this as any).setMaxListeners === "function") {
          try {
            (this as any).setMaxListeners(0);
          } catch {
            (this as any)._maxListeners = 0;
          }
        } else {
          (this as any)._maxListeners = 0;
        }
        return originalAddListener.call(this, type, listener);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;

      const originalSetMaxListeners = EventEmitter.prototype.setMaxListeners;
      EventEmitter.prototype.setMaxListeners = function (n: number) {
        const effectiveN = (n === 0 || n > 100) ? n : 0;
        if (typeof originalSetMaxListeners === "function") {
          return originalSetMaxListeners.call(this, effectiveN);
        }
        (this as any)._maxListeners = effectiveN;
        return this;
      };
    }
  }

  // Attach to window and globalThis so injected content scripts (contentscript.js) share threshold
  const win = window as any;
  win.EventEmitter = EventEmitter;
  (globalThis as any).EventEmitter = EventEmitter;

  if (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process?.setMaxListeners) {
    try {
      (globalThis as any).process.setMaxListeners(0);
    } catch {
      // Ignore process setMaxListeners if restricted in browser context
    }
  }

  // Helper to detect third-party extension stream warning noise (Error objects, warning objects, or strings)
  const isExtensionStreamNoise = (...args: any[]): boolean => {
    let joined = "";
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      if (typeof arg === "string") {
        joined += " " + arg;
      } else if (typeof arg === "object") {
        try {
          joined += " " + (arg.message || "") + " " + (arg.stack || "") + " " + (arg.name || "") + " " + String(arg);
          try {
            joined += " " + JSON.stringify(arg);
          } catch {
            // ignore circular structures
          }
        } catch {
          joined += " " + String(arg);
        }
      } else {
        joined += " " + String(arg);
      }
    }

    return (
      joined.includes("MaxListenersExceededWarning") ||
      joined.includes("Possible EventEmitter memory leak detected") ||
      joined.includes("close listeners added") ||
      joined.includes("end listeners added") ||
      joined.includes("Use emitter.setMaxListeners()") ||
      joined.includes("ObjectMultiplex - orphaned data for stream") ||
      joined.includes("app-init-liveness") ||
      joined.includes("background-liveness") ||
      joined.includes("contentscript.js")
    );
  };

  // Filter out non-actionable third-party Web3 extension stream liveness warnings (ObjectMultiplex orphaned streams)
  const consoleMethods = ["warn", "error", "info", "log"] as const;
  consoleMethods.forEach((method) => {
    const original = console[method];
    console[method] = function (...args: any[]) {
      if (isExtensionStreamNoise(...args)) return;
      original.apply(console, args);
    };
  });

  window.addEventListener("error", (event) => {
    if (isExtensionStreamNoise(event.error, event.message, event.filename)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    if (isExtensionStreamNoise(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

const privyAppId = (import.meta as any)?.env?.VITE_PRIVY_APP_ID || "cms9cnybp002k0bl7ts2nm8ra";

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId={privyAppId}
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#6366f1',
      },
      embeddedWallets: {
        createOnLogin: 'all-users',
        requireUserPasswordOnCreate: false,
      },
      solanaClusters: [
        {
          name: 'devnet',
          rpcUrl: 'https://api.devnet.solana.com',
        },
      ],
    }}
  >
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </PrivyProvider>
);