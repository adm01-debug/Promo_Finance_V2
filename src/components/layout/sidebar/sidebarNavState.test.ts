import { describe, expect, it } from 'vitest';
import { isSidebarNavItemActive, sidebarNavItemAriaCurrent } from './sidebarNavState';

describe('isSidebarNavItemActive', () => {
  it('exige hash correspondente quando o link aponta para uma âncora', () => {
    expect(
      isSidebarNavItemActive('/inteligencia#alertas-preditivos', {
        pathname: '/inteligencia',
        hash: '#alertas-preditivos',
      })
    ).toBe(true);
    expect(
      isSidebarNavItemActive('/inteligencia#alertas-preditivos', {
        pathname: '/inteligencia',
        hash: '#action-matrix',
      })
    ).toBe(false);
  });

  it('mantém rotas sem hash ativas no mesmo pathname', () => {
    expect(
      isSidebarNavItemActive('/inteligencia', { pathname: '/inteligencia', hash: '#qualquer' })
    ).toBe(true);
  });

  it('mantém o item-pai ativo em rotas filhas (detalhe/edição)', () => {
    expect(
      isSidebarNavItemActive('/contas-pagar', { pathname: '/contas-pagar/123', hash: '' })
    ).toBe(true);
    expect(isSidebarNavItemActive('/contas-pagar', { pathname: '/contas-receber', hash: '' })).toBe(
      false
    );
  });

  it('não marca tudo com href só-âncora ou raiz', () => {
    expect(isSidebarNavItemActive('#topo', { pathname: '/inteligencia', hash: '' })).toBe(false);
    expect(isSidebarNavItemActive('/', { pathname: '/inteligencia', hash: '' })).toBe(false);
    expect(isSidebarNavItemActive('/', { pathname: '/', hash: '' })).toBe(true);
  });
});

describe('sidebarNavItemAriaCurrent', () => {
  it('anuncia page só no match exato do pathname', () => {
    expect(
      sidebarNavItemAriaCurrent('/clientes/scoring', { pathname: '/clientes/scoring', hash: '' })
    ).toBe('page');
    // Item-pai ativo por prefixo NÃO é a página atual — vira 'location'.
    expect(
      sidebarNavItemAriaCurrent('/clientes', { pathname: '/clientes/scoring', hash: '' })
    ).toBe('location');
    // Item não relacionado continua sem aria-current.
    expect(
      sidebarNavItemAriaCurrent('/fornecedores', { pathname: '/clientes/scoring', hash: '' })
    ).toBeUndefined();
  });

  it('âncora correspondente anuncia location, nunca page', () => {
    expect(
      sidebarNavItemAriaCurrent('/inteligencia#alertas-preditivos', {
        pathname: '/inteligencia',
        hash: '#alertas-preditivos',
      })
    ).toBe('location');
    expect(
      sidebarNavItemAriaCurrent('/inteligencia#alertas-preditivos', {
        pathname: '/inteligencia',
        hash: '#outra',
      })
    ).toBeUndefined();
  });

  it('mantém um único aria-current=page por rota', () => {
    const loc = { pathname: '/configuracoes/preferencias', hash: '' };
    const correntes = ['/configuracoes', '/configuracoes/preferencias', '/usuarios'].map((href) =>
      sidebarNavItemAriaCurrent(href, loc)
    );
    expect(correntes.filter((c) => c === 'page')).toHaveLength(1);
  });
});
