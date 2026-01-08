// Gerenciamento de modo de contingência para NF-e
// Suporta emissão offline quando SEFAZ está indisponível

import { logger } from '@/lib/logger';
export type ContingencyMode = 
  | 'normal'      // Emissão normal - SEFAZ disponível
  | 'SCAN'        // Sistema de Contingência do Ambiente Nacional
  | 'DPEC'        // Declaração Prévia de Emissão em Contingência
  | 'FSDA'        // Formulário de Segurança para Impressão de Documento Auxiliar
  | 'SVCAN'       // SEFAZ Virtual de Contingência - Ambiente Nacional
  | 'SVCRS'       // SEFAZ Virtual de Contingência - Rio Grande do Sul
  | 'offline';    // Modo offline local

export interface ContingencyState {
  mode: ContingencyMode;
  reason: string;
  activatedAt: Date | null;
  activatedBy: string;
  estimatedReturn: Date | null;
  autoActivated: boolean;
  failureCount: number;
  lastFailure: Date | null;
  pendingNFes: PendingNFe[];
}

export interface PendingNFe {
  id: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: Date;
  valorTotal: number;
  destinatario: string;
  xmlContingencia: string;
  status: 'pendente' | 'transmitindo' | 'autorizada' | 'rejeitada';
  tentativas: number;
  ultimaTentativa: Date | null;
  erro?: string;
}

export interface SefazHealthStatus {
  online: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
}

// Regras de contingência automática
export interface ContingencyRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'failure_count' | 'latency' | 'schedule' | 'time_window';
  mode: ContingencyMode;
  config: {
    // Para failure_count
    maxFailures?: number;
    // Para latency
    maxLatency?: number; // em ms
    // Para schedule (horários específicos)
    scheduleStart?: string; // HH:mm
    scheduleEnd?: string; // HH:mm
    scheduleDays?: number[]; // 0-6 (domingo-sábado)
    // Para time_window (janela de indisponibilidade)
    downtimeMinutes?: number;
  };
  reason: string;
  priority: number; // Menor = maior prioridade
  createdAt: Date;
  lastTriggered?: Date;
}

export interface AutoContingencyConfig {
  enabled: boolean;
  rules: ContingencyRule[];
  checkIntervalSeconds: number;
  notifyOnActivation: boolean;
  notifyOnDeactivation: boolean;
  autoDeactivateWhenOnline: boolean;
  autoDeactivateDelayMinutes: number;
}

// Códigos de tipo de emissão (tpEmis) da NF-e
export const TIPO_EMISSAO = {
  normal: { code: '1', label: 'Normal', description: 'Emissão normal com autorização SEFAZ' },
  SCAN: { code: '3', label: 'SCAN', description: 'Sistema de Contingência do Ambiente Nacional' },
  DPEC: { code: '4', label: 'DPEC', description: 'Declaração Prévia de Emissão em Contingência' },
  FSDA: { code: '5', label: 'FS-DA', description: 'Formulário de Segurança para Impressão de Documento Auxiliar' },
  SVCAN: { code: '6', label: 'SVC-AN', description: 'SEFAZ Virtual de Contingência - Ambiente Nacional' },
  SVCRS: { code: '7', label: 'SVC-RS', description: 'SEFAZ Virtual de Contingência - Rio Grande do Sul' },
  offline: { code: '9', label: 'Offline', description: 'Contingência offline para posterior transmissão' },
} as const;

// Motivos comuns para ativação de contingência
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

// Estado inicial
const initialState: ContingencyState = {
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

// Armazenamento local
const STORAGE_KEY = 'sefaz_contingency_state';
const HEALTH_KEY = 'sefaz_health_status';
const RULES_KEY = 'sefaz_contingency_rules';

// Regras padrão
const defaultRules: ContingencyRule[] = [
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
      scheduleDays: [0] // Domingo
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

const defaultAutoConfig: AutoContingencyConfig = {
  enabled: true,
  rules: defaultRules,
  checkIntervalSeconds: 30,
  notifyOnActivation: true,
  notifyOnDeactivation: true,
  autoDeactivateWhenOnline: true,
  autoDeactivateDelayMinutes: 5,
};

// Obter estado atual da contingência
export function getContingencyState(): ContingencyState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        activatedAt: parsed.activatedAt ? new Date(parsed.activatedAt) : null,
        estimatedReturn: parsed.estimatedReturn ? new Date(parsed.estimatedReturn) : null,
        lastFailure: parsed.lastFailure ? new Date(parsed.lastFailure) : null,
        pendingNFes: parsed.pendingNFes.map((nfe: any) => ({
          ...nfe,
          dataEmissao: new Date(nfe.dataEmissao),
          ultimaTentativa: nfe.ultimaTentativa ? new Date(nfe.ultimaTentativa) : null,
        })),
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar estado:', error);
  }
  return initialState;
}

