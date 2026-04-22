import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastWithUndo } from '@/lib/toast-with-undo';
import { logger } from '@/lib/logger';
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
}

function formatValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v.length > 32 ? `${v.slice(0, 32)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `${v.length}`;
  if (typeof v === 'object') {
    try {
      const s = JSON.stringify(v);
      return s.length > 32 ? `${s.slice(0, 32)}…` : s;
    } catch {
      return '—';
    }
  }
  return String(v);
}

export function ClearFiltersButton<T extends Record<string, unknown>>({
  controller,
  entityLabel,
  describeFilters,
  variant = 'ghost',
  size = 'sm',
  className,
  label = 'Limpar',
}: ClearFiltersButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeFilters = useMemo(
    () => describeFilters(controller.values).filter((f) => f.isActive),
    [controller.values, describeFilters]
  );

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

      const filtersDesc =
        activeFilters.length > 0
          ? activeFilters
              .map((f) => `${f.label}${f.value !== undefined ? ` (${formatValue(f.value)})` : ''}`)
              .join(', ')
          : 'nenhum filtro ativo';

      const localDesc = localKeys.length > 0 ? `Removidas as preferências locais: ${localKeys.join(', ')}.` : '';

      toastWithUndo({
        title: `Filtros de ${entityLabel} limpos`,
        description: `Removidos: ${filtersDesc}.${localDesc ? ` ${localDesc}` : ''}`,
        duration: 6000,
        onUndo: async () => {
          await controller.restoreSnapshot(snapshot);
        },
      });
    } catch (e) {
      logger.error('[ClearFiltersButton] failed to clear', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, controller, entityLabel, localKeys]);

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
