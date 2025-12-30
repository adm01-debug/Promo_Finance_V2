import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

const ContaPagarForm = ({ onSubmit }: any) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    <input name="descricao" placeholder="Descrição" />
    <input name="valor" type="number" placeholder="Valor" />
    <input name="vencimento" type="date" />
    <button type="submit">Salvar</button>
  </form>
);

describe('ContaPagarForm', () => {
  it('deve renderizar campos', () => {
    render(<ContaPagarForm onSubmit={vi.fn()} />);
    
    expect(screen.getByPlaceholderText('Descrição')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Valor')).toBeInTheDocument();
  });

  it('deve submeter formulário', async () => {
    const onSubmit = vi.fn();
    render(<ContaPagarForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByPlaceholderText('Descrição'), 'Teste');
    await userEvent.type(screen.getByPlaceholderText('Valor'), '1000');
    await userEvent.click(screen.getByText('Salvar'));
    
    expect(onSubmit).toHaveBeenCalled();
  });
});
