import { logger } from '@/lib/logger';
import type { AutoContingencyConfig, ContingencyRule, ContingencyState } from './types';
import { RULES_KEY, defaultAutoConfig } from './constants';
import { getContingencyState, getSefazHealthStatus } from './storage';
import { activateContingency, checkSefazHealth, deactivateContingency } from './state';

interface ParsedRule {
  createdAt: string;
  lastTriggered?: string | null;
}

export function getAutoContingencyConfig(): AutoContingencyConfig {
  try {
    const stored = localStorage.getItem(RULES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        rules: parsed.rules.map((rule: ParsedRule) => ({
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

export function saveAutoContingencyConfig(config: AutoContingencyConfig): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(config));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar configuração automática:', error);
  }
}

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

export function updateContingencyRule(id: string, updates: Partial<ContingencyRule>): void {
  const config = getAutoContingencyConfig();
  const index = config.rules.findIndex((r) => r.id === id);
  if (index >= 0) {
    config.rules[index] = { ...config.rules[index], ...updates };
    saveAutoContingencyConfig(config);
  }
}

export function deleteContingencyRule(id: string): void {
  const config = getAutoContingencyConfig();
  config.rules = config.rules.filter((r) => r.id !== id);
  saveAutoContingencyConfig(config);
}

function isWithinSchedule(rule: ContingencyRule): boolean {
  if (rule.type !== 'schedule' || !rule.config.scheduleStart || !rule.config.scheduleEnd) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (rule.config.scheduleDays && !rule.config.scheduleDays.includes(currentDay)) {
    return false;
  }

  const { scheduleStart, scheduleEnd } = rule.config;
  if (scheduleStart <= scheduleEnd) {
    return currentTime >= scheduleStart && currentTime <= scheduleEnd;
  }
  return currentTime >= scheduleStart || currentTime <= scheduleEnd;
}

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

  const enabledRules = config.rules.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);

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
      updateContingencyRule(rule.id, { lastTriggered: new Date() });
      return { shouldActivate: true, triggeredRule: rule, reason: rule.reason };
    }
  }

  return { shouldActivate: false, triggeredRule: null, reason: '' };
}

export function shouldAutoDeactivate(): boolean {
  const config = getAutoContingencyConfig();
  const state = getContingencyState();
  const health = getSefazHealthStatus();

  if (!config.autoDeactivateWhenOnline || !state.autoActivated || state.mode === 'normal') {
    return false;
  }
  if (!health.online) return false;
  if (state.pendingNFes.some((n) => n.status === 'pendente')) return false;

  const onlineFor = (Date.now() - health.lastCheck.getTime()) / (1000 * 60);
  return onlineFor >= config.autoDeactivateDelayMinutes;
}

export async function runAutoContingencyCheck(): Promise<{
  action: 'activated' | 'deactivated' | 'none';
  rule?: ContingencyRule;
  newState?: ContingencyState;
}> {
  await checkSefazHealth();

  const evaluation = evaluateContingencyRules();
  if (evaluation.shouldActivate && evaluation.triggeredRule) {
    const newState = activateContingency(
      evaluation.triggeredRule.mode,
      evaluation.reason,
      'Sistema (Automático)',
      undefined,
      true,
    );
    return { action: 'activated', rule: evaluation.triggeredRule, newState };
  }

  if (shouldAutoDeactivate()) {
    const newState = deactivateContingency();
    return { action: 'deactivated', newState };
  }

  return { action: 'none' };
}
