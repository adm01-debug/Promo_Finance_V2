import { createContext, useContext } from 'react';
import type { UserEmpresaLink } from '@/hooks/useUserEmpresas';

export type ScopeMode = 'consolidated' | 'focused';

export interface EmpresaScopeContextValue {
  /** modo atual de visão */
  mode: ScopeMode;
  /**
   * IDs em escopo de SELEÇÃO (1+ no consolidated, exatamente 1 no focused).
   *
   * ATENÇÃO: `ids` NÃO agrega dados. Nenhum hook financeiro lê `ids`; todos
   * leem `currentEmpresaId`. Use `ids` apenas para escolher alvos de ação
   * (ex.: `EmpresaActionPicker` — "faturar por qual CNPJ?"). Exibir `ids` como
   * se os números somassem N empresas é o bug que a Etapa 27 corrigiu.
   */
  ids: string[];
  /** true quando mode === 'consolidated' E mais de 1 empresa selecionada */
  isConsolidated: boolean;
  /** Empresa cujos dados são de fato exibidos — a única fonte dos números. */
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
