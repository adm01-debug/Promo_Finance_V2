import { AuditoriaCompliancePanel } from '@/components/reforma-tributaria/AuditoriaCompliancePanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AuditoriaCompliancePage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <AuditoriaCompliancePanel empresaId="all" />
      </div>
    </MainLayout>
  );
}
