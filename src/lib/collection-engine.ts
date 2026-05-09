
/**
 * Collection stages and scoring rules engine for Financial Module 10/10
 */

export const COLLECTION_STAGES = {
  PREVENTIVA: 'preventiva',
  LEMBRETE: 'lembrete',
  COBRANCA: 'cobranca',
  NEGOCIACAO: 'negociacao',
  JURIDICO: 'juridico',
} as const;

export type CollectionStage = typeof COLLECTION_STAGES[keyof typeof COLLECTION_STAGES];

/**
 * Calculates the appropriate collection stage based on overdue days
 */
export const calculateCollectionStage = (dueDate: string, status: string): CollectionStage | null => {
  if (status === 'pago' || status === 'cancelado') return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return COLLECTION_STAGES.PREVENTIVA;
  if (diffDays <= 5) return COLLECTION_STAGES.LEMBRETE;
  if (diffDays <= 15) return COLLECTION_STAGES.COBRANCA;
  if (diffDays <= 30) return COLLECTION_STAGES.NEGOCIACAO;
  return COLLECTION_STAGES.JURIDICO;
};

/**
 * Calculates a dynamic credit score based on history (simulated for now)
 */
export const calculateDynamicScore = (history: { days_overdue: number }[]): number => {
  if (history.length === 0) return 600; // Base score
  
  const avgDelay = history.reduce((sum, h) => sum + Math.max(0, h.days_overdue), 0) / history.length;
  const punctualityRate = history.filter(h => h.days_overdue <= 0).length / history.length;
  
  let score = 600;
  score += (punctualityRate * 400); // Up to 400 points for punctuality
  score -= (avgDelay * 10); // Deduct for average delay
  
  return Math.min(1000, Math.max(0, Math.round(score)));
};
