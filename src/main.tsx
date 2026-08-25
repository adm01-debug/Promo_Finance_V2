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

// Health-check pós-boot: valida que o backend responde antes de montar a
// árvore React. Se falhar (URL/anon key erradas, projeto pausado, offline
// total), renderiza tela de erro em vez de app quebrado silencioso.
(async () => {
  const { verifySupabaseHealth } = await import("@/integrations/supabase/client");
  const health = await verifySupabaseHealth();
  if (!health.ok) {
    logger.warn("[boot] Supabase health-check falhou", health);
    // Só bloqueia se claramente não é offline transitório: status 401/403/404
    // indicam configuração incorreta; ausência de status (network) deixa passar
    // para não quebrar PWA offline.
    const isConfigError = typeof health.status === "number" && health.status >= 400;
    if (isConfigError) {
      rootElement.innerHTML = `
        <div style="max-width:640px;margin:80px auto;padding:24px;font-family:system-ui,sans-serif;color:var(--t0,#0f172a)">
          <h1 style="font-size:20px;margin:0 0 12px">Erro de configuração do backend</h1>
          <p style="margin:0 0 8px">Não foi possível conectar ao Supabase (status <b>${health.status}</b>).</p>
          <p style="margin:0 0 8px">Verifique <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> no ambiente de build.</p>
          <p style="margin:16px 0 0;color:var(--t2,#64748b);font-size:13px">Se você é usuário final, contate o administrador.</p>
        </div>`;
      return;
    }
  }
  createRoot(rootElement).render(<App />);
})();

