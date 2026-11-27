import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GestorCreditosTributarios } from '../GestorCreditosTributarios';

const { mockUseCreditos, mockEmpresas } = vi.hoisted(() => ({
  mockUseCreditos: vi.fn(),
  // Lista viva: o mock de `useAllEmpresas` devolve este objeto, então cada teste
  // pode trocar as empresas sem remontar o módulo.
  mockEmpresas: { data: [] as { id: string; nome: string }[] },
}));

vi.mock('@/hooks/useCreditosTributarios', () => ({
  useCreditosTributarios: mockUseCreditos,
}));
vi.mock('@/hooks/useEmpresas', () => ({
  useAllEmpresas: () => mockEmpresas,
}));
vi.mock('../NaoCumulatividadeInfoCard', () => ({
  NaoCumulatividadeInfoCard: () => null,
}));

const credito = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  empresa_id: 'emp-1',
  tipo_tributo: 'CBS',
  valor_credito: 1000,
  valor_utilizado: 0,
  saldo_disponivel: 0,
  data_origem: '2026-07-22',
  competencia_origem: '2026-07',
  status: 'disponivel',
  origem: 'estimado',
  efeito_tributario: false,
  ano_fato_gerador: 2026,
  documento_tipo: 'nfe',
  documento_numero: '123',
  fornecedor_nome: 'Fornecedor XZ',
  ...over,
});

const monta = (lista: Record<string, unknown>[]) =>
  mockUseCreditos.mockReturnValue({ creditos: lista, isLoading: false });

describe('GestorCreditosTributarios - coluna Disponível (etapa 48/88)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmpresas.data = [{ id: 'emp-1', nome: 'Empresa' }];
  });

  it('crédito informativo não exibe saldo disponível na linha', () => {
    // Antes a coluna fazia valor_credito - valor_utilizado para toda linha:
    // um crédito de 2026 (informativo) aparecia como R$ 1.000 disponível,
    // valor que o usuário não pode apropriar.
    monta([credito()]);
    render(<GestorCreditosTributarios />);
    const linhas = screen
      .getAllByText('Fornecedor XZ')
      .map((el) => el.closest('tr') as HTMLElement);
    // Coluna 7 (índice 6) é Disponível: Valor Total continua exibindo 1.000.
    for (const linha of linhas) {
      const tds = linha.querySelectorAll('td');
      const disponivel = tds[tds.length - 3];
      expect(disponivel.textContent).toBe('-');
    }
  });

  it('crédito apropriável exibe o saldo na linha', () => {
    monta([credito({ origem: 'xml_destacado', efeito_tributario: true, ano_fato_gerador: 2027 })]);
    render(<GestorCreditosTributarios />);
    const linhas = screen
      .getAllByText('Fornecedor XZ')
      .map((el) => el.closest('tr') as HTMLElement);
    expect(
      linhas.some((l) => {
        const tds = l.querySelectorAll('td');
        return tds[tds.length - 3]?.textContent?.includes('1.000');
      })
    ).toBe(true);
  });

  it('busca os créditos da empresa informada pelo painel, não da primeira da lista', () => {
    // A aba abria sempre em `empresas[0]` (ordem por razão social): o PDF gerado
    // para a Beta mandava o leitor para uma aba com os documentos da Alfa.
    mockEmpresas.data = [
      { id: 'emp-alfa', nome: 'Alfa' },
      { id: 'emp-beta', nome: 'Beta' },
    ];
    monta([credito()]);
    render(<GestorCreditosTributarios empresaId="emp-beta" />);

    expect(mockUseCreditos).toHaveBeenCalledWith('emp-beta');
  });

  it('sem empresa informada continua usando a primeira da lista', () => {
    mockEmpresas.data = [
      { id: 'emp-alfa', nome: 'Alfa' },
      { id: 'emp-beta', nome: 'Beta' },
    ];
    monta([credito()]);
    render(<GestorCreditosTributarios />);

    expect(mockUseCreditos).toHaveBeenCalledWith('emp-alfa');
  });
});
