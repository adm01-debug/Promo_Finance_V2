import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, RefreshCw, AlertTriangle, Clock, Infinity as InfinityIcon } from "lucide-react";

/** Linha retornada por public.get_retencao_politicas_status (admin-only). */
export interface RetencaoPoliticaStatus {
  tabela: string;
  coluna: string | null;
  dias: number | null;
  filtro: string | null;
  motivo: string | null;
  ativo: boolean;
  /** Política existe, mas declara guarda indefinida (dias = null) com justificativa. */
  isenta: boolean;
  tem_politica: boolean;
  total_linhas: number | null;
  /** Registros já além do TTL, aguardando a próxima execução do cron. */
  linhas_vencidas: number | null;
  registro_mais_antigo: string | null;
  atualizado_em: string | null;
}

type Filtro = "todas" | "sem_politica" | "vencidas" | "isentas";

const FILTROS: ReadonlyArray<{ id: Filtro; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "sem_politica", label: "Sem política" },
  { id: "vencidas", label: "Com pendência" },
  { id: "isentas", label: "Isentas" },
];

function formatarNumero(valor: number | null): string {
  return valor == null ? "—" : valor.toLocaleString("pt-BR");
}

function formatarTTL(linha: RetencaoPoliticaStatus): string {
  if (!linha.tem_politica) return "não definido";
  if (linha.dias == null) return "guarda indefinida";
  if (linha.dias >= 365) return `${Math.round(linha.dias / 365)} ano(s)`;
  return `${linha.dias} dias`;
}

function nomeCurto(tabela: string): string {
  return tabela.replace(/^public\./, "");
}

/**
 * Governança de retenção (Gate #35/#36): expõe, por tabela de log, o TTL vigente,
 * o volume atual e quantos registros já estão vencidos aguardando purga.
 *
 * O cálculo roda no servidor (`get_retencao_politicas_status`) porque as tabelas
 * envolvidas têm RLS restritiva e contagens diretas do cliente retornariam zero.
 */
export function RetentionPoliciesPanel() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<RetencaoPoliticaStatus[]>({
    queryKey: ["retencao-politicas-status"],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<RetencaoPoliticaStatus[]>(
        "get_retencao_politicas_status",
      );
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const resumo = useMemo(() => {
    const semPolitica = data.filter((l) => !l.tem_politica).length;
    const isentas = data.filter((l) => l.isenta).length;
    const pendentes = data.filter((l) => (l.linhas_vencidas ?? 0) > 0);
    const totalVencidas = pendentes.reduce((acc, l) => acc + (l.linhas_vencidas ?? 0), 0);
    const totalLinhas = data.reduce((acc, l) => acc + (l.total_linhas ?? 0), 0);
    return { semPolitica, isentas, pendentes: pendentes.length, totalVencidas, totalLinhas };
  }, [data]);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return data
      .filter((l) => {
        if (filtro === "sem_politica" && l.tem_politica) return false;
        if (filtro === "vencidas" && (l.linhas_vencidas ?? 0) === 0) return false;
        if (filtro === "isentas" && !l.isenta) return false;
        return termo === "" || l.tabela.toLowerCase().includes(termo);
      })
      .sort((a, b) => {
        // Prioriza risco: sem política → pendências → volume.
        if (a.tem_politica !== b.tem_politica) return a.tem_politica ? 1 : -1;
        const dv = (b.linhas_vencidas ?? 0) - (a.linhas_vencidas ?? 0);
        if (dv !== 0) return dv;
        return (b.total_linhas ?? 0) - (a.total_linhas ?? 0);
      });
  }, [data, filtro, busca]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Políticas de retenção
          {isLoading ? null : resumo.semPolitica > 0 ? (
            <Badge variant="destructive" className="text-[10px]">
              {resumo.semPolitica} sem política
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              cobertura total
            </Badge>
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => void refetch()}
          disabled={isRefetching}
          aria-label="Recarregar políticas de retenção"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Tabelas governadas</p>
            <p className="text-lg font-semibold text-foreground">{data.length}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Registros vivos</p>
            <p className="text-lg font-semibold text-foreground">
              {formatarNumero(resumo.totalLinhas)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Aguardando purga</p>
            <p className="text-lg font-semibold text-foreground">
              {formatarNumero(resumo.totalVencidas)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Guarda indefinida</p>
            <p className="text-lg font-semibold text-foreground">{resumo.isentas}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1">
            {FILTROS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filtro === f.id ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por tabela…"
            aria-label="Filtrar políticas de retenção por tabela"
            className="h-8 text-xs sm:max-w-xs"
          />
        </div>

        {isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar as políticas de retenção.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando políticas…</p>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tabela para os filtros aplicados.</p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            <TooltipProvider>
              {linhas.map((l) => {
                const pendencia = (l.linhas_vencidas ?? 0) > 0;
                return (
                  <div
                    key={l.tabela}
                    className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!l.tem_politica ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        ) : l.isenta ? (
                          <InfinityIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-xs font-medium text-foreground">
                          {nomeCurto(l.tabela)}
                        </span>
                        <Badge
                          variant={l.tem_politica ? "outline" : "destructive"}
                          className="text-[10px] font-normal"
                        >
                          {formatarTTL(l)}
                        </Badge>
                        {l.tem_politica && !l.ativo && (
                          <Badge variant="secondary" className="text-[10px]">
                            inativa
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {l.motivo
                          ? l.motivo
                          : l.coluna
                            ? `coluna ${l.coluna}${l.filtro ? ` · filtro ${l.filtro}` : ""}`
                            : "sem coluna temporal configurada"}
                      </p>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-foreground">
                            {formatarNumero(l.total_linhas)}
                          </p>
                          <p
                            className={`text-[10px] ${pendencia ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {pendencia
                              ? `${formatarNumero(l.linhas_vencidas)} vencidos`
                              : "em dia"}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {formatarNumero(l.total_linhas)} registro(s)
                          {l.registro_mais_antigo
                            ? ` · mais antigo em ${new Date(l.registro_mais_antigo).toLocaleDateString("pt-BR")}`
                            : ""}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
