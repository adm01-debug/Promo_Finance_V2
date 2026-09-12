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
});
