import { ScoringClientesPanel } from '@/components/clientes/ScoringClientesPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Target } from 'lucide-react';

export default function ScoringClientesPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Scoring & Risco" 
            subtitle="Análise preditiva de crédito e risco de inadimplência baseada em comportamento neural."
            badge="IA de Crédito"
            icon={Target}
            gradientFrom="from-amber-600"
            gradientVia="via-primary"
            gradientTo="to-rose-500"
          />
          
          <ScoringClientesPanel />
        </div>
      </div>
    </MainLayout>
  );
}
