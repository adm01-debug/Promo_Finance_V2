import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRouteMeta,
  getRouteLabel,
  resolveParentRoute,
  recordNavEntry,
  previousNavEntry,
  resetNavStack,
  subscribeNavStack,
  isSensitiveRoute,
} from '../navigation';

describe('getRouteMeta', () => {
  it('resolve rotas exatas', () => {
    expect(getRouteMeta('/contas-pagar')?.label).toBe('Contas a Pagar');
    expect(getRouteMeta('/tributario/sped')?.label).toBe('SPED');
  });

  it('resolve rotas com parâmetro', () => {
    expect(getRouteMeta('/reforma-tributaria/pis-cofins')?.label).toBe('Reforma Tributária');
    expect(getRouteMeta('/admin/insights-ia/anomalia/abc-123')?.label).toBe('Anomalia');
  });

  it('retorna undefined para rota desconhecida', () => {
    expect(getRouteMeta('/rota-inexistente')).toBeUndefined();
  });
});

describe('getRouteLabel', () => {
  it('usa o label do metadado', () => {
    expect(getRouteLabel('/clientes')).toBe('Clientes');
  });

  it('deriva label legível de rota desconhecida', () => {
    expect(getRouteLabel('/nova-feature-x')).toBe('Nova feature x');
  });
});

describe('resolveParentRoute', () => {
  it('usa parent explícito do metadado', () => {
    expect(resolveParentRoute('/usuarios')).toBe('/configuracoes');
    expect(resolveParentRoute('/contas-pagar/bloqueios')).toBe('/contas-pagar');
    expect(resolveParentRoute('/tributario/sped')).toBe('/tributario');
    expect(resolveParentRoute('/admin/sre')).toBe('/configuracoes');
  });

  it('sobe por strip de segmento até rota conhecida', () => {
    expect(resolveParentRoute('/clientes/portal-tokens')).toBe('/clientes');
  });

  it('rotas de topo caem no Dashboard', () => {
    expect(resolveParentRoute('/contas-pagar')).toBe('/');
    expect(resolveParentRoute('/expert')).toBe('/');
  });

  it('rota desconhecida sobe por segmento ou cai no Dashboard', () => {
    expect(resolveParentRoute('/desconhecida/profunda')).toBe('/');
    expect(resolveParentRoute('/')).toBe('/');
  });
});

describe('pilha de navegação in-app', () => {
  beforeEach(() => resetNavStack());

  it('PUSH empilha e POP trunca pela location.key', () => {
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    recordNavEntry({ key: 'b', pathname: '/clientes', search: '' }, 'PUSH');
    recordNavEntry({ key: 'c', pathname: '/fornecedores', search: '' }, 'PUSH');
    expect(previousNavEntry()?.pathname).toBe('/clientes');

    // Browser-back para 'b': a pilha trunca em 'b'
    recordNavEntry({ key: 'b', pathname: '/clientes', search: '' }, 'POP');
    expect(previousNavEntry()?.pathname).toBe('/');
  });

  it('REPLACE substitui o topo', () => {
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    recordNavEntry({ key: 'b', pathname: '/clientes', search: '' }, 'PUSH');
    recordNavEntry({ key: 'c', pathname: '/fornecedores', search: '' }, 'REPLACE');
    expect(previousNavEntry()?.pathname).toBe('/');
  });

  it('deduplica mesma location.key (StrictMode)', () => {
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    expect(previousNavEntry()).toBeUndefined();
  });

  it('POP para key desconhecida empilha (entrada direta)', () => {
    recordNavEntry({ key: 'a', pathname: '/clientes', search: '' }, 'PUSH');
    recordNavEntry({ key: 'x', pathname: '/fornecedores', search: '' }, 'POP');
    expect(previousNavEntry()?.pathname).toBe('/clientes');
  });
});

describe('pilha reativa e rotas sensíveis', () => {
  beforeEach(() => resetNavStack());

  it('notifica assinantes a cada mudança da pilha', () => {
    let calls = 0;
    const unsubscribe = subscribeNavStack(() => calls++);
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH'); // dedup não notifica
    recordNavEntry({ key: 'b', pathname: '/configuracoes', search: '' }, 'PUSH');
    unsubscribe();
    recordNavEntry({ key: 'c', pathname: '/clientes', search: '' }, 'PUSH');
    expect(calls).toBe(2);
  });

  it('identifica rotas com token no path', () => {
    expect(isSensitiveRoute('/contador/abc123')).toBe(true);
    expect(isSensitiveRoute('/convite/xyz')).toBe(true);
    expect(isSensitiveRoute('/clientes/portal-tokens')).toBe(false);
  });
});
