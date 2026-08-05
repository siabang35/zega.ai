import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);