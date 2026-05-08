import { MetasFinanceirasPanel } from '@/components/dashboard/MetasFinanceirasPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function MetasFinanceirasPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <MetasFinanceirasPanel />
      </div>
    </MainLayout>
  );
}