// Salvar estado da contingência
function saveContingencyState(state: ContingencyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar estado:', error);
  }
}

// Ativar modo de contingência
export function activateContingency(
  mode: ContingencyMode,
  reason: string,
  activatedBy: string,
  estimatedReturn?: Date,
  autoActivated = false
): ContingencyState {
  const state: ContingencyState = {
    ...getContingencyState(),
    mode,
    reason,
    activatedAt: new Date(),
    activatedBy,
    estimatedReturn: estimatedReturn || null,
    autoActivated,
  };
  
  saveContingencyState(state);
  logger.debug('[Contingência] Modo ativado:', mode, 'Motivo:', reason);
  
  return state;
}

// Desativar modo de contingência
export function deactivateContingency(): ContingencyState {
  const state: ContingencyState = {
    ...getContingencyState(),
    mode: 'normal',
    reason: '',
    activatedAt: null,
    activatedBy: '',
    estimatedReturn: null,
    autoActivated: false,
    failureCount: 0,
  };
  
  saveContingencyState(state);
  logger.debug('[Contingência] Modo desativado');
  
  return state;
}

// Registrar falha de comunicação
export function registerCommunicationFailure(): ContingencyState {
  const state = getContingencyState();
  state.failureCount++;
  state.lastFailure = new Date();
  
  // Auto-ativar contingência após 3 falhas consecutivas
  if (state.failureCount >= 3 && state.mode === 'normal') {
    return activateContingency(
      'offline',
      'SEFAZ indisponível - múltiplas falhas de comunicação',
      'Sistema',
      undefined,
      true
    );
  }
  
  saveContingencyState(state);
  return state;
}

// Registrar sucesso de comunicação
export function registerCommunicationSuccess(): void {
  const state = getContingencyState();
  state.failureCount = 0;
  saveContingencyState(state);
}

// Adicionar NF-e pendente (emitida em contingência)
export function addPendingNFe(nfe: Omit<PendingNFe, 'status' | 'tentativas' | 'ultimaTentativa'>): ContingencyState {
  const state = getContingencyState();
  state.pendingNFes.push({
    ...nfe,
    status: 'pendente',
    tentativas: 0,
    ultimaTentativa: null,
  });
  
  saveContingencyState(state);
  logger.debug('[Contingência] NF-e pendente adicionada:', nfe.numero);
  
  return state;
}

// Atualizar status de NF-e pendente
export function updatePendingNFe(
  id: string, 
  updates: Partial<Pick<PendingNFe, 'status' | 'tentativas' | 'ultimaTentativa' | 'erro'>>
): ContingencyState {
  const state = getContingencyState();
  const nfeIndex = state.pendingNFes.findIndex(n => n.id === id);
  
  if (nfeIndex >= 0) {
    state.pendingNFes[nfeIndex] = {
      ...state.pendingNFes[nfeIndex],
      ...updates,
    };
    saveContingencyState(state);
  }
  
  return state;
}

// Remover NF-e pendente (após autorização bem-sucedida)
export function removePendingNFe(id: string): ContingencyState {
  const state = getContingencyState();
  state.pendingNFes = state.pendingNFes.filter(n => n.id !== id);
  saveContingencyState(state);
  
  return state;
}

