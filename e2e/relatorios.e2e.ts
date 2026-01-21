import { test, expect } from '@playwright/test';

test.describe('Relatórios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/relatorios');
  });

  test('displays reports page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible();
  });

  test('shows report type options', async ({ page }) => {
    // Should have different report types
    await expect(page.getByText(/resumo|summary/i)).toBeVisible();
    await expect(page.getByText(/fluxo.*caixa|cash.*flow/i)).toBeVisible();
    await expect(page.getByText(/despesas|expenses/i)).toBeVisible();
    await expect(page.getByText(/receitas|revenue/i)).toBeVisible();
  });

  test('generates summary report', async ({ page }) => {
    // Select summary report type
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    
    // Wait for report to load
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Verify content
    await expect(page.getByText(/total.*receitas/i)).toBeVisible();
    await expect(page.getByText(/total.*despesas/i)).toBeVisible();
    await expect(page.getByText(/saldo/i)).toBeVisible();
  });

  test('filters report by date range', async ({ page }) => {
    // Set date range
    const startDate = page.getByLabel(/data.*início|start.*date/i);
    const endDate = page.getByLabel(/data.*fim|end.*date/i);
    
    await startDate.fill('2024-01-01');
    await endDate.fill('2024-12-31');
    
    // Generate report
    await page.getByRole('button', { name: /gerar|generate/i }).click();
    
    // Wait for report
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
  });

  test('generates cash flow report', async ({ page }) => {
    await page.getByRole('button', { name: /fluxo.*caixa|cash.*flow/i }).click();
    
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Should have cash flow chart or data
    await expect(
      page.getByTestId('cash-flow-chart')
        .or(page.getByText(/entradas/i))
    ).toBeVisible();
  });

  test('generates expenses by category report', async ({ page }) => {
    await page.getByRole('button', { name: /despesas.*categoria|expenses.*category/i }).click();
    
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Should have category breakdown
    await expect(
      page.getByTestId('category-chart')
        .or(page.locator('table'))
    ).toBeVisible();
  });

  test('generates revenue by client report', async ({ page }) => {
    const clientReportBtn = page.getByRole('button', { name: /receitas.*cliente|revenue.*client/i });
    
    if (await clientReportBtn.isVisible()) {
      await clientReportBtn.click();
      
      await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    }
  });

  test('exports report to PDF', async ({ page }) => {
    // Generate a report first
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Export to PDF
    const exportBtn = page.getByRole('button', { name: /exportar.*pdf|export.*pdf/i });
    
    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test('exports report to Excel', async ({ page }) => {
    // Generate a report first
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Export to Excel
    const exportBtn = page.getByRole('button', { name: /exportar.*excel|export.*excel|xlsx/i });
    
    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls)$/);
    }
  });

  test('exports report to CSV', async ({ page }) => {
    // Generate a report first
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Export to CSV
    const exportBtn = page.getByRole('button', { name: /exportar.*csv|export.*csv/i });
    
    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('prints report', async ({ page }) => {
    // Generate a report first
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Print button
    const printBtn = page.getByRole('button', { name: /imprimir|print/i });
    
    if (await printBtn.isVisible()) {
      // Note: Can't actually test print dialog, just verify button works
      await printBtn.click();
      // Print dialog would open here
    }
  });

  test('generates aging report', async ({ page }) => {
    const agingBtn = page.getByRole('button', { name: /aging|vencimento|inadimplência/i });
    
    if (await agingBtn.isVisible()) {
      await agingBtn.click();
      
      await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
      
      // Should show aging buckets
      await expect(page.getByText(/0-30.*dias|1-30.*dias/i)).toBeVisible();
    }
  });

  test('shows charts in reports', async ({ page }) => {
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Should have at least one chart
    const charts = page.locator('canvas, svg[data-testid*="chart"]');
    const chartCount = await charts.count();
    
    expect(chartCount).toBeGreaterThan(0);
  });

  test('comparison report between periods', async ({ page }) => {
    const comparisonBtn = page.getByRole('button', { name: /comparativo|comparison/i });
    
    if (await comparisonBtn.isVisible()) {
      await comparisonBtn.click();
      
      // Select two periods to compare
      const period1 = page.getByLabel(/período.*1|first.*period/i);
      const period2 = page.getByLabel(/período.*2|second.*period/i);
      
      if (await period1.isVisible()) {
        await period1.click();
        await page.getByRole('option').first().click();
        
        await period2.click();
        await page.getByRole('option').last().click();
        
        await page.getByRole('button', { name: /comparar|compare/i }).click();
        
        await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('saves report as favorite', async ({ page }) => {
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    const favoriteBtn = page.getByRole('button', { name: /favorito|favorite|salvar/i });
    
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.click();
      await expect(page.getByText(/salvo|saved|favorito/i)).toBeVisible();
    }
  });

  test('schedules report generation', async ({ page }) => {
    const scheduleBtn = page.getByRole('button', { name: /agendar|schedule/i });
    
    if (await scheduleBtn.isVisible()) {
      await scheduleBtn.click();
      
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Fill schedule form
      const emailInput = page.getByLabel(/email/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill('reports@company.com');
      }
      
      const frequencySelect = page.getByRole('combobox', { name: /frequência|frequency/i });
      if (await frequencySelect.isVisible()) {
        await frequencySelect.click();
        await page.getByRole('option', { name: /semanal|weekly/i }).click();
      }
      
      await page.getByRole('button', { name: /salvar|save/i }).click();
      await expect(page.getByText(/agendado|scheduled/i)).toBeVisible();
    }
  });

  test('handles empty data gracefully', async ({ page }) => {
    // Mock empty data
    await page.route('**/api/reports/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });
    
    await page.goto('/relatorios');
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    
    // Should show empty state message
    await expect(
      page.getByText(/nenhum.*dado|no.*data|sem.*registros/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('handles loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/reports/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    
    // Should show loading indicator
    await expect(
      page.getByTestId('loading-indicator')
        .or(page.getByRole('progressbar'))
        .or(page.locator('.animate-spin'))
    ).toBeVisible();
  });

  test('handles error state', async ({ page }) => {
    // Mock error response
    await page.route('**/api/reports/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });
    
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    
    // Should show error message
    await expect(page.getByText(/erro|error/i)).toBeVisible({ timeout: 10000 });
    
    // Should have retry option
    await expect(page.getByRole('button', { name: /tentar.*novamente|retry/i })).toBeVisible();
  });
});

test.describe('Relatórios - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('responsive layout works', async ({ page }) => {
    await page.goto('/relatorios');
    
    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible();
    
    // Report options should be accessible
    await expect(page.getByRole('button', { name: /resumo|summary/i })).toBeVisible();
  });

  test('report content scrolls on mobile', async ({ page }) => {
    await page.goto('/relatorios');
    
    await page.getByRole('button', { name: /resumo|summary/i }).click();
    await expect(page.getByTestId('report-content')).toBeVisible({ timeout: 10000 });
    
    // Content should be scrollable
    const content = page.getByTestId('report-content');
    const isScrollable = await content.evaluate((el) => el.scrollHeight > el.clientHeight);
    
    // If content is tall, it should be scrollable
    if (isScrollable) {
      await content.evaluate((el) => el.scrollTo(0, 100));
    }
  });
});
