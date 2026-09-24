import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TransacaoExtrato } from './conciliacaoPage.types';

/**
 * Ações destrutivas de "ignorar transação" (individual e em lote) da tela de
 * Conciliação — extraídas de `useConciliacaoPage` para manter esse hook sob
 * o limite de tamanho do projeto (max-lines).
 *
 * Ambas as ações expostas (`handleIgnorar`/`handleBulkIgnorar`) só abrem a
 * confirmação; a mutação em si roda apenas em `confirmarIgnorar`/
 * `confirmarBulkIgnorar`, chamadas pelo ConfirmDialog na página (E-022).
 */
export function useConciliacaoIgnorarActions({
  setTransacoes,
  selectedIds,
  setSelectedIds,
}: {
  setTransacoes: React.Dispatch<React.SetStateAction<TransacaoExtrato[]>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [ignorarDialogOpen, setIgnorarDialogOpen] = useState(false);
  const [ignorarAlvoId, setIgnorarAlvoId] = useState<string | null>(null);
  const [isIgnorando, setIsIgnorando] = useState(false);
  const [bulkIgnorarDialogOpen, setBulkIgnorarDialogOpen] = useState(false);
  const [isBulkIgnorando, setIsBulkIgnorando] = useState(false);

  const executarIgnorar = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('transacoes_bancarias')
          .update({ conciliada: true, compensacao_motivo: 'Ignorado pelo usuário' })
          .eq('id', id);

        if (error) throw error;
        setTransacoes((prev) => prev.filter((t) => t.id !== id));
        toast.info('Transação marcada como ignorada');
      } catch {
        toast.error('Erro ao ignorar transação');
      }
    },
    [setTransacoes]
  );

  const handleIgnorar = useCallback((id: string) => {
    setIgnorarAlvoId(id);
    setIgnorarDialogOpen(true);
  }, []);

  const confirmarIgnorar = useCallback(async () => {
    if (!ignorarAlvoId) return;
    setIsIgnorando(true);
    try {
      await executarIgnorar(ignorarAlvoId);
    } finally {
      setIsIgnorando(false);
      setIgnorarDialogOpen(false);
      setIgnorarAlvoId(null);
    }
  }, [ignorarAlvoId, executarIgnorar]);

  const executarBulkIgnorar = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const resultados = await Promise.allSettled(
      ids.map(async (id) => {
        const { error } = await supabase
          .from('transacoes_bancarias')
          .update({ conciliada: true, compensacao_motivo: 'Ignorado pelo usuário' })
          .eq('id', id);
        if (error) throw error;
        return id;
      })
    );

    const persistidos = new Set(
      resultados.flatMap((resultado) => (resultado.status === 'fulfilled' ? [resultado.value] : []))
    );
    const falhas = ids.length - persistidos.size;

    if (persistidos.size > 0) {
      setTransacoes((prev) => prev.filter((t) => !persistidos.has(t.id)));
    }
    setSelectedIds(new Set(ids.filter((id) => !persistidos.has(id))));

    if (persistidos.size > 0) {
      toast.success(`${persistidos.size} transações ignoradas e persistidas`);
    }
    if (falhas > 0) {
      toast.error(
        `${falhas} transações não foram ignoradas; a seleção foi preservada para nova tentativa.`
      );
    }
  }, [selectedIds, setSelectedIds, setTransacoes]);

  const handleBulkIgnorar = useCallback(() => {
    if (selectedIds.size === 0) return;
    setBulkIgnorarDialogOpen(true);
  }, [selectedIds.size]);

  const confirmarBulkIgnorar = useCallback(async () => {
    setIsBulkIgnorando(true);
    try {
      await executarBulkIgnorar();
    } finally {
      setIsBulkIgnorando(false);
      setBulkIgnorarDialogOpen(false);
    }
  }, [executarBulkIgnorar]);

  return {
    ignorarDialogOpen,
    setIgnorarDialogOpen,
    isIgnorando,
    handleIgnorar,
    confirmarIgnorar,
    bulkIgnorarDialogOpen,
    setBulkIgnorarDialogOpen,
    isBulkIgnorando,
    handleBulkIgnorar,
    confirmarBulkIgnorar,
  };
}
