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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bookmark, Star, Trash2, Save, ChevronDown } from "lucide-react";
import {
  useSavedFilters,
  type SavedFilterPayload,
} from "@/hooks/useSavedFilters";

interface SavedFiltersBarProps<T> {
  entityType: string;
  currentState: SavedFilterPayload<T>;
  activePresetId: string | null;
  onLoad: (preset: { id: string; payload: SavedFilterPayload<T> }) => void;
  onClear: () => void;
}

export function SavedFiltersBar<T>({
  entityType,
  currentState,
  activePresetId,
  onLoad,
  onClear,
}: SavedFiltersBarProps<T>) {
  const { filters, save, remove, setDefault } = useSavedFilters<T>(entityType);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

  const activePreset = useMemo(
    () => filters.find((f) => f.id === activePresetId) ?? null,
    [filters, activePresetId],
  );

  const isModified = useMemo(() => {
    if (!activePreset) return false;
    return JSON.stringify(activePreset.filters) !== JSON.stringify(currentState);
  }, [activePreset, currentState]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    await save.mutateAsync({
      name: trimmed,
      payload: currentState,
      isDefault: makeDefault,
    });
    setDialogOpen(false);
    setName("");
    setMakeDefault(false);
  };

  const handleOverwrite = async () => {
    if (!activePreset) return;
    await save.mutateAsync({
      name: activePreset.name,
      payload: currentState,
      isDefault: activePreset.is_default,
    });
  };

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
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs">
              Filtros salvos
            </DropdownMenuLabel>
            {filters.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Nenhum preset salvo ainda
              </div>
            ) : (
              filters.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  className="flex items-center justify-between gap-2"
                  onClick={() => onLoad({ id: f.id, payload: f.filters })}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {f.is_default && (
                      <Star className="h-3 w-3 fill-warning text-warning" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {!f.is_default && (
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
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <Save className="h-3.5 w-3.5 mr-2" /> Salvar como novo…
            </DropdownMenuItem>
            {activePreset && isModified && (
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
            <div className="flex items-center gap-2">
              <Checkbox
                id="default"
                checked={makeDefault}
                onCheckedChange={(v) => setMakeDefault(!!v)}
              />
              <Label htmlFor="default" className="text-sm font-normal">
                Aplicar automaticamente ao abrir esta tela
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={name.trim().length < 2 || save.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
