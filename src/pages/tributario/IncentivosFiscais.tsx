import { IncentivosFiscaisPanel } from '@/components/reforma-tributaria/IncentivosFiscaisPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Zap } from 'lucide-react';

export default function IncentivosFiscaisPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Incentivos Fiscais" 
            subtitle="Mapeamento e gestão de benefícios, isenções e regimes especiais (Sudene, Sudam, REIDI)."
            badge="Otimização Fiscal"
            icon={Zap}
            gradientFrom="from-yellow-400"
            gradientVia="via-primary"
            gradientTo="to-amber-600"
          />
          
          <IncentivosFiscaisPanel />
        </div>
      </div>
    </MainLayout>
  );
}
