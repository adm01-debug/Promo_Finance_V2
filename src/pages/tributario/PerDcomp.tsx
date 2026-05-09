import { PerDcompPanel } from '@/components/reforma-tributaria/PerDcompPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Calculator } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PerDcompPage() {
  const { currentEmpresaId } = useAuth();

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Per/Dcomp" 
            subtitle="Pedidos de Restituição, Ressarcimento e Declaração de Compensação de tributos federais."
            badge="Cash Management"
            icon={Calculator}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-emerald-500"
          />
          
          <PerDcompPanel empresaId={currentEmpresaId || ''} />
        </div>
      </div>
    </MainLayout>
  );
}
