import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/ui/tabs';
import { SimuladorTab } from '../SimuladorTab';
import type { SimulacaoElisao } from '../ElisaoFiscalTab.types';

const simulacao: SimulacaoElisao = {
  id: 'sim-1',
  ano_referencia: 2033,
  regime_atual: 'Simples Nacional',
  regime_simulado: 'Reforma Tributária (CBS/IBS) — 2033',
  carga_atual: 150000,
  carga_simulada: 120000,
  economia_estimada: 30000,
  premissas: { nome: 'Cenário 2033' },
  detalhes: {
    fontes: {
      faturamento12m: 1200000,
      comprasServicos12m: 300000,
      fonteFaturamento: 'notas_fiscais',
      notasConsideradas: 120,
      janelaInicio: '2025-11-26',
    },
    resultado: {
      totalAntigo: 150000,
      totalNovo: 120000,
      observacoes: ['Regime especial aplicado: Saúde'],
    },
  },
  created_at: '2026-11-26T10:00:00Z',
  updated_at: '2026-11-26T10:00:00Z',
};

const renderTab = (simulacoes: SimulacaoElisao[]) =>
  render(
    <Tabs value="simulador">
      <SimuladorTab simulacoes={simulacoes} onNovaSimulacao={vi.fn()} />
    </Tabs>
  );

describe('SimuladorTab', () => {
  it('mostra estado vazio quando não há cenários', () => {
    renderTab([]);
    expect(screen.getByText('Nenhuma simulação ativa')).toBeInTheDocument();
  });

  it('renderiza os números reais gravados no cenário', () => {
    renderTab([simulacao]);
    expect(screen.getByText('Cenário 2033')).toBeInTheDocument();
    expect(screen.getByText('Ano 2033')).toBeInTheDocument();
    expect(
      screen.getByText(/Simples Nacional → Reforma Tributária \(CBS\/IBS\)/)
    ).toBeInTheDocument();
    expect(screen.getByText(/150\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/120\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/30\.000,00/)).toBeInTheDocument();
  });

  it('abre a memória de cálculo no "Ver Detalhes do Cenário"', () => {
    renderTab([simulacao]);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Detalhes do Cenário' }));
    expect(screen.getByText('Base apurada')).toBeInTheDocument();
    expect(screen.getByText('Notas fiscais emitidas')).toBeInTheDocument();
    expect(screen.getByText('Regime especial aplicado: Saúde')).toBeInTheDocument();
  });
});
