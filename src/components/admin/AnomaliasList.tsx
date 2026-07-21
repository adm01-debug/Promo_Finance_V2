import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  Microscope,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ReabrirAnomaliaDialog } from "@/components/insights-ia/anomalia/ReabrirAnomaliaDialog";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { formatProfileLabel, type ProfileMini } from "@/hooks/useProfilesByIds";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import { severidadeBadge, TIPO_LABEL } from "./AnomaliasDetectadasPanel.helpers";

interface AtualizarStatusMutation {
  mutate: (
    input: { id: string; status: Anomalia["status"] },
    options?: { onSuccess?: () => void },
  ) => void;
  isPending: boolean;
}

interface SincronizarMutation {
  mutate: (input: { anomaliaId: string; evento: string }) => void;
}




export interface AnomaliasListProps {
  lista: Anomalia[];
  isLoading: boolean;
  isVisible: (key: string) => boolean;
  profilesMap: Map<string, ProfileEntry> | undefined;
  selecionados: Set<string>;
  toggleSelecionado: (id: string) => void;
  limparSelecao: () => void;
  setSelecionados: React.Dispatch<React.SetStateAction<Set<string>>>;
  onOpenReabrirLote: () => void;
  atualizarStatus: AtualizarStatusMutation;
  sincronizar: SincronizarMutation;
  onInvestigarNavigate: (id: string) => void;
}

export function AnomaliasList({
  lista,
  isLoading,
  isVisible,
  profilesMap,
  selecionados,
  toggleSelecionado,
  limparSelecao,
  setSelecionados,
  onOpenReabrirLote,
  atualizarStatus,
  sincronizar,
  onInvestigarNavigate,
}: AnomaliasListProps) {
  const idsReabriveis = lista
    .filter((a) => a.status === "confirmada" || a.status === "falso_positivo")
    .map((a) => a.id);
  const setReabriveis = new Set(idsReabriveis);
  const selecionadosVisiveis = idsReabriveis.filter((id) => selecionados.has(id));
  const allSelected =
    idsReabriveis.length > 0 && selecionadosVisiveis.length === idsReabriveis.length;
  const someSelected = selecionadosVisiveis.length > 0 && !allSelected;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelecionados((prev) => {
        const next = new Set(prev);
        idsReabriveis.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelecionados((prev) => {
        const next = new Set(prev);
        idsReabriveis.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  return (
    <>
      {idsReabriveis.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-md border border-border bg-muted/40">
          <Checkbox
            id="anomalias-select-all"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={handleToggleAll}
            aria-label="Selecionar todas as anomalias reabríveis visíveis"
          />
          <label
            htmlFor="anomalias-select-all"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            {selecionadosVisiveis.length > 0
              ? `${selecionadosVisiveis.length} de ${idsReabriveis.length} selecionada(s) para reabertura`
              : `Selecionar para reabrir em lote (${idsReabriveis.length} reabrível${idsReabriveis.length === 1 ? "" : "is"})`}
          </label>
          <div className="ml-auto flex items-center gap-2">
            {selecionadosVisiveis.length > 0 && (
              <Button variant="ghost" size="sm" onClick={limparSelecao}>
                <X className="h-3 w-3 mr-1" /> Limpar seleção
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={selecionadosVisiveis.length === 0}
              onClick={onOpenReabrirLote}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reabrir {selecionadosVisiveis.length || ""} em lote
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          ✓ Nenhuma anomalia neste filtro.
        </p>
      ) : (
        <div className="space-y-2">
          {lista.map((a) => {
            const podeSelecionar = setReabriveis.has(a.id);
            const selecionado = selecionados.has(a.id);
            return (
              <div
                key={a.id}
                className={`p-3 rounded-md border bg-card flex items-start justify-between gap-3 ${
                  selecionado ? "border-primary/60 ring-1 ring-primary/30" : ""
                }`}
              >
                {podeSelecionar && (
                  <Checkbox
                    checked={selecionado}
                    onChange={() => toggleSelecionado(a.id)}
                    className="mt-1 shrink-0"
                    aria-label={`Selecionar anomalia ${a.descricao}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={severidadeBadge(a.severidade)}>
                      {a.severidade}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {TIPO_LABEL[a.tipo_anomalia]}
                    </Badge>
                    {isVisible("data") && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.detectada_em).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{a.descricao}</p>
                  {isVisible("observacoes") && a.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {a.observacoes}
                    </p>
                  )}
                  {(a.status === "confirmada" || a.status === "falso_positivo") &&
                    a.resolvida_por && (
                      <p
                        className="text-[11px] text-muted-foreground mt-1"
                        title={profilesMap?.get(a.resolvida_por)?.email ?? undefined}
                      >
                        {a.status === "confirmada"
                          ? "Confirmada"
                          : "Marcada falso positivo"}{" "}
                        por{" "}
                        <span className="font-medium text-foreground">
                          {formatProfileLabel(profilesMap?.get(a.resolvida_por))}
                        </span>
                        {a.resolvida_em && (
                          <>
                            {" · "}
                            {new Date(a.resolvida_em).toLocaleString("pt-BR")}
                          </>
                        )}
                      </p>
                    )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => dispatchOpenAnomaliaDrawer(a.id)}
                  >
                    <Microscope className="h-3 w-3 mr-1" /> Drill-down
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to={`/admin/insights-ia/anomalia/${a.id}`}
                      target="_blank"
                    >
                      <Microscope className="h-3 w-3 mr-1" /> Nova aba
                    </Link>
                  </Button>
                </div>
                {isVisible("acoes_inline") && a.status === "nova" && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        atualizarStatus.mutate({ id: a.id, status: "investigando" });
                        onInvestigarNavigate(a.id);
                      }}
                      disabled={atualizarStatus.isPending}
                    >
                      <Search className="h-3 w-3 mr-1" /> Investigar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        atualizarStatus.mutate(
                          { id: a.id, status: "falso_positivo" },
                          {
                            onSuccess: () =>
                              sincronizar.mutate({
                                anomaliaId: a.id,
                                evento: "falso_positivo",
                              }),
                          },
                        )
                      }
                    >
                      <Eye className="h-3 w-3 mr-1" /> Falso +
                    </Button>
                  </div>
                )}
                {isVisible("acoes_inline") && a.status === "investigando" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      atualizarStatus.mutate(
                        { id: a.id, status: "confirmada" },
                        {
                          onSuccess: () =>
                            sincronizar.mutate({
                              anomaliaId: a.id,
                              evento: "confirmada",
                            }),
                        },
                      )
                    }
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                  </Button>
                )}
                {isVisible("acoes_inline") &&
                  (a.status === "confirmada" || a.status === "falso_positivo") && (
                    <ReabrirAnomaliaDialog anomaliaId={a.id} />
                  )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
