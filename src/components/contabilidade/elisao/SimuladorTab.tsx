import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

interface SimulacaoRow {
  id: string;
  ano_base: number;
  updated_at: string;
  nome: string;
}

interface Props {
  simulacoes: SimulacaoRow[];
  onNovaSimulacao: () => void;
}

export function SimuladorTab({ simulacoes, onNovaSimulacao }: Props) {
  return (
    <TabsContent value="simulador" className="space-y-4 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Cenários Tributários (2025+)</h3>
          <p className="text-sm text-muted-foreground">Compare regimes tradicionais com a transição da Reforma Tributária (CBS/IBS).</p>
        </div>
        <Button onClick={onNovaSimulacao} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cenário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {simulacoes.length === 0 ? (
          <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <CardTitle className="text-muted-foreground">Nenhuma simulação ativa</CardTitle>
            <CardDescription>Crie um cenário para projetar a carga tributária de 2025.</CardDescription>
            <Button variant="outline" className="mt-4" onClick={onNovaSimulacao}>Começar Simulação</Button>
          </Card>
        ) : (
          simulacoes.map((sim) => (
            <Card key={sim.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ano Base {sim.ano_base}</Badge>
                  <span className="text-[10px] text-muted-foreground">Atualizado em {new Date(sim.updated_at).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-base mt-2">{sim.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Melhor Opção:</span>
                    <span className="font-bold text-emerald-600">Simples Nacional</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Economia Anual:</span>
                    <span className="font-bold">R$ 42.150,00</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs">Ver Detalhes do Cenário</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </TabsContent>
  );
}
