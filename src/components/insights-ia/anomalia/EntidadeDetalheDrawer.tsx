import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, X, Database, Copy } from "lucide-react";
import { toast } from "sonner";
import type { EntidadeRelacionada } from "@/hooks/useAnomaliaDetalhe";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entidade: EntidadeRelacionada;
}

const ENTIDADE_LABEL: Record<string, string> = {
  movimentacao: "Movimentação",
  conta_pagar: "Conta a pagar",
  conta_receber: "Conta a receber",
  transacao_bancaria: "Transação bancária",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

/**
 * Inline drawer that shows the FULL related-entity record without
 * leaving the anomalia screen. The "Abrir tela completa" link is kept
 * as a secondary action in the footer for users who need full context.
 */
export function EntidadeDetalheDrawer({ open, onOpenChange, entidade }: Props) {
  const label = ENTIDADE_LABEL[entidade.tipo] ?? entidade.tipo;
  const registro = entidade.registro ?? {};
  const entries = Object.entries(registro);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(registro, null, 2));
      toast.success("Registro copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {label}
            <Badge variant="outline" className="font-mono text-xs">
              {entidade.tipo}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          {!entidade.encontrada ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Registro não localizado ou já removido.
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem campos disponíveis para exibição.
            </p>
          ) : (
            <dl className="grid grid-cols-1 gap-2">
              {entries.map(([k, v]) => (
                <div
                  key={k}
                  className="border rounded-md px-3 py-2 bg-muted/30"
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="font-mono text-xs break-all whitespace-pre-wrap mt-1">
                    {formatValue(v)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </ScrollArea>

        <SheetFooter className="gap-2 sm:gap-2 flex-wrap border-t pt-4">
          {entidade.encontrada && (
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
              <Copy className="h-3 w-3 mr-1" /> Copiar JSON
            </Button>
          )}
          {entidade.rotaUI && (
            <Button asChild variant="secondary" size="sm">
              <Link
                to={entidade.rotaUI}
                onClick={() => onOpenChange(false)}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Abrir tela completa
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3 w-3 mr-1" /> Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
