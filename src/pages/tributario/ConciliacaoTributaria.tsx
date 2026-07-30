import { ConciliacaoTributariaPanel } from '@/components/reforma-tributaria/ConciliacaoTributariaPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { RefreshCcw } from 'lucide-react';

export default function ConciliacaoTributariaPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Conciliação Tributária" 
            subtitle="Detecção automática de divergências entre registros contábeis e obrigações fiscais."
            badge="Divergência Zero"
            icon={RefreshCcw}
            gradientFrom="from-amber-500"
            gradientVia="via-primary"
            gradientTo="to-orange-600"
          />
          
          <ConciliacaoTributariaPanel empresaId="all" />
        </div>
      </div>
    </MainLayout>
  );
}
