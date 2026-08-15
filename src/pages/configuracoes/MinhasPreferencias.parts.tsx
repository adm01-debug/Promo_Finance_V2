// Tipos e sub-componentes da página MinhasPreferencias — extraídos para zerar max-lines.
import { Link } from 'react-router-dom';
import {
  Columns,
  ExternalLink,
  Filter as FilterIcon,
  Loader2,
  Share2,
  ShieldOff,
  Star,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { findCatalogEntry, type FilterCatalogEntry } from './savedFiltersCatalog';

/** Linha enxuta usada apenas nesta tela (sem importar tipos do hook). */
export interface PreferenciaRow {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  filters: {
    filters?: Record<string, unknown>;
    columns?: string[];
    sort?: { key: string; dir: 'asc' | 'desc' };
  } | null;
  is_default: boolean;
  is_shared: boolean;
  empresa_id: string | null;
  shared_with_roles: string[];
  updated_at: string;
}

export interface ModuleGroup {
  entry: FilterCatalogEntry | { entityType: string; label: string; area: string; route: string };
  rows: PreferenciaRow[];
}

interface ModuleSectionProps {
  group: ModuleGroup;
  onToggleDefault: (row: PreferenciaRow) => void;
  onStopSharing: (row: PreferenciaRow) => void;
  onDelete: (row: PreferenciaRow) => void;
  busyId: string | null;
}

export function ModuleSection({ group, onToggleDefault, onStopSharing, onDelete, busyId }: ModuleSectionProps) {
  const { entry, rows } = group;
  const catalog = findCatalogEntry(entry.entityType);
  return (
    <section className="rounded-lg border border-border bg-card/40">
      <div className="flex items-center justify-between gap-3 p-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">{entry.label}</h2>
            <Badge variant="outline" className="text-[10px]">
              {entry.area}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {entry.entityType}
            </span>
          </div>
          {catalog?.defaultsKeys?.length ? (
            <p className="text-xs text-muted-foreground mt-1">
              Campos sincronizados: {catalog.defaultsKeys.join(', ')}
            </p>
          ) : null}
        </div>
        {entry.route && entry.route !== '#' ? (
          <Button asChild variant="ghost" size="sm" className="gap-1 h-7">
            <Link to={entry.route}>
              <ExternalLink className="h-3 w-3" />
              Abrir tela
            </Link>
          </Button>
        ) : null}
      </div>
      <Separator />
      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Nenhum preset salvo para este módulo. Aplique filtros ou ajuste colunas na tela e clique em <span className="font-semibold">Salvar preset</span>.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <PresetRow
              key={row.id}
              row={row}
              onToggleDefault={onToggleDefault}
              onStopSharing={onStopSharing}
              onDelete={onDelete}
              busy={busyId === row.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface PresetRowProps {
  row: PreferenciaRow;
  onToggleDefault: (row: PreferenciaRow) => void;
  onStopSharing: (row: PreferenciaRow) => void;
  onDelete: (row: PreferenciaRow) => void;
  busy: boolean;
}

function PresetRow({ row, onToggleDefault, onStopSharing, onDelete, busy }: PresetRowProps) {
  const filtersObj = (row.filters?.filters ?? {}) as Record<string, unknown>;
  const filterKeys = Object.keys(filtersObj);
  const columns = row.filters?.columns ?? [];
  const sort = row.filters?.sort ?? null;

  return (
    <li className="p-4 flex items-start justify-between gap-4 flex-wrap hover:bg-card/60 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{row.name}</span>
          {row.is_default && (
            <Badge variant="outline" className="gap-1 text-[10px] border-primary/40 text-primary">
              <Star className="h-3 w-3" /> Padrão
            </Badge>
          )}
          {row.is_shared && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Share2 className="h-3 w-3" />
                  Compartilhado
                  {row.shared_with_roles.length > 0 && ` · ${row.shared_with_roles.length}`}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  {row.shared_with_roles.length === 0
                    ? 'Visível para todos os papéis do tenant.'
                    : `Papéis: ${row.shared_with_roles.join(', ')}`}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-1">
            <FilterIcon className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{filterKeys.length}</span> filtro(s)
              {filterKeys.length > 0 && (
                <span className="block font-mono truncate">{filterKeys.join(', ')}</span>
              )}
            </span>
          </div>
          <div className="flex items-start gap-1">
            <Columns className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{columns.length}</span> coluna(s) sincronizada(s)
              {columns.length > 0 && (
                <span className="block font-mono truncate">{columns.join(', ')}</span>
              )}
            </span>
          </div>
          <div>
            {sort ? (
              <>
                Ordenação: <span className="font-mono text-foreground">{sort.key}</span>{' '}
                <span className="uppercase">{sort.dir}</span>
              </>
            ) : (
              <span>Sem ordenação salva</span>
            )}
            <div className="mt-1">
              Atualizado: {new Date(row.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                checked={row.is_default}
                disabled={busy}
                onCheckedChange={() => onToggleDefault(row)}
                aria-label="Marcar como padrão"
              />
              <span className="text-xs text-muted-foreground">Padrão</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Aplica este preset automaticamente ao abrir a tela.</p>
          </TooltipContent>
        </Tooltip>

        {row.is_shared && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8"
            disabled={busy}
            onClick={() => onStopSharing(row)}
          >
            <ShieldOff className="h-3 w-3" />
            Parar de compartilhar
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={busy}
              aria-label="Excluir preset"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir preset “{row.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove permanentemente o preset desta sua conta. Outras pessoas que receberam este preset compartilhado deixarão de vê-lo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(row)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
