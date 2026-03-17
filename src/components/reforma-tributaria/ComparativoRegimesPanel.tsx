// ============================================
// COMPONENTE: COMPARATIVO DE REGIMES TRIBUTÁRIOS
// ============================================

import { Calculator, Award, XCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { useComparativoRegimes } from '@/hooks/useComparativoRegimes';
import { useRegimesEspeciaisEmpresa, useUpdateRegimeEspecial } from '@/hooks/useRegimesEspeciais';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId?: string;
}

export function ComparativoRegimesPanel({ empresaId }: Props = {}) {
  const { parametros, setParametros, resultado } = useComparativoRegimes();
  const { data: regimesEspeciais, isLoading: loadingRegimes } = useRegimesEspeciaisEmpresa(empresaId);
  const updateRegime = useUpdateRegimeEspecial();

  const chartData = resultado.resultados.map(r => ({
    name: r.nome,
    valor: r.totalTributos,
    color: r.regime === 'lucro_real' ? 'hsl(217, 91%, 60%)' : r.regime === 'lucro_presumido' ? 'hsl(258, 90%, 66%)' : 'hsl(160, 84%, 39%)'
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comparativo de Regimes Tributários</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Parâmetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Faturamento Anual</Label>
              <Input
                type="number"
                value={parametros.faturamentoAnual}
                onChange={e => setParametros(p => ({ ...p, faturamentoAnual: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Folha de Pagamento</Label>
              <Input
                type="number"
                value={parametros.folhaPagamento}
                onChange={e => setParametros(p => ({ ...p, folhaPagamento: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Despesas Operacionais</Label>
              <Input
                type="number"
                value={parametros.despesasOperacionais}
                onChange={e => setParametros(p => ({ ...p, despesasOperacionais: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Compras com Crédito</Label>
              <Input
                type="number"
                value={parametros.comprasCredito}
                onChange={e => setParametros(p => ({ ...p, comprasCredito: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="pt-6 flex items-center gap-4">
              <Award className="h-10 w-10 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Regime Mais Vantajoso</p>
                <p className="text-2xl font-bold text-success">{resultado.melhorOpcao.nome}</p>
                <p className="text-sm text-success/80">Economia: {formatCurrency(resultado.economiaMelhorOpcao)}/ano</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Carga Tributária</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="real">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="real">Lucro Real</TabsTrigger>
              <TabsTrigger value="presumido">Presumido</TabsTrigger>
              <TabsTrigger value="simples">Simples</TabsTrigger>
            </TabsList>
            {resultado.resultados.map(r => (
              <TabsContent key={r.regime} value={r.regime.replace('lucro_', '').replace('_nacional', '')}>
                <Card>
                  <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
                    <div className="p-3 rounded bg-muted">
                      <p className="text-sm text-muted-foreground">IRPJ</p>
                      <p className="text-xl font-bold">{formatCurrency(r.irpj)}</p>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <p className="text-sm text-muted-foreground">CSLL</p>
                      <p className="text-xl font-bold">{formatCurrency(r.csll)}</p>
                    </div>
                    <div className="p-3 rounded bg-muted">
                      <p className="text-sm text-muted-foreground">CBS + IBS</p>
                      <p className="text-xl font-bold">{formatCurrency(r.cbs + r.ibs)}</p>
                    </div>
                    <div className="p-3 rounded bg-primary/10">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{formatCurrency(r.totalTributos)}</p>
                      <p className="text-xs">Carga: {r.cargaEfetiva.toFixed(2)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Regimes Especiais da Empresa */}
        {empresaId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Regimes Especiais Aplicáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRegimes ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : regimesEspeciais && regimesEspeciais.length > 0 ? (
                <div className="space-y-3">
                  {regimesEspeciais.map((regime) => (
                    <div key={regime.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{regime.regime_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          CBS: -{regime.reducao_cbs}% • IBS: -{regime.reducao_ibs}%
                          {regime.data_inicio && ` • Desde ${regime.data_inicio}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={regime.ativo ? 'default' : 'secondary'}>
                          {regime.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Switch
                          checked={regime.ativo}
                          onCheckedChange={(checked) => updateRegime.mutate({ id: regime.id, ativo: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Nenhum regime especial cadastrado para esta empresa
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ComparativoRegimesPanel;
