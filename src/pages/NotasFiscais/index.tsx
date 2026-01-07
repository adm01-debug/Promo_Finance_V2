import { NFProvider } from './context';
import { NFHeader } from './components/Header';
import { NFFilters } from './components/Filters';
import { NFList } from './components/List';
import { NFEmissaoModal } from './components/EmissaoModal';

export default function NotasFiscais() {
  return (
    <NFProvider>
      <div className="space-y-4 sm:space-y-5 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <NFHeader />
        <NFFilters />
        <NFList />
        <NFEmissaoModal />
      </div>
    </NFProvider>
  );
}
