import type { AutoContingencyConfig, ContingencyRule, ContingencyState } from './types';

export const TIPO_EMISSAO = {
  normal: { code: '1', label: 'Normal', description: 'Emissão normal com autorização SEFAZ' },
  SCAN: { code: '3', label: 'SCAN', description: 'Sistema de Contingência do Ambiente Nacional' },
  DPEC: { code: '4', label: 'DPEC', description: 'Declaração Prévia de Emissão em Contingência' },
  FSDA: { code: '5', label: 'FS-DA', description: 'Formulário de Segurança para Impressão de Documento Auxiliar' },
  SVCAN: { code: '6', label: 'SVC-AN', description: 'SEFAZ Virtual de Contingência - Ambiente Nacional' },
  SVCRS: { code: '7', label: 'SVC-RS', description: 'SEFAZ Virtual de Contingência - Rio Grande do Sul' },
  offline: { code: '9', label: 'Offline', description: 'Contingência offline para posterior transmissão' },
} as const;

export const MOTIVOS_CONTINGENCIA = [
  'SEFAZ indisponível - manutenção programada',
  'SEFAZ indisponível - problemas técnicos',
  'Problemas de conectividade local',
  'Timeout na comunicação com SEFAZ',
  'Erro de certificado digital',
  'Falha no webservice da SEFAZ',
  'Contingência preventiva - evento especial',
  'Outro motivo',
] as const;

export const STORAGE_KEY = 'sefaz_contingency_state';
export const HEALTH_KEY = 'sefaz_health_status';
export const RULES_KEY = 'sefaz_contingency_rules';

export const initialState: ContingencyState = {
  mode: 'normal',
  reason: '',
  activatedAt: null,
  activatedBy: '',
  estimatedReturn: null,
  autoActivated: false,
  failureCount: 0,
  lastFailure: null,
  pendingNFes: [],
};

export const defaultRules: ContingencyRule[] = [
  {
    id: 'rule_failures_3',
    name: 'Falhas consecutivas (3x)',
    enabled: true,
    type: 'failure_count',
    mode: 'offline',
    config: { maxFailures: 3 },
    reason: 'Ativação automática: 3 falhas consecutivas de comunicação',
    priority: 1,
    createdAt: new Date(),
  },
  {
    id: 'rule_latency_high',
    name: 'Latência alta (>5s)',
    enabled: false,
    type: 'latency',
    mode: 'SVCAN',
    config: { maxLatency: 5000 },
    reason: 'Ativação automática: latência superior a 5 segundos',
    priority: 2,
    createdAt: new Date(),
  },
  {
    id: 'rule_maintenance_window',
    name: 'Janela de manutenção SEFAZ',
    enabled: false,
    type: 'schedule',
    mode: 'offline',
    config: {
      scheduleStart: '00:00',
      scheduleEnd: '06:00',
      scheduleDays: [0],
    },
    reason: 'Ativação automática: janela de manutenção programada',
    priority: 3,
    createdAt: new Date(),
  },
  {
    id: 'rule_downtime_10min',
    name: 'Indisponibilidade prolongada (10min)',
    enabled: false,
    type: 'time_window',
    mode: 'offline',
    config: { downtimeMinutes: 10 },
    reason: 'Ativação automática: SEFAZ indisponível por mais de 10 minutos',
    priority: 4,
    createdAt: new Date(),
  },
];

export const defaultAutoConfig: AutoContingencyConfig = {
  enabled: true,
  rules: defaultRules,
  checkIntervalSeconds: 30,
  notifyOnActivation: true,
  notifyOnDeactivation: true,
  autoDeactivateWhenOnline: true,
  autoDeactivateDelayMinutes: 5,
};
