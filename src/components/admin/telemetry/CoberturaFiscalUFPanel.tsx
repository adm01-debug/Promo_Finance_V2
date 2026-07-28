import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Map, RefreshCw } from "lucide-react";

/** Cobertura consolidada de catálogos fiscais para uma UF. */
interface CoberturaUF {
  uf: string;
  nome: string;
  regiao: string;
  uf_atualizado_em: string | null;
  aliquotas_internas: number;
  aliquotas_internas_atualizado_em: string | null;
  iss_municipios: number;
  iss_registros: number;
  iss_atualizado_em: string | null;
  protocolos_st: number;
  protocolos_st_atualizado_em: string | null;
  beneficios_fiscais: number;
  beneficios_atualizado_em: string | null;
}

/** Totais nacionais (catálogos sem recorte por UF). */
interface CoberturaGlobais {
  cnaes: number;
  cnaes_atualizado_em: string | null;
  ncms: number;
  ncms_atualizado_em: string | null;
  ncms_st: number;
  protocolos_st: number;
  protocolos_st_ncms: number;
  itens_lista_iss: number;
  ufs_total: number;
}

interface CoberturaFiscalPayload {
  gerado_em: string;
  globais: CoberturaGlobais;
  ufs: CoberturaUF[];
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Célula numérica que sinaliza gap (zero registros) com estilo destrutivo. */
function CelulaContagem({ valor, sufixo }: { valor: number; sufixo?: string }) {
  const vazio = valor === 0;
  return (
    <span className={vazio ? "font-medium text-destructive" : "text-foreground"}>
      {valor}
      {sufixo ? ` ${sufixo}` : ""}
    </span>
  );
}

/**
 * Painel administrativo de cobertura dos dados fiscais por UF.
 * Consome a RPC `get_cobertura_fiscal_uf` (restrita a admins) e evidencia
 * gaps (catálogos zerados) e a data da última atualização de cada fonte.
 */
export function CoberturaFiscalUFPanel() {
  const [somenteGaps, setSomenteGaps] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<CoberturaFiscalPayload>({
      queryKey: ["cobertura-fiscal-uf"],
      queryFn: async () => {
        const { data, error } = await supabaseDyn.rpc<CoberturaFiscalPayload>(
          "get_cobertura_fiscal_uf",
          {},
        );
        if (error) throw error;
        return data as CoberturaFiscalPayload;
      },
      staleTime: 300_000,
    });

  const ufs = useMemo(() => data?.ufs ?? [], [data]);

  const ufsComGap = useMemo(
    () =>
      ufs.filter(
        (u) =>
          u.aliquotas_internas === 0 ||
          u.iss_municipios === 0 ||
          u.protocolos_st === 0,
      ),
    [ufs],
  );

  const listaExibida = somenteGaps ? ufsComGap : ufs;
  const globais = data?.globais;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Cobertura de dados fiscais por UF</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isRefetching}
          aria-label="Atualizar cobertura fiscal por UF"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span className="ml-2">Atualizar</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a cobertura fiscal. Esta visão é restrita a
            administradores.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">CNAEs</p>
                <p className="text-2xl font-semibold text-foreground">
                  {globais?.cnaes ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Atualizado em {formatarData(globais?.cnaes_atualizado_em ?? null)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">NCMs</p>
                <p className="text-2xl font-semibold text-foreground">
                  {globais?.ncms ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {globais?.ncms_st ?? 0} sujeitos a ST ·{" "}
                  {formatarData(globais?.ncms_atualizado_em ?? null)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Itens lista ISS</p>
                <p className="text-2xl font-semibold text-foreground">
                  {globais?.itens_lista_iss ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">LC 116/2003</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Protocolos ST</p>
                <p className="text-2xl font-semibold text-foreground">
                  {globais?.protocolos_st ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {globais?.protocolos_st_ncms ?? 0} vínculos com NCM
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={ufsComGap.length > 0 ? "destructive" : "secondary"}>
                {ufsComGap.length} UF(s) com gap
              </Badge>
              <Badge variant="outline">{ufs.length} UFs mapeadas</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSomenteGaps((v) => !v)}
                aria-pressed={somenteGaps}
              >
                {somenteGaps ? "Mostrar todas" : "Mostrar somente gaps"}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UF</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead className="text-right">Alíq. internas</TableHead>
                    <TableHead className="text-right">ISS municipal</TableHead>
                    <TableHead className="text-right">Protocolos ST</TableHead>
                    <TableHead className="text-right">Benefícios</TableHead>
                    <TableHead className="text-right">Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaExibida.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        Nenhuma UF com gaps de catálogo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    listaExibida.map((u) => (
                      <TableRow key={u.uf}>
                        <TableCell className="font-medium">
                          {u.uf}
                          <span className="ml-2 text-xs text-muted-foreground">{u.nome}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.regiao}
                        </TableCell>
                        <TableCell className="text-right">
                          <CelulaContagem valor={u.aliquotas_internas} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CelulaContagem valor={u.iss_municipios} sufixo="mun." />
                        </TableCell>
                        <TableCell className="text-right">
                          <CelulaContagem valor={u.protocolos_st} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CelulaContagem valor={u.beneficios_fiscais} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatarData(
                            u.iss_atualizado_em ??
                              u.aliquotas_internas_atualizado_em ??
                              u.uf_atualizado_em,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Consulta gerada em {formatarData(data?.gerado_em ?? null)} · valores em
              vermelho indicam ausência total de dados para a UF.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
