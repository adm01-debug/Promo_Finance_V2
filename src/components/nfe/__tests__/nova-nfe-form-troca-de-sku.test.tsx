/**
 * Achados do Devin na PR #569: trocar o SKU do item carregava o NCM do produto
 * anterior (digitar `KIT-12` passa por `KIT-1` e herdava o NCM dele) e o NCM
 * digitado a mao era sobrescrito. Os dois casos sao dirigidos pela tela.
 *
 * A classificacao manual (escolha no seletor) e coberta em
 * `cclasstribManualAposTroca`, no teste de `lib/tributario/produtos`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { resolverPadraoPorCodigo } from '@/lib/tributario/produtos/cclasstrib-padrao';
import { NovaNFeForm } from '../NovaNFeForm';

vi.mock('@/hooks/useFinancialData', () => ({
  useEmpresas: () => ({ data: [] }),
}));

const PADROES = [
  {
    produto_id: '1',
    codigo: 'KIT-1',
    ncm: '12345678',
    cst: '200',
    cclasstrib: '200032',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
  {
    produto_id: '2',
    codigo: 'KIT-12',
    ncm: '39269090',
    cst: '200',
    cclasstrib: '200032',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
];

vi.mock('@/hooks/useProdutoCclasstribPadrao', () => ({
  useProdutoCclasstribPadrao: () => ({
    padroes: PADROES,
    porCodigo: (codigo?: string | null) => resolverPadraoPorCodigo(PADROES, codigo),
  }),
}));

interface OpcaoCatalogo {
  cst: string;
  cclasstrib: string;
  descricao: string;
  vigencia_inicio: string;
}

// Mesma regra do hook real: `codigos` e derivado das `opcoes`, nunca um set a
// parte. Catalogo vazio = nenhum cClassTrib disponivel para a regra por NCM.
const catalogo = vi.hoisted(() => ({ opcoes: [] as OpcaoCatalogo[] }));

vi.mock('@/hooks/useCatalogoCclasstrib', () => ({
  useCatalogoCclasstrib: () => ({
    opcoes: catalogo.opcoes,
    codigos: new Set(catalogo.opcoes.map((opcao) => opcao.cclasstrib)),
    carregando: false,
    indisponivel: false,
  }),
}));

beforeEach(() => {
  catalogo.opcoes = [];
});

const campo = (placeholder: string) => screen.getByPlaceholderText(placeholder) as HTMLInputElement;
const sku = () => campo('SKU');
const ncm = () => campo('00000000');

const digitarSku = (valor: string) => fireEvent.change(sku(), { target: { value: valor } });

describe('NovaNFeForm ao trocar de SKU', () => {
  it('troca o NCM herdado do SKU anterior pelo NCM do SKU novo', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    expect(ncm().value).toBe('12345678');

    digitarSku('KIT-12');
    expect(ncm().value).toBe('39269090');
  });

  it('limpa o NCM herdado quando o SKU novo nao tem padrao', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    expect(ncm().value).toBe('12345678');

    digitarSku('AVULSO');
    expect(ncm().value).toBe('');
  });

  it('marca o total de IBS/CBS como parcial quando o padrao do SKU nao esta no catalogo', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    expect(screen.queryByText(/^Parcial:/)).toBeNull();

    // Catalogo vazio (carga da RFB pendente): o padrao salvo do SKU (200/200032)
    // nao tem linha no catalogo, entao o item nao consegue ser enquadrado.
    digitarSku('KIT-1');
    expect(ncm().value).toBe('12345678');
    expect(screen.getByText(/Parcial: 1 item sem referencia no catalogo da RFB/)).toBeTruthy();
  });

  it('nao marca o total como parcial quando o catalogo tem o cClassTrib do padrao', () => {
    catalogo.opcoes = [
      { cst: '200', cclasstrib: '200032', descricao: 'tributado', vigencia_inicio: '2026-01-01' },
    ];
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    expect(screen.queryByText(/^Parcial:/)).toBeNull();
  });

  it('preserva o NCM digitado a mao', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    fireEvent.change(ncm(), { target: { value: '84713012' } });

    digitarSku('KIT-12');
    expect(ncm().value).toBe('84713012');
  });
});
