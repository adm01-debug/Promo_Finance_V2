import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { IndicesGrid } from '@/components/contabilidade/indices/IndicesGrid';
import { IndicesToolbar } from '@/components/contabilidade/indices/IndicesToolbar';
import { calcularIndices, AGREGADOS_ZERO } from '@/lib/contabil/indices';

expect.extend(axeMatchers as never);

const axeConfig = {
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
};

const indices = calcularIndices({
  ...AGREGADOS_ZERO,
  ativoTotal: 1000,
  ativoCirculante: 600,
  passivoCirculante: 300,
  patrimonioLiquido: 500,
  receitaLiquida: 1000,
  cmv: 600,
  clientes: 250,
  estoques: 200,
  fornecedores: 120,
  lucroLiquido: 120,
});

describe('A11y — aba Índices contábeis', () => {
  it('grade de indicadores não possui violações', async () => {
    const { container } = render(
      <IndicesGrid indices={indices} anteriores={null} busca="" />,
    );
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('toolbar de filtros não possui violações', async () => {
    const { container } = render(
      <IndicesToolbar
        values={{
          dataInicio: '2026-01-01',
          dataFim: '2026-12-31',
          compararAnterior: true,
          busca: '',
          serie: ['liquidez_corrente'],
        }}
        setField={() => undefined}
        countLabel="20 de 21 com base contábil"
      />,
    );
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });
});
