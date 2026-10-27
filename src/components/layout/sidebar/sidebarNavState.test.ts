import { describe, expect, it } from 'vitest';
import { isSidebarNavItemActive } from './sidebarNavState';

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
