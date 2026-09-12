import { useEffect, useRef, useState } from 'react';
import {
  INITIAL_FILTERS,
  type ConciliacaoFilterState,
} from '@/components/conciliacao/conciliacaoFiltersState';
import { carregarTransacoesBanco } from '@/lib/conciliacao-page-helpers';
import type { TransacaoExtrato } from './conciliacaoPage.types';

const FILTERS_STORAGE_KEY = 'conciliacao_filters';

function isFilterState(value: unknown): value is ConciliacaoFilterState {
  if (!value || typeof value !== 'object') return false;
  const filters = value as Record<string, unknown>;
  return (
    typeof filters.periodoInicio === 'string' &&
    typeof filters.periodoFim === 'string' &&
    typeof filters.valorMin === 'string' &&
    typeof filters.valorMax === 'string' &&
    ['todos', 'credito', 'debito'].includes(String(filters.tipo)) &&
    ['todos', 'alta', 'media', 'baixa'].includes(String(filters.confiancaIA)) &&
    typeof filters.centroCustoId === 'string'
  );
}

export function useFiltrosConciliacaoPersistidos() {
  const [filters, setFilters] = useState<ConciliacaoFilterState>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return isFilterState(parsed) ? parsed : INITIAL_FILTERS;
    } catch {
      return INITIAL_FILTERS;
    }
  });

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  return [filters, setFilters] as const;
}

export function useContaBancariaSelecionada(currentBankAccountId: string | null | undefined) {
  const [selectedBanco, setSelectedBanco] = useState(currentBankAccountId || '');
  const bancoGlobalAnterior = useRef(currentBankAccountId);

  useEffect(() => {
    const bancoAnterior = bancoGlobalAnterior.current;
    bancoGlobalAnterior.current = currentBankAccountId;

    // `undefined` significa que o filtro global ainda não foi carregado. Já
    // `null` é uma remoção explícita e deve limpar a seleção local anterior.
    if (currentBankAccountId === undefined || bancoAnterior === currentBankAccountId) return;

    setSelectedBanco(currentBankAccountId ?? '');
  }, [currentBankAccountId]);

  return [selectedBanco, setSelectedBanco] as const;
}

export function useTransacoesBancariasSelecionadas(selectedBanco: string) {
  const [transacoes, setTransacoes] = useState<TransacaoExtrato[]>([]);

  useEffect(() => {
    let consultaAtiva = true;
    setTransacoes([]);

    if (!selectedBanco) {
      return () => {
        consultaAtiva = false;
      };
    }

    carregarTransacoesBanco(selectedBanco).then((rows) => {
      if (consultaAtiva && rows) setTransacoes(rows);
    });

    return () => {
      consultaAtiva = false;
    };
  }, [selectedBanco]);

  return [transacoes, setTransacoes] as const;
}
