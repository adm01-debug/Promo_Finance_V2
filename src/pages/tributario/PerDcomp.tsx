import { PerDcompPanel } from '@/components/reforma-tributaria/PerDcompPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function PerDcompPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <PerDcompPanel />
      </div>
    </MainLayout>
  );
}
