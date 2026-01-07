// ============================================
// A/B TESTING: Sistema de testes A/B
// Experimentos e variantes para otimização
// ============================================

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import React from 'react';

// ============================================
// TIPOS
// ============================================

interface Variant {
  id: string;
  name: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  targetAudience?: AudienceCondition[];
  metrics?: ExperimentMetric[];
  createdAt: string;
  updatedAt: string;
}

interface AudienceCondition {
  type: 'user' | 'group' | 'attribute' | 'percentage' | 'device' | 'location';
  operator: 'equals' | 'notEquals' | 'contains' | 'in' | 'notIn';
  attribute?: string;
  value: unknown;
}

interface ExperimentMetric {
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'custom';
  goal?: number;
}

interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
  userId?: string;
}

interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  eventType: 'exposure' | 'conversion' | 'custom';
  eventName?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

interface UserContext {
  id?: string;
  attributes?: Record<string, unknown>;
  device?: 'mobile' | 'tablet' | 'desktop';
  location?: string;
  groups?: string[];
}

interface ABTestingConfig {
  experiments: Experiment[];
  userId?: string;
  userContext?: UserContext;
  persistKey?: string;
  onExposure?: (experiment: Experiment, variant: Variant) => void;
  onConversion?: (experiment: Experiment, variant: Variant, value?: number) => void;
}

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

let globalConfig: ABTestingConfig = {
  experiments: [],
  persistKey: 'ab_experiments',
};

let assignments: Map<string, ExperimentAssignment> = new Map();
let events: ExperimentEvent[] = [];
let listeners: Set<() => void> = new Set();

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================

/**
 * Configura o sistema de A/B testing
 */
export function configureABTesting(config: Partial<ABTestingConfig>): void {
  globalConfig = { ...globalConfig, ...config };
  loadPersistedAssignments();
  notifyListeners();
}

/**
 * Define o contexto do usuário
 */
export function setUserContext(context: UserContext): void {
  globalConfig.userContext = context;
  if (context.id) {
    globalConfig.userId = context.id;
  }
  notifyListeners();
}

/**
 * Adiciona um experimento
 */
export function addExperiment(experiment: Experiment): void {
  const existingIndex = globalConfig.experiments.findIndex(e => e.id === experiment.id);
  
  if (existingIndex >= 0) {
    globalConfig.experiments[existingIndex] = experiment;
  } else {
    globalConfig.experiments.push(experiment);
  }
  
  notifyListeners();
}

/**
 * Remove um experimento
 */
export function removeExperiment(id: string): void {
  globalConfig.experiments = globalConfig.experiments.filter(e => e.id !== id);
  assignments.delete(id);
  persistAssignments();
  notifyListeners();
}

/**
 * Atualiza status de um experimento
 */
export function updateExperimentStatus(
  id: string,
  status: Experiment['status']
): void {
  const experiment = globalConfig.experiments.find(e => e.id === id);
  if (experiment) {
    experiment.status = status;
    experiment.updatedAt = new Date().toISOString();
    notifyListeners();
  }
}

// ============================================
// PERSISTÊNCIA
// ============================================

