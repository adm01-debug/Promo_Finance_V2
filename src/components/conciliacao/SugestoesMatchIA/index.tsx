// ANTES: SugestoesMatchIA.tsx (51 KB - TUDO EM UM ARQUIVO)
// DEPOIS: Dividir em múltiplos arquivos

// src/components/conciliacao/SugestoesMatchIA/index.tsx
import { MatchCard } from './MatchCard';
import { ConfidenceScore } from './ConfidenceScore';
import { TransactionDetails } from './TransactionDetails';
import { MatchActions } from './MatchActions';
import { FiltersPanel } from './FiltersPanel';
import { useMatchAlgorithm } from './hooks/useMatchAlgorithm';
import { useMatchFilters } from './hooks/useMatchFilters';
import type { Match, BankTransaction, ContaPagar } from './types';

export function SugestoesMatchIA() {
  const { matches, loading, executeMatch } = useMatchAlgorithm();
  const { filters, setFilters, filteredMatches } = useMatchFilters(matches);

  return (
    <div className="space-y-4">
      <FiltersPanel filters={filters} onChange={setFilters} />
      
      <div className="grid gap-4">
        {filteredMatches.map((match) => (
          <MatchCard key={match.id} match={match}>
            <ConfidenceScore confidence={match.confidence} />
            <TransactionDetails transaction={match.bankTransaction} />
            <MatchActions matchId={match.id} onConfirm={executeMatch} />
          </MatchCard>
        ))}
      </div>
    </div>
  );
}
