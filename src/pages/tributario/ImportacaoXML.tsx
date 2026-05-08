import { ImportacaoXMLPanel } from '@/components/reforma-tributaria/ImportacaoXMLPanel';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ImportacaoXMLPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ImportacaoXMLPanel empresaId="all" />
      </div>
    </MainLayout>
  );
}
