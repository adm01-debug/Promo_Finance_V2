import "./lib/console-guard";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

import "./styles/high-contrast.css";
import { logger } from "@/lib/logger";
import { initTelemetry } from "@/lib/telemetry";

// Inicializa telemetria de erros frontend (window.onerror + unhandledrejection)
initTelemetry();

// Registro do Service Worker adiado para `requestIdleCallback` para não
// competir com o carregamento crítico (LCP/FID). Fallback para setTimeout
// em browsers sem suporte (Safari < 16.4).
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => logger.info('SW registered:', registration.scope))
      .catch((error: unknown) => logger.warn('SW registration failed:', error));
  };
  const schedule = (cb: () => void) => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback;
    if (typeof ric === 'function') ric(cb, { timeout: 4000 });
    else setTimeout(cb, 2500);
  };
  window.addEventListener('load', () => schedule(registerSW), { once: true });
}


const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    '[promo-finance] Elemento #root não encontrado no index.html — não é possível montar a aplicação.',
  );
}
createRoot(rootElement).render(<App />);
