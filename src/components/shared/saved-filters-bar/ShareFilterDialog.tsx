import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RoleCheckboxGroup } from "./RoleCheckboxGroup";
import type { AppRole, SavedFilterRow } from "@/hooks/useSavedFilters";

interface ShareFilterDialogProps<T> {
  target: SavedFilterRow<T> | null;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  roles: AppRole[];
  onRolesChange: (roles: AppRole[]) => void;
  currentEmpresaId: string | null | undefined;
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
}

export function ShareFilterDialog<T>({
  target,
  enabled,
  onEnabledChange,
  roles,
  onRolesChange,
  currentEmpresaId,
  isSaving,
  error,
  onCancel,
  onSave,
}: ShareFilterDialogProps<T>) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar &quot;{target?.name}&quot;</DialogTitle>
          <DialogDescription>
            Outros usuários da mesma empresa que tiverem o papel selecionado
            poderão visualizar e duplicar este preset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Checkbox
            id="share-edit"
            checked={enabled}
            onChange={(e) => onEnabledChange((e.target as HTMLInputElement).checked)}
            label="Compartilhar com a equipe da empresa atual"
          />
          {enabled && (
            <div className="pl-6 space-y-2">
              {!currentEmpresaId && (
                <p className="text-xs text-destructive">
                  Selecione uma empresa atual para poder compartilhar.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Papéis com acesso (vazio = todos):
              </p>
              <RoleCheckboxGroup idPrefix="share-role" roles={roles} onChange={onRolesChange} />
            </div>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving || (enabled && !currentEmpresaId)}>
            {isSaving ? (
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
  );
}
