// Hook de derivações para AnomaliasDetectadasPanel — extrai memos pesados
// para reduzir o tamanho do componente principal (modularização #4).
import { useMemo } from "react";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import type { ReaberturaInfo } from "@/hooks/useAnomaliasReabertasIndex";
import {
  useProfilesByIds,
  formatProfileLabel,
} from "@/hooks/useProfilesByIds";
import type { ViewExportColumn } from "@/components/shared/ViewExportButton";
import type {
  SearchSuggestion,
  SeverityPreview,
} from "@/components/shared/AdvancedSearchPopover";
import {
  SEV_RANK,
  TIPO_LABEL,
  SORT_OPTIONS,
  type AnomaliaFilters,
} from "./AnomaliasDetectadasPanel.helpers";

export interface UseAnomaliasPanelDerivationsInput {
  data: Anomalia[] | undefined;
  filters: AnomaliaFilters;
  sort: { key: string; dir: "asc" | "desc" };
  searchTerm: string;
  visibleCols: string[];
  activePresetId: string | null;
  pendentes: Anomalia[];
  reabertasIndex: Map<string, ReaberturaInfo> | undefined;
  recentSearches: string[];
}

export function useAnomaliasPanelDerivations({
  data,
  filters,
  sort,
  searchTerm,
  visibleCols,
  activePresetId,
  pendentes,
  reabertasIndex,
  recentSearches,
}: UseAnomaliasPanelDerivationsInput) {
  const listaBase = useMemo(() => {
    let arr = data ?? [];
    if (filters.severidades.length > 0)
      arr = arr.filter((a) => filters.severidades.includes(a.severidade));
    if (filters.tipos.length > 0)
      arr = arr.filter((a) => filters.tipos.includes(a.tipo_anomalia));
    if (filters.periodoInicio) {
      const ini = new Date(filters.periodoInicio).getTime();
      arr = arr.filter((a) => new Date(a.detectada_em).getTime() >= ini);
    }
    if (filters.periodoFim) {
      const fim = new Date(filters.periodoFim).getTime() + 86_400_000;
      arr = arr.filter((a) => new Date(a.detectada_em).getTime() <= fim);
    }
    if (filters.apenasReabertas) {
      arr = arr.filter((a) => reabertasIndex?.has(a.id));
    }
    return arr;
  }, [data, filters, reabertasIndex]);

  const lista = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let arr = listaBase;
    if (term) {
      arr = arr.filter((a) => {
        const tipoLabel = (TIPO_LABEL[a.tipo_anomalia] ?? "").toLowerCase();
        return (
          (a.descricao ?? "").toLowerCase().includes(term) ||
          (a.observacoes ?? "").toLowerCase().includes(term) ||
          a.tipo_anomalia.toLowerCase().includes(term) ||
          tipoLabel.includes(term) ||
          a.severidade.toLowerCase().includes(term)
        );
      });
    }
    const sorted = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sort.key === "severidade") {
        cmp = SEV_RANK[a.severidade] - SEV_RANK[b.severidade];
      } else if (sort.key === "tipo_anomalia") {
        cmp = a.tipo_anomalia.localeCompare(b.tipo_anomalia);
      } else if (sort.key === "ultima_reabertura") {
        const ta = reabertasIndex?.get(a.id)?.ultima_reabertura;
        const tb = reabertasIndex?.get(b.id)?.ultima_reabertura;
        const va = ta ? new Date(ta).getTime() : Number.NEGATIVE_INFINITY;
        const vb = tb ? new Date(tb).getTime() : Number.NEGATIVE_INFINITY;
        cmp = va - vb;
      } else {
        cmp =
          new Date(a.detectada_em).getTime() -
          new Date(b.detectada_em).getTime();
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [listaBase, searchTerm, sort, reabertasIndex]);

  const pendentesPorSev = useMemo(() => {
    const acc: Record<Anomalia["severidade"] | "todas", number> = {
      todas: pendentes.length,
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (const a of pendentes) acc[a.severidade] += 1;
    return acc;
  }, [pendentes]);

  const { data: profilesMap } = useProfilesByIds(
    lista.map((a) => a.resolvida_por),
  );

  const exportColumns = useMemo<ViewExportColumn<Anomalia>[]>(() => {
    const all: ViewExportColumn<Anomalia>[] = [
      { key: "severidade", header: "Severidade", accessor: (a) => a.severidade },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (a) => TIPO_LABEL[a.tipo_anomalia] ?? a.tipo_anomalia,
      },
      {
        key: "data",
        header: "Detectada em",
        accessor: (a) => new Date(a.detectada_em).toLocaleString("pt-BR"),
      },
      { key: "descricao", header: "Descrição", accessor: (a) => a.descricao ?? "" },
      {
        key: "observacoes",
        header: "Observações",
        accessor: (a) => a.observacoes ?? "",
      },
    ];
    const auditCols: ViewExportColumn<Anomalia>[] = [
      { key: "status", header: "Status", accessor: (a) => a.status },
      {
        key: "resolvida_por",
        header: "Resolvida por",
        accessor: (a) =>
          a.resolvida_por
            ? formatProfileLabel(profilesMap?.get(a.resolvida_por))
            : "",
      },
      {
        key: "resolvida_em",
        header: "Resolvida em",
        accessor: (a) =>
          a.resolvida_em ? new Date(a.resolvida_em).toLocaleString("pt-BR") : "",
      },
    ];
    return [...all.filter((c) => visibleCols.includes(c.key)), ...auditCols];
  }, [visibleCols, profilesMap]);

  const exportMeta = useMemo(() => {
    const sortLabel =
      SORT_OPTIONS.find((o) => o.key === sort.key)?.label ?? sort.key;
    return {
      ordenacao: `${sortLabel} (${sort.dir === "asc" ? "asc" : "desc"})`,
      periodo:
        filters.periodoInicio || filters.periodoFim
          ? `${filters.periodoInicio || "—"} até ${filters.periodoFim || "—"}`
          : "Sem período definido",
      filtros: {
        Status: filters.status,
        Severidades: filters.severidades.join(", ") || "todas",
        Tipos: filters.tipos.map((t) => TIPO_LABEL[t]).join(", ") || "todos",
        Colunas: visibleCols.join(", "),
      },
    };
  }, [filters, sort, visibleCols]);

  const severityPreview = useMemo<SeverityPreview[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    const source = term
      ? listaBase.filter((a) => {
          const tipoLabel = (TIPO_LABEL[a.tipo_anomalia] ?? "").toLowerCase();
          return (
            (a.descricao ?? "").toLowerCase().includes(term) ||
            (a.observacoes ?? "").toLowerCase().includes(term) ||
            a.tipo_anomalia.toLowerCase().includes(term) ||
            tipoLabel.includes(term) ||
            a.severidade.toLowerCase().includes(term)
          );
        })
      : listaBase;
    const counts: Record<Anomalia["severidade"], number> = {
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (const a of source) counts[a.severidade] += 1;
    return [
      { key: "critica", label: "crítica", count: counts.critica, variant: "destructive" },
      { key: "alta", label: "alta", count: counts.alta, variant: "destructive" },
      { key: "media", label: "média", count: counts.media, variant: "secondary" },
      { key: "baixa", label: "baixa", count: counts.baixa, variant: "outline" },
    ];
  }, [listaBase, searchTerm]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const tiposCount = new Map<Anomalia["tipo_anomalia"], number>();
    const descSet = new Set<string>();
    for (const a of listaBase) {
      tiposCount.set(a.tipo_anomalia, (tiposCount.get(a.tipo_anomalia) ?? 0) + 1);
      if (a.descricao && a.descricao.length <= 80) descSet.add(a.descricao);
    }
    const recent: SearchSuggestion[] = recentSearches.slice(0, 4).map((q) => ({
      label: q,
      value: q,
      group: "Recente",
    }));
    const tipos: SearchSuggestion[] = Array.from(tiposCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, count]) => ({
        label: TIPO_LABEL[tipo] ?? tipo,
        value: TIPO_LABEL[tipo] ?? tipo,
        group: "Tipo",
        count,
      }));
    const descricoes: SearchSuggestion[] = Array.from(descSet)
      .slice(0, 6)
      .map((d) => ({ label: d, value: d, group: "Descrição" }));
    return [...recent, ...tipos, ...descricoes];
  }, [listaBase, recentSearches]);

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.periodoInicio || filters.periodoFim) {
      parts.push(
        `Período: ${filters.periodoInicio || "—"} → ${filters.periodoFim || "—"}`,
      );
    } else {
      parts.push("Todo o período");
    }
    if (activePresetId) parts.push("Preset ativo");
    if (filters.severidades.length > 0)
      parts.push(`${filters.severidades.length} severidade(s)`);
    if (filters.tipos.length > 0) parts.push(`${filters.tipos.length} tipo(s)`);
    return parts.join(" · ");
  }, [filters, activePresetId]);

  const activeFilterCount =
    filters.severidades.length +
    filters.tipos.length +
    (filters.periodoInicio ? 1 : 0) +
    (filters.periodoFim ? 1 : 0) +
    (filters.apenasReabertas ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  return {
    listaBase,
    lista,
    pendentesPorSev,
    profilesMap,
    exportColumns,
    exportMeta,
    severityPreview,
    searchSuggestions,
    scopeLabel,
    activeFilterCount,
  };
}
