import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { anoDoCenario, nomeDoCenario, formatarMoeda } from '@/lib/contabilidade/simulacao-regimes';
import { cn } from '@/lib/utils';
import type { SimulacaoElisao } from './ElisaoFiscalTab.types';

interface Props {
  simulacoes: SimulacaoElisao[];
  onNovaSimulacao: () => void;
}

const ROTULO_FONTE: Record<string, string> = {
  notas_fiscais: 'Notas fiscais emitidas',
  contas_receber: 'Títulos a receber',
  sem_dados: 'Sem dados no período',
};

function corEconomia(valor: number) {
  return cn(
    valor > 0 && 'text-emerald-600',
    valor < 0 && 'text-destructive',
    valor === 0 && 'text-muted-foreground'
  );
}

export function SimuladorTab({ simulacoes, onNovaSimulacao }: Props) {
  const [detalhe, setDetalhe] = useState<SimulacaoElisao | null>(null);
  const fontes = detalhe?.detalhes?.fontes;
  const resultado = detalhe?.detalhes?.resultado;

  return (
    <TabsContent value="simulador" className="space-y-4 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Cenários Tributários (CBS/IBS)</h3>
          <p className="text-sm text-muted-foreground">
            Compare o regime atual com a transição da Reforma Tributária usando o faturamento real
            dos últimos 12 meses.
          </p>
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
            <CardDescription>
              Crie um cenário para projetar a carga tributária com os dados da contabilidade.
            </CardDescription>
            <Button variant="outline" className="mt-4" onClick={onNovaSimulacao}>
              Começar Simulação
            </Button>
          </Card>
        ) : (
          simulacoes.map((sim) => (
            <Card key={sim.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">
                    Ano {anoDoCenario(sim.premissas) ?? sim.ano_referencia}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Atualizado em {new Date(sim.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{nomeDoCenario(sim.premissas)}</CardTitle>
                <CardDescription className="text-xs">
                  {sim.regime_atual ?? 'Regime não informado'} →{' '}
                  {sim.regime_simulado ?? 'Cenário simulado'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Carga atual:</span>
                    <span className="font-mono">{formatarMoeda(sim.carga_atual)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Carga simulada:</span>
                    <span className="font-mono">{formatarMoeda(sim.carga_simulada)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Economia estimada:</span>
                    <span className={`font-bold ${corEconomia(sim.economia_estimada)}`}>
                      {formatarMoeda(sim.economia_estimada)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setDetalhe(sim)}
                >
                  Ver Detalhes do Cenário
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{detalhe ? nomeDoCenario(detalhe.premissas) : 'Cenário'}</DialogTitle>
            <DialogDescription>Memória de cálculo gravada na criação do cenário.</DialogDescription>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Base apurada</p>
                <div className="flex justify-between">
                  <span>Faturamento 12m</span>
                  <span className="font-mono">{formatarMoeda(fontes?.faturamento12m)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compras/serviços 12m</span>
                  <span className="font-mono">{formatarMoeda(fontes?.comprasServicos12m)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fonte</span>
                  <span>{ROTULO_FONTE[fontes?.fonteFaturamento ?? ''] ?? 'Registrada'}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Folha apurada 12m</span>
                  <span className="font-mono">{formatarMoeda(fontes?.folha12m)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tributos no regime atual</span>
                  <span className="font-mono">{formatarMoeda(resultado?.totalAntigo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tributos no cenário CBS/IBS</span>
                  <span className="font-mono">{formatarMoeda(resultado?.totalNovo)}</span>
                </div>
                {(detalhe.detalhes?.residuais_transicao?.total ?? 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>ICMS/ISS/PIS/COFINS residuais do ano</span>
                    <span className="font-mono">
                      {formatarMoeda(detalhe.detalhes?.residuais_transicao?.total)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Economia estimada</span>
                  <span className={corEconomia(detalhe.economia_estimada)}>
                    {formatarMoeda(detalhe.economia_estimada)}
                  </span>
                </div>
              </div>
              {detalhe.detalhes?.avisos && detalhe.detalhes.avisos.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Premissas do cálculo</p>
                  {detalhe.detalhes.avisos.map((aviso) => (
                    <p key={aviso} className="text-muted-foreground">
                      {aviso}
                    </p>
                  ))}
                </div>
              )}
              {resultado?.observacoes && resultado.observacoes.length > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Observações do motor</p>
                  {resultado.observacoes.map((obs) => (
                    <p key={obs} className="text-muted-foreground">
                      {obs}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
