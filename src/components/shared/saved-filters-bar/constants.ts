import type { AppRole } from "@/hooks/useSavedFilters";

export const ALL_ROLES: { key: AppRole; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "financeiro", label: "Financeiro" },
  { key: "operacional", label: "Operacional" },
  { key: "visualizador", label: "Visualizador" },
];

export const TIPOS_EVENTOS_ANOMALIAS = [
  { value: "movimentacao_outlier", label: "Movimentação atípica" },
  { value: "pagamento_duplicado", label: "Pagamento duplicado" },
  { value: "conta_pagar_alta", label: "Conta a pagar alta" },
  { value: "conciliacao_atrasada", label: "Conciliação atrasada" },
  { value: "mudanca_regime_brusca", label: "Variação brusca de regime" },
];
