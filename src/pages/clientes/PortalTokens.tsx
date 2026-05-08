import { PortalClientePanel } from '@/components/clientes/PortalClientePanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function PortalTokensPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <PortalClientePanel />
      </div>
    </MainLayout>
  );
}
