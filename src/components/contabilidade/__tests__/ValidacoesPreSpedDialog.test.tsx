import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ValidacoesPreSpedDialog, type ValidacoesPreSpedArquivo } from '../ValidacoesPreSpedDialog';

function makeArquivo(overrides: Partial<ValidacoesPreSpedArquivo> = {}): ValidacoesPreSpedArquivo {
  return {
    tipo: 'ECD',
    ano_calendario: 2024,
    hash_sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    status: 'gerado',
    validacoes: { erros: [], avisos: [] },
    ...overrides,
  };
}

describe('ValidacoesPreSpedDialog — bloqueio de download por erros', () => {
  let onDownloadTxt: ReturnType<typeof vi.fn>;
  let onDownloadZip: ReturnType<typeof vi.fn>;
  let onOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDownloadTxt = vi.fn();
    onDownloadZip = vi.fn();
    onOpenChange = vi.fn();
  });

  it('desabilita .txt e .zip quando há erros em validacoes.erros', () => {
    render(
      <ValidacoesPreSpedDialog
        open
        onOpenChange={onOpenChange}
        arquivo={makeArquivo({
          status: 'rejeitado',
          validacoes: {
            erros: ['Lançamento 42 desbalanceado: D=R$100 ≠ C=R$90', 'Conta 3.1.01 sem código CFC'],
            avisos: ['Plano de contas com 3 contas inativas'],
          },
        })}
        onDownloadTxt={onDownloadTxt}
        onDownloadZip={onDownloadZip}
      />,
    );

    const btnTxt = screen.getByTestId('btn-download-txt');
    const btnZip = screen.getByTestId('btn-download-zip');

    expect(btnTxt).toBeDisabled();
    expect(btnZip).toBeDisabled();
    expect(btnTxt).toHaveAttribute('aria-disabled', 'true');
    expect(btnZip).toHaveAttribute('aria-disabled', 'true');

    // Banner de bloqueio visível
    expect(screen.getByTestId('banner-bloqueio')).toBeInTheDocument();
    expect(screen.getByText(/Arquivo rejeitado pela transmissão/i)).toBeInTheDocument();

    // Contadores corretos
    expect(screen.getByTestId('contador-erros')).toHaveTextContent('2');
    expect(screen.getByTestId('contador-avisos')).toHaveTextContent('1');

    // Lista de erros é renderizada (aba "Erros" é a default quando há erros)
    const lista = screen.getByTestId('lista-erros');
    expect(within(lista).getByText(/Lançamento 42 desbalanceado/)).toBeInTheDocument();
    expect(within(lista).getByText(/Conta 3.1.01 sem código CFC/)).toBeInTheDocument();

    // Cliques em botões desabilitados não disparam callbacks
    fireEvent.click(btnTxt);
    fireEvent.click(btnZip);
    expect(onDownloadTxt).not.toHaveBeenCalled();
    expect(onDownloadZip).not.toHaveBeenCalled();
  });

  it('habilita .txt e .zip quando validacoes.erros está vazio (mesmo com avisos)', () => {
    render(
      <ValidacoesPreSpedDialog
        open
        onOpenChange={onOpenChange}
        arquivo={makeArquivo({
          status: 'gerado',
          validacoes: {
            erros: [],
            avisos: ['Plano de contas com 3 contas inativas', 'Período tem feriados não conciliados'],
          },
        })}
        onDownloadTxt={onDownloadTxt}
        onDownloadZip={onDownloadZip}
      />,
    );

    const btnTxt = screen.getByTestId('btn-download-txt');
    const btnZip = screen.getByTestId('btn-download-zip');

    expect(btnTxt).toBeEnabled();
    expect(btnZip).toBeEnabled();

    // Banner de bloqueio NÃO aparece
    expect(screen.queryByTestId('banner-bloqueio')).not.toBeInTheDocument();

    // Cliques disparam callbacks
    fireEvent.click(btnZip);
    expect(onDownloadZip).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled(); // .zip não fecha o diálogo

    fireEvent.click(btnTxt);
    expect(onDownloadTxt).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false); // .txt fecha o diálogo
  });

  it('habilita downloads quando não há erros nem avisos', () => {
    render(
      <ValidacoesPreSpedDialog
        open
        onOpenChange={onOpenChange}
        arquivo={makeArquivo({ validacoes: { erros: [], avisos: [] } })}
        onDownloadTxt={onDownloadTxt}
        onDownloadZip={onDownloadZip}
      />,
    );

    expect(screen.getByTestId('btn-download-txt')).toBeEnabled();
    expect(screen.getByTestId('btn-download-zip')).toBeEnabled();
    expect(screen.getByTestId('contador-erros')).toHaveTextContent('0');
    expect(screen.getByTestId('contador-avisos')).toHaveTextContent('0');
  });

  it('não renderiza nada quando arquivo é null', () => {
    const { container } = render(
      <ValidacoesPreSpedDialog
        open
        onOpenChange={onOpenChange}
        arquivo={null}
        onDownloadTxt={onDownloadTxt}
        onDownloadZip={onDownloadZip}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
