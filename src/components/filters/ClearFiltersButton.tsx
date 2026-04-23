import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastWithUndo } from '@/lib/toast-with-undo';
import { logger } from '@/lib/logger';
import { formatFilterValue } from '@/lib/format-filter-value';
import { FilterPreviewChips } from '@/components/filters/FilterPreviewChips';
import type { ManagedFiltersController } from '@/hooks/useManagedFilters';

export interface DescribedFilter {
  /** Rótulo legível ex: "Status", "Busca", "Período". */
  label: string;
  /** Valor atual (string já formatada para humanos quando possível). */
  value?: unknown;
  /** Se está ativo (≠ default). */
  isActive: boolean;
}

interface ClearFiltersButtonProps<T extends Record<string, unknown>> {
  controller: ManagedFiltersController<T>;
  /** Rótulo da entidade — usado nas mensagens (ex: "clientes", "fornecedores"). */
  entityLabel: string;
  /** Lista descritiva dos filtros — guia o toast e o dialog. */
  describeFilters: (values: T) => DescribedFilter[];
  /** Variante do botão. */
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
  /** Texto customizado (default: "Limpar"). */
  label?: string;
  /**
   * Nomes (label) dos filtros que devem aparecer SEMPRE no resumo do toast,
   * mesmo quando não estavam ativos (mostrados como "—"). Default: ['Busca', 'Período'].
   * Use para garantir que campos críticos sempre apareçam no undo, ajudando
   * o usuário a confirmar o que perdeu.
   */
  pinnedFields?: string[];
}

// Formatação centralizada em `@/lib/format-filter-value`.


export function ClearFiltersButton<T extends Record<string, unknown>>({
  controller,
  entityLabel,
  describeFilters,
  variant = 'ghost',
  size = 'sm',
  className,
  label = 'Limpar',
  pinnedFields = ['Busca', 'Período'],
}: ClearFiltersButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const allFilters = useMemo(
    () => describeFilters(controller.values),
    [controller.values, describeFilters]
  );
  const activeFilters = useMemo(
    () => allFilters.filter((f) => f.isActive),
    [allFilters]
  );

  /**
   * Resumo fixo: para cada nome em `pinnedFields`, pega o filtro descrito
   * correspondente (case-insensitive). Garante que "Busca" e "Período"
   * apareçam sempre, com valor real ou "—" quando vazios.
   */
  const pinnedSummary = useMemo(() => {
    return pinnedFields.map((name) => {
      const match = allFilters.find(
        (f) => f.label.toLowerCase() === name.toLowerCase(),
      );
      return {
        label: name,
        value: match?.value,
        isActive: match?.isActive ?? false,
      };
    });
  }, [allFilters, pinnedFields]);

  const localKeys = useMemo(() => {
    const keys: string[] = [];
    if (controller.localStorageKey) keys.push(controller.localStorageKey);
    keys.push(...controller.extraLocalStorageKeys);
    return keys;
  }, [controller.localStorageKey, controller.extraLocalStorageKeys]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await controller.performClear();
      setOpen(false);

      const announcement = [
        `Filtros de ${entityLabel} limpos.`,
        `${activeFilters.length} ${
          activeFilters.length === 1 ? 'filtro removido' : 'filtros removidos'
        } no total.`,
        ...pinnedSummary.map((f) =>
          f.isActive && f.value !== undefined
            ? `${f.label}: ${formatFilterValue(f.value)}.`
            : `${f.label}: vazio.`,
        ),
        activeFilters.length > 0
          ? `Filtros ativos: ${activeFilters
              .map((f) =>
                f.value !== undefined
                  ? `${f.label} ${formatFilterValue(f.value)}`
                  : f.label,
              )
              .join('; ')}.`
          : 'Nenhum filtro ativo.',
        'Pressione o botão Desfazer em até 5 segundos para restaurar.',
      ].join(' ');

      const description = (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{activeFilters.length}</span>{' '}
            {activeFilters.length === 1 ? 'filtro removido' : 'filtros removidos'} no total
            {localKeys.length > 0 ? ' · preferências locais limpas' : ''}
          </p>
          <FilterPreviewChips
            activeFilters={activeFilters}
            pinnedSummary={pinnedSummary}
            entityLabel={entityLabel}
            announcement={announcement}
            dense
          />
          <p
            className="pt-1 text-[10px] uppercase tracking-wide text-muted-foreground"
            aria-hidden="true"
          >
            Você tem 5s para desfazer.
          </p>
        </div>
      );


      toastWithUndo({
        title: `Filtros de ${entityLabel} limpos`,
        description,
        duration: 5000,
        onUndo: async () => {
          await controller.restoreSnapshot(snapshot);
        },
      });
    } catch (e) {
      logger.error('[ClearFiltersButton] failed to clear', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, controller, entityLabel, localKeys, pinnedSummary]);

  const handleClick = useCallback(() => {
    if (!controller.hasActive) return;
    setOpen(true);
  }, [controller.hasActive]);

  const count = activeFilters.length;
  const dialogDescription = count
    ? `Você vai apagar ${count} filtro(s) ativo(s): ${activeFilters
        .map((f) => f.label)
        .join(', ')}. Isso também removerá suas preferências salvas para esta tela na sua conta${localKeys.length ? ' e neste dispositivo' : ''}.`
    : 'Nenhum filtro ativo para limpar.';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={!controller.hasActive || isLoading}
        className={className}
      >
        <X className="h-4 w-4 mr-1" />
        {label}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title={`Limpar filtros de ${entityLabel}?`}
        description={dialogDescription}
        confirmLabel="Sim, limpar"
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={isLoading}
      />
    </>
  );
}

export default ClearFiltersButton;
