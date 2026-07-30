import { MainLayout } from '@/components/layout/MainLayout';
import { AssinaturaDigital } from '@/components/documentos/AssinaturaDigital';

export default function AssinaturaDigitalPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinatura Digital</h1>
          <p className="text-muted-foreground">Envie e gerencie documentos para assinatura eletrônica</p>
        </div>
        <AssinaturaDigital />
      </div>
    </MainLayout>
  );
}
