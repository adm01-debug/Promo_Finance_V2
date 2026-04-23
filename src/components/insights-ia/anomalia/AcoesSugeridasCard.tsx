import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Save } from "lucide-react";
import { Link } from "react-router-dom";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import { useAnomaliasDetectadas } from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";

interface AcaoSugerida {
  titulo: string;
  descricao: string;
  rota?: string;
  cta?: string;
}

function acoesPara(a: Anomalia): AcaoSugerida[] {
  switch (a.tipo_anomalia) {
    case "movimentacao_outlier":
      return [
        {
          titulo: "Validar com responsável",
          descricao: "Confirme com o operador que registrou a movimentação se o valor está correto.",
          rota: "/movimentacoes",
          cta: "Abrir movimentações",
        },
        {
          titulo: "Comparar com série histórica",
          descricao: "Verifique se há justificativa contábil (sazonalidade, evento único).",
        },
      ];
    case "pagamento_duplicado":
      return [
        {
          titulo: "Cancelar pagamento duplicado",
          descricao: "Identifique qual conta é a duplicata e marque-a como cancelada antes do vencimento.",
          rota: "/contas-pagar",
          cta: "Ir para contas a pagar",
        },
        {
          titulo: "Verificar fornecedor",
          descricao: "Notifique o fornecedor sobre a possível emissão duplicada.",
        },
      ];
    case "conta_pagar_alta":
      return [
        {
          titulo: "Solicitar aprovação adicional",
          descricao: "Submeta para fluxo de aprovação caso ultrapasse threshold definido.",
          rota: "/aprovacoes",
          cta: "Fluxo de aprovação",
        },
        {
          titulo: "Comparar histórico do fornecedor",
          descricao: "Avalie variação contra média de pagamentos anteriores ao mesmo fornecedor.",
          rota: "/fornecedores",
          cta: "Ver fornecedores",
        },
      ];
    case "conciliacao_atrasada":
      return [
        {
          titulo: "Executar conciliação assistida por IA",
          descricao: "Use o motor de conciliação para sugerir matches e reduzir backlog.",
          rota: "/conciliacao",
          cta: "Abrir conciliação",
        },
        {
          titulo: "Revisar regras automáticas",
          descricao: "Verifique se há regras existentes que deveriam ter resolvido este caso.",
        },
      ];
    case "mudanca_regime_brusca":
      return [
        {
          titulo: "Recalcular regime tributário",
          descricao: "Rode a simulação atualizada para confirmar o melhor enquadramento.",
          rota: "/tributario/simulacao-regimes",
          cta: "Simular regimes",
        },
        {
          titulo: "Auditar lançamentos do mês",
          descricao: "Verifique se houve erro de classificação ou evento extraordinário.",
          rota: "/relatorios",
          cta: "Ver relatórios",
        },
      ];
    default:
      return [];
  }
}

export function AcoesSugeridasCard({ anomalia }: { anomalia: Anomalia }) {
  const [obs, setObs] = useState(anomalia.observacoes ?? "");
  const { atualizarStatus } = useAnomaliasDetectadas();
  const sincronizar = useSincronizarAnomaliaBitrix();
  const acoes = acoesPara(anomalia);

  return (
    <Card className="border-l-4 border-l-success">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Lightbulb className="h-4 w-4 text-success" /> Ações sugeridas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {acoes.map((a, i) => (
            <div key={i} className="border border-border rounded-md p-3 bg-muted/40">
              <h4 className="text-sm font-semibold tracking-tight">{a.titulo}</h4>
              <p className="text-xs text-muted-foreground mt-1">{a.descricao}</p>
              {a.rota && a.cta && (
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link to={a.rota}>{a.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label
            htmlFor="obs"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Parecer / observações
          </label>
          <Textarea
            id="obs"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Registre o resultado da investigação..."
            rows={3}
          />
          <Button
            size="sm"
            onClick={() =>
              atualizarStatus.mutate(
                {
                  id: anomalia.id,
                  status: anomalia.status === "nova" ? "investigando" : anomalia.status,
                  observacoes: obs,
                },
                {
                  onSuccess: () =>
                    sincronizar.mutate({ anomaliaId: anomalia.id, evento: "parecer" }),
                },
              )
            }
            disabled={atualizarStatus.isPending}
          >
            <Save className="h-3 w-3 mr-1" /> Salvar parecer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
