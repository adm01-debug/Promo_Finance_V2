import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Download, FileJson, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import type {
  EntidadeRelacionada,
  PontoHistorico,
} from "@/hooks/useAnomaliaDetalhe";
import { useLogAudit } from "@/hooks/useAuditLog";

interface Props {
  anomalia: Anomalia;
  entidade: EntidadeRelacionada;
  historico: PontoHistorico[];
  relacionadas: Anomalia[];
}

interface Detector {
  nome: string;
  regra: string;
  observado: string;
  esperado: string;
  contribuicao: number;
}

// Mantém em sincronia com DetectoresContribuintesCard.buildDetectores
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

function buildResumoMarkdown(p: Props): string {
  const { anomalia, entidade, historico, relacionadas } = p;
  const detectores = buildDetectores(anomalia);
  const linhas: string[] = [];

  linhas.push(`# Evidências da anomalia ${anomalia.id}`);
  linhas.push("");
  linhas.push(`- **Tipo:** ${anomalia.tipo_anomalia}`);
  linhas.push(`- **Severidade:** ${anomalia.severidade}`);
  linhas.push(`- **Status:** ${anomalia.status}`);
  linhas.push(
    `- **Detectada em:** ${new Date(anomalia.detectada_em).toLocaleString("pt-BR")}`,
  );
  if (anomalia.empresa_id) linhas.push(`- **Empresa:** ${anomalia.empresa_id}`);
  if (anomalia.centro_custo_id)
    linhas.push(`- **Centro de custo:** ${anomalia.centro_custo_id}`);
  linhas.push(`- **Descrição:** ${anomalia.descricao}`);
  if (anomalia.observacoes)
    linhas.push(`- **Observações:** ${anomalia.observacoes}`);
  if (anomalia.bitrix_task_id)
    linhas.push(`- **Bitrix24 task:** #${anomalia.bitrix_task_id}`);
  linhas.push(
    `- **Exportado em:** ${new Date().toLocaleString("pt-BR")} por ${typeof window !== "undefined" ? window.location.host : "sistema"}`,
  );
  linhas.push("");

  linhas.push("## Detectores XAI");
  if (detectores.length === 0) {
    linhas.push("_Nenhum detector específico para este tipo._");
  } else {
    for (const d of detectores) {
      linhas.push(`### ${d.nome} (${d.contribuicao}%)`);
      linhas.push(`- **Regra:** ${d.regra}`);
      linhas.push(`- **Observado:** ${d.observado}`);
      linhas.push(`- **Esperado:** ${d.esperado}`);
    }
  }
  linhas.push("");

  linhas.push("## Entidade relacionada");
  linhas.push(`- **Tipo:** ${entidade.tipo}`);
  linhas.push(`- **Encontrada:** ${entidade.encontrada ? "sim" : "não"}`);
  if (entidade.rotaUI) linhas.push(`- **Rota:** ${entidade.rotaUI}`);
  if (entidade.registro) {
    linhas.push("```json");
    linhas.push(JSON.stringify(entidade.registro, null, 2));
    linhas.push("```");
  }
  linhas.push("");

  linhas.push(`## Histórico contextual (${historico.length} pontos)`);
  if (historico.length === 0) {
    linhas.push("_Sem histórico disponível._");
  } else {
    linhas.push("| Data | Valor | Descrição |");
    linhas.push("| --- | ---: | --- |");
    for (const h of historico.slice(0, 50)) {
      linhas.push(
        `| ${h.data} | ${Number(h.valor).toFixed(2)} | ${(h.descricao ?? "").replace(/\|/g, "\\|")} |`,
      );
    }
    if (historico.length > 50)
      linhas.push(`_… ${historico.length - 50} pontos adicionais omitidos._`);
  }
  linhas.push("");

  linhas.push(`## Anomalias relacionadas (${relacionadas.length})`);
  if (relacionadas.length === 0) {
    linhas.push("_Nenhuma._");
  } else {
    for (const r of relacionadas.slice(0, 20)) {
      linhas.push(
        `- [${r.severidade}] ${r.tipo_anomalia} — ${new Date(r.detectada_em).toLocaleString("pt-BR")} — ${r.id}`,
      );
    }
  }
  linhas.push("");

  linhas.push("## Payload bruto (dados)");
  linhas.push("```json");
  linhas.push(JSON.stringify(anomalia.dados ?? {}, null, 2));
  linhas.push("```");

  return linhas.join("\n");
}

