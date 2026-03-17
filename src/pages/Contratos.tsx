import { MainLayout } from '@/components/layout/MainLayout';
import { GestaoContratos } from '@/components/contratos/GestaoContratos';

export default function Contratos() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">Gerencie contratos de serviços e fornecedores</p>
        </div>
        <GestaoContratos />
      </div>
    </MainLayout>
  );
}
