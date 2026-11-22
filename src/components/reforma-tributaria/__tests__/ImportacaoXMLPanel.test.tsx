import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useImportacaoXMLNFe } from '@/hooks/useImportacaoXMLNFe';
import { ImportacaoXMLPanel } from '../ImportacaoXMLPanel';

const nfeBase = {
  chaveAcesso: 'CH1',
  numero: '1',
  serie: '1',
  dataEmissao: new Date(2026, 6, 22, 10, 0, 0),
  cnpjEmitente: '12345678000199',
  nomeEmitente: 'Fornecedor',
  cnpjDestinatario: '99887766000155',
  valorTotal: 100,
  valorProdutos: 100,
  valorServicos: 0,
  baseCalculoICMS: 100,
  valorICMS: 18,
  cfop: '1102',
  naturezaOperacao: 'Compra',
  itens: [
    {
      codigo: 'X',
      descricao: 'Item',
      ncm: '02013000',
      cfop: '1102',
      quantidade: 1,
      valorUnitario: 100,
      valorTotal: 100,
      ibscbs: { cst: '200', cClassTrib: '200035' },
    },
  ],
  status: 'pendente' as const,
};

const mockHook = (nfes: (typeof nfeBase)[]) => {
  vi.mocked(useImportacaoXMLNFe).mockReturnValue({
    nfesParsed: nfes,
    isProcessando: false,
    progresso: 0,
    processarArquivos: vi.fn(),
    importarNFes: { mutate: vi.fn(), isPending: false } as never,
    limparArquivos: vi.fn(),
    removerNFe: vi.fn(),
  } as never);
};

vi.mock('@/hooks/useImportacaoXMLNFe', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useImportacaoXMLNFe')>()),
  useImportacaoXMLNFe: vi.fn(),
}));

describe('ImportacaoXMLPanel — etapa 47', () => {
  it('mostra CST, cClassTrib, vIBS e vCBS do XML', () => {
    mockHook([{ ...nfeBase, ibscbs: { vIBS: 12.5, vCBS: 9.1 } }] as never);
    render(<ImportacaoXMLPanel empresaId="e1" />);
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('200035')).toBeInTheDocument();
  });

  it('classifica 2026 como informativo', () => {
    mockHook([{ ...nfeBase, ibscbs: { vIBS: 12.5, vCBS: 9.1 } }] as never);
    render(<ImportacaoXMLPanel empresaId="e1" />);
    expect(screen.getByText('informativo 2026')).toBeInTheDocument();
  });

  it('classifica 2027 como apropriavel', () => {
    mockHook([
      {
        ...nfeBase,
        dataEmissao: new Date(2027, 2, 15, 10, 0, 0),
        ibscbs: { vIBS: 12.5, vCBS: 9.1 },
      },
    ] as never);
    render(<ImportacaoXMLPanel empresaId="e1" />);
    expect(screen.getByText('apropriável')).toBeInTheDocument();
  });

  it('marca nota sem grupo como sem grupo', () => {
    mockHook([nfeBase] as never);
    render(<ImportacaoXMLPanel empresaId="e1" />);
    expect(screen.getByText('sem grupo')).toBeInTheDocument();
  });
});
