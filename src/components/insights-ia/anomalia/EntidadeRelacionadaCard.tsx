import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Database } from "lucide-react";
import { Link } from "react-router-dom";
import type { EntidadeRelacionada } from "@/hooks/useAnomaliaDetalhe";

export function EntidadeRelacionadaCard({ entidade }: { entidade: EntidadeRelacionada }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" /> Entidade relacionada
          <span className="text-xs text-muted-foreground font-normal">({entidade.tipo})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!entidade.encontrada ? (
          <p className="text-sm text-muted-foreground">
            Registro não localizado ou já removido.
          </p>
        ) : (
          <div className="space-y-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(entidade.registro ?? {})
                .filter(([k]) => !["created_at", "updated_at"].includes(k))
                .slice(0, 10)
                .map(([k, v]) => (
                  <div key={k} className="border rounded-md px-2 py-1.5">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-mono text-xs truncate">
                      {v === null || v === undefined
                        ? "—"
                        : typeof v === "object"
                        ? JSON.stringify(v)
                        : String(v)}
                    </dd>
                  </div>
                ))}
            </dl>
            {entidade.rotaUI && (
              <Button asChild size="sm" variant="outline">
                <Link to={entidade.rotaUI}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Abrir tela completa
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
