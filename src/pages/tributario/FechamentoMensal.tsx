import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';
import { MainLayout } from '@/components/layout/MainLayout';

export default function FechamentoMensalPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <AssistenteFechamentoMensal />
      </div>
    </MainLayout>
  );
}
