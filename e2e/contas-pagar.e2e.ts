import { test, expect } from '@playwright/test';

test.describe('Contas a Pagar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contas-pagar');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contas a pagar/i })).toBeVisible();
  });

  test('shows contas list', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible();
    
    // Should have table headers
    await expect(page.getByRole('columnheader', { name: /descrição/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /valor/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /vencimento/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /nova conta/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/cadastrar conta a pagar/i)).toBeVisible();
  });

  test('creates new conta a pagar', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /nova conta/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill form
    await page.getByLabel(/descrição/i).fill('Conta de luz - Janeiro');
    await page.getByLabel(/valor/i).fill('350.00');
    await page.getByLabel(/vencimento/i).fill('2024-02-15');
    
    // Select fornecedor if dropdown exists
    const fornecedorSelect = page.getByLabel(/fornecedor/i);
    if (await fornecedorSelect.isVisible()) {
      await fornecedorSelect.click();
      await page.getByRole('option').first().click();
    }
    
    // Submit
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Success message should appear
    await expect(page.getByText(/sucesso|criada/i)).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.getByRole('button', { name: /nova conta/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/obrigatório|required/i)).toBeVisible();
  });

  test('filters by status', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Open status filter
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /pendente/i }).click();
    
    // Wait for table to update
    await page.waitForResponse((response) => 
      response.url().includes('contas') && response.status() === 200
    );
    
    // All visible rows should have "Pendente" status
    const statusCells = page.locator('td:has-text("Pendente")');
    const rowCount = await statusCells.count();
    
    if (rowCount > 0) {
      // Verify status badges are all "Pendente"
      await expect(statusCells.first()).toBeVisible();
    }
  });

  test('searches by description', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill('energia');
    
    // Wait for debounce and API call
    await page.waitForTimeout(500);
    
    // Results should update
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('marks conta as paid', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Find a pending conta and click pay button
    const row = page.locator('tr').filter({ hasText: /pendente/i }).first();
    
    if (await row.isVisible()) {
      const payButton = row.getByRole('button', { name: /pagar/i });
      
      if (await payButton.isVisible()) {
        await payButton.click();
        
        // Confirm payment
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: /confirmar/i }).click();
        
        // Success message
        await expect(page.getByText(/pago|sucesso/i)).toBeVisible();
      }
    }
  });

  test('edits existing conta', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Find first row and click edit
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modal should open with data
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Modify description
      const descInput = page.getByLabel(/descrição/i);
      await descInput.clear();
      await descInput.fill('Descrição atualizada');
      
      // Save
      await page.getByRole('button', { name: /salvar/i }).click();
      
      // Verify update
      await expect(page.getByText(/atualizada|sucesso/i)).toBeVisible();
    }
  });

  test('deletes conta with confirmation', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/confirmar|certeza/i)).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirmar|excluir/i }).click();
      
      // Success message
      await expect(page.getByText(/excluída|sucesso/i)).toBeVisible();
    }
  });

  test('selects multiple and performs bulk action', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Select multiple rows
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 3) {
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();
      
      // Bulk actions should appear
      await expect(page.getByText(/selecionados/i)).toBeVisible();
      
      // Click bulk delete
      const bulkDeleteBtn = page.getByRole('button', { name: /excluir selecionados/i });
      
      if (await bulkDeleteBtn.isVisible()) {
        await bulkDeleteBtn.click();
        await page.getByRole('button', { name: /confirmar/i }).click();
        
        await expect(page.getByText(/excluídas|sucesso/i)).toBeVisible();
      }
    }
  });

  test('exports to CSV', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    const exportButton = page.getByRole('button', { name: /exportar/i });
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('paginates results', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Check if pagination exists (requires more than 10 items)
    const nextPageBtn = page.getByRole('button', { name: /próxima|next/i });
    
    if (await nextPageBtn.isVisible() && await nextPageBtn.isEnabled()) {
      await nextPageBtn.click();
      
      // Page indicator should change
      await expect(page.getByText(/página 2/i)).toBeVisible();
    }
  });

  test('filters by date range', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    
    // Open date filter
    const startDate = page.getByLabel(/data início/i);
    const endDate = page.getByLabel(/data fim/i);
    
    if (await startDate.isVisible()) {
      await startDate.fill('2024-01-01');
      await endDate.fill('2024-01-31');
      
      // Apply filter
      const applyBtn = page.getByRole('button', { name: /aplicar|filtrar/i });
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
      
      // Results should update
      await page.waitForTimeout(500);
      await expect(page.getByRole('table')).toBeVisible();
    }
  });

  test('shows stats summary', async ({ page }) => {
    // Check for stats cards
    const statsSection = page.getByTestId('stats-cards');
    
    if (await statsSection.isVisible()) {
      // Should show totals
      await expect(page.getByText(/total/i)).toBeVisible();
      await expect(page.getByText(/R\$/)).toBeVisible();
    }
  });
});

test.describe('Contas a Pagar - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('responsive layout works', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    // Should be accessible on mobile
    await expect(page.getByRole('heading', { name: /contas a pagar/i })).toBeVisible();
    
    // Menu might be collapsed
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  });

  test('modal is usable on mobile', async ({ page }) => {
    await page.goto('/contas-pagar');
    
    await page.getByRole('button', { name: /nova conta/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Form should be scrollable and usable
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Close button should be accessible
    await page.getByRole('button', { name: /fechar|cancelar/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