function persistAssignments(): void {
  if (globalConfig.persistKey) {
    try {
      const data = Array.from(assignments.entries());
      localStorage.setItem(globalConfig.persistKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist experiment assignments:', e);
    }
  }
}

function loadPersistedAssignments(): void {
  if (globalConfig.persistKey) {
    try {
      const saved = localStorage.getItem(globalConfig.persistKey);
      if (saved) {
        const data = JSON.parse(saved) as [string, ExperimentAssignment][];
        assignments = new Map(data);
      }
    } catch (e) {
      console.warn('Failed to load persisted assignments:', e);
    }
  }
}

// ============================================
// LISTENERS
// ============================================

function notifyListeners(): void {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ============================================
// LÓGICA DE EXPERIMENTOS
// ============================================

/**
 * Gera hash determinístico para string
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Seleciona variante baseado em pesos
 */
function selectVariant(
  variants: Variant[],
  userId: string,
  experimentId: string
): Variant {
  // Hash determinístico baseado no userId e experimentId
  const hash = hashCode(`${experimentId}:${userId}`);
  const normalizedHash = (hash % 10000) / 100; // 0-99.99
  
  // Normaliza os pesos
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += (variant.weight / totalWeight) * 100;
    if (normalizedHash < cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback para última variante
  return variants[variants.length - 1];
}

/**
 * Verifica se usuário está na audiência do experimento
 */
function isInTargetAudience(
  conditions: AudienceCondition[] | undefined,
  context: UserContext
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every(condition => {
    const { type, operator, attribute, value } = condition;

    let targetValue: unknown;

    switch (type) {
      case 'user':
        targetValue = context.id;
        break;
      case 'group':
        targetValue = context.groups;
        break;
      case 'attribute':
        targetValue = attribute ? context.attributes?.[attribute] : undefined;
        break;
      case 'device':
        targetValue = context.device;
        break;
      case 'location':
        targetValue = context.location;
        break;
      case 'percentage':
        const hash = context.id 
          ? hashCode(context.id) % 100 
          : Math.random() * 100;
        return hash < (value as number);
      default:
        return false;
    }

    switch (operator) {
      case 'equals':
        return targetValue === value;
      case 'notEquals':
        return targetValue !== value;
      case 'contains':
        if (Array.isArray(targetValue)) {
          return targetValue.includes(value);
        }
        if (typeof targetValue === 'string') {
          return targetValue.includes(String(value));
        }
        return false;
      case 'in':
        if (Array.isArray(value)) {
          return value.includes(targetValue);
        }
        return false;
      case 'notIn':
        if (Array.isArray(value)) {
          return !value.includes(targetValue);
        }
        return true;
      default:
        return false;
    }
  });
}

/**
 * Verifica se experimento está ativo
 */
function isExperimentActive(experiment: Experiment): boolean {
  if (experiment.status !== 'running') {
    return false;
  }

  const now = new Date();

  if (experiment.startDate && new Date(experiment.startDate) > now) {
    return false;
  }

  if (experiment.endDate && new Date(experiment.endDate) < now) {
    return false;
  }

  return true;
}

/**
 * Obtém ou atribui variante para um experimento
 */
export function getVariant(experimentId: string): Variant | null {
  const experiment = globalConfig.experiments.find(e => e.id === experimentId);
  
  if (!experiment) {
    console.warn(`Experiment not found: ${experimentId}`);
    return null;
  }

  if (!isExperimentActive(experiment)) {
    return null;
  }

  const context = globalConfig.userContext || {};
  
  if (!isInTargetAudience(experiment.targetAudience, context)) {
    return null;
  }

  // Verifica se já existe atribuição
  const existing = assignments.get(experimentId);
  if (existing) {
    const variant = experiment.variants.find(v => v.id === existing.variantId);
    if (variant) {
      return variant;
    }
  }

  // Atribui nova variante
  const userId = globalConfig.userId || 'anonymous-' + Math.random().toString(36).substr(2, 9);
  const variant = selectVariant(experiment.variants, userId, experimentId);

  const assignment: ExperimentAssignment = {
    experimentId,
    variantId: variant.id,
    assignedAt: new Date().toISOString(),
    userId,
  };

  assignments.set(experimentId, assignment);
  persistAssignments();

  return variant;
}

/**
 * Registra exposição ao experimento
 */
export function trackExposure(experimentId: string): void {
  const experiment = globalConfig.experiments.find(e => e.id === experimentId);
  const assignment = assignments.get(experimentId);
  
  if (!experiment || !assignment) return;

  const variant = experiment.variants.find(v => v.id === assignment.variantId);
  if (!variant) return;

  const event: ExperimentEvent = {
    experimentId,
    variantId: assignment.variantId,
    eventType: 'exposure',
    timestamp: new Date().toISOString(),
    userId: globalConfig.userId,
  };

  events.push(event);
  globalConfig.onExposure?.(experiment, variant);
}

/**
 * Registra conversão
 */
export function trackConversion(
  experimentId: string,
  value?: number,
  metadata?: Record<string, unknown>
): void {
  const experiment = globalConfig.experiments.find(e => e.id === experimentId);
  const assignment = assignments.get(experimentId);
  
  if (!experiment || !assignment) return;

  const variant = experiment.variants.find(v => v.id === assignment.variantId);
  if (!variant) return;

  const event: ExperimentEvent = {
    experimentId,
    variantId: assignment.variantId,
    eventType: 'conversion',
    value,
    metadata,
    timestamp: new Date().toISOString(),
    userId: globalConfig.userId,
  };

  events.push(event);
  globalConfig.onConversion?.(experiment, variant, value);
}

/**
 * Registra evento customizado
 */
export function trackEvent(
  experimentId: string,
  eventName: string,
  value?: number,
  metadata?: Record<string, unknown>
): void {
  const assignment = assignments.get(experimentId);
  if (!assignment) return;

  const event: ExperimentEvent = {
    experimentId,
    variantId: assignment.variantId,
    eventType: 'custom',
    eventName,
    value,
    metadata,
    timestamp: new Date().toISOString(),
    userId: globalConfig.userId,
  };

  events.push(event);
}

/**
 * Obtém todos os eventos
 */
export function getEvents(): ExperimentEvent[] {
  return [...events];
}

/**
 * Limpa eventos
 */
export function clearEvents(): void {
  events = [];
}

/**
 * Força atribuição de variante específica (para testes)
 */
export function forceVariant(experimentId: string, variantId: string): void {
  const experiment = globalConfig.experiments.find(e => e.id === experimentId);
  if (!experiment) return;

  const variant = experiment.variants.find(v => v.id === variantId);
  if (!variant) return;

  const assignment: ExperimentAssignment = {
    experimentId,
    variantId,
    assignedAt: new Date().toISOString(),
    userId: globalConfig.userId,
  };

  assignments.set(experimentId, assignment);
  persistAssignments();
  notifyListeners();
}

/**
 * Limpa atribuições (para testes)
 */
export function clearAssignments(): void {
  assignments.clear();
  persistAssignments();
  notifyListeners();
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obter variante de um experimento
 */
export function useExperiment(experimentId: string): {
  variant: Variant | null;
  isControl: boolean;
  trackConversion: (value?: number) => void;
  trackEvent: (eventName: string, value?: number) => void;
} {
  const [variant, setVariant] = useState<Variant | null>(() => getVariant(experimentId));

  useEffect(() => {
    const newVariant = getVariant(experimentId);
    setVariant(newVariant);
    
    if (newVariant) {
      trackExposure(experimentId);
    }

    const unsubscribe = subscribe(() => {
      setVariant(getVariant(experimentId));
    });

    return unsubscribe;
  }, [experimentId]);

  const handleConversion = useCallback((value?: number) => {
    trackConversion(experimentId, value);
  }, [experimentId]);

  const handleEvent = useCallback((eventName: string, value?: number) => {
    trackEvent(experimentId, eventName, value);
  }, [experimentId]);

  return {
    variant,
    isControl: variant?.id === 'control',
    trackConversion: handleConversion,
    trackEvent: handleEvent,
  };
}

/**
 * Hook para gerenciar experimentos
 */
export function useExperimentManager() {
  const [experiments, setExperiments] = useState<Experiment[]>(globalConfig.experiments);

  useEffect(() => {
    const update = () => {
      setExperiments([...globalConfig.experiments]);
    };

    const unsubscribe = subscribe(update);
    return unsubscribe;
  }, []);

  return {
    experiments,
    addExperiment,
    removeExperiment,
    updateStatus: updateExperimentStatus,
    forceVariant,
    clearAssignments,
    getEvents,
    clearEvents,
  };
}

// ============================================
// CONTEXT PROVIDER
// ============================================

interface ABTestingContextValue {
  getVariant: (experimentId: string) => Variant | null;
  trackConversion: (experimentId: string, value?: number) => void;
  trackEvent: (experimentId: string, eventName: string, value?: number) => void;
  experiments: Experiment[];
}

const ABTestingContext = createContext<ABTestingContextValue | null>(null);

interface ABTestingProviderProps {
  children: ReactNode;
  config?: Partial<ABTestingConfig>;
}

export function ABTestingProvider({ 
  children, 
  config 
}: ABTestingProviderProps) {
  useEffect(() => {
    if (config) {
      configureABTesting(config);
    }
  }, [config]);

  const [experiments, setExperiments] = useState<Experiment[]>(globalConfig.experiments);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setExperiments([...globalConfig.experiments]);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      getVariant,
      trackConversion,
      trackEvent,
      experiments,
    }),
    [experiments]
  );

  return React.createElement(
    ABTestingContext.Provider,
    { value },
    children
  );
}

export function useABTestingContext(): ABTestingContextValue {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTestingContext must be used within an ABTestingProvider');
  }
  return context;
}

