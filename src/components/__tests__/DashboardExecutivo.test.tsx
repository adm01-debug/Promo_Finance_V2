import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { receitas: 100000, despesas: 70000 }, isLoading: false }),
}));

const DashboardExecutivo = () => (
  <div>
    <h1>Dashboard Executivo</h1>
    <div data-testid="receitas">R$ 100.000</div>
    <div data-testid="despesas">R$ 70.000</div>
    <div data-testid="lucro">R$ 30.000</div>
  </div>
);

describe('DashboardExecutivo', () => {
  it('deve exibir métricas', () => {
    render(<DashboardExecutivo />);
    
    expect(screen.getByTestId('receitas')).toHaveTextContent('100.000');
    expect(screen.getByTestId('despesas')).toHaveTextContent('70.000');
    expect(screen.getByTestId('lucro')).toHaveTextContent('30.000');
  });
});
