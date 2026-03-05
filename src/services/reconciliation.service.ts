// @ts-nocheck - Uses tables not yet in schema (transactions)
import { supabase } from '@/integrations/supabase/client';

/**
 * Reconciliation Service
 */

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  bankAccountId?: string;
  categoryId?: string;
  isPaid?: boolean;
  isReconciled?: boolean;
  reconciledAt?: string;
  reconciledWith?: string;
}

interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  balance?: number;
}

interface ReconciliationMatch {
  transactionId: string;
  statementId: string;
  confidence: number;
  matchType: 'exact' | 'amount' | 'date' | 'partial' | 'manual';
  differences?: {
    amount?: number;
    date?: number;
    description?: boolean;
  };
}

interface ReconciliationResult {
  matched: ReconciliationMatch[];
  unmatchedTransactions: Transaction[];
  unmatchedStatements: BankStatement[];
  summary: {
    totalMatched: number;
    totalUnmatchedTransactions: number;
    totalUnmatchedStatements: number;
    matchRate: number;
    totalReconciled: number;
    totalDiscrepancy: number;
  };
}

interface ReconciliationConfig {
  allowAmountTolerance?: number;
  allowDateTolerance?: number;
  autoReconcile?: boolean;
  autoReconcileThreshold?: number;
  matchByReference?: boolean;
  matchByDescription?: boolean;
  fuzzyMatchDescription?: boolean;
}

