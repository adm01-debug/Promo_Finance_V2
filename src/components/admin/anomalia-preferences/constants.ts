import type { Severidade, ToastAcoes, DrawerAcoes } from "@/hooks/useAnomaliaPreferences";

export const TIPOS = [
  { value: "movimentacao_outlier", label: "Movimentação atípica" },
  { value: "pagamento_duplicado", label: "Pagamento duplicado" },
  { value: "conta_pagar_alta", label: "Conta a pagar alta" },
  { value: "conciliacao_atrasada", label: "Conciliação atrasada" },
  { value: "mudanca_regime_brusca", label: "Variação brusca de regime" },
] as const;

export const SEVERIDADES: Array<{ value: Severidade; label: string; hint: string }> = [
  { value: "critica", label: "Crítica", hint: "Risco financeiro imediato" },
  { value: "alta", label: "Alta", hint: "Requer atenção em horas" },
  { value: "media", label: "Média", hint: "Anomalias relevantes" },
  { value: "baixa", label: "Baixa", hint: "Apenas informativas" },
];

export const TOAST_ACOES_OPTIONS: Array<{ key: keyof ToastAcoes; label: string; hint: string }> = [
  { key: "drill_down", label: "Drill-down", hint: "Abre o drawer lateral" },
  { key: "abrir_pagina", label: "Abrir página", hint: "Vai para a página completa" },
  { key: "copiar_id", label: "Copiar ID", hint: "Copia o ID da anomalia" },
  { key: "marcar_lida", label: "Marcar lida", hint: "Move para investigando" },
];

export const DRAWER_ACOES_OPTIONS: Array<{ key: keyof DrawerAcoes; label: string; hint: string }> = [
  { key: "abrir_entidade", label: "Abrir transação completa", hint: "Link para a entidade origem" },
  { key: "pagina_completa", label: "Página completa", hint: "Sai do drawer e abre /anomalia/:id" },
  { key: "copiar_id", label: "Copiar ID", hint: "Copia o ID da anomalia" },
  { key: "marcar_lida", label: "Marcar lida", hint: "Move para investigando" },
];
