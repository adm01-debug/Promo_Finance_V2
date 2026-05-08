import { IncentivosFiscaisPanel } from '@/components/reforma-tributaria/IncentivosFiscaisPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function IncentivosFiscaisPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <IncentivosFiscaisPanel empresaId="all" />
      </div>
    </MainLayout>
  );
}
