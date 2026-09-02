import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8080';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH;
const chromiumLaunchOptions = chromiumExecutablePath
  ? { launchOptions: { executablePath: chromiumExecutablePath } }
  : {};

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/auth/login.e2e.ts', '**/auth/admin-rbac.e2e.ts', '**/visual-theme.e2e.ts'],
  testIgnore: ['**/auth/auth.setup.ts', '**/auth/logout-real.e2e.ts'],
  grepInvert: /RBAC › usuário autenticado sem perfil admin|Regressão visual — Telas autenticadas/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 30000,
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
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  outputDir: 'test-results/critical',
});
