import { RelatoriosContabeisTributarios } from '@/components/reforma-tributaria/RelatoriosContabeisTributarios';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { FileBarChart } from 'lucide-react';

export default function RelatoriosContabeisPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Relatórios Contábeis" 
            subtitle="Demonstrativos de resultados, balancetes e fluxos de caixa com visão tributária."
            badge="Business Intelligence"
            icon={FileBarChart}
            gradientFrom="from-slate-700"
            gradientVia="via-primary"
            gradientTo="to-blue-500"
          />
          
          <RelatoriosContabeisTributarios />
        </div>
      </div>
    </MainLayout>
  );
}
