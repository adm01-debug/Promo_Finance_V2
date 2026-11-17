/**
 * Regressão da PR #423 (achado 🔴 do Devin e P1 do Codex): ao remover a espera
 * simulada de `checkSefazHealth`, o monitor passou a verificar em laço
 * contínuo. `performHealthCheck` dependia de `health`, cada verificação
 * devolve um objeto novo, e o `setHealth` recriava o callback → recriava o
 * efeito → nova verificação, sem respeitar o intervalo configurado.
 *
 * Com o código anterior a este arquivo, o teste abaixo falha com
 * "expected 5 to be less than or equal to 1" (medido nesta sessão).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockCheck } = vi.hoisted(() => ({ mockCheck: vi.fn() }));

const DESCONHECIDO = {
  online: null,
  latency: null,
  lastCheck: null,
  consecutiveFailures: 0,
  averageResponseTime: 0,
};
const ESTADO_NORMAL = {
  mode: 'normal',
  activatedAt: null,
  activatedBy: null,
  reason: null,
  estimatedReturn: null,
  pendingNFes: [],
  lastFailure: null,
  consecutiveFailures: 0,
  autoActivated: false,
};

vi.mock('@/lib/sefaz-contingency', () => ({
  checkSefazHealth: mockCheck,
  getSefazHealthStatus: () => DESCONHECIDO,
  getContingencyState: () => ESTADO_NORMAL,
  getAutoContingencyConfig: () => ({ checkIntervalSeconds: 30, rules: [], enabled: true }),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useInView: () => true,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

import { SefazMonitor } from '../SefazMonitor';

describe('monitor da SEFAZ não verifica em laço (regressão #423)', () => {
  it('não reexecuta a verificação a cada render, mesmo devolvendo objeto novo', async () => {
    // Objeto novo por chamada é o comportamento real de checkSefazHealth; com
    // referência repetida o React descartaria o setState e o laço não apareceria.
    mockCheck.mockImplementation(async () => ({ ...DESCONHECIDO }));
    render(<SefazMonitor />);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockCheck.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('com status desconhecido o rodapé não promete monitoramento', async () => {
    mockCheck.mockImplementation(async () => ({ ...DESCONHECIDO }));
    render(<SefazMonitor />);
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Monitorando')).not.toBeInTheDocument();
  });
});
