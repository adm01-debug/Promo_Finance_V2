import { CashbackSimuladorPanel } from '@/components/reforma-tributaria/CashbackSimuladorPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { RefreshCw } from 'lucide-react';

export default function CashbackSimuladorPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Simulador de Cashback" 
            subtitle="Calcule a devolução de impostos para famílias de baixa renda e impacto no consumo."
            badge="Justiça Fiscal"
            icon={RefreshCw}
            gradientFrom="from-emerald-600"
            gradientVia="via-primary"
            gradientTo="to-blue-500"
          />
          
          <CashbackSimuladorPanel />
        </div>
      </div>
    </MainLayout>
  );
}
