/**
 * FINANCE HUB - Hook para Filtros Salvos
 * 
 * @module hooks/useSavedFilters
 * @description Gerencia filtros salvos localmente (sem banco)
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}

interface SaveFilterInput {
  name: string;
  filters: Record<string, unknown>;
  is_default?: boolean;
}

// ============================================
// HOOK (Local Storage based)
// ============================================

export function useSavedFilters(entityType: string) {
  const storageKey = `saved-filters-${entityType}`;
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar filtros do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setFilters(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Erro ao carregar filtros salvos:', e);
    }
    setIsLoading(false);
  }, [storageKey]);

  // Persistir no localStorage
  const persist = useCallback((newFilters: SavedFilter[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newFilters));
    setFilters(newFilters);
  }, [storageKey]);

  // Obter filtro padrão
  const defaultFilter = filters.find(f => f.is_default);

  // Salvar novo filtro
  const saveFilter = useCallback((input: SaveFilterInput) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: input.name,
      filters: input.filters,
      is_default: input.is_default ?? false,
      created_at: new Date().toISOString(),
    };

    let newFilters = [...filters];
    
    // Se marcado como padrão, remove padrão dos outros
    if (input.is_default) {
      newFilters = newFilters.map(f => ({ ...f, is_default: false }));
    }

    newFilters.unshift(newFilter);
    persist(newFilters);
    toast.success('Filtro salvo com sucesso!');
  }, [filters, persist]);

  // Atualizar filtro
  const updateFilter = useCallback(({ id, ...input }: SaveFilterInput & { id: string }) => {
    const newFilters = filters.map(f => 
      f.id === id ? { ...f, ...input } : f
    );
    persist(newFilters);
    toast.success('Filtro atualizado!');
  }, [filters, persist]);

  // Deletar filtro
  const deleteFilter = useCallback((id: string) => {
    const newFilters = filters.filter(f => f.id !== id);
    persist(newFilters);
    toast.success('Filtro removido');
  }, [filters, persist]);

  // Definir como padrão
  const setDefault = useCallback((id: string) => {
    const newFilters = filters.map(f => ({
      ...f,
      is_default: f.id === id,
    }));
    persist(newFilters);
    toast.success('Filtro padrão definido');
  }, [filters, persist]);

  return {
    filters,
    isLoading,
    defaultFilter,
    saveFilter,
    updateFilter,
    deleteFilter,
    setDefault,
    isSaving: false,
  };
}

export default useSavedFilters;
