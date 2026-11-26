import { AnaliseCreditoPanel } from '@/components/clientes/AnaliseCreditoPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { ShieldCheck } from 'lucide-react';

export default function AnaliseCreditoPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />

        <div className="container mx-auto p-6 relative z-10">
          <PageHeader
            title="Análise de Crédito — 1ª Venda"
            subtitle="Fila das primeiras vendas enviadas pelo Promo Champions: CNPJ.já automático, Escavador e consulta financeira registrados aqui, decisão devolvida ao vendedor."
            badge="Crédito"
            icon={ShieldCheck}
            gradientFrom="from-emerald-600"
            gradientVia="via-primary"
            gradientTo="to-amber-500"
          />

          <AnaliseCreditoPanel />
        </div>
      </div>
    </MainLayout>
  );
}
