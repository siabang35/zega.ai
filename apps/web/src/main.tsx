import { EventEmitter } from "events";

// 🛡️ Web3 Extension Memory Leak & Stream Warning Filter (Phantom, Solflare, Privy, MetaMask contentscript.js)
if (typeof window !== "undefined") {
  if (typeof EventEmitter !== "undefined") {
    EventEmitter.defaultMaxListeners = 0;
    if (EventEmitter.prototype) {
      (EventEmitter.prototype as any).defaultMaxListeners = 0;
      const originalAddListener = EventEmitter.prototype.addListener;
      EventEmitter.prototype.addListener = function (type: any, listener: any) {
        if (typeof (this as any).setMaxListeners === "function") {
          try { (this as any).setMaxListeners(0); } catch { (this as any)._maxListeners = 0; }
        } else {
          (this as any)._maxListeners = 0;
        }
        return originalAddListener.call(this, type, listener);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      const originalOnce = EventEmitter.prototype.once;
      if (typeof originalOnce === "function") {
        EventEmitter.prototype.once = function (type: any, listener: any) {
          if (typeof (this as any).setMaxListeners === "function") {
            try { (this as any).setMaxListeners(0); } catch { (this as any)._maxListeners = 0; }
          } else {
            (this as any)._maxListeners = 0;
          }
          return originalOnce.call(this, type, listener);
        };
      }
      const originalSetMaxListeners = EventEmitter.prototype.setMaxListeners;
      EventEmitter.prototype.setMaxListeners = function (n: number) {
        (this as any)._maxListeners = 0;
        if (typeof originalSetMaxListeners === "function") {
          try { return originalSetMaxListeners.call(this, 0); } catch {}
        }
        return this;
      };
    }
  }

  const win = window as any;
  win.EventEmitter = EventEmitter;
  (globalThis as any).EventEmitter = EventEmitter;

  const proc = (globalThis as any).process || (window as any).process;
  if (proc) {
    if (typeof proc.setMaxListeners === "function") {
      try { proc.setMaxListeners(0); } catch {}
    }
    if (typeof proc.emitWarning === "function") {
      const originalEmitWarning = proc.emitWarning;
      proc.emitWarning = function (warning: any, ...args: any[]) {
        if (isExtensionStreamNoise(warning, ...args)) return;
        return originalEmitWarning.apply(proc, [warning, ...args]);
      };
    }
  }

  function isExtensionStreamNoise(...args: any[]): boolean {
    let joined = "";
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      if (typeof arg === "string") {
        joined += " " + arg;
      } else if (typeof arg === "object") {
        try {
          joined += " " + (arg.message || "") + " " + (arg.stack || "") + " " + (arg.name || "") + " " + (arg.filename || "") + " " + String(arg);
          try { joined += " " + JSON.stringify(arg); } catch {}
        } catch {
          joined += " " + String(arg);
        }
      } else {
        joined += " " + String(arg);
      }
    }
    const lower = joined.toLowerCase();
    return (
      joined.includes("MaxListenersExceededWarning") ||
      joined.includes("Possible EventEmitter memory leak detected") ||
      joined.includes("close listeners added") ||
      joined.includes("end listeners added") ||
      joined.includes("Use emitter.setMaxListeners()") ||
      joined.includes("ObjectMultiplex - orphaned data for stream") ||
      joined.includes("app-init-liveness") ||
      joined.includes("background-liveness") ||
      joined.includes("contentscript.js") ||
      lower.includes("maxlistenersexceededwarning") ||
      lower.includes("possible eventemitter memory leak") ||
      lower.includes("listeners added") ||
      lower.indexOf("close listeners") !== -1 ||
      lower.indexOf("end listeners") !== -1 ||
      lower.includes("setmaxlisteners") ||
      lower.includes("objectmultiplex") ||
      lower.includes("orphaned data for stream") ||
      lower.includes("app-init-liveness") ||
      lower.includes("background-liveness") ||
      lower.includes("contentscript.js")
    );
  }

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

import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./app/App.tsx";
import { LanguageProvider } from "./i18n/translations.tsx";
import "./styles/index.css";

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