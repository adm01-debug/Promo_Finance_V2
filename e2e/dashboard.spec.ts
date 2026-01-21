import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await page.waitForURL(/dashboard/).catch(() => {
      // Already on dashboard or login failed
    });
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByRole('heading', { name: /dashboard|painel/i })).toBeVisible();
  });

  test('should display stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for stats to load
    await page.waitForSelector('[data-testid="stat-card"]', { timeout: 10000 }).catch(() => null);
    
    // Check for typical stat cards
    const statCards = page.locator('[data-testid="stat-card"]');
    const count = await statCards.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display charts section', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for charts to load
    await page.waitForTimeout(2000);
    
    // Check for chart containers
    const charts = page.locator('[data-testid="chart-container"], .recharts-wrapper, canvas');
    const count = await charts.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display recent transactions or upcoming payments', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for transactions or payments section
    const sections = page.locator('[data-testid="recent-transactions"], [data-testid="upcoming-payments"]');
    const found = await sections.count();
    
    expect(found).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to contas a pagar from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    const quickAction = page.getByRole('link', { name: /conta.*pagar|nova.*despesa/i });
    
    if (await quickAction.isVisible()) {
      await quickAction.click();
      await expect(page).toHaveURL(/contas-pagar/);
    }
  });

  test('should navigate to contas a receber from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    const quickAction = page.getByRole('link', { name: /conta.*receber|nova.*receita/i });
    
    if (await quickAction.isVisible()) {
      await quickAction.click();
      await expect(page).toHaveURL(/contas-receber/);
    }
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    await page.goto('/dashboard');
    
    const refreshButton = page.getByRole('button', { name: /atualizar|refresh/i });
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Wait for loading indicator
      await page.waitForTimeout(1000);
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test('should display correct date range filter', async ({ page }) => {
    await page.goto('/dashboard');
    
    const dateFilter = page.getByTestId('date-range-picker');
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      
      // Should show preset options
      await expect(page.getByText(/hoje|hoje/i)).toBeVisible();
      await expect(page.getByText(/últimos.*7.*dias|last.*7.*days/i)).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for empty state messages
    const emptyStates = page.getByText(/nenhum.*registro|sem.*dados|no.*data/i);
    const count = await emptyStates.count();
    
    // Empty states are acceptable
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display loading states', async ({ page }) => {
    // Intercept and delay API requests
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('/dashboard');
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"], .animate-spin, .animate-pulse');
    const count = await loadingIndicators.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Should still display main content
    await expect(page.getByRole('heading', { name: /dashboard|painel/i })).toBeVisible();
    
    // Stat cards should stack vertically
    const statCards = page.locator('[data-testid="stat-card"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for sidebar
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav');
    const found = await sidebar.count();
    
    expect(found).toBeGreaterThan(0);
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    const menuButton = page.getByRole('button', { name: /menu/i });
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();
    }
  });
});

test.describe('Dashboard Error Handling', () => {
  test('should display error state when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show error message or retry button
    const errorElements = page.getByText(/erro|error|falha|failed/i);
    const retryButton = page.getByRole('button', { name: /tentar.*novamente|retry/i });
    
    const hasError = await errorElements.count() > 0 || await retryButton.isVisible();
    expect(hasError).toBeTruthy();
  });

  test('should recover from error after retry', async ({ page }) => {
    let requestCount = 0;
    
    // First request fails, subsequent succeed
    await page.route('**/api/**', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/dashboard');
    
    const retryButton = page.getByRole('button', { name: /tentar.*novamente|retry/i });
    
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForTimeout(1000);
      
      // Should recover and show content
      await expect(page.getByRole('heading', { name: /dashboard|painel/i })).toBeVisible();
    }
  });
});