// Verificar saúde da SEFAZ
export function getSefazHealthStatus(): SefazHealthStatus {
  try {
    const stored = localStorage.getItem(HEALTH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastCheck: new Date(parsed.lastCheck),
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar status de saúde:', error);
  }
  
  return {
    online: true,
    latency: 0,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    averageResponseTime: 0,
  };
}

// Atualizar status de saúde da SEFAZ
export function updateSefazHealthStatus(status: Partial<SefazHealthStatus>): void {
  const current = getSefazHealthStatus();
  const updated = { ...current, ...status, lastCheck: new Date() };
  localStorage.setItem(HEALTH_KEY, JSON.stringify(updated));
}

// Simular verificação de saúde da SEFAZ
export async function checkSefazHealth(): Promise<SefazHealthStatus> {
  const startTime = Date.now();
  
  // Simula chamada ao webservice de status da SEFAZ
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  // 10% de chance de simular SEFAZ offline
  const isOnline = Math.random() > 0.1;
  const latency = Date.now() - startTime;
  
  const currentHealth = getSefazHealthStatus();
  const status: SefazHealthStatus = {
    online: isOnline,
    latency,
    lastCheck: new Date(),
    consecutiveFailures: isOnline ? 0 : currentHealth.consecutiveFailures + 1,
    averageResponseTime: isOnline 
      ? (currentHealth.averageResponseTime + latency) / 2 
      : currentHealth.averageResponseTime,
  };
  
  updateSefazHealthStatus(status);
  
  // Atualizar estado de contingência baseado na saúde
  if (!isOnline) {
    registerCommunicationFailure();
  } else {
    registerCommunicationSuccess();
  }
  
  return status;
}

// Obter configuração de contingência automática
export function getAutoContingencyConfig(): AutoContingencyConfig {
  try {
    const stored = localStorage.getItem(RULES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        rules: parsed.rules.map((rule: any) => ({
          ...rule,
          createdAt: new Date(rule.createdAt),
          lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : undefined,
        })),
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar configuração automática:', error);
  }
  return defaultAutoConfig;
}

// Salvar configuração de contingência automática
export function saveAutoContingencyConfig(config: AutoContingencyConfig): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(config));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar configuração automática:', error);
  }
}

// Adicionar nova regra
export function addContingencyRule(rule: Omit<ContingencyRule, 'id' | 'createdAt'>): ContingencyRule {
  const config = getAutoContingencyConfig();
  const newRule: ContingencyRule = {
    ...rule,
    id: `rule_${Date.now()}`,
    createdAt: new Date(),
  };
  config.rules.push(newRule);
  saveAutoContingencyConfig(config);
  return newRule;
}

// Atualizar regra existente
export function updateContingencyRule(id: string, updates: Partial<ContingencyRule>): void {
  const config = getAutoContingencyConfig();
  const index = config.rules.findIndex(r => r.id === id);
  if (index >= 0) {
    config.rules[index] = { ...config.rules[index], ...updates };
    saveAutoContingencyConfig(config);
  }
}

// Remover regra
export function deleteContingencyRule(id: string): void {
  const config = getAutoContingencyConfig();
  config.rules = config.rules.filter(r => r.id !== id);
  saveAutoContingencyConfig(config);
}

// Verificar se está dentro de uma janela de horário
function isWithinSchedule(rule: ContingencyRule): boolean {
  if (rule.type !== 'schedule' || !rule.config.scheduleStart || !rule.config.scheduleEnd) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Verificar dia da semana
  if (rule.config.scheduleDays && !rule.config.scheduleDays.includes(currentDay)) {
    return false;
  }

  // Verificar horário
  const { scheduleStart, scheduleEnd } = rule.config;
  
  // Lidar com janelas que cruzam meia-noite
  if (scheduleStart <= scheduleEnd) {
    return currentTime >= scheduleStart && currentTime <= scheduleEnd;
  } else {
    return currentTime >= scheduleStart || currentTime <= scheduleEnd;
  }
}

