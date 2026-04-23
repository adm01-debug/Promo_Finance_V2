/**
 * Componente reutilizável que renderiza:
 *  - Um resumo fixo dos campos pinados (ex.: "Busca", "Período"), sempre
 *    exibidos mesmo quando vazios.
 *  - Uma lista de chips com os filtros ativos (com truncagem +N).
 *  - Uma região acessível paralela (`role="status"` + `<dl>` `sr-only`).
 *
 * Usado tanto no `ConfirmDialog` (preview "o que será removido") quanto
 * no toast de undo após a limpeza, garantindo paridade visual e semântica.
 */
import { Badge } from '@/components/ui/badge';
import { formatFilterValue } from '@/lib/format-filter-value';

export interface FilterPreviewItem {
  label: string;
  value?: unknown;
  isActive: boolean;
}

interface FilterPreviewChipsProps {
  /** Filtros considerados ativos (≠ default). */
  activeFilters: FilterPreviewItem[];
  /** Resumo fixo (sempre mostrado, mesmo quando inativo). */
  pinnedSummary?: FilterPreviewItem[];
  /** Rótulo da entidade — usado no `aria-label` da lista semântica. */
  entityLabel: string;
  /** Quantos chips renderizar antes do "+N". Default: 6. */
  maxChips?: number;
  /** Texto para o `role="status"` (sr-only). Default: derivado do contexto. */
  announcement?: string;
  /** Compactar — usado no toast (densidade alta). */
  dense?: boolean;
}

export function FilterPreviewChips({
  activeFilters,
  pinnedSummary = [],
  entityLabel,
  maxChips = 6,
  announcement,
  dense = false,
}: FilterPreviewChipsProps) {
  const overflow = Math.max(0, activeFilters.length - maxChips);

  const defaultAnnouncement = [
    `${activeFilters.length} ${
      activeFilters.length === 1 ? 'filtro ativo' : 'filtros ativos'
    } em ${entityLabel}.`,
    ...pinnedSummary.map((f) =>
      f.isActive && f.value !== undefined
        ? `${f.label}: ${formatFilterValue(f.value)}.`
        : `${f.label}: vazio.`,
    ),
    activeFilters.length > 0
      ? `Filtros: ${activeFilters
          .map((f) =>
            f.value !== undefined ? `${f.label} ${formatFilterValue(f.value)}` : f.label,
          )
          .join('; ')}.`
      : 'Nenhum filtro ativo.',
  ].join(' ');

  return (
    <div className={dense ? 'space-y-2' : 'space-y-3'}>
      {/* Região acessível (anúncio + lista estrutural) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement ?? defaultAnnouncement}
      </div>
      <dl className="sr-only" aria-label={`Resumo dos filtros de ${entityLabel}`}>
        {pinnedSummary.map((f) => (
          <div key={`a11y-pin-${f.label}`}>
            <dt>{f.label}</dt>
            <dd>
              {f.isActive && f.value !== undefined ? formatFilterValue(f.value) : 'vazio'}
            </dd>
          </div>
        ))}
        {activeFilters.map((f, i) => (
          <div key={`a11y-active-${f.label}-${i}`}>
            <dt>{f.label}</dt>
            <dd>{f.value !== undefined ? formatFilterValue(f.value) : 'ativo'}</dd>
          </div>
        ))}
      </dl>

      {/* Resumo fixo */}
      {pinnedSummary.length > 0 && (
        <div
          className={`grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 rounded-md border border-border/60 bg-muted/40 ${
            dense ? 'px-2.5 py-2' : 'px-3 py-2.5'
          }`}
          aria-hidden="true"
        >
          {pinnedSummary.map((f) => (
            <div key={f.label} className="contents">
              <span
                className={`${
                  dense ? 'text-[11px]' : 'text-xs'
                } font-medium text-foreground`}
              >
                {f.label}
              </span>
              <span
                className={`${dense ? 'text-[11px]' : 'text-xs'} truncate ${
                  f.isActive ? 'text-foreground' : 'text-muted-foreground italic'
                }`}
                title={f.value !== undefined ? formatFilterValue(f.value) : '—'}
              >
                {f.isActive && f.value !== undefined ? formatFilterValue(f.value) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chips */}
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-hidden="true">
          {activeFilters.slice(0, maxChips).map((f, i) => (
            <Badge
              key={`${f.label}-${i}`}
              variant="secondary"
              className="gap-1 font-normal max-w-[220px]"
            >
              <span className="font-medium shrink-0">{f.label}</span>
              {f.value !== undefined && (
                <span className="text-muted-foreground truncate">
                  · {formatFilterValue(f.value)}
                </span>
              )}
            </Badge>
          ))}
          {overflow > 0 && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              +{overflow}
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          Nenhum filtro ativo.
        </span>
      )}
    </div>
  );
}

export default FilterPreviewChips;
