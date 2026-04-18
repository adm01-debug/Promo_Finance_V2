// ============================================
// COMPONENT: DRETributariaPanel (P10)
// ============================================
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { useDRETributaria } from "@/hooks/useDRETributaria";

interface Props {
  empresaId: string;
}

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export function DRETributariaPanel({ empresaId }: Props) {
  const now = new Date();
  const [periodo, setPeriodo] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const { data: dre, isLoading } = useDRETributaria(empresaId, periodo);

  const exportCSV = () => {
    if (!dre) return;
    const rows: [string, string][] = [
      ["Período", dre.periodo],
      ["Receita Bruta", formatBRL(dre.receita_bruta)],
      ["(-) CBS", formatBRL(dre.deducoes.cbs)],
      ["(-) IBS", formatBRL(dre.deducoes.ibs)],
      ["(-) Imposto Seletivo", formatBRL(dre.deducoes.imposto_seletivo)],
      ["(-) PIS", formatBRL(dre.deducoes.pis)],
      ["(-) COFINS", formatBRL(dre.deducoes.cofins)],
      ["(-) ICMS", formatBRL(dre.deducoes.icms)],
      ["(-) ISS", formatBRL(dre.deducoes.iss)],
      ["(=) Receita Líquida", formatBRL(dre.receita_liquida)],
      ["(-) Custos", formatBRL(dre.custos)],
      ["(=) Lucro Bruto", formatBRL(dre.lucro_bruto)],
      ["(-) IRPJ", formatBRL(dre.irpj)],
      ["(-) CSLL", formatBRL(dre.csll)],
      ["(=) Lucro Líquido", formatBRL(dre.lucro_liquido)],
      ["Carga Tributária %", `${dre.carga_tributaria_pct.toFixed(2)}%`],
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dre-tributaria-${dre.periodo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>DRE Tributária</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={!dre}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {!isLoading && !dre && (
          <p className="text-sm text-muted-foreground">Sem dados para o período.</p>
        )}
        {dre && (
          <div className="space-y-1">
            <Row label="Receita Bruta" value={dre.receita_bruta} bold />
            <Section title="Deduções fiscais (CBS/IBS/IS/PIS/COFINS/ICMS/ISS)" />
            <Row label="(-) CBS" value={-dre.deducoes.cbs} muted />
            <Row label="(-) IBS" value={-dre.deducoes.ibs} muted />
            <Row label="(-) Imposto Seletivo" value={-dre.deducoes.imposto_seletivo} muted />
            <Row label="(-) PIS" value={-dre.deducoes.pis} muted />
            <Row label="(-) COFINS" value={-dre.deducoes.cofins} muted />
            <Row label="(-) ICMS" value={-dre.deducoes.icms} muted />
            <Row label="(-) ISS" value={-dre.deducoes.iss} muted />
            <Row label="(=) Receita Líquida" value={dre.receita_liquida} bold />
            <Row label="(-) Custos" value={-dre.custos} muted />
            <Row label="(=) Lucro Bruto" value={dre.lucro_bruto} bold />
            <Row label="(-) IRPJ" value={-dre.irpj} muted />
            <Row label="(-) CSLL" value={-dre.csll} muted />
            <Row label="(=) Lucro Líquido Tributário" value={dre.lucro_liquido} bold highlight />

            <div className="mt-4 flex items-center justify-between p-3 rounded-md bg-muted">
              <span className="text-sm">Carga tributária total</span>
              <Badge variant="secondary">{dre.carga_tributaria_pct.toFixed(2)}%</Badge>
            </div>

            {dre.comparativo_regime_otimo && (
              <div className="mt-4 p-3 rounded-md border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {dre.comparativo_regime_otimo.economia_potencial > 0
                    ? <TrendingDown className="h-4 w-4 text-success" />
                    : <TrendingUp className="h-4 w-4 text-destructive" />}
                  Comparativo regime ótimo: <Badge>{dre.comparativo_regime_otimo.regime}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Tributos estimados (regime ótimo, mensal):{" "}
                  <strong>{formatBRL(dre.comparativo_regime_otimo.tributos_estimados)}</strong>
                </div>
                <div className="text-sm">
                  Economia potencial:{" "}
                  <strong className={dre.comparativo_regime_otimo.economia_potencial > 0 ? "text-success" : "text-destructive"}>
                    {formatBRL(dre.comparativo_regime_otimo.economia_potencial)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold, muted, highlight }: { label: string; value: number; bold?: boolean; muted?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded ${highlight ? "bg-primary/10" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : ""} ${muted ? "text-muted-foreground" : ""}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-semibold" : ""} ${value < 0 ? "text-destructive" : ""}`}>
        {formatBRL(value)}
      </span>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <div className="text-xs uppercase tracking-wide text-muted-foreground mt-3 mb-1 px-2">{title}</div>;
}
