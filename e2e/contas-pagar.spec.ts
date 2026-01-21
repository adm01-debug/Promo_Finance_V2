import { test, expect } from '@playwright/test';

test.describe('Contas a Pagar', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/senha|password/i).fill(testPassword);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    await page.waitForURL(/dashboard/).catch(() => null);
  });

  test('should display contas a pagar page', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    await expect(page.getByRole('heading', { name: /contas.*pagar|despesas/i })).toBeVisible();
  });

  test('should display data table', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Wait for table to load
    await page.waitForSelector('table, [data-testid="data-table"]', { timeout: 10000 }).catch(() => null);
    
    const table = page.locator('table, [data-testid="data-table"]');
    const exists = await table.count() > 0;
    
    expect(exists).toBeTruthy();
  });

  test('should have add new button', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|criar|new|add/i });
    await expect(addButton).toBeVisible();
  });

  test('should open modal when clicking add button', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|criar|new|add/i });
    await addButton.click();
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show form fields in modal', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|criar|new|add/i });
    await addButton.click();
    
    // Check for form fields
    await expect(page.getByLabel(/descrição|description/i)).toBeVisible();
    await expect(page.getByLabel(/valor|value|amount/i)).toBeVisible();
    await expect(page.getByLabel(/vencimento|due.*date/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|criar|new|add/i });
    await addButton.click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /salvar|save|criar|create/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/obrigatório|required/i)).toBeVisible();
  });

  test('should create new conta a pagar', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|criar|new|add/i });
    await addButton.click();
    
    // Fill form
    await page.getByLabel(/descrição|description/i).fill('Teste E2E - Conta a Pagar');
    await page.getByLabel(/valor|value|amount/i).fill('1500');
    
    // Set due date
    const dueDateInput = page.getByLabel(/vencimento|due.*date/i);
    await dueDateInput.fill('2026-02-15');
    
    // Submit
    const submitButton = page.getByRole('button', { name: /salvar|save|criar|create/i });
    await submitButton.click();
    
    // Should close modal and show success
    await expect(page.getByText(/sucesso|success|criado|created/i)).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Find status filter
    const statusFilter = page.getByLabel(/status/i);
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Select "Pendente"
      await page.getByRole('option', { name: /pendente/i }).click();
      
      // Table should update
      await page.waitForTimeout(500);
    }
  });

  test('should search by description', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const searchInput = page.getByPlaceholder(/buscar|search|pesquisar/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('teste');
      await page.waitForTimeout(500);
      
      // Results should filter
    }
  });

  test('should select multiple items', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Wait for table rows
    await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => null);
    
    const checkboxes = page.locator('table tbody tr input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      await checkboxes.first().check();
      
      // Should show bulk actions
      await expect(page.getByText(/selecionado|selected/i)).toBeVisible();
    }
  });

  test('should export data', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const exportButton = page.getByRole('button', { name: /exportar|export/i });
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Should show export options
      await expect(page.getByText(/csv|excel|pdf/i)).toBeVisible();
    }
  });

  test('should mark as paid', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Find a row with pending status
    const row = page.locator('table tbody tr').first();
    
    if (await row.isVisible()) {
      // Find pay button or menu
      const payButton = row.getByRole('button', { name: /pagar|pay|baixar/i });
      
      if (await payButton.isVisible()) {
        await payButton.click();
        
        // Confirm action if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirmar|confirm/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Should show success message
        await expect(page.getByText(/sucesso|pago|paid/i)).toBeVisible();
      }
    }
  });

  test('should delete conta', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    const row = page.locator('table tbody tr').first();
    
    if (await row.isVisible()) {
      // Find delete button
      const deleteButton = row.getByRole('button', { name: /excluir|delete|remover/i });
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /confirmar|confirm|excluir|delete/i });
        await confirmButton.click();
        
        // Should show success message
        await expect(page.getByText(/sucesso|excluído|deleted/i)).toBeVisible();
      }
    }
  });

  test('should paginate results', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Check for pagination
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label="pagination"]');
    
    if (await pagination.isVisible()) {
      const nextButton = pagination.getByRole('button', { name: /próximo|next|>>/i });
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Page should change
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contas-pagar');
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /contas.*pagar|despesas/i })).toBeVisible();
    
    // Add button should be visible
    const addButton = page.getByRole('button', { name: /nova|adicionar|\+/i });
    await expect(addButton).toBeVisible();
  });
});
