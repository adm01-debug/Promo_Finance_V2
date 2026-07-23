import { test, expect, type Page } from '@playwright/test';

/**
 * Visual regression suite — theme (dark/light).
 *
 * Cobre a tela de Login (não autenticada) e as principais telas autenticadas
 * em ambos os temas, gerando snapshots por combinação `rota × tema`.
 *
 * Como funciona:
 *   1. Antes de qualquer navegação, injeta `localStorage.theme` para forçar
 *      o tema desejado — o script inline em `index.html` aplica a classe
 *      no `<html>` antes do React montar, evitando flash e garantindo
 *      snapshots estáveis.
 *   2. Aguarda a rede ficar ociosa e que a fonte web esteja carregada.
 *   3. Mascara regiões voláteis (spinners, toasts, timestamps) para não
 *      poluir o diff visual.
 *
 * Baselines ficam em `e2e/visual-theme.e2e.ts-snapshots/`. Para gerar/atualizar
 * localmente após uma mudança intencional de UI, rode:
 *     npx playwright test e2e/visual-theme.e2e.ts --update-snapshots
 *
 * Testes de rotas autenticadas são pulados se `E2E_USER_EMAIL/PASSWORD` não
 * estiverem definidos — o setup emite `storageState` vazio nesse caso.
 */

type Theme = 'light' | 'dark';

const THEMES: Theme[] = ['light', 'dark'];

const AUTHED_ROUTES: Array<{ path: string; name: string; heading?: RegExp }> = [
  { path: '/', name: 'dashboard' },
  { path: '/contas-pagar', name: 'contas-pagar', heading: /contas a pagar/i },
  { path: '/contas-receber', name: 'contas-receber', heading: /contas a receber/i },
  { path: '/conciliacao', name: 'conciliacao', heading: /concilia[cç][aã]o/i },
  { path: '/relatorios', name: 'relatorios', heading: /relat[oó]rios/i },
];

const HAS_CREDS = !!(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

async function setThemeAndGoto(page: Page, path: string, theme: Theme) {
  await page.addInitScript((t) => {
    try {
      window.localStorage.setItem('theme', t);
      // Evita flash: aplica classe antes do bundle rodar (redundante com o
      // script inline em index.html, mas garante em navegações internas).
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(t);
    } catch { /* storage indisponível — segue */ }
  }, theme);

  await page.goto(path, { waitUntil: 'networkidle' });

  // Aguarda fontes web (Outfit/Plus Jakarta) para snapshot consistente.
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  // Confirma tema aplicado no <html>.
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
}

const SNAPSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  // Ruído aceitável em antialiasing/subpixel entre execuções.
  maxDiffPixelRatio: 0.02,
};

// Máscaras aplicadas em todos os snapshots — cobrem elementos voláteis que
// mudariam o hash sem indicar regressão real.
function volatileMasks(page: Page) {
  return [
    page.locator('.animate-spin'),
    page.locator('[data-sonner-toaster]'),
    page.locator('[data-testid="current-timestamp"]'),
    page.locator('time'),
  ];
}

test.describe('Regressão visual — Login (sem autenticação)', () => {
  // Login não deve usar storageState — força sessão vazia por teste.
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const theme of THEMES) {
    test(`/auth em tema ${theme}`, async ({ page }) => {
      await setThemeAndGoto(page, '/auth', theme);

      // Aguarda o formulário renderizar completamente.
      await expect(page.getByRole('button', { name: /Acessar Plataforma/i })).toBeVisible({
        timeout: 15_000,
      });

      await expect(page).toHaveScreenshot(`auth-${theme}.png`, {
        ...SNAPSHOT_OPTIONS,
        mask: volatileMasks(page),
      });
    });
  }
});

test.describe('Regressão visual — Telas autenticadas', () => {
  test.skip(
    !HAS_CREDS,
    'Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para rodar snapshots autenticados.',
  );

  for (const theme of THEMES) {
    for (const route of AUTHED_ROUTES) {
      test(`${route.path} em tema ${theme}`, async ({ page }) => {
        await setThemeAndGoto(page, route.path, theme);

        if (route.heading) {
          await expect(page.getByRole('heading', { name: route.heading }).first())
            .toBeVisible({ timeout: 20_000 });
        }

        // Pequeno settle para conteúdo lazy (queries, gráficos).
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
          ...SNAPSHOT_OPTIONS,
          mask: volatileMasks(page),
        });
      });
    }
  }
});
