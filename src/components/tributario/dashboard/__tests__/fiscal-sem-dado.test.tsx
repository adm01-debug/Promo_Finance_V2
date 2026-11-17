/**
 * Regressao: as 3 funcoes fiscais inventavam numero quando faltava faturamento,
 * e tirar a invencao sem acertar o contrato trocava a mentira por tela quebrada.
 *
 * Revisao da PR #403 (Devin e Codex): a primeira versao devolvia
 * `{ celulas: [], motivo }` no heatmap, e o cabecalho do painel le
 * `data.insights.mes_pico` dentro de `{data && ...}` ANTES da guarda de vazio --
 * TypeError na renderizacao. Estes testes cobrem os contratos vazios e os dois
 * componentes que os consomem.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: mockInvoke } },
}));
vi.mock('framer-motion', () => ({
  motion: { div: (p: Record<string, unknown>) => <div {...p} /> },
}));

import { HeatmapTributarioAnual } from '../HeatmapTributarioAnual';
import { BenchmarkSetorialCard } from '../BenchmarkSetorialCard';

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/** Contrato completo que a funcao devolve para ano sem lancamento. */
const heatmapVazio = {
  success: true,
  ano: 2025,
  empresa_id: 'e1',
  celulas: [],
  meses_com_lancamento: [],
  total_por_mes: Array.from({ length: 12 }, () => 0),
  total_ano: 0,
  max_valor: 0,
  insights: { mes_pico: null, mes_vale: null },
  motivo: 'sem_faturamento_no_ano',
  detalhe: 'Nao ha faturamento lancado para o ano informado.',
};

describe('heatmap tributario — ano sem faturamento', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza o estado vazio em vez de quebrar no insights.mes_pico', async () => {
    mockInvoke.mockResolvedValue({ data: heatmapVazio, error: null });
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <HeatmapTributarioAnual empresaId="e1" ano={2025} />
      </Wrapper>
    );
    expect(await screen.findByText(/Nao ha faturamento lancado/)).toBeInTheDocument();
    // o badge de pico nao pode aparecer sem mes de pico
    expect(screen.queryByText(/Pico:/)).not.toBeInTheDocument();
  });

  it('resposta sem a chave insights ainda renderiza (nao le antes da guarda)', async () => {
    // Revisao da PR #403 (Devin): assertar o objeto `heatmapVazio` deste arquivo
    // nao prova nada sobre a funcao -- o contrato real e assertado em
    // supabase/functions/gerar-heatmap-tributario/index.test.ts. O que cabe
    // aqui e a robustez do componente: mesmo uma resposta ANTIGA, sem
    // `insights`, nao pode mais quebrar o cabecalho.
    const { insights: _descartado, ...semInsights } = heatmapVazio;
    mockInvoke.mockResolvedValue({ data: semInsights, error: null });
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <HeatmapTributarioAnual empresaId="e1" ano={2025} />
      </Wrapper>
    );
    expect(await screen.findByText(/Nao ha faturamento lancado/)).toBeInTheDocument();
    expect(screen.queryByText(/Pico:/)).not.toBeInTheDocument();
  });
});

describe('benchmark setorial — sem carga e sem percentil', () => {
  beforeEach(() => vi.clearAllMocks());

  it('empresa sem faturamento 12m nao aparece "na mediana do setor"', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        empresa: { id: 'e1', razao_social: 'Acme', regime: 'simples' },
        carga_empresa_12m: null,
        benchmark: null,
        posicao: null,
        percentil: null,
        diferenca_mediana: null,
        motivo: 'sem_faturamento_12m',
        insights: [
          'Sem faturamento lançado nos últimos 12 meses: não há carga tributária a comparar.',
        ],
        atualizado_em: '2026-11-17T00:00:00Z',
      },
      error: null,
    });
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <BenchmarkSetorialCard empresaId="e1" />
      </Wrapper>
    );
    expect(await screen.findByText(/não há carga tributária a comparar/)).toBeInTheDocument();
    expect(screen.queryByText('Na mediana do setor')).not.toBeInTheDocument();
    expect(screen.queryByText(/Percentil estimado/)).not.toBeInTheDocument();
  });

  it('percentil nulo (P25 = P75) esconde a régua em vez de mostrar zero', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        empresa: { id: 'e1', razao_social: 'Acme', regime: 'simples' },
        carga_empresa_12m: 6,
        benchmark: {
          regime: 'simples',
          p25: 6,
          mediana: 6,
          p75: 6,
          media: 6,
          origem: 'tabela',
          fonte: 'public.benchmarks_setoriais',
        },
        posicao: 'mediana',
        percentil: null,
        diferenca_mediana: 0,
        insights: ['Comparado ao benchmark vigente do regime simples.'],
        atualizado_em: '2026-11-17T00:00:00Z',
      },
      error: null,
    });
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <BenchmarkSetorialCard empresaId="e1" />
      </Wrapper>
    );
    expect(await screen.findByText(/Comparado ao benchmark vigente/)).toBeInTheDocument();
    // a regua inteira sai de cena: sem percentil, sem "Percentil estimado: 0"
    expect(screen.queryByText(/Percentil estimado/)).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
