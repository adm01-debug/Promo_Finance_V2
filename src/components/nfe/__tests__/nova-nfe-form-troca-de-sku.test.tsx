/**
 * Achados do Devin na PR #569: trocar o SKU do item carregava o NCM do produto
 * anterior (digitar `KIT-12` passa por `KIT-1` e herdava o NCM dele) e o NCM
 * digitado a mao era sobrescrito. Os dois casos sao dirigidos pela tela.
 *
 * A classificacao manual (escolha no seletor) e coberta em
 * `cclasstribManualAposTroca`, no teste de `lib/tributario/produtos`.
 */
import { describe, expect, it, vi } from 'vitest';
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

vi.mock('@/hooks/useCatalogoCclasstrib', () => ({
  useCatalogoCclasstrib: () => ({
    opcoes: [],
    codigos: new Set(['000001']),
    carregando: false,
    indisponivel: false,
  }),
}));

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

  it('marca o total de IBS/CBS como parcial quando um item fica sem referencia', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    expect(screen.queryByText(/^Parcial:/)).toBeNull();

    fireEvent.change(ncm(), { target: { value: '12345678' } });
    expect(screen.getByText(/Parcial: 1 item sem referencia no catalogo da RFB/)).toBeTruthy();
  });

  it('preserva o NCM digitado a mao', () => {
    render(<NovaNFeForm onClose={() => {}} />);

    digitarSku('KIT-1');
    fireEvent.change(ncm(), { target: { value: '84713012' } });

    digitarSku('KIT-12');
    expect(ncm().value).toBe('84713012');
  });
});
