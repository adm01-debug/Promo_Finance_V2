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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('SW registered:', registration.scope);
      })
      .catch((error: unknown) => {
        logger.warn('SW registration failed:', error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    '[promo-finance] Elemento #root não encontrado no index.html — não é possível montar a aplicação.',
  );
}
createRoot(rootElement).render(<App />);
