import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ChevronLeft, ChevronRight, Download, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuditFiltersBar, type FiltrosState } from "./AuditFiltersBar";
import { AuditDetailDialog } from "./AuditDetailDialog";
import {
  useTrilhaAuditoria,
  fetchTrilhaCompleto,
  fetchUsuariosTrilha,
  type TrilhaTipo,
} from "@/hooks/useTrilhaAuditoria";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";

const TIPO_TABLE: Record<TrilhaTipo, string> = {
  financeira: "auditoria_financeira",
  tributaria: "auditoria_tributaria",
  sistema: "audit_logs",
  conformidade: "verificacoes_conformidade",
};


interface ColunaDef {
  key: string;
  header: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface Props {
  tipo: TrilhaTipo;
  colunas: ColunaDef[];
  acoes?: { value: string; label: string }[];
  filename: string;
}

const TIPO_LABEL: Record<TrilhaTipo, string> = {
  financeira: "Financeira",
  tributaria: "Tributária",
  sistema: "Sistema",
  conformidade: "Conformidade Fiscal",
};

export function TrilhaTable({ tipo, colunas, acoes, filename }: Props) {
  const [filtros, setFiltros] = useState<FiltrosState>({
    inicio: "",
    fim: "",
    busca: "",
    acao: "todas",
    usuario: "",
  });
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<Record<string, unknown> | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const filtrosNorm = {
    inicio: filtros.inicio || undefined,
    fim: filtros.fim || undefined,
    busca: filtros.busca || undefined,
    acao: filtros.acao || undefined,
    usuario: filtros.usuario || undefined,
  };

  const { data, isLoading } = useTrilhaAuditoria(tipo, { ...filtrosNorm, pagina });

  const { data: usuarios } = useQuery({
    queryKey: ["trilha-usuarios", tipo],
    queryFn: () => fetchUsuariosTrilha(tipo),
    staleTime: 5 * 60 * 1000,
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / 50));

  // Deep-link: quando ?record=<id> e ?tab=<tipo> vierem da URL (ex.: clique
  // no toast em tempo real), localiza e abre o registro automaticamente.
  useEffect(() => {
    const recordId = searchParams.get("record");
    const tabParam = searchParams.get("tab");
    if (!recordId || tabParam !== tipo) return;

    let cancelled = false;
    (async () => {
      const local = (data?.rows ?? []).find(
        (r) => (r as { id?: string }).id === recordId,
      );
      if (local) {
        setDetalhe(local);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: row, error } = await (supabase as any)
          .from(TIPO_TABLE[tipo])
          .select("*")
          .eq("id", recordId)
          .maybeSingle();
        if (cancelled) return;
        if (!error && row) setDetalhe(row as Record<string, unknown>);
        else toast.error("Registro de auditoria não encontrado");
      }
      const next = new URLSearchParams(searchParams);
      next.delete("record");
      setSearchParams(next, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tipo, data?.rows]);


  const construirLinhas = (rows: Record<string, unknown>[]) =>
    rows.map((r) => {
      const obj: Record<string, string> = {};
      colunas.forEach((c) => {
        const v = r[c.key];
        obj[c.header] = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      });
      return obj;
    });

  const colunasExport: ExportColumn<Record<string, string>>[] = colunas.map((c) => ({
    header: c.header,
    key: c.header,
  }));

  const periodoSuffix =
    filtros.inicio && filtros.fim ? `_${filtros.inicio}_${filtros.fim}` : "";
  const tituloPDF = `Trilha de Auditoria — ${TIPO_LABEL[tipo]}${
    filtros.inicio && filtros.fim ? ` (${filtros.inicio} a ${filtros.fim})` : ""
  }`;

  const handleExport = async (formato: "csv" | "pdf") => {
    try {
      setExporting(formato);
      const { rows, truncado, cap } = await fetchTrilhaCompleto(tipo, filtrosNorm);
      if (rows.length === 0) {
        toast.warning("Nada para exportar com os filtros atuais.");
        return;
      }
      const linhas = construirLinhas(rows);
      const nome = `${filename}${periodoSuffix}`;
      if (formato === "csv") exportToCSV(linhas, colunasExport, nome);
      else exportToPDF(linhas, colunasExport, tituloPDF);
      if (truncado) {
        toast.warning(
          `Exportação limitada a ${cap.toLocaleString("pt-BR")} registros. Refine o período para incluir todos.`,
        );
      } else {
        toast.success(`${rows.length.toLocaleString("pt-BR")} registros exportados.`);
      }
    } catch (e) {
      toast.error("Falha ao exportar", { description: (e as Error).message });
    } finally {
      setExporting(null);
    }
  };

  // Reset pagina quando filtros mudam
  useEffect(() => {
    setPagina(1);
  }, [filtros.inicio, filtros.fim, filtros.busca, filtros.acao, filtros.usuario]);

  return (
    <div className="space-y-3">
      <AuditFiltersBar value={filtros} onChange={setFiltros} acoes={acoes} usuarios={usuarios} storageKey={`trilha-${tipo}`} />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${total.toLocaleString("pt-BR")} eventos`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={!data?.rows.length || !!exporting}>
                  {exporting ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
                  <FileText className="h-4 w-4" /> Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {colunas.map((c) => (
                    <TableHead key={c.key}>{c.header}</TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.rows ?? []).map((row, i) => (
                  <TableRow key={(row.id as string) ?? i}>
                    {colunas.map((c) => (
                      <TableCell key={c.key} className="text-sm">
                        {c.render ? c.render(row) : (row[c.key] as string) ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => setDetalhe(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.rows || data.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={colunas.length + 1} className="text-center py-8 text-muted-foreground">
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-xs text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuditDetailDialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)} registro={detalhe} />
    </div>
  );
}

export type { ColunaDef };