function buildResumoJson(p: Props) {
  const { anomalia, entidade, historico, relacionadas } = p;
  return {
    exportadoEm: new Date().toISOString(),
    anomalia: {
      id: anomalia.id,
      tipo: anomalia.tipo_anomalia,
      severidade: anomalia.severidade,
      status: anomalia.status,
      detectadaEm: anomalia.detectada_em,
      empresaId: anomalia.empresa_id,
      centroCustoId: anomalia.centro_custo_id,
      descricao: anomalia.descricao,
      observacoes: anomalia.observacoes,
      bitrixTaskId: anomalia.bitrix_task_id,
    },
    detectoresXAI: buildDetectores(anomalia),
    entidadeRelacionada: entidade,
    historico,
    anomaliasRelacionadas: relacionadas.map((r) => ({
      id: r.id,
      tipo: r.tipo_anomalia,
      severidade: r.severidade,
      status: r.status,
      detectadaEm: r.detectada_em,
    })),
    payload: anomalia.dados ?? {},
  };
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportarEvidenciasButton(props: Props) {
  const [open, setOpen] = useState(false);
  const audit = useLogAudit();

  const registrarAuditoria = (formato: "markdown" | "json", canal: "copy" | "download") => {
    audit
      .mutateAsync({
        action: "EXPORT",
        tableName: "anomalias_detectadas",
        recordId: props.anomalia.id,
        details: `Exportou evidências (${formato}/${canal}) — histórico=${props.historico.length} pontos, relacionadas=${props.relacionadas.length}`,
      })
      .catch(() => undefined);
  };

  const handleCopy = async (formato: "markdown" | "json") => {
    try {
      const conteudo =
        formato === "markdown"
          ? buildResumoMarkdown(props)
          : JSON.stringify(buildResumoJson(props), null, 2);
      await navigator.clipboard.writeText(conteudo);
      registrarAuditoria(formato, "copy");
      toast.success(
        `Resumo copiado (${formato === "markdown" ? "Markdown" : "JSON"})`,
      );
      setOpen(false);
    } catch {
      toast.error("Não foi possível copiar — verifique permissões do navegador");
    }
  };

  const handleDownload = (formato: "markdown" | "json") => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const baseName = `anomalia-${props.anomalia.id}-${stamp}`;
    if (formato === "markdown") {
      downloadBlob(buildResumoMarkdown(props), "text/markdown", `${baseName}.md`);
    } else {
      downloadBlob(
        JSON.stringify(buildResumoJson(props), null, 2),
        "application/json",
        `${baseName}.json`,
      );
    }
    registrarAuditoria(formato, "download");
    toast.success(`Arquivo ${formato.toUpperCase()} baixado`);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" /> Exportar evidências
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Compartilhar para auditoria</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleCopy("markdown")}>
          <Copy className="h-4 w-4 mr-2" /> Copiar resumo (Markdown)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy("json")}>
          <Copy className="h-4 w-4 mr-2" /> Copiar JSON estruturado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload("markdown")}>
          <FileText className="h-4 w-4 mr-2" /> Baixar .md
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("json")}>
          <FileJson className="h-4 w-4 mr-2" /> Baixar .json
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            handleDownload("markdown");
            handleDownload("json");
          }}
        >
          <Download className="h-4 w-4 mr-2" /> Baixar pacote (md + json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
