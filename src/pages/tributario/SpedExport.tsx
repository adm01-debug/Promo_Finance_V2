import { ExportacaoSPED } from '@/components/reforma-tributaria/ExportacaoSPED';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SpedExportPage() {
  const { currentEmpresaId } = useAuth();

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Exportação SPED" 
            subtitle="Geração de arquivos magnéticos para SPED Fiscal, Contribuições e Contábil."
            badge="Compliance Legal"
            icon={BookOpen}
            gradientFrom="from-blue-700"
            gradientVia="via-primary"
            gradientTo="to-indigo-600"
          />
          
          <ExportacaoSPED empresaId={currentEmpresaId || ''} />
        </div>
      </div>
    </MainLayout>
  );
}
