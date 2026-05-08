import { PortalClientePanel } from '@/components/clientes/PortalClientePanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClientes } from '@/hooks/useFinancialData';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function PortalTokensPage() {
  const { data: clientes = [] } = useClientes();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Portal de Tokens do Cliente</h1>
          <p className="text-muted-foreground">Visão consolidada administrativa para gestão de acessos self-service</p>
        </div>

        <Card>
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
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            Selecione um cliente acima para visualizar e gerenciar seus tokens.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
