import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const ClienteForm = ({ onSubmit }: any) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    <input name="nome" placeholder="Nome do Cliente" />
    <input name="cpf_cnpj" placeholder="CPF/CNPJ" />
    <input name="email" type="email" placeholder="E-mail" />
    <button type="submit">Salvar Cliente</button>
  </form>
);

describe('ClienteForm', () => {
  it('deve renderizar campos do cliente', () => {
    render(<ClienteForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Nome do Cliente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('CPF/CNPJ')).toBeInTheDocument();
  });

  it('deve submeter dados', async () => {
    const onSubmit = vi.fn();
    render(<ClienteForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('Salvar Cliente'));
    expect(onSubmit).toHaveBeenCalled();
  });
});
