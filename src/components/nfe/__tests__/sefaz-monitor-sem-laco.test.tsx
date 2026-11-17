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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockCheck, inicial } = vi.hoisted(() => ({
  mockCheck: vi.fn(),
  // Mutável de propósito: o status inicial do componente vem daqui, e o laço
  // precisa ser testado também com status CONHECIDO — com `online: null` o
  // efeito nem começa, então o teste passaria com zero chamadas e não veria o
  // laço voltar (achado do Devin na PR #423).
  inicial: { status: null as unknown as Record<string, unknown> },
}));

const DESCONHECIDO = {
  online: null,
  latency: null,
  lastCheck: null,
  consecutiveFailures: 0,
  averageResponseTime: 0,
};
const ONLINE = {
  online: true,
  latency: 180,
  lastCheck: new Date('2026-11-17T10:00:00.000Z'),
  consecutiveFailures: 0,
  averageResponseTime: 180,
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
  getSefazHealthStatus: () => inicial.status,
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
  beforeEach(() => {
    mockCheck.mockReset();
  });

  it('com status CONHECIDO verifica uma vez e respeita o intervalo', async () => {
    // Este é o caso que prova o fim do laço: aqui o monitoramento roda de fato
    // (o efeito não é suspenso), e o intervalo configurado é de 30s — então
    // mais de uma chamada em 50ms só pode vir da recriação do efeito.
    inicial.status = ONLINE;
    mockCheck.mockImplementation(async () => ({ ...ONLINE }));
    render(<SefazMonitor />);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });

  it('com status desconhecido não verifica nada e o rodapé não promete monitoramento', async () => {
    inicial.status = DESCONHECIDO;
    mockCheck.mockImplementation(async () => ({ ...DESCONHECIDO }));
    render(<SefazMonitor />);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockCheck).not.toHaveBeenCalled();
    expect(screen.getByText('Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Monitorando')).not.toBeInTheDocument();
  });
});
