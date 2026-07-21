import { Loader2, AlertCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { RoleCheckboxGroup } from "./RoleCheckboxGroup";
import type { AppRole } from "@/hooks/useSavedFilters";

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  makeDefault: boolean;
  onMakeDefaultChange: (v: boolean) => void;
  shareEnabled: boolean;
  onShareEnabledChange: (v: boolean) => void;
  shareRoles: AppRole[];
  onShareRolesChange: (roles: AppRole[]) => void;
  currentEmpresaId: string | null | undefined;
  isSaving: boolean;
  saveError: string | null;
  onCancel: () => void;
  onSave: () => void;
}

export function SavePresetDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  makeDefault,
  onMakeDefaultChange,
  shareEnabled,
  onShareEnabledChange,
  shareRoles,
  onShareRolesChange,
  currentEmpresaId,
  isSaving,
  saveError,
  onCancel,
  onSave,
}: SavePresetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex.: Críticas dos últimos 7 dias"
              autoFocus
            />
          </div>
          <Checkbox
            id="default"
            checked={makeDefault}
            onChange={(e) => onMakeDefaultChange((e.target as HTMLInputElement).checked)}
            label="Aplicar automaticamente ao abrir esta tela"
          />
          <div className="border-t pt-3 space-y-2">
            <Checkbox
              id="share"
              checked={shareEnabled}
              onChange={(e) => onShareEnabledChange((e.target as HTMLInputElement).checked)}
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
                <RoleCheckboxGroup
                  idPrefix="role"
                  roles={shareRoles}
                  onChange={onShareRolesChange}
                />
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
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={name.trim().length < 2 || isSaving || (shareEnabled && !currentEmpresaId)}
          >
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
