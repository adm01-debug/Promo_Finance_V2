import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

export const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

export type SeveridadeBadgeVariant = "destructive" | "secondary" | "outline";

export function severidadeBadge(s: Anomalia["severidade"]): SeveridadeBadgeVariant {
  if (s === "critica" || s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
}

export function tempoDecorrido(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / 86_400_000);
  if (dias >= 1) return `há ${dias} dia${dias > 1 ? "s" : ""}`;
  const horas = Math.floor(ms / 3_600_000);
  if (horas >= 1) return `há ${horas}h`;
  const min = Math.floor(ms / 60_000);
  return `há ${min}min`;
}

export function truncarDescricao(descricao: string, limite = 80): string {
  return descricao.length > limite ? `${descricao.slice(0, limite)}…` : descricao;
}

/** Mensagem de validação do comentário (mínimo de caracteres por ação). */
export function mensagemErro(comentarioTrim: string, min: number, label: string): string | null {
  if (comentarioTrim.length >= min) return null;
  if (comentarioTrim.length === 0)
    return `Informe um comentário para ${label} (mínimo ${min} caracteres).`;
  const faltam = min - comentarioTrim.length;
  return `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para ${label} (mínimo ${min}).`;
}
