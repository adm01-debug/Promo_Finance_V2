import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, LineChart, RefreshCw } from "lucide-react";

/** Linha retornada por public.get_catalogos_tributarios_history (admin-only). */
interface HistoricoDia {
  dia: string;
  criticos: number;
  avisos: number;
  infos: number;
  total_invariantes: number;
  saudavel: boolean;
}

const JANELAS = [7, 30, 90] as const;

function formatarDia(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Série temporal das invariantes violadas nos catálogos tributários.
 *
 * Cada ponto é o retrato diário gravado pela rotina
 * `check_catalogos_tributarios_invariants` no ciclo de integridade, permitindo
 * distinguir regressões pontuais de degradação sustentada dos seeds fiscais.
 */
export function CatalogosTributariosHistoryPanel() {
  const [dias, setDias] = useState<(typeof JANELAS)[number]>(30);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<HistoricoDia[]>({
    queryKey: ["catalogos-tributarios-history", dias],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc(
        "get_catalogos_tributarios_history",
        { _dias: dias },
      );
      if (error) throw error;
      return (data ?? []) as HistoricoDia[];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const resumo = useMemo(() => {
    const linhas = data ?? [];
    const diasComCritico = linhas.filter((l) => l.criticos > 0).length;
    const ultimo = linhas.at(-1) ?? null;
    return { total: linhas.length, diasComCritico, ultimo };
  }, [data]);

  const serie = useMemo(
    () => (data ?? []).map((l) => ({ ...l, rotulo: formatarDia(l.dia) })),
    [data],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LineChart className="h-5 w-5 text-primary" aria-hidden />
          Histórico de Saúde Fiscal
        </CardTitle>
        <div className="flex items-center gap-1">
          {JANELAS.map((j) => (
            <Button
              key={j}
              size="sm"
              variant={j === dias ? "default" : "outline"}
              onClick={() => setDias(j)}
              aria-pressed={j === dias}
            >
              {j}d
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Recarregar histórico de saúde fiscal"
          >
            <RefreshCw className={isRefetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Histórico indisponível — requer papel administrador.
          </p>
        ) : serie.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum retrato diário registrado ainda. O primeiro ponto será gravado
            na próxima execução do ciclo de integridade.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  resumo.diasComCritico > 0
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-success/30 bg-success/10 text-success"
                }
              >
                {resumo.diasComCritico > 0 ? (
                  <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden />
                )}
                {resumo.diasComCritico} de {resumo.total} dias com crítico
              </Badge>
              {resumo.ultimo && (
                <span className="text-xs text-muted-foreground">
                  Último retrato: {formatarDia(resumo.ultimo.dia)} —{" "}
                  {resumo.ultimo.criticos} crítico(s), {resumo.ultimo.avisos} aviso(s)
                </span>
              )}
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} stroke="currentColor" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" />
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avisos"
                    name="Avisos"
                    stackId="1"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning) / 0.25)"
                  />
                  <Area
                    type="monotone"
                    dataKey="criticos"
                    name="Críticos"
                    stackId="1"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive) / 0.3)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CatalogosTributariosHistoryPanel;
