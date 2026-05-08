import { ConciliacaoTributariaPanel } from '@/components/reforma-tributaria/ConciliacaoTributariaPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ConciliacaoTributariaPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ConciliacaoTributariaPanel empresaId="all" />
      </div>
    </MainLayout>
  );
}
