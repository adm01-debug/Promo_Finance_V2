import { ComparativoRegimesPanel } from '@/components/reforma-tributaria/ComparativoRegimesPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ComparativoRegimesPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ComparativoRegimesPanel />
      </div>
    </MainLayout>
  );
}