// ============================================
// COMPONENTES DE RENDERIZAÇÃO
// ============================================

interface ExperimentComponentProps {
  id: string;
  children: ReactNode | ((variant: Variant | null) => ReactNode);
  fallback?: ReactNode;
}

export function Experiment({ id, children, fallback = null }: ExperimentComponentProps) {
  const { variant } = useExperiment(id);

  if (!variant) {
    return React.createElement(React.Fragment, null, fallback);
  }

  if (typeof children === 'function') {
    return React.createElement(React.Fragment, null, children(variant));
  }

  return React.createElement(React.Fragment, null, children);
}

interface VariantComponentProps {
  experimentId: string;
  variantId: string;
  children: ReactNode;
}

export function VariantComponent({ 
  experimentId, 
  variantId, 
  children 
}: VariantComponentProps) {
  const { variant } = useExperiment(experimentId);

  if (variant?.id !== variantId) {
    return null;
  }

  return React.createElement(React.Fragment, null, children);
}

// ============================================
// EXPERIMENTOS PADRÃO
// ============================================

export const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: 'homepage_cta',
    name: 'Homepage CTA Test',
    description: 'Teste de diferentes CTAs na homepage',
    variants: [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant_a', name: 'Variant A - Green Button', weight: 25 },
      { id: 'variant_b', name: 'Variant B - Animated Button', weight: 25 },
    ],
    status: 'running',
    metrics: [
      { name: 'signup_rate', type: 'conversion', goal: 0.05 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pricing_display',
    name: 'Pricing Display Test',
    description: 'Teste de exibição de preços',
    variants: [
      { id: 'control', name: 'Control - Monthly', weight: 50 },
      { id: 'yearly_first', name: 'Yearly First', weight: 50 },
    ],
    status: 'running',
    metrics: [
      { name: 'purchase_rate', type: 'conversion', goal: 0.02 },
      { name: 'revenue', type: 'revenue', goal: 100 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Inicializa experimentos padrão
configureABTesting({
  experiments: DEFAULT_EXPERIMENTS,
});
