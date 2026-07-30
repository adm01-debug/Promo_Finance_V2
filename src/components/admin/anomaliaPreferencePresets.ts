import type {
  Severidade,
  ToastAcoes,
  DrawerAcoes,
} from "@/hooks/useAnomaliaPreferences";
import { TOAST_DURACAO_DEFAULT } from "@/hooks/useAnomaliaPreferences";

export interface AnomaliaPreferencePreset {
  id: string;
  nome: string;
  descricao: string;
  severidades: Severidade[];
  duracao: number;
  toastAcoes: ToastAcoes;
  drawerAcoes: DrawerAcoes;
}

/**
 * Presets prontos para perfis típicos de uso. Aplicam um conjunto coeso
 * de severidades, duração e ações sem tocar em silêncio/CCs/tipos.
 */
export const ANOMALIA_PREFERENCE_PRESETS: AnomaliaPreferencePreset[] = [
  {
    id: "operacao",
    nome: "Operação",
    descricao:
      "Foco em ação rápida no dia a dia: só severidades altas, toast curto, drill-down direto.",
    severidades: ["critica", "alta"],
    duracao: 8,
    toastAcoes: {
      drill_down: true,
      abrir_pagina: false,
      copiar_id: false,
      marcar_lida: true,
    },
    drawerAcoes: {
      abrir_entidade: true,
      pagina_completa: false,
      copiar_id: false,
      marcar_lida: true,
    },
  },
  {
    id: "gestao",
    nome: "Gestão",
    descricao:
      "Visão tática: inclui média severidade, duração padrão, navegação para páginas completas.",
    severidades: ["critica", "alta", "media"],
    duracao: TOAST_DURACAO_DEFAULT,
    toastAcoes: {
      drill_down: true,
      abrir_pagina: true,
      copiar_id: false,
      marcar_lida: false,
    },
    drawerAcoes: {
      abrir_entidade: true,
      pagina_completa: true,
      copiar_id: false,
      marcar_lida: false,
    },
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    descricao:
      "Cobertura total: todas as severidades, toast longo, todas as ações inclusive copiar ID.",
    severidades: ["critica", "alta", "media", "baixa"],
    duracao: 20,
    toastAcoes: {
      drill_down: true,
      abrir_pagina: true,
      copiar_id: true,
      marcar_lida: true,
    },
    drawerAcoes: {
      abrir_entidade: true,
      pagina_completa: true,
      copiar_id: true,
      marcar_lida: true,
    },
  },
];

/** Compara o estado atual com um preset (ignora silêncio/CCs/tipos). */
export function presetMatches(
  preset: AnomaliaPreferencePreset,
  current: {
    severidades: Severidade[];
    duracao: number;
    toastAcoes: ToastAcoes;
    drawerAcoes: DrawerAcoes;
  },
): boolean {
  if (preset.duracao !== current.duracao) return false;

  const a = [...preset.severidades].sort();
  const b = [...current.severidades].sort();
  if (a.length !== b.length || a.some((v, i) => v !== b[i])) return false;

  const tKeys = Object.keys(preset.toastAcoes) as Array<keyof ToastAcoes>;
  if (tKeys.some((k) => preset.toastAcoes[k] !== current.toastAcoes[k]))
    return false;

  const dKeys = Object.keys(preset.drawerAcoes) as Array<keyof DrawerAcoes>;
  if (dKeys.some((k) => preset.drawerAcoes[k] !== current.drawerAcoes[k]))
    return false;

  return true;
}
