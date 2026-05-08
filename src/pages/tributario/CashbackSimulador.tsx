import { CashbackSimuladorPanel } from '@/components/reforma-tributaria/CashbackSimuladorPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function CashbackSimuladorPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <CashbackSimuladorPanel />
      </div>
    </MainLayout>
  );
}
