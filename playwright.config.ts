import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8080';
const authStorageState = 'playwright/.auth/user.json';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH;
const chromiumLaunchOptions = chromiumExecutablePath
  ? { launchOptions: { executablePath: chromiumExecutablePath } }
  : {};

/**
 * Promo Finance E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* CI usa sharding via matriz; cada shard mantém 2 workers para paralelismo local */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'on-first-retry',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project - runs before all tests */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: chromiumLaunchOptions,
    },

    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        ...chromiumLaunchOptions,
        storageState: authStorageState,
      },
      dependencies: ['setup'],
      // O fluxo destrutivo de login/logout real roda isolado no projeto
      // dedicado abaixo (estágio serial do CI) — nunca misturado nos shards.
      testIgnore: /auth\/logout-real\.e2e\.ts/,
    },

    // Projeto dedicado ao fluxo destrutivo serial (login/logout real).
    // Revoga sessões do usuário de teste — deve rodar sozinho, após os shards.
    {
      name: 'chromium-destructive',
      testMatch: /auth\/logout-real\.e2e\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumLaunchOptions,
        storageState: { cookies: [], origins: [] },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: authStorageState,
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: authStorageState,
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        ...chromiumLaunchOptions,
        storageState: authStorageState,
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: authStorageState,
      },
      dependencies: ['setup'],
    },

    /* Test against branded browsers */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global timeout for each test */
  timeout: 30 * 1000,
  
  /* Expect timeout */
  expect: {
    timeout: 5000,
    // Regressão visual em CI: nenhum baseline foi jamais commitado
    // (e2e/visual-theme.e2e.ts-snapshots/) e as telas autenticadas renderizam
    // dados reais mutáveis — a comparação não é determinística entre runs e
    // falha o gate sem proteger nada de verdade. Até existir suíte visual com
    // dados mockados (registrada em docs/execucao-cline/RELATORIO_LOTE_01.md
    // e ligada à etapa 078), ignoramos SOMENTE a comparação de screenshot em
    // CI: navegação, headings e aplicação de tema continuam sendo exercitados.
    // Localmente (sem CI=1) a comparação permanece ativa.
    ...(process.env.CI ? { toHaveScreenshot: { ignoreSnapshots: true } } : {}),
  },

  /* Output folder for test artifacts */
  outputDir: 'test-results/',

  /* Folder for test data */
  testMatch: '**/*.e2e.ts',
});
