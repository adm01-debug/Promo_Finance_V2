import {
  Bookmark,
  Save,
  ChevronDown,
  Cloud,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { SavedFilterRow } from "@/hooks/useSavedFilters";
import type { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";
import { PresetListItem } from "./PresetListItem";

type SubsApi = ReturnType<typeof useSavedFilterSubscriptions>;

interface PresetsDropdownMenuProps<T> {
  entityType: string;
  filters: SavedFilterRow<T>[];
  activePreset: SavedFilterRow<T> | null;
  isModified: boolean;
  presetsLoading: boolean;
  loadingPresetId: string | null;
  pendingRemoveId: string | null;
  pendingDefaultId: string | null;
  pendingDuplicateId: string | null;
  removePending: boolean;
  setDefaultPending: boolean;
  duplicatePending: boolean;
  savePending: boolean;
  anyMutationPending: boolean;
  canRestore: boolean;
  defaultFilter: SavedFilterRow<T> | null;
  subsApi: SubsApi;
  pushReady: boolean;
  isOwner: (f: SavedFilterRow<T>) => boolean;
  onLoad: (f: SavedFilterRow<T>) => void;
  onRemove: (f: SavedFilterRow<T>) => void;
  onSetDefault: (f: SavedFilterRow<T>) => void;
  onDuplicate: (f: SavedFilterRow<T>) => void;
  onOpenShare: (f: SavedFilterRow<T>) => void;
  onOverwrite: () => void;
  onClear: () => void;
  onRestoreDefault: () => void;
  onSaveNew: () => void;
  onEnablePush: () => void;
}

export function PresetsDropdownMenu<T>({
  entityType,
  filters,
  activePreset,
  isModified,
  presetsLoading,
  loadingPresetId,
  pendingRemoveId,
  pendingDefaultId,
  pendingDuplicateId,
  removePending,
  setDefaultPending,
  duplicatePending,
  savePending,
  anyMutationPending,
  canRestore,
  defaultFilter,
  subsApi,
  pushReady,
  isOwner,
  onLoad,
  onRemove,
  onSetDefault,
  onDuplicate,
  onOpenShare,
  onOverwrite,
  onClear,
  onRestoreDefault,
  onSaveNew,
  onEnablePush,
}: PresetsDropdownMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-busy={presetsLoading || !!loadingPresetId}
        >
          {presetsLoading || loadingPresetId ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          {activePreset ? activePreset.name : "Presets"}
          {isModified && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              modificado
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-xs flex items-center gap-1.5">
          Filtros salvos
          {presetsLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </DropdownMenuLabel>
        {presetsLoading ? (
          <div className="px-2 py-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando presets…
          </div>
        ) : filters.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            Nenhum preset salvo ainda
          </div>
        ) : (
          filters.map((f) => {
            const isLoadingThis = loadingPresetId === f.id;
            const rowDisabled =
              pendingRemoveId === f.id ||
              isLoadingThis ||
              (!!loadingPresetId && loadingPresetId !== f.id);
            return (
              <PresetListItem
                key={f.id}
                filter={f}
                isOwner={isOwner(f)}
                isLoading={isLoadingThis}
                isRemoving={pendingRemoveId === f.id || removePending}
                isSettingDefault={pendingDefaultId === f.id || setDefaultPending}
                isDuplicating={pendingDuplicateId === f.id || duplicatePending}
                rowDisabled={rowDisabled}
                entityType={entityType}
                subsApi={subsApi}
                pushReady={pushReady}
                onEnablePush={onEnablePush}
                onLoad={onLoad}
                onDuplicate={onDuplicate}
                onOpenShare={onOpenShare}
                onSetDefault={onSetDefault}
                onRemove={onRemove}
              />
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onSaveNew();
          }}
          disabled={savePending}
        >
          <Save className="h-3.5 w-3.5 mr-2" /> Salvar como novo…
        </DropdownMenuItem>
        {activePreset && isModified && isOwner(activePreset) && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onOverwrite();
            }}
            disabled={savePending}
          >
            {savePending ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-2" />
            )}
            Sobrescrever &quot;{activePreset.name}&quot;
          </DropdownMenuItem>
        )}
        {activePreset && (
          <DropdownMenuItem onClick={onClear} disabled={anyMutationPending}>
            Limpar seleção
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onRestoreDefault();
          }}
          disabled={!canRestore || anyMutationPending}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          {defaultFilter
            ? `Restaurar padrão (${defaultFilter.name})`
            : "Restaurar estado inicial"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div
          className="px-2 py-1.5 text-[11px] text-muted-foreground flex items-start gap-1.5"
          role="note"
        >
          <Cloud className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
          <span>
            Sincronizado com sua conta — disponível em qualquer navegador
            após login.
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
