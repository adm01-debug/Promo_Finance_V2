import { ScoringClientesPanel } from '@/components/clientes/ScoringClientesPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ScoringClientesPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ScoringClientesPanel />
      </div>
    </MainLayout>
  );
}
