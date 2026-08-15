import { createContext, useContext } from 'react';
import type { UserEmpresaLink } from '@/hooks/useUserEmpresas';

export type ScopeMode = 'consolidated' | 'focused';

export interface EmpresaScopeContextValue {
  /** modo atual de visão */
  mode: ScopeMode;
  /** IDs de empresas atualmente em escopo (1+ no consolidated, exatamente 1 no focused) */
  ids: string[];
  /** true quando mode === 'consolidated' E mais de 1 empresa selecionada */
  isConsolidated: boolean;
  /** Empresa focada (modo focused) ou primeira selecionada (modo consolidated) */
  currentEmpresaId: string | null;
  /** Vínculos completos do usuário (todas empresas disponíveis) */
  availableEmpresas: UserEmpresaLink[];
  /** Vínculos atualmente em escopo */
  scopedEmpresas: UserEmpresaLink[];
  /** true enquanto os vínculos estão carregando */
  isLoading: boolean;

  // Ações
  setMode: (mode: ScopeMode) => void;
  toggleEmpresa: (empresaId: string) => void;
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  focusEmpresa: (empresaId: string) => void;
}

export const EmpresaScopeContext = createContext<EmpresaScopeContextValue | null>(null);

export function useEmpresaScope(): EmpresaScopeContextValue {
  const ctx = useContext(EmpresaScopeContext);
  if (!ctx) {
    throw new Error('useEmpresaScope deve ser usado dentro de <EmpresaScopeProvider>');
  }
  return ctx;
}
