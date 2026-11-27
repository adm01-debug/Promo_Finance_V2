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
import { crtDoRegime, totaisDaNota } from '@/lib/nfe/pre-validacao-nota';
import { formatCurrency } from '@/lib/formatters';
import { NovaNFeForm } from '../NovaNFeForm';
import type { ItemNFe } from '../nfe-types';

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
const campoDoItem = (rotulo: string) => screen.getByLabelText(rotulo) as HTMLInputElement;
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
    // Nao basta o aviso sumir: o item tem que ficar com o codigo do padrao.
    expect(screen.getAllByText(/200032/).length).toBeGreaterThan(0);
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

describe('NovaNFeForm: pre-validacao do grupo IBS/CBS', () => {
  it('lista o cClassTrib do padrao do SKU quando ele nao existe no catalogo vigente', () => {
    // Catalogo carregado, mas sem o codigo que o padrao do SKU carrega: o item
    // enquadra em 200032 e o catalogo so conhece 000001.
    catalogo.opcoes = [
      { cst: '000', cclasstrib: '000001', descricao: 'padrao', vigencia_inicio: '2026-01-01' },
    ];
    render(<NovaNFeForm onClose={() => {}} />);

    expect(screen.queryByText(/Pré-validação do grupo IBS\/CBS/)).toBeNull();

    digitarSku('KIT-1');
    expect(screen.getByText(/Pré-validação do grupo IBS\/CBS/)).toBeTruthy();
    expect(screen.getByText(/200032 não existe no catálogo vigente/)).toBeTruthy();
  });
});

describe('NovaNFeForm: totais do grupo e CRT do emitente', () => {
  const item = (extra: Partial<ItemNFe>): ItemNFe => ({
    codigo: 'KIT-1',
    descricao: 'Item',
    ncm: '12345678',
    cfop: '5102',
    unidade: 'UN',
    quantidade: 1,
    valorUnitario: 100,
    valorTotal: 100,
    ...extra,
  });

  it('soma os totais do grupo a partir dos itens enquadrados', () => {
    expect(
      totaisDaNota([
        item({ cstIbsCbs: '200', vIBSUF: 5.65, vIBSMun: 5, vCBS: 9 }),
        item({ codigo: 'KIT-2', cstIbsCbs: '200', vIBSUF: 0.05, vIBSMun: 0.05, vCBS: 0.9 }),
        item({ codigo: 'SEM-GRUPO' }),
      ])
    ).toEqual({ vIBS: 10.75, vCBS: 9.9 });
  });

  it('usa vIBSUF + vIBSMun quando o item nao traz o total de IBS', () => {
    expect(totaisDaNota([item({ cstIbsCbs: '200', vIBSUF: 5.66, vIBSMun: 5.01 })])).toEqual({
      vIBS: 10.67,
      vCBS: 0,
    });
  });

  it('nao informa totais quando nenhum item tem grupo', () => {
    expect(totaisDaNota([item({})])).toBeUndefined();
  });

  it('mapeia Lucro Arbitrado para CRT 3', () => {
    expect(crtDoRegime('arbitrado')).toBe(3);
    expect(crtDoRegime('lucro_presumido')).toBe(3);
    expect(crtDoRegime('lucro_real')).toBe(3);
    expect(crtDoRegime('simples_nacional')).toBe(1);
    expect(crtDoRegime('mei')).toBeUndefined();
    expect(crtDoRegime(null)).toBeUndefined();
  });

  it('nao acusa total ausente nem divergencia 1091 com o item enquadrado e valorizado', () => {
    catalogo.opcoes = [
      { cst: '200', cclasstrib: '200032', descricao: 'tributado', vigencia_inicio: '2026-01-01' },
    ];
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    // Sem valor unitario a base do item fica zerada e as duas guardas de total
    // passariam por vacuidade (0 = soma de itens sem grupo). 2 x 100 fixa base
    // tributavel de 200 para o item enquadrado.
    fireEvent.change(campoDoItem('Quantidade'), { target: { value: '2' } });
    fireEvent.change(campoDoItem('Valor Unitário'), { target: { value: '100' } });

    // Vacuidade descartada: o item destacou IBS/CBS sobre a base informada.
    expect(campoDoItem('CBS + IBS').value).not.toBe(formatCurrency(0));

    // A tela nao tem campo de totais: o total da nota sai da soma dos itens, entao
    // nem o aviso de total ausente nem a divergencia 1091 podem aparecer.
    expect(screen.queryByText(/não informa os totais/)).toBeNull();
    expect(screen.queryByText(/difere da soma dos itens/)).toBeNull();
  });
});
