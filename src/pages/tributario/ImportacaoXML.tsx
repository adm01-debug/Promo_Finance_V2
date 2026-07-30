import { ImportacaoXMLPanel } from '@/components/reforma-tributaria/ImportacaoXMLPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ImportacaoXMLPage() {
  const { currentEmpresaId } = useAuth();

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Importação XML" 
            subtitle="Processamento inteligente e em massa de documentos fiscais eletrônicos."
            badge="Data Integration"
            icon={FileSpreadsheet}
            gradientFrom="from-emerald-500"
            gradientVia="via-primary"
            gradientTo="to-teal-600"
          />
          
          <ImportacaoXMLPanel empresaId={currentEmpresaId || ''} />
        </div>
      </div>
    </MainLayout>
  );
}
