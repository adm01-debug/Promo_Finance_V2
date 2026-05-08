import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function FechamentoMensalPage() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Assistente de Fechamento Mensal</h1>
          <p className="text-muted-foreground">Validação e fechamento de períodos tributários</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Configuração do Fechamento</CardTitle>
                <CardDescription>Selecione a empresa para iniciar o processo de fechamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setEmpresaId}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Selecione uma empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.razao_social || emp.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {empresaId ? (
          <AssistenteFechamentoMensal 
            empresaId={empresaId} 
            ano={currentYear} 
            mes={currentMonth} 
            isAdmin={true}
          />
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            Selecione uma empresa acima para processar o fechamento do período atual ({String(currentMonth).padStart(2, '0')}/{currentYear}).
          </div>
        )}
      </div>
    </MainLayout>
  );
}
