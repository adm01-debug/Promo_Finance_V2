import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

export type { Anomalia };

export interface ReviewQueueProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Filtra a fila por severidade antes do snapshot. "todas" inclui todas.
   * Default: "todas".
   */
  severidadeFilter?: Anomalia["severidade"] | "todas";
}

export interface ConflitoBanner {
  anomaliaId: string;
  severidade: Anomalia["severidade"];
  tipoLabel: string;
  descricao: string;
  statusLabel: string;
  acaoLabel: string;
  autorNome: string;
  autorEmail: string | null;
  resolvidaEm: string | null;
  motivo: "ja_resolvida" | "removida";
}

export interface ReviewStats {
  confirmadas: number;
  rejeitadas: number;
  puladas: number;
}

export interface ProgressoPorSeveridade {
  total: Record<Anomalia["severidade"], number>;
  revisado: Record<Anomalia["severidade"], number>;
}

export const SEVERIDADES = ["critica", "alta", "media", "baixa"] as const;
export const MIN_CONFIRMAR = 10;
export const MIN_FALSO_POSITIVO = 15;
