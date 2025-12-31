import { NFProvider } from './context';
import { NFHeader } from './components/Header';
import { NFList } from './components/List';
import { NFForm } from './components/Form';

export default function NotasFiscais() {
  return (
    <NFProvider>
      <div className="space-y-6 p-6">
        <NFHeader />
        <NFList />
        <NFForm />
      </div>
    </NFProvider>
  );
}
