/**
 * Achado do Devin na PR #425: além da edge function, a própria tela tinha um
 * caminho de extrato fabricado — Conciliação → Importar Extrato → Open Finance
 * fingia uma conexão de 3s e inventava três transações ('SYNC: RECEBIMENTO PIX
 * CLIENTE A', 'SYNC: PAGAMENTO FORNECEDOR B', 'SYNC: TARIFA BANCARIA') mais um
 * saldo final de R$ 15.420,50, já pré-selecionadas. Confirmar levava tudo para
 * `transacoes_bancarias`. Este era o caminho alcançável por clique.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

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
}));

import { ImportarExtratoDialogArquivoLocal } from '../ImportarExtratoDialogArquivoLocal';

function renderAba() {
  return render(
    <ImportarExtratoDialogArquivoLocal
      activeTab="open-finance"
      setActiveTab={vi.fn()}
      dragActive={false}
      handleDrag={vi.fn()}
      handleDrop={vi.fn()}
      handleFileSelect={vi.fn()}
      handleOpenFinanceConnect={vi.fn()}
    />
  );
}

describe('importar extrato não oferece Open Finance fabricado (#425)', () => {
  it('o botão Conectar via Open Finance fica desabilitado com o motivo à mostra', () => {
    renderAba();
    const botao = screen.getByRole('button', { name: /Conectar via Open Finance/i });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('title', expect.stringContaining('não homologada'));
  });

  it('o texto não promete sincronização em tempo real nem gateway inexistente', () => {
    renderAba();
    expect(screen.queryByText(/Sincronize transações em tempo real/i)).toBeNull();
    expect(screen.queryByText(/Powered by Lovable Gateway Open Banking/i)).toBeNull();
    expect(screen.getByText(/ainda não foi homologada/i)).toBeInTheDocument();
  });
});
