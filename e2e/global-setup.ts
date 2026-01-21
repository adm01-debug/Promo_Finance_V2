import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // Create test user session if needed
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Check if we need to login
    const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible()
      .catch(() => false);
    
    if (!isLoggedIn) {
      // Fill login form with test credentials
      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
      
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.click('[data-testid="login-button"]');
      
      // Wait for login to complete
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
        console.log('Login may have failed or redirected elsewhere');
      });
    }
    
    // Save storage state for reuse in tests
    if (storageState) {
      await context.storageState({ path: storageState as string });
    }
  } catch (error) {
    console.log('Global setup encountered an error:', error);
    // Don't fail setup - tests will handle auth individually if needed
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup complete');
}

export default globalSetup;
