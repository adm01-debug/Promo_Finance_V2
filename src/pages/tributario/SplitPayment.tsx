import { SplitPaymentPanel } from '@/components/reforma-tributaria/SplitPaymentPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function SplitPaymentPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <SplitPaymentPanel />
      </div>
    </MainLayout>
  );
}
