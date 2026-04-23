import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Database, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { EntidadeRelacionada } from "@/hooks/useAnomaliaDetalhe";
import { EntidadeDetalheDrawer } from "./EntidadeDetalheDrawer";

const MONO_KEYS = new Set(["id", "uuid", "external_id", "bitrix_id"]);

export function EntidadeRelacionadaCard({ entidade }: { entidade: EntidadeRelacionada }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Database className="h-4 w-4 text-primary" /> Entidade relacionada
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entidade.tipo}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!entidade.encontrada ? (
            <p className="text-sm text-muted-foreground">
              Registro não localizado ou já removido.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(entidade.registro ?? {})
                  .filter(([k]) => !["created_at", "updated_at"].includes(k))
                  .slice(0, 10)
                  .map(([k, v]) => {
                    const isMono = MONO_KEYS.has(k) || k.endsWith("_id");
                    return (
                      <div key={k} className="space-y-1 border border-border rounded-md p-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {k}
                        </dt>
                        <dd
                          className={
                            isMono
                              ? "font-mono text-xs truncate"
                              : "text-xs tabular-nums truncate"
                          }
                        >
                          {v === null || v === undefined
                            ? "—"
                            : typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v)}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Ver detalhes da entidade relacionada"
                  title="Ver detalhes"
                >
                  <Eye className="h-3 w-3 mr-1" aria-hidden="true" /> Ver detalhes
                </Button>
                {entidade.rotaUI && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    aria-label="Abrir tela completa da entidade"
                    title="Abrir tela completa"
                  >
                    <Link to={entidade.rotaUI}>
                      <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> Abrir tela completa
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EntidadeDetalheDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entidade={entidade}
      />
    </>
  );
}