function normalizeDescription(description: string): string {
  return description.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function calculateDescriptionSimilarity(a: string, b: string): number {
  const normalA = normalizeDescription(a);
  const normalB = normalizeDescription(b);
  if (normalA === normalB) return 1;
  const wordsA = new Set(normalA.split(' '));
  const wordsB = new Set(normalB.split(' '));
  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

function dateDiffDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
}

export const reconciliationService = {
  autoReconcile(
    transactions: Transaction[],
    statements: BankStatement[],
    config: ReconciliationConfig = {}
  ): ReconciliationResult {
    const {
      allowAmountTolerance = 0,
      allowDateTolerance = 2,
      matchByReference = true,
      matchByDescription = true,
      fuzzyMatchDescription = true,
    } = config;

    const matched: ReconciliationMatch[] = [];
    const usedTransactionIds = new Set<string>();
    const usedStatementIds = new Set<string>();

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedStatements = [...statements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Pass 1: Exact matches
    for (const transaction of sortedTransactions) {
      if (usedTransactionIds.has(transaction.id)) continue;
      for (const statement of sortedStatements) {
        if (usedStatementIds.has(statement.id)) continue;
        const amountMatch = Math.abs(transaction.amount - statement.amount) <= allowAmountTolerance;
        const dateMatch = dateDiffDays(transaction.date, statement.date) <= allowDateTolerance;
        const typeMatch = transaction.type === statement.type;
        const referenceMatch = matchByReference && transaction.reference && statement.reference && transaction.reference === statement.reference;

        if (amountMatch && dateMatch && typeMatch && (referenceMatch || !matchByReference)) {
          matched.push({ transactionId: transaction.id, statementId: statement.id, confidence: 1, matchType: 'exact' });
          usedTransactionIds.add(transaction.id);
          usedStatementIds.add(statement.id);
          break;
        }
      }
    }

    // Pass 2: Amount-based matches with description similarity
    if (matchByDescription) {
      for (const transaction of sortedTransactions) {
        if (usedTransactionIds.has(transaction.id)) continue;
        let bestMatch: { statement: BankStatement; confidence: number; dateDiff: number } | null = null;

        for (const statement of sortedStatements) {
          if (usedStatementIds.has(statement.id)) continue;
          const amountMatch = Math.abs(transaction.amount - statement.amount) <= allowAmountTolerance;
          const dateDiff = dateDiffDays(transaction.date, statement.date);
          const dateMatch = dateDiff <= allowDateTolerance;
          const typeMatch = transaction.type === statement.type;
          if (!amountMatch || !dateMatch || !typeMatch) continue;

          let descriptionSimilarity = 0;
          if (fuzzyMatchDescription) {
            descriptionSimilarity = calculateDescriptionSimilarity(transaction.description, statement.description);
          }

          const confidence = 0.5 + (descriptionSimilarity * 0.3) + ((allowDateTolerance - dateDiff) / allowDateTolerance * 0.2);

          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { statement, confidence, dateDiff };
          }
        }

        if (bestMatch && bestMatch.confidence >= 0.5) {
          matched.push({
            transactionId: transaction.id,
            statementId: bestMatch.statement.id,
            confidence: bestMatch.confidence,
            matchType: bestMatch.confidence >= 0.9 ? 'amount' : 'partial',
            differences: { date: bestMatch.dateDiff },
          });
          usedTransactionIds.add(transaction.id);
          usedStatementIds.add(bestMatch.statement.id);
        }
      }
    }

    const unmatchedTransactions = transactions.filter((t) => !usedTransactionIds.has(t.id));
    const unmatchedStatements = statements.filter((s) => !usedStatementIds.has(s.id));

    const totalReconciled = matched.reduce((sum, m) => {
      const transaction = transactions.find((t) => t.id === m.transactionId);
      return sum + (transaction?.amount || 0);
    }, 0);

    const totalDiscrepancy = unmatchedStatements.reduce((sum, s) => sum + s.amount, 0) - unmatchedTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      matched,
      unmatchedTransactions,
      unmatchedStatements,
      summary: {
        totalMatched: matched.length,
        totalUnmatchedTransactions: unmatchedTransactions.length,
        totalUnmatchedStatements: unmatchedStatements.length,
        matchRate: transactions.length > 0 ? matched.length / transactions.length : 0,
        totalReconciled,
        totalDiscrepancy: Math.abs(totalDiscrepancy),
      },
    };
  },

  async manualReconcile(transactionId: string, statementId: string, notes?: string): Promise<void> {
    const now = new Date().toISOString();
    await (supabase as any)
      .from('transacoes_bancarias')
      .update({ conciliada: true, conciliada_em: now })
      .eq('id', transactionId);
  },

  async unreconcile(transactionId: string): Promise<void> {
    await (supabase as any)
      .from('transacoes_bancarias')
      .update({ conciliada: false, conciliada_em: null })
      .eq('id', transactionId);
  },

  async batchReconcile(matches: ReconciliationMatch[], minConfidence: number = 0.8): Promise<{ reconciled: number; skipped: number }> {
    const toReconcile = matches.filter((m) => m.confidence >= minConfidence);
    const now = new Date().toISOString();
    let reconciled = 0;
    let skipped = matches.length - toReconcile.length;

    for (const match of toReconcile) {
      try {
        await (supabase as any)
          .from('transacoes_bancarias')
          .update({ conciliada: true, conciliada_em: now })
          .eq('id', match.transactionId);
        reconciled++;
      } catch (error) {
        console.error(`Failed to reconcile ${match.transactionId}:`, error);
        skipped++;
      }
    }

    return { reconciled, skipped };
  },

  async getReconciliationStatus(bankAccountId: string, startDate: string, endDate: string) {
    const { data: transactions, error } = await supabase
      .from('transacoes_bancarias')
      .select('id, valor, conciliada')
      .eq('conta_bancaria_id', bankAccountId)
      .gte('data', startDate)
      .lte('data', endDate);

    if (error) throw error;

    const total = transactions?.length || 0;
    const reconciled = transactions?.filter((t: any) => t.conciliada).length || 0;
    const totalAmount = transactions?.reduce((sum: number, t: any) => sum + (Number(t.valor) || 0), 0) || 0;
    const reconciledAmount = transactions?.filter((t: any) => t.conciliada).reduce((sum: number, t: any) => sum + (Number(t.valor) || 0), 0) || 0;

    return {
      totalTransactions: total,
      reconciledTransactions: reconciled,
      pendingTransactions: total - reconciled,
      reconciliationRate: total > 0 ? reconciled / total : 0,
      totalAmount,
      reconciledAmount,
    };
  },

  parseStatement(content: string, format: 'csv' | 'ofx'): BankStatement[] {
    if (format === 'csv') return this.parseCSVStatement(content);
    if (format === 'ofx') return this.parseOFXStatement(content);
    return [];
  },

  parseCSVStatement(content: string): BankStatement[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase().split(/[,;]/);
    const dateIndex = header.findIndex((h) => h.includes('data') || h.includes('date'));
    const descIndex = header.findIndex((h) => h.includes('descri') || h.includes('hist'));
    const amountIndex = header.findIndex((h) => h.includes('valor') || h.includes('amount'));
    const statements: BankStatement[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/);
      if (cols.length < 3) continue;
      const amount = parseFloat(cols[amountIndex]?.replace(/[^\\d,-]/g, '').replace(',', '.') || '0');
      statements.push({
        id: `stmt-${i}-${Date.now()}`,
        date: cols[dateIndex]?.trim() || '',
        description: cols[descIndex]?.trim() || '',
        amount: Math.abs(amount),
        type: amount < 0 ? 'debit' : 'credit',
      });
    }
    return statements;
  },

  parseOFXStatement(content: string): BankStatement[] {
    const statements: BankStatement[] = [];
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = transactionRegex.exec(content)) !== null) {
      const block = match[1];
      const getTag = (tag: string): string => {
        const tagMatch = block.match(new RegExp(`<${tag}>([^<\n]+)`));
        return tagMatch ? tagMatch[1].trim() : '';
      };
      const trntype = getTag('TRNTYPE');
      const dtposted = getTag('DTPOSTED');
      const trnamt = getTag('TRNAMT');
      const name = getTag('NAME') || getTag('MEMO');
      const fitid = getTag('FITID');

      if (dtposted && trnamt) {
        const amount = parseFloat(trnamt);
        const date = dtposted.slice(0, 4) + '-' + dtposted.slice(4, 6) + '-' + dtposted.slice(6, 8);
        statements.push({
          id: fitid || `ofx-${statements.length}-${Date.now()}`,
          date,
          description: name,
          amount: Math.abs(amount),
          type: amount < 0 || trntype === 'DEBIT' ? 'debit' : 'credit',
          reference: fitid,
        });
      }
    }
    return statements;
  },
};

export type { Transaction, BankStatement, ReconciliationMatch, ReconciliationResult, ReconciliationConfig };
export default reconciliationService;
