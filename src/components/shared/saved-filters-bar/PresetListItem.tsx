import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Star,
  Users,
  User as UserIcon,
  Copy,
  Share2,
  Trash2,
  Loader2,
} from "lucide-react";
import { SubscriptionPopover } from "@/components/shared/SubscriptionPopover";
import { TIPOS_EVENTOS_ANOMALIAS } from "./constants";
import type { SavedFilterRow } from "@/hooks/useSavedFilters";
import type { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";

type SubsApi = ReturnType<typeof useSavedFilterSubscriptions>;

interface PresetListItemProps<T> {
  filter: SavedFilterRow<T>;
  isOwner: boolean;
  isLoading: boolean;
  isRemoving: boolean;
  isSettingDefault: boolean;
  isDuplicating: boolean;
  rowDisabled: boolean;
  entityType: string;
  subsApi: SubsApi;
  pushReady: boolean;
  onEnablePush: () => void;
  onLoad: (f: SavedFilterRow<T>) => void;
  onDuplicate: (f: SavedFilterRow<T>) => void;
  onOpenShare: (f: SavedFilterRow<T>) => void;
  onSetDefault: (f: SavedFilterRow<T>) => void;
  onRemove: (f: SavedFilterRow<T>) => void;
}

export function PresetListItem<T>({
  filter: f,
  isOwner,
  isLoading,
  isRemoving,
  isSettingDefault,
  isDuplicating,
  rowDisabled,
  entityType,
  subsApi,
  pushReady,
  onEnablePush,
  onLoad,
  onDuplicate,
  onOpenShare,
  onSetDefault,
  onRemove,
}: PresetListItemProps<T>) {
  return (
    <DropdownMenuItem
      className="flex items-center justify-between gap-2"
      disabled={rowDisabled}
      onSelect={(e) => {
        if (rowDisabled) {
          e.preventDefault();
          return;
        }
        onLoad(f);
      }}
    >
      <span className="flex items-center gap-1.5 truncate">
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : f.is_default ? (
          <Star className="h-3 w-3 fill-warning text-warning" />
        ) : f.is_shared ? (
          <Users className="h-3 w-3 text-primary" aria-label="Compartilhado" />
        ) : (
          <UserIcon className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="truncate">{f.name}</span>
        {!isOwner && (
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            equipe
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        {entityType === "anomalias_detectadas" && (() => {
          const sub = subsApi.byFilterId.get(f.id);
          const subBusy =
            subsApi.subscribe.isPending ||
            subsApi.unsubscribe.isPending ||
            subsApi.updateChannels.isPending;
          return (
            <SubscriptionPopover
              subscription={sub ?? null}
              filterName={f.name}
              isBusy={subBusy}
              pushReady={pushReady}
              tiposEventosOpcoes={TIPOS_EVENTOS_ANOMALIAS}
              onEnablePush={onEnablePush}
              onSubscribe={(input) =>
                subsApi.subscribe.mutate({ savedFilterId: f.id, ...input })
              }
              onUpdate={(input) => subsApi.updateChannels.mutate(input)}
              onUnsubscribe={(id) => subsApi.unsubscribe.mutate(id)}
            />
          );
        })()}
        <button
          type="button"
          disabled={isDuplicating}
          className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
          title="Duplicar para minha biblioteca"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(f);
          }}
        >
          {isDuplicating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
        </button>
        {isOwner && (
          <button
            type="button"
            className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
            title="Compartilhar"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(f);
            }}
          >
            <Share2 className="h-3 w-3" />
          </button>
        )}
        {isOwner && !f.is_default && (
          <button
            type="button"
            disabled={isSettingDefault}
            className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
            title="Definir como padrão"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(f);
            }}
          >
            {isSettingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            disabled={isRemoving}
            className="opacity-50 hover:opacity-100 hover:text-destructive disabled:opacity-30 disabled:cursor-wait"
            title="Remover preset"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(f);
            }}
          >
            {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        )}
      </span>
    </DropdownMenuItem>
  );
}
