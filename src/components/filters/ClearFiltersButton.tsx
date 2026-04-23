import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  /**
   * Nomes (label) dos filtros que devem aparecer SEMPRE no resumo do toast,
   * mesmo quando não estavam ativos (mostrados como "—"). Default: ['Busca', 'Período'].
   * Use para garantir que campos críticos sempre apareçam no undo, ajudando
   * o usuário a confirmar o que perdeu.
   */
  pinnedFields?: string[];
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

      const previewChips = activeFilters.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5" aria-hidden="true">
          {activeFilters.slice(0, 6).map((f, i) => (
            <Badge
              key={`${f.label}-${i}`}
              variant="secondary"
              className="gap-1 font-normal"
            >
              <span className="font-medium">{f.label}</span>
              {f.value !== undefined && (
                <span className="text-muted-foreground">· {formatValue(f.value)}</span>
              )}
            </Badge>
          ))}
          {activeFilters.length > 6 && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              +{activeFilters.length - 6}
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          Nenhum filtro ativo.
        </span>
      );

      // Resumo fixo: sempre mostra os campos pinados (ex.: Busca, Período).
      // Renderizado num grid para alinhamento estável independentemente da
      // largura do toast.
      const pinnedSummaryEl = pinnedSummary.length > 0 ? (
        <div
          className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 rounded-md border border-border/60 bg-muted/40 px-2.5 py-2"
          aria-hidden="true"
        >
          {pinnedSummary.map((f) => (
            <div key={f.label} className="contents">
              <span className="text-[11px] font-medium text-foreground">{f.label}</span>
              <span
                className={`text-[11px] truncate ${
                  f.isActive ? 'text-foreground' : 'text-muted-foreground italic'
                }`}
                title={f.value !== undefined ? formatValue(f.value) : '—'}
              >
                {f.isActive && f.value !== undefined ? formatValue(f.value) : '—'}
              </span>
            </div>
          ))}
        </div>
      ) : null;

      // ---- Região acessível ----
      // Frase narrável (aria-live) — leitores de tela anunciam imediatamente
      // o estado geral da limpeza.
      const announcement = [
        `Filtros de ${entityLabel} limpos.`,
        `${activeFilters.length} ${
          activeFilters.length === 1 ? 'filtro removido' : 'filtros removidos'
        } no total.`,
        ...pinnedSummary.map((f) =>
          f.isActive && f.value !== undefined
            ? `${f.label}: ${formatValue(f.value)}.`
            : `${f.label}: vazio.`,
        ),
        activeFilters.length > 0
          ? `Filtros ativos: ${activeFilters
              .map((f) =>
                f.value !== undefined ? `${f.label} ${formatValue(f.value)}` : f.label,
              )
              .join('; ')}.`
          : 'Nenhum filtro ativo.',
        'Pressione o botão Desfazer em até 5 segundos para restaurar.',
      ].join(' ');

      const a11yRegion = (
        <>
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </div>
          {/* Lista semântica navegável por leitor de tela (modo de leitura
              estrutural). Permanece invisível mas indexada. */}
          <dl
            className="sr-only"
            aria-label={`Resumo dos filtros removidos de ${entityLabel}`}
          >
            {pinnedSummary.map((f) => (
              <div key={`a11y-pin-${f.label}`}>
                <dt>{f.label}</dt>
                <dd>
                  {f.isActive && f.value !== undefined ? formatValue(f.value) : 'vazio'}
                </dd>
              </div>
            ))}
            {activeFilters.map((f, i) => (
              <div key={`a11y-active-${f.label}-${i}`}>
                <dt>{f.label}</dt>
                <dd>{f.value !== undefined ? formatValue(f.value) : 'ativo'}</dd>
              </div>
            ))}
          </dl>
        </>
      );

      const description = (
        <div className="space-y-2">
          {a11yRegion}
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{activeFilters.length}</span>{' '}
            {activeFilters.length === 1 ? 'filtro removido' : 'filtros removidos'} no total
            {localKeys.length > 0 ? ' · preferências locais limpas' : ''}
          </p>
          {pinnedSummaryEl}
          {previewChips}
          <p className="pt-1 text-[10px] uppercase tracking-wide text-muted-foreground" aria-hidden="true">
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
