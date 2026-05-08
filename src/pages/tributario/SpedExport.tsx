import { ExportacaoSPED } from '@/components/reforma-tributaria/ExportacaoSPED';
import { MainLayout } from '@/components/layout/MainLayout';

export default function SpedExportPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ExportacaoSPED />
      </div>
    </MainLayout>
  );
}
