import { defineConfig, devices } from '@playwright/test';
import { AMBIENTE_OFFLINE } from './e2e/fixtures/sessao';

/**
 * Gate E2E financeiro (Etapa 31).
 *
 * Até aqui o merge era bloqueado por quatro specs — `login`, `admin-rbac`,
 * `visual-theme` e `logout-real` — e nenhuma delas toca em dinheiro. As telas
 * financeiras viviam todas na quarentena `continue-on-error: true`.
 *
 * Promover as specs existentes como estavam não resolveria: elas dependem de
 * `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` e, sem os segredos, `auth.setup.ts`
 * grava storageState vazio — o app redireciona para `/auth` e o gate fica
 * verde sem ter exercitado nada. Um gate bloqueante que abre sozinho quando
 * falta segredo é pior que nenhum gate.
 *
 * Este config resolve a dependência pela raiz: serve o app apontando para um
 * projeto Supabase sintético (`AMBIENTE_OFFLINE`) e `autenticarOffline()`
 * semeia sessão e vínculo de empresa no browser, interceptando toda a rede.
 * Consequências:
 *  - roda sem nenhum secret (inclusive em PR de fork);
 *  - não grava uma linha sequer em banco real;
 *  - falha por regressão de UI, nunca por indisponibilidade de ambiente.
 *
 * A quarentena continua existindo para o que ainda depende de banco real —
 * ver `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`, Etapa 31.
 */

/**
 * Fuso fixo, browser e Node no mesmo. O sistema é brasileiro e as telas
 * financeiras lidam com colunas `DATE` puras ("2026-09-13"), que o JavaScript
 * lê como meia-noite UTC: em UTC-3 isso exibe o dia anterior. Em runner UTC —
 * o default do GitHub Actions — o deslocamento é zero e o bug desaparece,
 * então um gate sem fuso fixo estaria cego justamente para a classe de erro
 * que mais dói aqui. Fixando o fuso, o CI reproduz o que o usuário vê.
 */
const FUSO = 'America/Sao_Paulo';
process.env.TZ = FUSO;

// Porta própria: o gate não pode reaproveitar um `vite` já rodando com as
// envs reais do `.env.local` — seria o projeto errado e a chave de sessão
// (`sb-<ref>-auth-token`) não bateria com a que o fixture semeia.
const PORTA = process.env.E2E_FINANCEIRO_PORT || '8091';
const baseURL = process.env.E2E_FINANCEIRO_BASE_URL || `http://localhost:${PORTA}`;

const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH;
const chromiumLaunchOptions = chromiumExecutablePath
  ? { launchOptions: { executablePath: chromiumExecutablePath } }
  : {};

export default defineConfig({
  testDir: './e2e',

  /**
   * Onda 1 da promoção. Cada spec listada aqui roda 100% offline — qualquer
   * uma que precise de banco real fica na quarentena até ser convertida.
   */
  testMatch: [
    '**/financeiro/conciliacao-offline.e2e.ts',
    '**/financeiro/contas-pagar-offline.e2e.ts',
    '**/nfe-fluxo.e2e.ts',
    '**/nfe-fluxo-falhas.e2e.ts',
    '**/regua-cobranca.e2e.ts',
    '**/split-payment.e2e.ts',
  ],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Determinístico por construção: um retry só mascararia flakiness de
  // verdade, que aqui seria bug do teste e não do ambiente.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    // `AnimatedNumber` conta de 0 até o valor final em ~1,1s. Como os
    // matchers do Playwright passam na primeira leitura que casa, um KPI
    // errado de 91.500,00 satisfaria uma asserção de 1.500,00 ao cruzar esse
    // ponto no meio da animação — o teste ficaria verde justamente no caso que
    // deveria pegar. Com movimento reduzido o componente escreve o valor final
    // direto, e o framer-motion também para de animar a entrada dos cartões.
    //
    // Vai em `contextOptions`, não solto em `use`: no Playwright 1.62
    // `reducedMotion` não é opção de topo, e o loader descarta chaves
    // desconhecidas sem avisar. Solto aqui, o guard não existia — a suíte
    // ficava verde exibindo uma proteção que nunca foi aplicada. Quem pega
    // isso é o `tsconfig.e2e.json`.
    contextOptions: { reducedMotion: 'reduce' },
    timezoneId: FUSO,
    locale: 'pt-BR',
    // Sem storageState compartilhado: a sessão vem de `autenticarOffline()`,
    // por teste, sem depender do projeto `setup` nem de credenciais.
    storageState: { cookies: [], origins: [] },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumLaunchOptions,
      },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORTA} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...AMBIENTE_OFFLINE,
    },
  },

  timeout: 45_000,
  expect: { timeout: 7_000 },
  outputDir: 'test-results/financeiro',
});
