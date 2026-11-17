/**
 * Achado F11 (P0): o painel da SEFAZ anunciava status, latência e uptime que
 * ninguém mediu — `checkSefazHealth` sorteava o resultado localmente e o
 * default do storage abria a tela como "Online / 0ms". As telas de histórico,
 * analytics e alertas de rejeição vinham semeadas com eventos de demonstração.
 *
 * Estes testes fixam o contrato: com status desconhecido ou sem evento algum, a
 * tela mostra "—" / "não verificado" em vez de número, e não desabilita nada
 * que funcione de verdade (contingência manual e as regras seguem intactas).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        const C = ({ children, ...rest }: Record<string, unknown> & { children?: ReactNode }) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, ...dom } =
            rest;
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...(dom as object)}>{children}</Tag>;
        };
        return C;
      },
    }
  ),
  useInView: () => true,
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/sefaz-event-logger', () => ({
  getEventos: () => [],
  getEstatisticas: () => ({
    total: 0,
    autorizadas: 0,
    rejeitadas: 0,
    erros: 0,
    taxaSucesso: '0',
    tempoMedioResposta: '0',
    temposMedidos: 0,
  }),
  eventTypeConfig: {},
}));

vi.mock('@/lib/sefaz-rejection-monitor', () => ({
  getAlertas: () => [],
  getAlertasNaoLidos: () => [],
  getAlertasCriticos: () => [],
  marcarComoLido: vi.fn(),
  marcarTodosComoLidos: vi.fn(),
  analisarPadroes: () => ({ codigosFrequentes: [], horariosPico: [], tendencia: 'estavel' }),
  verificarRejeicoes: vi.fn(),
  rejeicaoConfig: {},
}));

import { SefazStatusBanner } from '../sefaz-monitor/SefazStatusBanner';
import { SefazMetricsCards } from '../sefaz-monitor/SefazMetricsCards';
import { SefazAnalyticsKPIs } from '../sefaz-analytics/SefazAnalyticsKPIs';
import { EventosHistorico } from '../EventosHistorico';

const HEALTH_DESCONHECIDO = {
  online: null,
  latency: null,
  lastCheck: null,
  consecutiveFailures: 0,
  averageResponseTime: 0,
};

const ESTADO_NORMAL = {
  mode: 'normal' as const,
  activatedAt: null,
  activatedBy: null,
  reason: null,
  estimatedReturn: null,
  pendingNFes: [],
  lastFailure: null,
  consecutiveFailures: 0,
  autoActivated: false,
};

describe('painel da SEFAZ não exibe métrica fabricada (F11)', () => {
  it('status desconhecido: banner diz "não verificado" e não afirma online nem offline', () => {
    render(
      <SefazStatusBanner
        health={HEALTH_DESCONHECIDO}
        contingencyState={ESTADO_NORMAL}
        autoMonitor={false}
        setAutoMonitor={vi.fn()}
        isChecking={false}
        onCheck={vi.fn()}
      />
    );
    expect(screen.getByText('SEFAZ — status não verificado')).toBeInTheDocument();
    expect(screen.getByText('Sem integração homologada')).toBeInTheDocument();
    expect(screen.queryByText('SEFAZ Online')).not.toBeInTheDocument();
    expect(screen.queryByText('SEFAZ Offline')).not.toBeInTheDocument();
  });

  it('status desconhecido: "Verificar Agora" e o monitor automático ficam desabilitados', () => {
    render(
      <SefazStatusBanner
        health={HEALTH_DESCONHECIDO}
        contingencyState={ESTADO_NORMAL}
        autoMonitor={false}
        setAutoMonitor={vi.fn()}
        isChecking={false}
        onCheck={vi.fn()}
      />
    );
    screen.getAllByRole('button').forEach((botao) => expect(botao).toHaveAttribute('disabled'));
    expect(screen.getByText('nunca verificada', { exact: false })).toBeInTheDocument();
  });

  it('sem medição, os cards não mostram latência nem uptime numéricos', () => {
    render(
      <SefazMetricsCards
        health={HEALTH_DESCONHECIDO}
        uptime={null}
        avgLatency={0}
        minLatency={0}
        maxLatency={0}
        maxFailuresRule={3}
      />
    );
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('0ms')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  it('analytics sem evento: taxa de sucesso e tempo médio aparecem como "—"', () => {
    render(
      <SefazAnalyticsKPIs
        taxaSucesso={0}
        taxaRejeicao={0}
        tempoMedio={0}
        total={0}
        autorizadas={0}
        rejeitadas={0}
        cancelamentos={0}
        erros={0}
      />
    );
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0s')).not.toBeInTheDocument();
  });

  it('analytics com evento real volta a exibir os percentuais medidos', () => {
    render(
      <SefazAnalyticsKPIs
        taxaSucesso={97.5}
        taxaRejeicao={2.5}
        tempoMedio={1200}
        total={40}
        autorizadas={39}
        rejeitadas={1}
        cancelamentos={0}
        erros={0}
      />
    );
    expect(screen.getByText('97.5%')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('1.2s')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('evento sem tempo de resposta não vira "0.0s" de resposta da SEFAZ', () => {
    // Ativar contingência manualmente registra evento sem tempoResposta: total
    // passa a ser > 0 sem nenhuma medição (achado do Devin na PR #423).
    render(
      <SefazAnalyticsKPIs
        taxaSucesso={0}
        taxaRejeicao={0}
        tempoMedio={0}
        total={3}
        autorizadas={0}
        rejeitadas={0}
        cancelamentos={3}
        erros={0}
        temposMedidos={0}
      />
    );
    expect(screen.getAllByText('—')).toHaveLength(1);
    expect(screen.queryByText('0.0s')).not.toBeInTheDocument();
    expect(screen.getByText('0.0%', { selector: '.text-success' })).toBeInTheDocument();
  });

  it('histórico vazio não anuncia "0ms de resposta" nem promete evento por emissão', () => {
    render(<EventosHistorico />);
    expect(screen.getByText('Nenhum evento registrado')).toBeInTheDocument();
    expect(screen.queryByText('0ms')).not.toBeInTheDocument();
    expect(screen.queryByText(/emita uma NF-e/)).not.toBeInTheDocument();
  });
});
