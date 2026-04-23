import { useState, useMemo, useEffect, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bookmark,
  Star,
  Trash2,
  Save,
  ChevronDown,
  Copy,
  Share2,
  Users,
  User as UserIcon,
  Cloud,
  RotateCcw,
  Loader2,
  AlertCircle,
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
import { SubscriptionPopover } from "@/components/shared/SubscriptionPopover";

interface SavedFiltersBarProps<T> {
  entityType: string;
  currentState: SavedFilterPayload<T>;
  activePresetId: string | null;
  onLoad: (preset: { id: string; payload: SavedFilterPayload<T> }) => void;
  onClear: () => void;
}

const ALL_ROLES: { key: AppRole; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "financeiro", label: "Financeiro" },
  { key: "operacional", label: "Operacional" },
  { key: "visualizador", label: "Visualizador" },
];

export function SavedFiltersBar<T>({
  entityType,
  currentState,
  activePresetId,
  onLoad,
  onClear,
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
  const {
    byFilterId: subsByFilter,
    subscribe,
    unsubscribe,
    updateChannels,
  } = useSavedFilterSubscriptions();
  const { subscribed: pushReady, subscribe: enablePush } =
    useWebPushSubscription();

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

  // Estados visuais para feedback por linha (evita cliques repetidos)
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);
  const [pendingDuplicateId, setPendingDuplicateId] = useState<string | null>(
    null,
  );

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

  const isOwner = (f: SavedFilterRow<T>) =>
    user?.id === (f.created_by ?? f.user_id);

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
      setSaveError(
        err instanceof Error ? err.message : "Falha ao salvar o preset.",
      );
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
        err instanceof Error
          ? err.message
          : "Falha ao atualizar compartilhamento.",
      );
    }
  };

  // Carrega preset com feedback visual e proteção contra cliques repetidos
  const handleLoadPreset = (f: SavedFilterRow<T>) => {
    if (loadingPresetId || anyMutationPending) return;
    if (f.id === activePresetId) return; // já está ativo
    setLoadingPresetId(f.id);
    try {
      onLoad({ id: f.id, payload: f.filters });
    } finally {
      // Limpa no próximo tick — onLoad é síncrono no consumidor,
      // mas mantemos o feedback brevemente para evitar flicker.
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
    setDefault.mutate(f.id, {
      onSettled: () => setPendingDefaultId(null),
    });
  };

  const handleDuplicate = (f: SavedFilterRow<T>) => {
    if (pendingDuplicateId || duplicate.isPending) return;
    setPendingDuplicateId(f.id);
    duplicate.mutate(
      { sourceId: f.id },
      { onSettled: () => setPendingDuplicateId(null) },
    );
  };

  const toggleRole = (
    roles: AppRole[],
    setRoles: (r: AppRole[]) => void,
    role: AppRole,
    checked: boolean,
  ) => {
    setRoles(checked ? [...roles, role] : roles.filter((r) => r !== role));
  };

  // Restaura ao preset padrão (se existir) ou ao estado inicial.
  const handleRestoreDefault = () => {
    if (defaultFilter) {
      onLoad({ id: defaultFilter.id, payload: defaultFilter.filters });
    } else {
      onClear();
    }
  };

  // Habilita o botão somente quando há algo a restaurar:
  // - existe preset modificado, OU
  // - há um preset ativo diferente do default, OU
  // - não há preset ativo mas existe default disponível
  const canRestore =
    isModified ||
    (defaultFilter && activePresetId !== defaultFilter.id) ||
    (!activePresetId && !!defaultFilter);

  // Atalho Alt+R aciona "Restaurar padrão" rapidamente, ignorando campos editáveis.
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
      // Feedback visual: leva o foco ao botão para indicar a ação executada.
      requestAnimationFrame(() => restoreButtonRef.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // handleRestoreDefault é estável dentro do mesmo render; dependências cobrem o relevante.
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
                const owner = isOwner(f);
                const isLoadingThis = loadingPresetId === f.id;
                const isRemovingThis = pendingRemoveId === f.id;
                const isDefaultingThis = pendingDefaultId === f.id;
                const isDuplicatingThis = pendingDuplicateId === f.id;
                const rowDisabled =
                  isRemovingThis ||
                  isLoadingThis ||
                  (!!loadingPresetId && loadingPresetId !== f.id);
                return (
                  <DropdownMenuItem
                    key={f.id}
                    className="flex items-center justify-between gap-2"
                    disabled={rowDisabled}
                    onSelect={(e) => {
                      // Evita fechar o menu enquanto carrega; permite clique único
                      if (rowDisabled) {
                        e.preventDefault();
                        return;
                      }
                      handleLoadPreset(f);
                    }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {isLoadingThis ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      ) : f.is_default ? (
                        <Star className="h-3 w-3 fill-warning text-warning" />
                      ) : f.is_shared ? (
                        <Users
                          className="h-3 w-3 text-primary"
                          aria-label="Compartilhado"
                        />
                      ) : (
                        <UserIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="truncate">{f.name}</span>
                      {!owner && (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1"
                        >
                          equipe
                        </Badge>
                      )}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {entityType === "anomalias_detectadas" && (() => {
                        const sub = subsByFilter.get(f.id);
                        const subBusy =
                          subscribe.isPending ||
                          unsubscribe.isPending ||
                          updateChannels.isPending;
                        return (
                          <SubscriptionPopover
                            subscription={sub ?? null}
                            filterName={f.name}
                            isBusy={subBusy}
                            pushReady={pushReady}
                            tiposEventosOpcoes={[
                              { value: "movimentacao_outlier", label: "Movimentação atípica" },
                              { value: "pagamento_duplicado", label: "Pagamento duplicado" },
                              { value: "conta_pagar_alta", label: "Conta a pagar alta" },
                              { value: "conciliacao_atrasada", label: "Conciliação atrasada" },
                              { value: "mudanca_regime_brusca", label: "Variação brusca de regime" },
                            ]}
                            onEnablePush={enablePush}
                            onSubscribe={(input) =>
                              subscribe.mutate({
                                savedFilterId: f.id,
                                ...input,
                              })
                            }
                            onUpdate={(input) => updateChannels.mutate(input)}
                            onUnsubscribe={(id) => unsubscribe.mutate(id)}
                          />
                        );
                      })()}
                      <button
                        type="button"
                        disabled={isDuplicatingThis || duplicate.isPending}
                        className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
                        title="Duplicar para minha biblioteca"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(f);
                        }}
                      >
                        {isDuplicatingThis ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      {owner && (
                        <button
                          type="button"
                          disabled={updateSharing.isPending}
                          className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
                          title="Compartilhar"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareDialog(f);
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                      )}
                      {owner && !f.is_default && (
                        <button
                          type="button"
                          disabled={isDefaultingThis || setDefault.isPending}
                          className="opacity-50 hover:opacity-100 disabled:opacity-30 disabled:cursor-wait"
                          title="Definir como padrão"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(f);
                          }}
                        >
                          {isDefaultingThis ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      {owner && (
                        <button
                          type="button"
                          disabled={isRemovingThis || remove.isPending}
                          className="opacity-50 hover:opacity-100 hover:text-destructive disabled:opacity-30 disabled:cursor-wait"
                          title="Remover preset"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(f);
                          }}
                        >
                          {isRemovingThis ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </span>
                  </DropdownMenuItem>
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
              onClick={handleRestoreDefault}
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
          onClick={handleRestoreDefault}
          disabled={!canRestore}
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

      {/* Salvar novo preset */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar preset de filtros</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Nome do preset</Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Críticas dos últimos 7 dias"
                autoFocus
              />
            </div>
            <Checkbox
              id="default"
              checked={makeDefault}
              onChange={(e) =>
                setMakeDefault((e.target as HTMLInputElement).checked)
              }
              label="Aplicar automaticamente ao abrir esta tela"
            />
            <div className="border-t pt-3 space-y-2">
              <Checkbox
                id="share"
                checked={shareEnabled}
                onChange={(e) =>
                  setShareEnabled((e.target as HTMLInputElement).checked)
                }
                label="Compartilhar com a equipe da empresa atual"
              />
              {shareEnabled && (
                <div className="pl-6 space-y-2">
                  {!currentEmpresaId && (
                    <p className="text-xs text-destructive">
                      Selecione uma empresa atual para poder compartilhar.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Visível para os papéis selecionados (vazio = todos os papéis):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((r) => (
                      <Checkbox
                        key={r.key}
                        id={`role-${r.key}`}
                        checked={shareRoles.includes(r.key)}
                        onChange={(e) =>
                          toggleRole(
                            shareRoles,
                            setShareRoles,
                            r.key,
                            (e.target as HTMLInputElement).checked,
                          )
                        }
                        label={r.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {saveError && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveError(null);
                setDialogOpen(false);
              }}
              disabled={save.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                name.trim().length < 2 ||
                save.isPending ||
                (shareEnabled && !currentEmpresaId)
              }
            >
              {save.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar compartilhamento */}
      <Dialog
        open={!!shareDialog}
        onOpenChange={(o) => !o && setShareDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar &quot;{shareDialog?.name}&quot;</DialogTitle>
            <DialogDescription>
              Outros usuários da mesma empresa que tiverem o papel selecionado
              poderão visualizar e duplicar este preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Checkbox
              id="share-edit"
              checked={shareDialogEnabled}
              onChange={(e) =>
                setShareDialogEnabled((e.target as HTMLInputElement).checked)
              }
              label="Compartilhar com a equipe da empresa atual"
            />
            {shareDialogEnabled && (
              <div className="pl-6 space-y-2">
                {!currentEmpresaId && (
                  <p className="text-xs text-destructive">
                    Selecione uma empresa atual para poder compartilhar.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Papéis com acesso (vazio = todos):
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => (
                    <Checkbox
                      key={r.key}
                      id={`share-role-${r.key}`}
                      checked={shareDialogRoles.includes(r.key)}
                      onChange={(e) =>
                        toggleRole(
                          shareDialogRoles,
                          setShareDialogRoles,
                          r.key,
                          (e.target as HTMLInputElement).checked,
                        )
                      }
                      label={r.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {shareError && (
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{shareError}</span>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShareError(null);
                setShareDialog(null);
              }}
              disabled={updateSharing.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveShare}
              disabled={
                updateSharing.isPending ||
                (shareDialogEnabled && !currentEmpresaId)
              }
            >
              {updateSharing.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
