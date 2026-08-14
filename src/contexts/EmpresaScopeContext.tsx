/**
 * EmpresaScopeContext — Escopo multi-empresa do grupo econômico.
 *
 * Substitui o modelo "uma empresa ativa por vez" por:
 *  - scopeMode 'consolidated': usuário vê dados de várias empresas ao mesmo tempo
 *  - scopeMode 'focused':      usuário foca em UMA empresa (similar ao legado)
 *
 * Retrocompatibilidade: expõe `currentEmpresaId` derivado
 * (focusedEmpresaId quando focused, primeiro selecionado quando consolidated)
 * e mantém o mesmo localStorage key usado pelo `getCurrentEmpresaId()` legado,
 * de modo que hooks ainda não migrados continuam funcionando.
 */
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import { EmpresaScopeContext, type ScopeMode, type EmpresaScopeContextValue } from './useEmpresaScope';

const LEGACY_KEY = 'pf:current-empresa-id';
const SCOPE_KEY = 'pf:empresa-scope-v1';

interface PersistedScope {
  mode: ScopeMode;
  selectedIds: string[];
  focusedId: string | null;
}

function loadPersisted(): PersistedScope | null {
  try {
    const raw = localStorage.getItem(SCOPE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedScope>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      mode: parsed.mode === 'focused' ? 'focused' : 'consolidated',
      selectedIds: Array.isArray(parsed.selectedIds) ? parsed.selectedIds.filter((x): x is string => typeof x === 'string') : [],
      focusedId: typeof parsed.focusedId === 'string' ? parsed.focusedId : null,
    };
  } catch {
    return null;
  }
}

function persist(state: PersistedScope) {
  try {
    localStorage.setItem(SCOPE_KEY, JSON.stringify(state));
  } catch {
    /* storage indisponível – ignorar */
  }
}

function syncLegacyKey(currentId: string | null) {
  try {
    if (currentId) localStorage.setItem(LEGACY_KEY, currentId);
    else localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
export function EmpresaScopeProvider({ children }: { children: ReactNode }) {
  const { data: vinculos = [], isLoading } = useUserEmpresas();

  const [mode, setModeState] = useState<ScopeMode>(() => loadPersisted()?.mode ?? 'consolidated');
  const [selectedIds, setSelectedIdsState] = useState<string[]>(() => loadPersisted()?.selectedIds ?? []);
  const [focusedId, setFocusedIdState] = useState<string | null>(() => {
    const persisted = loadPersisted();
    if (persisted?.focusedId) return persisted.focusedId;
    // fallback: ID legado salvo pelo EmpresaSwitcher antigo
    try {
      return localStorage.getItem(LEGACY_KEY);
    } catch {
      return null;
    }
  });

  // Reconciliação quando os vínculos chegam: garantir que IDs em escopo são válidos
  useEffect(() => {
    if (isLoading || vinculos.length === 0) return;
    const validIds = new Set(vinculos.map((v) => v.empresa_id));

    setSelectedIdsState((prev) => {
      const filtered = prev.filter((id) => validIds.has(id));
      // Se vazio, seleciona todas (default consolidado)
      if (filtered.length === 0) return vinculos.map((v) => v.empresa_id);
      return filtered;
    });

    setFocusedIdState((prev) => {
      if (prev && validIds.has(prev)) return prev;
      // fallback: empresa padrão ou primeira
      const def = vinculos.find((v) => v.is_default) ?? vinculos[0];
      return def?.empresa_id ?? null;
    });
  }, [vinculos, isLoading]);

  // Persistência
  useEffect(() => {
    persist({ mode, selectedIds, focusedId });
  }, [mode, selectedIds, focusedId]);

  // Valor derivado: IDs em escopo de fato
  const ids = useMemo(
    () => (mode === 'focused' && focusedId ? [focusedId] : selectedIds),
    [mode, focusedId, selectedIds],
  );

  const currentEmpresaId = useMemo(
    () => (mode === 'focused' ? focusedId : ids[0] ?? null),
    [mode, focusedId, ids],
  );

  // Sincroniza chave legada para hooks ainda não migrados
  useEffect(() => {
    syncLegacyKey(currentEmpresaId);
  }, [currentEmpresaId]);

  const scopedEmpresas = useMemo(
    () => vinculos.filter((v) => ids.includes(v.empresa_id)),
    [vinculos, ids],
  );

  const setMode = useCallback((next: ScopeMode) => {
    setModeState(next);
  }, []);

  const setSelectedIds = useCallback((next: string[]) => {
    setSelectedIdsState(Array.from(new Set(next)));
  }, []);

  const toggleEmpresa = useCallback((empresaId: string) => {
    setSelectedIdsState((prev) => {
      if (prev.includes(empresaId)) {
        // Guarda: nunca permitir escopo vazio — bloqueia desmarcar a última.
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== empresaId);
      }
      return [...prev, empresaId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIdsState(vinculos.map((v) => v.empresa_id));
  }, [vinculos]);

  const focusEmpresa = useCallback((empresaId: string) => {
    setFocusedIdState(empresaId);
    setModeState('focused');
  }, []);

  const value: EmpresaScopeContextValue = {
    mode,
    ids,
    isConsolidated: mode === 'consolidated' && ids.length > 1,
    currentEmpresaId,
    availableEmpresas: vinculos,
    scopedEmpresas,
    isLoading,
    setMode,
    toggleEmpresa,
    setSelectedIds,
    selectAll,
    focusEmpresa,
  };

  return <EmpresaScopeContext.Provider value={value}>{children}</EmpresaScopeContext.Provider>;
}
