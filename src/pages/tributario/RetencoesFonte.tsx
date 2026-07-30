import { RetencoesFonte } from '@/components/reforma-tributaria/RetencoesFonte';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RetencoesFontePage() {
  const { currentEmpresaId } = useAuth();

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Retenções na Fonte" 
            subtitle="Controle centralizado de IRRF, CSRF, INSS, ISS e novos tributos CBS/IBS."
            badge="Cash-Out Management"
            icon={Receipt}
            gradientFrom="from-destructive/80"
            gradientVia="via-primary"
            gradientTo="to-orange-500"
          />
          
          <RetencoesFonte empresaId={currentEmpresaId || ''} />
        </div>
      </div>
    </MainLayout>
  );
}
