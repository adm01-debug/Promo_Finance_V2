import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SavedFilterRow } from "@/hooks/useSavedFilters";

interface RestoreConfirmDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFilter: SavedFilterRow<T> | null | undefined;
  isModified: boolean;
  activePreset: SavedFilterRow<T> | null;
  onConfirm: () => void;
}

export function RestoreConfirmDialog<T>({
  open,
  onOpenChange,
  defaultFilter,
  isModified,
  activePreset,
  onConfirm,
}: RestoreConfirmDialogProps<T>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {defaultFilter
              ? `Restaurar preset padrão "${defaultFilter.name}"?`
              : "Voltar ao estado inicial?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {defaultFilter
              ? "Suas alterações atuais nos filtros, ordenação e colunas visíveis serão substituídas pelo preset padrão. Esta ação não pode ser desfeita."
              : "Suas alterações atuais nos filtros, ordenação e colunas visíveis serão descartadas e o painel voltará à configuração inicial. Esta ação não pode ser desfeita."}
            {isModified && activePreset && (
              <span className="block mt-2 text-warning">
                Você tem alterações não salvas em "{activePreset.name}".
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            {defaultFilter ? "Restaurar padrão" : "Voltar ao inicial"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
