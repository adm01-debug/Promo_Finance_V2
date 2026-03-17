import { MainLayout } from '@/components/layout/MainLayout';
import { SimuladorAntecipacao } from '@/components/simuladores/SimuladorAntecipacao';

export default function SimuladorAntecipacaoPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulador de Antecipação</h1>
          <p className="text-muted-foreground">Simule a antecipação de recebíveis e analise taxas</p>
        </div>
        <SimuladorAntecipacao />
      </div>
    </MainLayout>
  );
}
