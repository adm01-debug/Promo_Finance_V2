import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { History, ArrowRight } from "lucide-react";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

export function AnomaliasRelacionadasCard({ lista }: { lista: Anomalia[] }) {
  return (
    <Card className="border-l-4 border-l-secondary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <History className="h-4 w-4 text-secondary" /> Outras anomalias relacionadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Nenhuma anomalia adicional para esta entidade.
          </p>
        ) : (
          <ul className="space-y-3">
            {lista.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 border-l-2 border-primary/40 pl-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        a.severidade === "critica" || a.severidade === "alta"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {a.severidade}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(a.detectada_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm leading-snug truncate">{a.descricao}</p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={`Abrir anomalia: ${a.descricao}`}
                  title="Abrir anomalia relacionada"
                >
                  <Link to={`/admin/insights-ia/anomalia/${a.id}`} aria-label={`Abrir anomalia: ${a.descricao}`}>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