// Avaliar regras e determinar se contingência deve ser ativada
export function evaluateContingencyRules(): { 
  shouldActivate: boolean; 
  triggeredRule: ContingencyRule | null;
  reason: string;
} {
  const config = getAutoContingencyConfig();
  const state = getContingencyState();
  const health = getSefazHealthStatus();

  if (!config.enabled || state.mode !== 'normal') {
    return { shouldActivate: false, triggeredRule: null, reason: '' };
  }

  // Ordenar regras por prioridade
  const enabledRules = config.rules
    .filter(r => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of enabledRules) {
    let triggered = false;

    switch (rule.type) {
      case 'failure_count':
        if (rule.config.maxFailures && health.consecutiveFailures >= rule.config.maxFailures) {
          triggered = true;
        }
        break;

      case 'latency':
        if (rule.config.maxLatency && health.latency > rule.config.maxLatency) {
          triggered = true;
        }
        break;

      case 'schedule':
        triggered = isWithinSchedule(rule);
        break;

      case 'time_window':
        if (rule.config.downtimeMinutes && state.lastFailure) {
          const downtimeMs = Date.now() - state.lastFailure.getTime();
          const downtimeMinutes = downtimeMs / (1000 * 60);
          if (!health.online && downtimeMinutes >= rule.config.downtimeMinutes) {
            triggered = true;
          }
        }
        break;
    }

    if (triggered) {
      // Atualizar lastTriggered
      updateContingencyRule(rule.id, { lastTriggered: new Date() });
      return { shouldActivate: true, triggeredRule: rule, reason: rule.reason };
    }
  }

  return { shouldActivate: false, triggeredRule: null, reason: '' };
}

// Verificar se deve desativar automaticamente
export function shouldAutoDeactivate(): boolean {
  const config = getAutoContingencyConfig();
  const state = getContingencyState();
  const health = getSefazHealthStatus();

  if (!config.autoDeactivateWhenOnline || !state.autoActivated || state.mode === 'normal') {
    return false;
  }

  // Verificar se SEFAZ está online há tempo suficiente
  if (!health.online) {
    return false;
  }

  // Verificar se há NF-e pendentes
  if (state.pendingNFes.some(n => n.status === 'pendente')) {
    return false;
  }

  // Verificar delay de desativação
  const onlineFor = (Date.now() - health.lastCheck.getTime()) / (1000 * 60);
  return onlineFor >= config.autoDeactivateDelayMinutes;
}

// Executar verificação automática de contingência
export async function runAutoContingencyCheck(): Promise<{
  action: 'activated' | 'deactivated' | 'none';
  rule?: ContingencyRule;
  newState?: ContingencyState;
}> {
  // Primeiro verificar saúde da SEFAZ
  await checkSefazHealth();

  // Avaliar regras
  const evaluation = evaluateContingencyRules();
  
  if (evaluation.shouldActivate && evaluation.triggeredRule) {
    const newState = activateContingency(
      evaluation.triggeredRule.mode,
      evaluation.reason,
      'Sistema (Automático)',
      undefined,
      true
    );
    return { action: 'activated', rule: evaluation.triggeredRule, newState };
  }

  // Verificar se deve desativar
  if (shouldAutoDeactivate()) {
    const newState = deactivateContingency();
    return { action: 'deactivated', newState };
  }

  return { action: 'none' };
}

// Obter estatísticas de contingência
export function getContingencyStats(): {
  totalPending: number;
  pendingValue: number;
  oldestPending: Date | null;
  transmissionAttempts: number;
} {
  const state = getContingencyState();
  const pending = state.pendingNFes.filter(n => n.status === 'pendente');
  
  return {
    totalPending: pending.length,
    pendingValue: pending.reduce((sum, n) => sum + n.valorTotal, 0),
    oldestPending: pending.length > 0 
      ? new Date(Math.min(...pending.map(n => n.dataEmissao.getTime())))
      : null,
    transmissionAttempts: pending.reduce((sum, n) => sum + n.tentativas, 0),
  };
}

// Gerar XML em contingência
export function generateContingencyXml(
  nfeData: any,
  mode: ContingencyMode,
  chaveAcesso: string
): string {
  const tpEmis = TIPO_EMISSAO[mode]?.code || '1';
  const dhCont = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chaveAcesso}">
    <ide>
      <tpEmis>${tpEmis}</tpEmis>
      <dhCont>${dhCont}</dhCont>
      <xJust>Emissão em contingência - ${TIPO_EMISSAO[mode]?.description || 'Modo offline'}</xJust>
      <!-- Demais campos da NF-e -->
    </ide>
    <!-- Conteúdo completo da NF-e em contingência -->
  </infNFe>
</NFe>`;
}
