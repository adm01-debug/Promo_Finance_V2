import { NFProvider } from './context';
import { NFHeader } from './components/Header';
import { NFFilters } from './components/Filters';
import { NFList } from './components/List';
import { NFEmissaoModal } from './components/EmissaoModal';

export default function NotasFiscais() {
  return (
    <NFProvider>
      <div className="space-y-6 p-6">
        <NFHeader />
        <NFFilters />
        <NFList />
        <NFEmissaoModal />
      </div>
    </NFProvider>
  );
}
