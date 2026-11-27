// Etapa 86: o SKU compartilhado so pode ser unificado numa gravacao (um
// upsert), e produtos com NCM diferente nao podem ser unificados.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  salvar: vi.fn(),
  salvarVarios: vi.fn(),
  remover: vi.fn(),
  padroes: [] as Array<Record<string, unknown>>,
  porProduto: new Map<string, unknown>(),
}));

vi.mock('@/hooks/useProdutoCclasstribPadrao', () => ({
  useProdutoCclasstribPadrao: () => ({
    padroes: mocks.padroes,
    porProduto: mocks.porProduto,
    porCodigo: new Map(),
    isLoading: false,
  }),
  useProdutoCclasstribPadraoMutations: () => ({
    salvar: { mutate: mocks.salvar, isPending: false },
    salvarVarios: { mutate: mocks.salvarVarios, isPending: false },
    remover: { mutate: mocks.remover, isPending: false },
  }),
}));

vi.mock('@/hooks/useCatalogoCclasstrib', () => ({
  useClassificacaoTributaria: () => ({
    opcoes: [],
    fundamentos: new Map(),
    carregando: false,
    indisponivel: true,
    offline: false,
    offlineGravadoEm: undefined,
  }),
}));

vi.mock('@/hooks/bling/useProdutos', () => ({
  useBlingProdutoDetail: () => ({ data: undefined }),
}));

import { ProdutoCclasstribDialog } from '../ProdutoCclasstribDialog';

const sku = 'KIT-01';

const vizinho = (produto_id: string, cst: string, cclasstrib: string, ncm = '12345678') => ({
  produto_id,
  codigo: sku,
  cst,
  cclasstrib,
  ncm,
  atualizado_em: new Date(2026, 10, 26).toISOString(),
});

function montar(extras: Array<Record<string, unknown>>) {
  mocks.padroes = extras;
  // Referencia estavel: o efeito do dialogo depende de `porProduto` e zeraria
  // CST/cClassTrib a cada render se o mock criasse um Map novo.
  mocks.porProduto = new Map(extras.map((p) => [String(p.produto_id), p]));
  return render(
    <ProdutoCclasstribDialog
      produto={{ id: 900, nome: 'Kit', codigo: sku, ncm: '12345678' }}
      aberto
      onFechar={() => {}}
    />
  );
}

function digitarEnquadramento(cst: string, cclasstrib: string) {
  fireEvent.change(screen.getByLabelText('CST IBS/CBS'), { target: { value: cst } });
  fireEvent.change(screen.getByLabelText('cClassTrib'), { target: { value: cclasstrib } });
}

describe('ProdutoCclasstribDialog - SKU compartilhado', () => {
  beforeEach(() => {
    mocks.salvar.mockClear();
    mocks.salvarVarios.mockClear();
    mocks.remover.mockClear();
  });

  it('grava o enquadramento dos tres produtos do SKU numa unica chamada', () => {
    montar([vizinho('456', '200', '200032'), vizinho('457', '200', '200032')]);
    digitarEnquadramento('102', '000001');

    const botao = screen.getByRole('button', { name: /Aplicar aos 3 produtos/ });
    fireEvent.click(botao);

    expect(mocks.salvarVarios).toHaveBeenCalledTimes(1);
    expect(mocks.salvar).not.toHaveBeenCalled();
    const [entradas] = mocks.salvarVarios.mock.calls[0];
    expect(entradas).toHaveLength(3);
    expect(entradas.map((e: { produto_id: string }) => e.produto_id)).toEqual([
      '900',
      '456',
      '457',
    ]);
    for (const entrada of entradas) {
      expect(entrada.cst).toBe('102');
      expect(entrada.cclasstrib).toBe('000001');
      expect(entrada.codigo).toBe(sku);
    }
  });

  it('bloqueia a unificacao quando um produto do SKU tem NCM diferente', () => {
    montar([vizinho('456', '200', '200032'), vizinho('457', '200', '200032', '99999999')]);
    digitarEnquadramento('102', '000001');

    expect(screen.queryByRole('button', { name: /Aplicar aos/ })).toBeNull();
    expect(screen.getByText(/unifique o enquadramento de todos ou separe os SKUs/)).toBeTruthy();

    const salvar = screen.getByRole('button', { name: /Salvar padrao/ });
    expect(salvar).toBeDisabled();
    fireEvent.click(salvar);
    expect(mocks.salvar).not.toHaveBeenCalled();
    expect(mocks.salvarVarios).not.toHaveBeenCalled();
  });
});
