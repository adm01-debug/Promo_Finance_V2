import { MetasFinanceirasPanel } from '@/components/dashboard/MetasFinanceirasPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Target } from 'lucide-react';

export default function MetasFinanceirasPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Metas Financeiras" 
            subtitle="Defina objetivos estratégicos e acompanhe a performance operacional em tempo real."
            badge="Performance 10/10"
            icon={Target}
            gradientFrom="from-rose-600"
            gradientVia="via-primary"
            gradientTo="to-orange-500"
          />
          
          <MetasFinanceirasPanel />
        </div>
      </div>
    </MainLayout>
  );
}
