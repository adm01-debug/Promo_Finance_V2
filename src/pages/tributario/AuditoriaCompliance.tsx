import { AuditoriaCompliancePanel } from '@/components/reforma-tributaria/AuditoriaCompliancePanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuditoriaCompliancePage() {
  const { currentEmpresaId } = useAuth();
  
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Compliance & Auditoria" 
            subtitle="Verificação contínua de conformidade fiscal e mitigação de riscos regulatórios."
            badge="Audit Trail 10/10"
            icon={ShieldCheck}
            gradientFrom="from-slate-600"
            gradientVia="via-primary"
            gradientTo="to-indigo-500"
          />
          
          <AuditoriaCompliancePanel empresaId={currentEmpresaId || 'all'} />
        </div>
      </div>
    </MainLayout>
  );
}
