import { ComparativoRegimesPanel } from '@/components/reforma-tributaria/ComparativoRegimesPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Scale } from 'lucide-react';

export default function ComparativoRegimesPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Comparativo de Regimes" 
            subtitle="Simule a carga tributária entre Lucro Real, Presumido e o novo sistema IBS/CBS."
            badge="Planejamento Tributário"
            icon={Scale}
            gradientFrom="from-cyan-600"
            gradientVia="via-primary"
            gradientTo="to-blue-600"
          />
          
          <ComparativoRegimesPanel />
        </div>
      </div>
    </MainLayout>
  );
}
