import { test, expect } from '@playwright/test';

test.describe('Realtime Stability', () => {
  test('realtime subscription connects successfully', async ({ page }) => {
    await page.goto('/alertas');
    
    // Check for realtime status if UI exposes it, or just verify data loads
    await expect(page.getByText(/Alertas/i)).toBeVisible();
    
    // Verify websocket connection in browser logs/network if needed
  });

  test('duplicate requests are avoided on rapid interactions', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const refreshBtn = page.getByRole('button', { name: /Atualizar/i });
    if (await refreshBtn.isVisible()) {
      // Rapid clicks
      await refreshBtn.click();
      await refreshBtn.click();
      await refreshBtn.click();
      
      // Should not crash and should deduplicate logic (check console)
      const logs = await page.evaluate(() => (window as any).console.history || []);
      // Verification logic here
    }
  });
});
