import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricasPorCanal } from '../MetricasPorCanal';

describe('MetricasPorCanal', () => {
  it('não projeta métricas financeiras quando não há registros reais por canal', () => {
    render(<MetricasPorCanal />);

    expect(
      screen.getByText(
        /Métricas por canal indisponíveis até que os registros de entrega, leitura e pagamento sejam reconciliados/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('42%')).not.toBeInTheDocument();
    expect(screen.queryByText('58%')).not.toBeInTheDocument();
  });

  it('apresenta apenas os números fornecidos por uma fonte de dados', () => {
    render(
      <MetricasPorCanal
        metricas={[{ canal: 'Email', enviados: 10, abertos: 8, pagos: 4, taxaConversao: 40 }]}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
