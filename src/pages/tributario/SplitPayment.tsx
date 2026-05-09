import { SplitPaymentPanel } from '@/components/reforma-tributaria/SplitPaymentPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SplitPaymentPage() {
  const { currentEmpresaId } = useAuth();
  
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Split Payment" 
            subtitle="Segregação automática de impostos IBS/CBS em tempo real para conformidade absoluta."
            badge="Transição Tributária"
            icon={ArrowLeftRight}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-emerald-500"
          />
          
          <SplitPaymentPanel />
        </div>
      </div>
    </MainLayout>
  );
}
