import { ContasPagarProvider } from './context';
import { ContasPagarHeader } from './components/Header';
import { ContasPagarFilters } from './components/Filters';
import { ContasPagarList } from './components/List';
import { ContasPagarStats } from './components/Stats';

export default function ContasPagar() {
  return (
    <ContasPagarProvider>
      <div className="space-y-6">
        <ContasPagarHeader />
        <ContasPagarStats />
        <ContasPagarFilters />
        <ContasPagarList />
      </div>
    </ContasPagarProvider>
  );
}
