import { useState, useMemo, useCallback } from 'react';
import {
  Check,
  X,
  Link,
  Unlink,
  AlertTriangle,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/financial-calculations';
import { Button } from '@/components/ui/button';

interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  reconciled: boolean;
  matchedId?: string;
}

interface SystemTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category?: string;
  reference?: string;
  reconciled: boolean;
  matchedId?: string;
}

interface ReconciliationMatch {
  bankTransaction: BankTransaction;
  systemTransaction: SystemTransaction;
  confidence: number;
  matchType: 'exact' | 'amount' | 'date' | 'manual';
}

interface BankReconciliationProps {
  bankTransactions: BankTransaction[];
  systemTransactions: SystemTransaction[];
  onReconcile: (bankId: string, systemId: string) => void;
  onUnreconcile: (bankId: string) => void;
  onCreateTransaction?: (bankTransaction: BankTransaction) => void;
  period?: { start: Date; end: Date };
}

export function BankReconciliation({
  bankTransactions,
  systemTransactions,
  onReconcile,
  onUnreconcile,
  onCreateTransaction,
  period,
}: BankReconciliationProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [searchBank, setSearchBank] = useState('');
  const [searchSystem, setSearchSystem] = useState('');
  const [showOnlyUnreconciled, setShowOnlyUnreconciled] = useState(true);

  // Calculate statistics
  const stats = useMemo(() => {
    const bankTotal = bankTransactions.reduce((sum, t) => 
      sum + (t.type === 'credit' ? t.amount : -t.amount), 0
    );
    const systemTotal = systemTransactions.reduce((sum, t) => 
      sum + (t.type === 'receita' ? t.amount : -t.amount), 0
    );
    const reconciledBank = bankTransactions.filter(t => t.reconciled).length;
    const reconciledSystem = systemTransactions.filter(t => t.reconciled).length;

    return {
      bankTotal,
      systemTotal,
      difference: bankTotal - systemTotal,
      bankReconciled: reconciledBank,
      bankPending: bankTransactions.length - reconciledBank,
      systemReconciled: reconciledSystem,
      systemPending: systemTransactions.length - reconciledSystem,
    };
  }, [bankTransactions, systemTransactions]);

  // Filter transactions
  const filteredBank = useMemo(() => {
    return bankTransactions.filter(t => {
      if (showOnlyUnreconciled && t.reconciled) return false;
      if (searchBank && !t.description.toLowerCase().includes(searchBank.toLowerCase())) return false;
      return true;
    });
  }, [bankTransactions, showOnlyUnreconciled, searchBank]);

  const filteredSystem = useMemo(() => {
    return systemTransactions.filter(t => {
      if (showOnlyUnreconciled && t.reconciled) return false;
      if (searchSystem && !t.description.toLowerCase().includes(searchSystem.toLowerCase())) return false;
      return true;
    });
  }, [systemTransactions, showOnlyUnreconciled, searchSystem]);

  // Auto-match suggestions
  const suggestions = useMemo(() => {
    const matches: ReconciliationMatch[] = [];
    
    filteredBank.forEach(bank => {
      if (bank.reconciled) return;
      
      filteredSystem.forEach(sys => {
        if (sys.reconciled) return;
        
        const bankAmount = bank.type === 'credit' ? bank.amount : -bank.amount;
        const sysAmount = sys.type === 'receita' ? sys.amount : -sys.amount;
        
        if (Math.abs(bankAmount - sysAmount) < 0.01) {
          let confidence = 50;
          
          const daysDiff = Math.abs(
            (bank.date.getTime() - sys.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 0) confidence += 30;
          else if (daysDiff <= 3) confidence += 20;
          else if (daysDiff <= 7) confidence += 10;
          
          if (bank.reference && sys.reference && 
              bank.reference.toLowerCase() === sys.reference.toLowerCase()) {
            confidence += 20;
          }
          
          matches.push({
            bankTransaction: bank,
            systemTransaction: sys,
            confidence,
            matchType: confidence >= 80 ? 'exact' : 'amount',
          });
        }
      });
    });
    
    return matches.sort((a, b) => b.confidence - a.confidence);
  }, [filteredBank, filteredSystem]);

  const handleReconcile = useCallback(() => {
    if (selectedBank && selectedSystem) {
      onReconcile(selectedBank, selectedSystem);
      setSelectedBank(null);
      setSelectedSystem(null);
    }
  }, [selectedBank, selectedSystem, onReconcile]);

  const applySuggestion = useCallback((match: ReconciliationMatch) => {
    onReconcile(match.bankTransaction.id, match.systemTransaction.id);
  }, [onReconcile]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Extrato"
          value={stats.bankTotal}
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
        <StatCard
          label="Saldo Sistema"
          value={stats.systemTotal}
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
        <StatCard
          label="Diferença"
          value={stats.difference}
          highlight={stats.difference !== 0}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Pendentes"
          value={stats.bankPending + stats.systemPending}
          isCurrency={false}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-4">
          <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Sugestões de Conciliação ({suggestions.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.slice(0, 5).map((match, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-card rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {match.bankTransaction.description}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {match.confidence}% match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(match.bankTransaction.amount)} → {match.systemTransaction.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => applySuggestion(match)}
                >
                  <Link className="w-4 h-4 mr-1" />
                  Vincular
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showOnlyUnreconciled}
            onChange={(e) => setShowOnlyUnreconciled(e.target.checked)}
            className="rounded border-input"
          />
          Apenas não conciliados
        </label>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Extrato Bancário
            </h3>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchBank}
                onChange={(e) => setSearchBank(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-transparent"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {filteredBank.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                selected={selectedBank === transaction.id}
                onSelect={() => setSelectedBank(
                  selectedBank === transaction.id ? null : transaction.id
                )}
                onUnreconcile={() => onUnreconcile(transaction.id)}
                type="bank"
              />
            ))}
            {filteredBank.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            )}
          </div>
        </div>

        {/* System Transactions */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Lançamentos do Sistema
            </h3>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchSystem}
                onChange={(e) => setSearchSystem(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-transparent"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {filteredSystem.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                selected={selectedSystem === transaction.id}
                onSelect={() => setSelectedSystem(
                  selectedSystem === transaction.id ? null : transaction.id
                )}
                type="system"
              />
            ))}
            {filteredSystem.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {(selectedBank || selectedSystem) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card rounded-lg shadow-lg border border-border p-4 flex items-center gap-4">
          {selectedBank && selectedSystem ? (
            <>
              <span className="text-sm text-muted-foreground">
                Vincular transações selecionadas?
              </span>
              <Button onClick={handleReconcile}>
                <Link className="w-4 h-4 mr-2" />
                Conciliar
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Selecione uma transação em cada coluna para conciliar
            </span>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedBank(null);
              setSelectedSystem(null);
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

// Transaction Row Component
interface TransactionRowProps {
  transaction: BankTransaction | SystemTransaction;
  selected: boolean;
  onSelect: () => void;
  onUnreconcile?: () => void;
  type: 'bank' | 'system';
}

function TransactionRow({ transaction, selected, onSelect, onUnreconcile, type }: TransactionRowProps) {
  const isCredit = type === 'bank' 
    ? (transaction as BankTransaction).type === 'credit'
    : (transaction as SystemTransaction).type === 'receita';

  return (
    <div
      onClick={!transaction.reconciled ? onSelect : undefined}
      className={cn(
        'px-4 py-3 flex items-center gap-3 transition-colors',
        !transaction.reconciled && 'cursor-pointer hover:bg-muted/50',
        selected && 'bg-primary/5',
        transaction.reconciled && 'opacity-60'
      )}
    >
      {/* Status */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        transaction.reconciled 
          ? 'bg-success/10'
          : selected
          ? 'bg-primary/10'
          : 'bg-muted'
      )}>
        {transaction.reconciled ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : selected ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.date.toLocaleDateString('pt-BR')}
          {transaction.reference && ` • ${transaction.reference}`}
        </p>
      </div>

      {/* Amount */}
      <div className={cn(
        'text-sm font-medium',
        isCredit ? 'text-success' : 'text-destructive'
      )}>
        {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
      </div>

      {/* Actions */}
      {transaction.reconciled && onUnreconcile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnreconcile();
          }}
          className="p-1.5 hover:bg-muted rounded"
          title="Desfazer conciliação"
        >
          <Unlink className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  highlight?: boolean;
  isCurrency?: boolean;
}

function StatCard({ label, value, icon, highlight = false, isCurrency = true }: StatCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-lg p-4 shadow-sm border',
      highlight && value !== 0
        ? 'border-warning'
        : 'border-border'
    )}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn(
        'text-xl font-bold mt-1',
        highlight && value !== 0
          ? 'text-warning'
          : 'text-foreground'
      )}>
        {isCurrency ? formatCurrency(value) : value}
      </p>
    </div>
  );
}

export type { BankTransaction, SystemTransaction, ReconciliationMatch };
export default BankReconciliation;
