import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { AuditFiltersBar, type FiltrosState } from "./AuditFiltersBar";
import { AuditDetailDialog } from "./AuditDetailDialog";
import { useTrilhaAuditoria, type TrilhaTipo } from "@/hooks/useTrilhaAuditoria";
import { exportToCSV } from "@/lib/export-utils";

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

export function TrilhaTable({ tipo, colunas, acoes, filename }: Props) {
  const [filtros, setFiltros] = useState<FiltrosState>({ inicio: "", fim: "", busca: "", acao: "todas" });
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useTrilhaAuditoria(tipo, {
    inicio: filtros.inicio || undefined,
    fim: filtros.fim || undefined,
    busca: filtros.busca || undefined,
    acao: filtros.acao || undefined,
    pagina,
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / 50));

  const handleExport = () => {
    const rows = (data?.rows ?? []).map((r) => {
      const obj: Record<string, string> = {};
      colunas.forEach((c) => {
        const v = r[c.key];
        obj[c.header] = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      });
      return obj;
    });
    exportToCSV(
      rows,
      colunas.map((c) => ({ header: c.header, key: c.header })),
      filename
    );
  };

  return (
    <div className="space-y-3">
      <AuditFiltersBar
        value={filtros}
        onChange={(v) => {
          setFiltros(v);
          setPagina(1);
        }}
        acoes={acoes}
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${total.toLocaleString("pt-BR")} eventos`}
            </span>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!data?.rows.length}>
              <Download className="h-3 w-3 mr-1" /> Exportar CSV
            </Button>
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
              <Button size="sm" variant="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
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
