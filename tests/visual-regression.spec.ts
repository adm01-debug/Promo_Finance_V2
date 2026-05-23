import { test, expect } from '@playwright/test';

const pages = [
  { name: 'dashboard', path: '/' },
  { name: 'debug', path: '/design-system-debug' },
  // Add more key pages here
];

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

for (const pageInfo of pages) {
  test.describe(`Visual Regression: ${pageInfo.name}`, () => {
    for (const viewport of viewports) {
      test(`Compare ${viewport.name} pixel-by-pixel`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageInfo.path);
        
        // Wait for fonts and content to load
        await page.waitForLoadState('networkidle');
        
        // Take screenshot and compare
        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
          fullPage: true,
          threshold: 0.1, // 10% sensitivity
          maxDiffPixels: 100,
        });
      });
    }
  });
}
