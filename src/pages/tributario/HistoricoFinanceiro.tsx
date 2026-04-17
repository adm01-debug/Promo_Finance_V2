// ============================================
// PÁGINA: Histórico Financeiro (Faturamento + Folha)
// Modularizado — tabs extraídos para components/tributario/historico/
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from 'lucide-react';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { FaturamentoTab } from '@/components/tributario/historico/FaturamentoTab';
import { FolhaTab } from '@/components/tributario/historico/FolhaTab';

export default function HistoricoFinanceiro() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Database className="h-7 w-7 md:h-8 md:w-8 text-primary" aria-hidden="true" />
          Histórico Financeiro Tributário
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Cadastre faturamento e folha mensal — base para RBT12, Fator R e simulações de regime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="max-w-md" aria-label="Selecionar empresa">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {empresaId && (
        <Tabs defaultValue="faturamento">
          <TabsList>
            <TabsTrigger value="faturamento">Faturamento Mensal</TabsTrigger>
            <TabsTrigger value="folha">Folha de Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="faturamento">
            <FaturamentoTab empresaId={empresaId} />
          </TabsContent>
          <TabsContent value="folha">
            <FolhaTab empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
