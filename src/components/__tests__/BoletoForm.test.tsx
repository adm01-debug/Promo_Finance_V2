import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const BoletoForm = ({ onSubmit }: any) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    <input name="valor" type="number" placeholder="Valor" />
    <input name="vencimento" type="date" />
    <button type="submit">Gerar Boleto</button>
  </form>
);

describe('BoletoForm', () => {
  it('deve renderizar', () => {
    render(<BoletoForm onSubmit={vi.fn()} />);
    expect(screen.getByText('Gerar Boleto')).toBeInTheDocument();
  });
});
