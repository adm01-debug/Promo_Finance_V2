import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
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
import {
  Bookmark,
  Save,
  ChevronDown,
  Cloud,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  useSavedFilters,
  type AppRole,
  type SavedFilterPayload,
  type SavedFilterRow,
} from "@/hooks/useSavedFilters";
import { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";
import { useWebPushSubscription } from "@/hooks/useWebPushSubscription";
import { useAuth } from "@/hooks/useAuth";
import { PresetListItem } from "./saved-filters-bar/PresetListItem";
import { SavePresetDialog } from "./saved-filters-bar/SavePresetDialog";
import { ShareFilterDialog } from "./saved-filters-bar/ShareFilterDialog";
import { RestoreConfirmDialog } from "./saved-filters-bar/RestoreConfirmDialog";

interface SavedFiltersBarProps<T> {
  entityType: string;
  currentState: SavedFilterPayload<T>;
  activePresetId: string | null;
  onLoad: (preset: { id: string; payload: SavedFilterPayload<T> }) => void;
  onClear: () => void;
  /**
   * Restaura um snapshot completo (presetId + payload) — usado pelo "Desfazer"
   * após Restaurar padrão. Se ausente, o undo recai em onLoad/onClear, o que
   * pode não preservar o activePresetId quando o estado anterior era livre.
   */
  onRestoreState?: (state: {
    presetId: string | null;
    payload: SavedFilterPayload<T>;
  }) => void;
}

export function SavedFiltersBar<T>({
  entityType,
  currentState,
  activePresetId,
  onLoad,
  onClear,
  onRestoreState,
}: SavedFiltersBarProps<T>) {
  const { user, currentEmpresaId } = useAuth();
  const {
    filters,
    defaultFilter,
    isLoading: presetsLoading,
    save,
    remove,
    setDefault,
    duplicate,
    updateSharing,
  } = useSavedFilters<T>(entityType);
  const subsApi = useSavedFilterSubscriptions();
  const { subscribed: pushReady, subscribe: enablePush } = useWebPushSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareRoles, setShareRoles] = useState<AppRole[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [shareDialog, setShareDialog] = useState<SavedFilterRow<T> | null>(null);
  const [shareDialogEnabled, setShareDialogEnabled] = useState(false);
  const [shareDialogRoles, setShareDialogRoles] = useState<AppRole[]>([]);
  const [shareError, setShareError] = useState<string | null>(null);

  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);
  const [pendingDuplicateId, setPendingDuplicateId] = useState<string | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  const anyMutationPending =
    save.isPending ||
    remove.isPending ||
    setDefault.isPending ||
    duplicate.isPending ||
    updateSharing.isPending ||
    !!loadingPresetId;

  const activePreset = useMemo(
    () => filters.find((f) => f.id === activePresetId) ?? null,
    [filters, activePresetId],
  );

  const isModified = useMemo(() => {
    if (!activePreset) return false;
    return JSON.stringify(activePreset.filters) !== JSON.stringify(currentState);
  }, [activePreset, currentState]);

  const isOwner = (f: SavedFilterRow<T>) => user?.id === (f.created_by ?? f.user_id);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setSaveError(null);
    try {
      await save.mutateAsync({
        name: trimmed,
        payload: currentState,
        isDefault: makeDefault,
        isShared: shareEnabled,
        sharedWithRoles: shareEnabled ? shareRoles : [],
      });
      setDialogOpen(false);
      setName("");
      setMakeDefault(false);
      setShareEnabled(false);
      setShareRoles([]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao salvar o preset.");
    }
  };

  const handleOverwrite = async () => {
    if (!activePreset || !isOwner(activePreset)) return;
    if (save.isPending) return;
    try {
      await save.mutateAsync({
        name: activePreset.name,
        payload: currentState,
        isDefault: activePreset.is_default,
        isShared: activePreset.is_shared,
        sharedWithRoles: activePreset.shared_with_roles,
      });
    } catch {
      /* toast já é exibido pelo hook */
    }
  };

  const openShareDialog = (f: SavedFilterRow<T>) => {
    setShareDialog(f);
    setShareDialogEnabled(f.is_shared);
    setShareDialogRoles(f.shared_with_roles);
    setShareError(null);
  };

  const handleSaveShare = async () => {
    if (!shareDialog) return;
    setShareError(null);
    try {
      await updateSharing.mutateAsync({
        id: shareDialog.id,
        isShared: shareDialogEnabled,
        sharedWithRoles: shareDialogEnabled ? shareDialogRoles : [],
      });
      setShareDialog(null);
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : "Falha ao atualizar compartilhamento.",
      );
    }
  };

  const handleLoadPreset = (f: SavedFilterRow<T>) => {
    if (loadingPresetId || anyMutationPending) return;
    if (f.id === activePresetId) return;
    setLoadingPresetId(f.id);
    try {
      onLoad({ id: f.id, payload: f.filters });
    } finally {
      setTimeout(() => setLoadingPresetId(null), 200);
    }
  };

  const handleRemove = (f: SavedFilterRow<T>) => {
    if (pendingRemoveId || remove.isPending) return;
    setPendingRemoveId(f.id);
    remove.mutate(f.id, {
      onSettled: () => setPendingRemoveId(null),
      onSuccess: () => {
        if (f.id === activePresetId) onClear();
      },
    });
  };

  const handleSetDefault = (f: SavedFilterRow<T>) => {
    if (pendingDefaultId || setDefault.isPending) return;
    setPendingDefaultId(f.id);
    setDefault.mutate(f.id, { onSettled: () => setPendingDefaultId(null) });
  };

  const handleDuplicate = (f: SavedFilterRow<T>) => {
    if (pendingDuplicateId || duplicate.isPending) return;
    setPendingDuplicateId(f.id);
    duplicate.mutate(
      { sourceId: f.id },
      { onSettled: () => setPendingDuplicateId(null) },
    );
  };

  const canRestore =
    isModified ||
    (defaultFilter && activePresetId !== defaultFilter.id) ||
    (!activePresetId && !!defaultFilter);

  const handleRestoreDefault = () => {
    const previousPresetId = activePresetId;
    const previousState: SavedFilterPayload<T> = currentState;

    if (defaultFilter) {
      onLoad({ id: defaultFilter.id, payload: defaultFilter.filters });
    } else {
      onClear();
    }

    const undo = () => {
      if (onRestoreState) {
        onRestoreState({ presetId: previousPresetId, payload: previousState });
      } else if (previousPresetId) {
        onLoad({ id: previousPresetId, payload: previousState });
      } else {
        onClear();
      }
      toast.success("Alteração desfeita", {
        description: "Estado anterior dos filtros foi restaurado.",
      });
    };

    const titulo = defaultFilter
      ? `Preset padrão aplicado: "${defaultFilter.name}"`
      : "Filtros limpos";
    const descricao = defaultFilter
      ? "Filtros, ordenação e colunas foram restaurados."
      : "O painel voltou à configuração inicial.";

    toast.success(titulo, {
      description: descricao,
      duration: 8000,
      action: { label: "Desfazer", onClick: undo },
    });
  };

  const requestRestoreDefault = () => {
    if (!canRestore || anyMutationPending) return;
    setConfirmRestoreOpen(true);
  };
  const confirmRestoreDefault = () => {
    handleRestoreDefault();
    setConfirmRestoreOpen(false);
  };

  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "r" && e.key !== "R") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target?.isContentEditable ?? false);
      if (isEditable) return;
      if (!canRestore || anyMutationPending) return;
      e.preventDefault();
      handleRestoreDefault();
      requestAnimationFrame(() => restoreButtonRef.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRestore, anyMutationPending, defaultFilter, activePresetId]);

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
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
                    isRemoving={pendingRemoveId === f.id || remove.isPending}
                    isSettingDefault={pendingDefaultId === f.id || setDefault.isPending}
                    isDuplicating={pendingDuplicateId === f.id || duplicate.isPending}
                    rowDisabled={rowDisabled}
                    entityType={entityType}
                    subsApi={subsApi}
                    pushReady={pushReady}
                    onEnablePush={enablePush}
                    onLoad={handleLoadPreset}
                    onDuplicate={handleDuplicate}
                    onOpenShare={openShareDialog}
                    onSetDefault={handleSetDefault}
                    onRemove={handleRemove}
                  />
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDialogOpen(true);
              }}
              disabled={save.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-2" /> Salvar como novo…
            </DropdownMenuItem>
            {activePreset && isModified && isOwner(activePreset) && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleOverwrite();
                }}
                disabled={save.isPending}
              >
                {save.isPending ? (
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
                requestRestoreDefault();
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

        <Button
          ref={restoreButtonRef}
          variant="ghost"
          size="sm"
          className="gap-1.5 h-9"
          onClick={requestRestoreDefault}
          disabled={!canRestore || anyMutationPending}
          title={
            defaultFilter
              ? `Restaurar preset padrão "${defaultFilter.name}" (Alt+R)`
              : "Voltar ao estado inicial (Alt+R)"
          }
          aria-label="Restaurar padrão (atalho: Alt+R)"
          aria-keyshortcuts="Alt+R"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Restaurar padrão</span>
          <kbd className="hidden lg:inline-flex items-center justify-center h-4 px-1 rounded border bg-muted text-[9px] font-mono text-muted-foreground">
            Alt+R
          </kbd>
        </Button>
      </div>

      <SavePresetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        name={name}
        onNameChange={setName}
        makeDefault={makeDefault}
        onMakeDefaultChange={setMakeDefault}
        shareEnabled={shareEnabled}
        onShareEnabledChange={setShareEnabled}
        shareRoles={shareRoles}
        onShareRolesChange={setShareRoles}
        currentEmpresaId={currentEmpresaId}
        isSaving={save.isPending}
        saveError={saveError}
        onCancel={() => {
          setSaveError(null);
          setDialogOpen(false);
        }}
        onSave={handleSave}
      />

      <ShareFilterDialog
        target={shareDialog}
        enabled={shareDialogEnabled}
        onEnabledChange={setShareDialogEnabled}
        roles={shareDialogRoles}
        onRolesChange={setShareDialogRoles}
        currentEmpresaId={currentEmpresaId}
        isSaving={updateSharing.isPending}
        error={shareError}
        onCancel={() => {
          setShareError(null);
          setShareDialog(null);
        }}
        onSave={handleSaveShare}
      />

      <RestoreConfirmDialog
        open={confirmRestoreOpen}
        onOpenChange={setConfirmRestoreOpen}
        defaultFilter={defaultFilter}
        isModified={isModified}
        activePreset={activePreset}
        onConfirm={confirmRestoreDefault}
      />
    </>
  );
}
