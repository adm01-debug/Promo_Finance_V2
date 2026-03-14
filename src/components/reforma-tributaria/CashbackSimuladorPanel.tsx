// ============================================
// COMPONENTE: SIMULADOR DE CASHBACK
// ============================================

import { Wallet, ShoppingBasket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useCashbackSimulador } from '@/hooks/useCashbackSimulador';
import { formatCurrency } from '@/lib/formatters';

export function CashbackSimuladorPanel() {
  const { 
    rendaFamiliar, setRendaFamiliar,
    inscritoCadUnico, setInscritoCadUnico,
    elegivel, resumoMensal, projecaoAnual, categoriasDisponiveis
  } = useCashbackSimulador();

  const chartData = resumoMensal.porCategoria.filter(c => c.totalCashback > 0).map(c => ({
    name: c.nome,
    value: c.totalCashback,
  }));

  const COLORS = ['hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(258, 90%, 66%)', 'hsl(0, 84%, 60%)', 'hsl(330, 81%, 60%)'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Simulador de Cashback - LC 214/2025
        </h2>
        <p className="text-sm text-muted-foreground">Calcule o cashback para famílias de baixa renda</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Família</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Renda Familiar Mensal</Label>
              <Input
                type="number"
                value={rendaFamiliar}
                onChange={e => setRendaFamiliar(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Inscrito no CadÚnico</Label>
              <Switch checked={inscritoCadUnico} onCheckedChange={setInscritoCadUnico} />
            </div>
            <div className="p-3 rounded bg-muted">
              <Badge variant={elegivel ? 'default' : 'secondary'}>
                {elegivel ? '✓ Elegível ao Cashback' : '✗ Não elegível'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-success/20 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Cashback Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{formatCurrency(resumoMensal.totalCashback)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Cashback Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(projecaoAnual.totalCashback)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">% Devolvido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{resumoMensal.percentualMedioDevolvido.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resumoMensal.porCategoria.filter(c => c.valorConsumo > 0).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted">
                      <span className="text-sm">{item.nome}</span>
                      <span className="font-mono font-medium">{formatCurrency(item.totalCashback)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashbackSimuladorPanel;
