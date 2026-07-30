import { MainLayout } from '@/components/layout/MainLayout';
import { CertificadosDigitaisTab } from '@/components/tributario/CertificadosDigitaisTab';

export default function CertificadosDigitais() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Certificados Digitais</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os certificados A1 usados para comunicação com a SEFAZ e descoberta
            automática de NF-e emitidas contra seus CNPJs.
          </p>
        </div>
        <CertificadosDigitaisTab />
      </div>
    </MainLayout>
  );
}
