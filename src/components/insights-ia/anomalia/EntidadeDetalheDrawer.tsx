import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, X, Database, Copy, LayoutGrid, FileJson } from "lucide-react";
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

/** Campos-chave priorizados para a visão resumida (chips). */
const KEY_FIELDS = [
  "id",
  "descricao",
  "valor",
  "data",
  "data_movimentacao",
  "data_vencimento",
  "vencimento",
  "status",
  "fornecedor_nome",
  "cliente_nome",
  "categoria",
  "tipo",
];

type ViewMode = "resumo" | "completo";

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function formatChip(k: string, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && (k.includes("valor") || k.includes("preco"))) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  return formatValue(v);
}

export function EntidadeDetalheDrawer({ open, onOpenChange, entidade }: Props) {
  const label = ENTIDADE_LABEL[entidade.tipo] ?? entidade.tipo;
  const registro = entidade.registro ?? {};
  const entries = Object.entries(registro);
  const [view, setView] = useState<ViewMode>("resumo");

  const keyEntries = KEY_FIELDS.map((k) => [k, registro[k]] as const).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

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

        {entidade.encontrada && entries.length > 0 && (
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as ViewMode)}
            className="mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo" className="gap-1.5" aria-label="Visualização resumida">
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> Resumo
              </TabsTrigger>
              <TabsTrigger value="completo" className="gap-1.5" aria-label="Visualização completa">
                <FileJson className="h-3.5 w-3.5" aria-hidden="true" /> Completo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          {!entidade.encontrada ? (
            <p className="text-sm text-muted-foreground text-center">
              Registro não localizado ou já removido.
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              Sem campos disponíveis para exibição.
            </p>
          ) : view === "resumo" ? (
            <div className="space-y-4">
              {keyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum campo-chave disponível. Use a aba "Completo".
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keyEntries.map(([k, v]) => (
                    <div
                      key={k}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {k}
                      </span>
                      <span className="text-xs font-medium tabular-nums">
                        {formatChip(k, v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {entries.length} campo(s) no total. Veja todos na aba "Completo".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-2">
                {entries.map(([k, v]) => {
                  const isMono = k === "id" || k.endsWith("_id") || k === "uuid";
                  const isNumeric = typeof v === "number";
                  return (
                    <div
                      key={k}
                      className="space-y-1 border border-border rounded-md p-3 bg-muted/40"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {k}
                      </dt>
                      <dd
                        className={
                          isMono
                            ? "font-mono text-xs break-all whitespace-pre-wrap"
                            : isNumeric
                            ? "text-xs tabular-nums break-all whitespace-pre-wrap"
                            : "text-xs break-all whitespace-pre-wrap"
                        }
                      >
                        {formatValue(v)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <details className="space-y-2 text-xs pt-4 border-t border-border">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver JSON bruto
                </summary>
                <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify(registro, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="gap-2 sm:gap-2 flex-wrap border-t border-border pt-4">
          {entidade.encontrada && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              aria-label="Copiar JSON do registro"
              title="Copiar JSON"
            >
              <Copy className="h-3 w-3 mr-1" aria-hidden="true" /> Copiar JSON
            </Button>
          )}
          {entidade.rotaUI && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              aria-label="Abrir tela completa da entidade"
              title="Abrir tela completa"
            >
              <Link to={entidade.rotaUI} onClick={() => onOpenChange(false)}>
                <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> Abrir tela completa
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar painel"
            title="Fechar"
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" /> Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
