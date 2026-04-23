import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain } from "lucide-react";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

interface Detector {
  nome: string;
  regra: string;
  observado: string;
  esperado: string;
  contribuicao: number;
}

function buildDetectores(a: Anomalia): Detector[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (a.dados ?? {}) as any;
  switch (a.tipo_anomalia) {
    case "movimentacao_outlier":
      return [
        {
          nome: "Outlier estatístico (3σ)",
          regra: "valor > média + 3 × desvio padrão (30d)",
          observado: `R$ ${Number(d.valor ?? 0).toFixed(2)}`,
          esperado: `≤ R$ ${Number(d.limite ?? 0).toFixed(2)} (média R$ ${Number(d.media ?? 0).toFixed(2)})`,
          contribuicao: 100,
        },
      ];
    case "pagamento_duplicado":
      return [
        {
          nome: "Chave duplicada",
          regra: "fornecedor + valor + vencimento idênticos em 7d",
          observado: `${(d.ids ?? []).length} ocorrências`,
          esperado: "1 ocorrência",
          contribuicao: 100,
        },
      ];
    case "conta_pagar_alta":
      return [
        {
          nome: "Acima de p95 da empresa",
          regra: "valor > 1.5 × p95 das contas a pagar (30d)",
          observado: `R$ ${Number(d.valor ?? 0).toFixed(2)}`,
          esperado: `≤ R$ ${(Number(d.p95 ?? 0) * 1.5).toFixed(2)} (p95: R$ ${Number(d.p95 ?? 0).toFixed(2)})`,
          contribuicao: 100,
        },
      ];
    case "conciliacao_atrasada":
      return [
        {
          nome: "Janela de conciliação excedida",
          regra: "transação bancária não conciliada > 30 dias",
          observado: `Data: ${d.data ?? "—"} | R$ ${Number(d.valor ?? 0).toFixed(2)}`,
          esperado: "Conciliada em até 30 dias",
          contribuicao: 100,
        },
      ];
    case "mudanca_regime_brusca":
      return [
        {
          nome: "Variação MoM da carga tributária",
          regra: "|Δ% mês a mês| > 30%",
          observado: `${Number(d.variacao_pct ?? 0).toFixed(1)}% (de ${Number(d.anterior ?? 0).toFixed(2)}% → ${Number(d.atual ?? 0).toFixed(2)}%)`,
          esperado: "Variação ≤ 30%",
          contribuicao: 100,
        },
      ];
    default:
      return [];
  }
}

export function DetectoresContribuintesCard({ anomalia }: { anomalia: Anomalia }) {
  const detectores = buildDetectores(anomalia);
  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Brain className="h-4 w-4 text-warning" /> Detectores que contribuíram (XAI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detectores.map((d, i) => (
          <div key={i} className="space-y-2 p-3 border border-border rounded-md bg-muted/40">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{d.nome}</h4>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {d.contribuicao}%
              </span>
            </div>
            <Progress value={d.contribuicao} className="h-1.5" />
            <p className="font-mono text-[11px] text-muted-foreground">Regra: {d.regra}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Observado: </span>
                <span className="font-medium tabular-nums">{d.observado}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Esperado: </span>
                <span className="font-medium tabular-nums">{d.esperado}</span>
              </div>
            </div>
          </div>
        ))}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Payload bruto (JSON)
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
            {JSON.stringify(anomalia.dados, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
