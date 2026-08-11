import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./app/App.tsx";
import { LanguageProvider } from "./i18n/translations.tsx";
import "./styles/index.css";

// Increase EventEmitter max listeners threshold for Web3 extension streams (Phantom, Solflare, Privy)
if (typeof window !== "undefined") {
  const win = window as any;
  if (win.EventEmitter && typeof win.EventEmitter.defaultMaxListeners === "number") {
    win.EventEmitter.defaultMaxListeners = 50;
  }
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