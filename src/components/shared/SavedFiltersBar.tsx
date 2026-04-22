import { useState, useMemo } from "react";
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
  Bell,
  BellOff,
  RotateCcw,
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
  const { filters, defaultFilter, save, remove, setDefault, duplicate, updateSharing } =
    useSavedFilters<T>(entityType);
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

  const [shareDialog, setShareDialog] = useState<SavedFilterRow<T> | null>(null);
  const [shareDialogEnabled, setShareDialogEnabled] = useState(false);
  const [shareDialogRoles, setShareDialogRoles] = useState<AppRole[]>([]);

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
  };

  const handleOverwrite = async () => {
    if (!activePreset || !isOwner(activePreset)) return;
    await save.mutateAsync({
      name: activePreset.name,
      payload: currentState,
      isDefault: activePreset.is_default,
      isShared: activePreset.is_shared,
      sharedWithRoles: activePreset.shared_with_roles,
    });
  };

  const openShareDialog = (f: SavedFilterRow<T>) => {
    setShareDialog(f);
    setShareDialogEnabled(f.is_shared);
    setShareDialogRoles(f.shared_with_roles);
  };

  const handleSaveShare = async () => {
    if (!shareDialog) return;
    await updateSharing.mutateAsync({
      id: shareDialog.id,
      isShared: shareDialogEnabled,
      sharedWithRoles: shareDialogEnabled ? shareDialogRoles : [],
    });
    setShareDialog(null);
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

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
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
            <DropdownMenuLabel className="text-xs">
              Filtros salvos
            </DropdownMenuLabel>
            {filters.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Nenhum preset salvo ainda
              </div>
            ) : (
              filters.map((f) => {
                const owner = isOwner(f);
                return (
                  <DropdownMenuItem
                    key={f.id}
                    className="flex items-center justify-between gap-2"
                    onClick={() => onLoad({ id: f.id, payload: f.filters })}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {f.is_default && (
                        <Star className="h-3 w-3 fill-warning text-warning" />
                      )}
                      {f.is_shared ? (
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
                        const active = !!sub;
                        return (
                          <button
                            type="button"
                            className={
                              active
                                ? "text-primary"
                                : "opacity-50 hover:opacity-100"
                            }
                            title={
                              active
                                ? `Notificações ativas (${[
                                    sub?.notify_inapp ? "in-app" : null,
                                    sub?.notify_push ? "push" : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" + ")})`
                                : "Receber notificação em tempo real"
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (active && sub) {
                                // Ciclo: in-app → in-app+push → off
                                if (sub.notify_inapp && !sub.notify_push) {
                                  if (!pushReady) await enablePush();
                                  updateChannels.mutate({
                                    id: sub.id,
                                    notifyInapp: true,
                                    notifyPush: true,
                                  });
                                } else {
                                  unsubscribe.mutate(sub.id);
                                }
                              } else {
                                subscribe.mutate({
                                  savedFilterId: f.id,
                                  notifyInapp: true,
                                  notifyPush: false,
                                });
                              }
                            }}
                          >
                            {active ? (
                              <Bell className="h-3 w-3" />
                            ) : (
                              <BellOff className="h-3 w-3" />
                            )}
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        className="opacity-50 hover:opacity-100"
                        title="Duplicar para minha biblioteca"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicate.mutate({ sourceId: f.id });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {owner && (
                        <button
                          type="button"
                          className="opacity-50 hover:opacity-100"
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
                          className="opacity-50 hover:opacity-100"
                          title="Definir como padrão"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefault.mutate(f.id);
                          }}
                        >
                          <Star className="h-3 w-3" />
                        </button>
                      )}
                      {owner && (
                        <button
                          type="button"
                          className="opacity-50 hover:opacity-100 hover:text-destructive"
                          title="Remover preset"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove.mutate(f.id);
                            if (f.id === activePresetId) onClear();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <Save className="h-3.5 w-3.5 mr-2" /> Salvar como novo…
            </DropdownMenuItem>
            {activePreset && isModified && isOwner(activePreset) && (
              <DropdownMenuItem onClick={handleOverwrite}>
                <Save className="h-3.5 w-3.5 mr-2" /> Sobrescrever &quot;
                {activePreset.name}&quot;
              </DropdownMenuItem>
            )}
            {activePreset && (
              <DropdownMenuItem onClick={onClear}>
                Limpar seleção
              </DropdownMenuItem>
            )}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
              Salvar
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveShare}
              disabled={
                updateSharing.isPending ||
                (shareDialogEnabled && !currentEmpresaId)
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
