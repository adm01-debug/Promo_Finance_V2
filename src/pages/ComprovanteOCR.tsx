import { MainLayout } from '@/components/layout/MainLayout';
import { ComprovanteOCR } from '@/components/comprovantes/ComprovanteOCR';

export default function ComprovanteOCRPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leitura de Comprovantes (OCR)</h1>
          <p className="text-muted-foreground">Digitalize comprovantes e extraia dados automaticamente com IA</p>
        </div>
        <ComprovanteOCR />
      </div>
    </MainLayout>
  );
}
