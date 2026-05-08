import { RetencoesFonte } from '@/components/reforma-tributaria/RetencoesFonte';
import { MainLayout } from '@/components/layout/MainLayout';

export default function RetencoesFontePage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <RetencoesFonte />
      </div>
    </MainLayout>
  );
}
