import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function FechamentoMensalPage() {
  const { data: empresas = [] } = useAllEmpresas();
  const { currentEmpresaId } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(currentEmpresaId || null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Fechamento Mensal" 
            subtitle={`Validação e encerramento do período fiscal de ${String(currentMonth).padStart(2, '0')}/${currentYear}.`}
            badge="Processo de Encerramento"
            icon={Clock}
            gradientFrom="from-indigo-600"
            gradientVia="via-primary"
            gradientTo="to-purple-500"
          />

          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-white/10">
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
                <Select value={empresaId || ''} onValueChange={setEmpresaId}>
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
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-background/20">
                Selecione uma empresa acima para processar o fechamento do período atual ({String(currentMonth).padStart(2, '0')}/{currentYear}).
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
