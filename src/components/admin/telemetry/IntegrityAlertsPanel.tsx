import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseDyn } from "@/lib/supabase-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/** Linha retornada por public.get_integrity_alerts (admin-only). */
interface IntegrityAlertRow {
  id: string;
  domain: string;
  invariant: string;
  severity: "critical" | "warning" | "info" | string;
  affected_count: number | null;
  reason: string | null;
  sample_ids: string[] | null;
  alert_hour: string;
  resolved_at: string | null;
  created_at: string;
}

const DOMAIN_LABEL: Record<string, string> = {
  entrega: "Entregas",
  screening: "Triagem de motoristas",
  financeiro: "Financeiro",
  nfe: "NF-e (XML)",
  nfe_sefaz: "SEFAZ DF-e",
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function severityBadge(severity: string) {
  if (severity === "critical") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        <ShieldAlert className="h-3 w-3 mr-1" /> Crítico
      </Badge>
    );
  }
  if (severity === "warning") {
    return (
      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
        <AlertTriangle className="h-3 w-3 mr-1" /> Atenção
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      Info
    </Badge>
  );
}

/**
 * Exibe os invariantes de integridade de dados detectados pelo ciclo horário
 * (run_integrity_cycle). Sem este painel os alertas ficavam apenas no banco.
 */
export function IntegrityAlertsPanel() {
  const [hours, setHours] = useState(24);
  const [somenteAbertos, setSomenteAbertos] = useState(true);
  const queryClient = useQueryClient();

  const { data = [], isLoading, refetch, isRefetching } = useQuery<IntegrityAlertRow[]>({
    queryKey: ["integrity-alerts", hours, somenteAbertos],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<IntegrityAlertRow[]>("get_integrity_alerts", {
        p_hours: hours,
        p_only_open: somenteAbertos,
      });
      if (error) throw error;
      return ((data as unknown as IntegrityAlertRow[]) || []).sort((a, b) => {
        const resolvido = Number(Boolean(a.resolved_at)) - Number(Boolean(b.resolved_at));
        if (resolvido !== 0) return resolvido;
        return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      });
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const resolver = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("integrity_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta marcado como resolvido");
      queryClient.invalidateQueries({ queryKey: ["integrity-alerts"] });
    },
    onError: (e: Error) => toast.error(`Falha ao resolver: ${e.message}`),
  });

  const counts = useMemo(() => {
    const abertos = data.filter((d) => !d.resolved_at);
    return {
      critical: abertos.filter((d) => d.severity === "critical").length,
      warning: abertos.filter((d) => d.severity === "warning").length,
      resolvidos: data.filter((d) => d.resolved_at).length,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Integridade de dados
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {counts.critical ? (
              <Badge variant="destructive" className="text-[10px]">
                {counts.critical} crítico{counts.critical > 1 ? "s" : ""}
              </Badge>
            ) : null}
            {counts.warning ? (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                {counts.warning} atenção
              </Badge>
            ) : null}
            {counts.resolvidos ? (
              <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {counts.resolvidos} encerrado
                {counts.resolvidos > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={somenteAbertos ? "outline" : "secondary"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setSomenteAbertos((v) => !v)}
            aria-pressed={!somenteAbertos}
          >
            {somenteAbertos ? "Mostrar encerrados" : "Ocultar encerrados"}
          </Button>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="text-xs bg-background border rounded px-2 py-1"
            aria-label="Período dos invariantes"
          >
            <option value={24}>24h</option>
            <option value={72}>3 dias</option>
            <option value={168}>7 dias</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Atualizar invariantes"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando invariantes…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ Nenhuma inconsistência {somenteAbertos ? "em aberto " : ""}no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Severidade</th>
                  <th className="text-left py-2 font-medium">Domínio</th>
                  <th className="text-left py-2 font-medium">Invariante</th>
                  <th className="text-right py-2 font-medium">Afetados</th>
                  <th className="text-right py-2 font-medium">Hora</th>
                  <th className="text-right py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-muted/40 ${r.resolved_at ? "opacity-60" : ""}`}
                  >
                    <td className="py-2">
                      {r.resolved_at ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500/40 text-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Encerrado
                        </Badge>
                      ) : (
                        severityBadge(r.severity)
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {DOMAIN_LABEL[r.domain] ?? r.domain}
                    </td>
                    <td className="py-2 max-w-md">
                      <div className="truncate" title={r.reason || r.invariant}>
                        {r.reason || r.invariant}
                      </div>
                      <div className="text-muted-foreground/70 text-[10px] font-mono truncate">
                        {r.invariant}
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.affected_count ?? "—"}</td>
                    <td className="py-2 text-right text-muted-foreground whitespace-nowrap">
                      {new Date(r.alert_hour).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 text-right">
                      {r.resolved_at ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px]"
                          disabled={resolver.isPending}
                          onClick={() => resolver.mutate(r.id)}
                        >
                          Resolver
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
