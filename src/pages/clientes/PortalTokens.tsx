import { PortalClientePanel } from '@/components/clientes/PortalClientePanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { useClientes } from '@/hooks/useFinancialData';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Key } from 'lucide-react';

export default function PortalTokensPage() {
  const { data: clientes = [] } = useClientes();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10">
          <PageHeader 
            title="Portal de Tokens" 
            subtitle="Visão consolidada administrativa para gestão de acessos self-service de clientes."
            badge="Customer Access"
            icon={Key}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-cyan-500"
          />

          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Selecionar Cliente</CardTitle>
                    <CardDescription>Escolha um cliente para gerenciar seus tokens de acesso</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedClienteId}>
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.razao_social} ({c.cnpj_cpf})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCliente ? (
              <PortalClientePanel 
                clienteId={selectedCliente.id} 
                clienteEmail={selectedCliente.email || ''} 
              />
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-background/20">
                Selecione um cliente acima para visualizar e gerenciar seus tokens.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
