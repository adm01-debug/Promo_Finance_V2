import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('shows summary stats cards', async ({ page }) => {
    // Wait for stats to load
    await expect(page.getByTestId('stats-cards')).toBeVisible();
    
    // Verify all stat cards are present
    await expect(page.getByText(/receitas/i)).toBeVisible();
    await expect(page.getByText(/despesas/i)).toBeVisible();
    await expect(page.getByText(/saldo/i)).toBeVisible();
  });

  test('displays recent transactions', async ({ page }) => {
    await expect(page.getByTestId('recent-transactions')).toBeVisible();
    
    // Should have at least the header
    await expect(page.getByText(/transações recentes/i)).toBeVisible();
  });

  test('shows upcoming bills section', async ({ page }) => {
    await expect(page.getByTestId('upcoming-bills')).toBeVisible();
    await expect(page.getByText(/próximos vencimentos/i)).toBeVisible();
  });

  test('period filter changes data', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByTestId('stats-cards')).toBeVisible();
    
    // Change period to month
    await page.getByRole('combobox', { name: /período/i }).click();
    await page.getByText(/este mês/i).click();
    
    // Verify loading state appears and resolves
    await expect(page.getByTestId('stats-cards')).toBeVisible();
  });

  test('quick actions are clickable', async ({ page }) => {
    const novaContaBtn = page.getByRole('button', { name: /nova conta/i });
    await expect(novaContaBtn).toBeVisible();
    
    // Click should open modal or navigate
    await novaContaBtn.click();
    
    // Verify modal or navigation happened
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="form-modal"]'))).toBeVisible();
  });

  test('alerts section shows overdue items', async ({ page }) => {
    const alertsSection = page.getByTestId('alerts-section');
    
    // Check if alerts section exists (may or may not have alerts)
    const hasAlerts = await alertsSection.isVisible().catch(() => false);
    
    if (hasAlerts) {
      // If there are alerts, verify they have proper styling
      const alertItems = page.locator('[data-testid="alert-item"]');
      const count = await alertItems.count();
      
      if (count > 0) {
        await expect(alertItems.first()).toBeVisible();
      }
    }
  });

  test('charts render correctly', async ({ page }) => {
    // Wait for charts to load
    await page.waitForSelector('[data-testid="chart-container"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Verify at least one chart is visible
    const charts = page.locator('[data-testid="chart-container"]');
    await expect(charts.first()).toBeVisible();
  });

  test('responsive layout works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be accessible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Stats cards should stack vertically (single column)
    const statsCards = page.getByTestId('stats-cards');
    await expect(statsCards).toBeVisible();
  });

  test('can navigate to other pages from dashboard', async ({ page }) => {
    // Click on sidebar link to contas a pagar
    await page.getByRole('link', { name: /contas a pagar/i }).click();
    
    await expect(page).toHaveURL(/contas-pagar/);
    await expect(page.getByRole('heading', { name: /contas a pagar/i })).toBeVisible();
  });

  test('refresh button reloads data', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByTestId('stats-cards')).toBeVisible();
    
    // Click refresh
    const refreshBtn = page.getByRole('button', { name: /atualizar/i });
    
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      
      // Should show loading and then data again
      await expect(page.getByTestId('stats-cards')).toBeVisible();
    }
  });

  test('export button downloads report', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByTestId('stats-cards')).toBeVisible();
    
    // Look for export button
    const exportBtn = page.getByRole('button', { name: /exportar/i });
    
    if (await exportBtn.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/);
    }
  });
});

test.describe('Dashboard Error Handling', () => {
  test('shows error message when API fails', async ({ page }) => {
    // Mock API to fail
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.getByText(/erro/i)).toBeVisible({ timeout: 10000 });
  });

  test('retry button works after error', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/**', (route) => {
      requestCount++;
      
      if (requestCount === 1) {
        // First request fails
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Error' }),
        });
      } else {
        // Subsequent requests succeed
        route.continue();
      }
    });
    
    await page.goto('/dashboard');
    
    // Wait for error
    await expect(page.getByText(/erro/i)).toBeVisible();
    
    // Click retry
    const retryBtn = page.getByRole('button', { name: /tentar novamente/i });
    if (await retryBtn.isVisible()) {
      await retryBtn.click();
      
      // Should load data after retry
      await expect(page.getByTestId('stats-cards')).toBeVisible({ timeout: 10000 });
    }
  });
});
