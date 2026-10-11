import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useUrlTab } from '../useUrlTab';

const TABS = ['geral', 'avancado'] as const;

function setup(initial: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => {
      const [tab, setTab] = useUrlTab('geral', TABS);
      const location = useLocation();
      return { tab, setTab, search: location.search };
    },
    { wrapper }
  );
}

describe('useUrlTab', () => {
  it('usa a aba da URL quando válida', () => {
    const { result } = setup('/x?tab=avancado');
    expect(result.current.tab).toBe('avancado');
  });

  it('cai na aba padrão quando o valor da URL é inválido', () => {
    const { result } = setup('/x?tab=inexistente');
    expect(result.current.tab).toBe('geral');
  });

  it('grava a aba na URL e remove o parâmetro na aba padrão', () => {
    const { result } = setup('/x?foo=1');
    act(() => result.current.setTab('avancado'));
    expect(result.current.search).toBe('?foo=1&tab=avancado');
    act(() => result.current.setTab('geral'));
    expect(result.current.search).toBe('?foo=1');
  });
});
