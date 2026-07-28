import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, AlertTriangle, Radar } from "lucide-react";

/** Linha retornada por public.get_acessos_suspeitos (admin-only). */
export interface AcessoSuspeitoRow {
  id: string;
  tipo: "cross_tenant" | "admin_pico" | "admin_fora_horario" | "delecao_massa" | string;
  severidade: "critical" | "warning" | "info" | string;
  janela_inicio: string;
  janela_fim: string;
  user_id: string | null;
  user_email: string | null;
  empresa_id: string | null;
  table_name: string | null;
  ocorrencias: number;
  baseline: number | null;
  detalhes: Record<string, unknown> | null;
  revisado_em: string | null;
  created_at: string;
}

const TIPO_LABEL: Record<string, string> = {
  cross_tenant: "Acesso a outra empresa",
  admin_pico: "Pico de atividade admin",
  admin_fora_horario: "Atividade admin madrugada",
  delecao_massa: "Exclusão em massa",
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function severityBadge(severidade: string) {
  if (severidade === "critical") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        <ShieldAlert className="h-3 w-3 mr-1" /> Crítico
      </Badge>
    );
  }
  if (severidade === "warning") {
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
 * Achados da auditoria horária de acessos (public.auditar_acessos_cross_tenant):
 * leituras/escritas em dados de empresas às quais o usuário não pertence e
 * comportamento administrativo anômalo (picos, madrugada, exclusões em massa).
 */
export function AcessosSuspeitosPanel() {
  const [hours, setHours] = useState(168);
  const [somenteAbertos, setSomenteAbertos] = useState(true);

  const { data = [], isLoading, refetch, isRefetching } = useQuery<AcessoSuspeitoRow[]>({
    queryKey: ["acessos-suspeitos", hours, somenteAbertos],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<AcessoSuspeitoRow[]>("get_acessos_suspeitos", {
        _horas: hours,
        _somente_abertos: somenteAbertos,
      });
      if (error) throw error;
      return ((data as unknown as AcessoSuspeitoRow[]) || []).sort(
        (a, b) => (SEVERITY_ORDER[a.severidade] ?? 9) - (SEVERITY_ORDER[b.severidade] ?? 9),
      );
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
  });

  const counts = useMemo(
    () => ({
      critical: data.filter((d) => d.severidade === "critical").length,
      crossTenant: data.filter((d) => d.tipo === "cross_tenant").length,
    }),
    [data],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Auditoria de acessos
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {counts.critical ? (
              <Badge variant="destructive" className="text-[10px]">
                {counts.critical} crítico{counts.critical > 1 ? "s" : ""}
              </Badge>
            ) : null}
            {counts.crossTenant ? (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                {counts.crossTenant} entre empresas
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
            {somenteAbertos ? "Mostrar revisados" : "Ocultar revisados"}
          </Button>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="text-xs bg-background border rounded px-2 py-1"
            aria-label="Período da auditoria de acessos"
          >
            <option value={24}>24h</option>
            <option value={72}>3 dias</option>
            <option value={168}>7 dias</option>
            <option value={720}>30 dias</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Atualizar auditoria de acessos"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando achados…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ Nenhum acesso entre empresas ou uso administrativo anômalo no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Severidade</th>
                  <th className="text-left py-2 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Usuário</th>
                  <th className="text-left py-2 font-medium">Tabela</th>
                  <th className="text-right py-2 font-medium">Ocorrências</th>
                  <th className="text-right py-2 font-medium">Baseline/h</th>
                  <th className="text-right py-2 font-medium">Janela</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-muted/40 ${r.revisado_em ? "opacity-60" : ""}`}
                  >
                    <td className="py-2">{severityBadge(r.severidade)}</td>
                    <td className="py-2">{TIPO_LABEL[r.tipo] ?? r.tipo}</td>
                    <td className="py-2 font-mono text-[11px]">
                      {r.user_email ?? r.user_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="py-2 font-mono text-[11px]">{r.table_name ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{r.ocorrencias}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {r.baseline != null ? Number(r.baseline).toFixed(1) : "—"}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {new Date(r.janela_inicio).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
