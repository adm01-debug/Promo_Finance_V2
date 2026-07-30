import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { RegimeEspecial, CategoriaIS } from '@/types/reforma-tributaria';

interface RegimeEspecialItem {
  regime: string;
  descricao: string;
}

interface SimuladorInputFormProps {
  faturamentoAnual: number;
  setFaturamentoAnual: (v: number) => void;
  comprasAnual: number;
  setComprasAnual: (v: number) => void;
  servicosTomadosAnual: number;
  setServicosTomadosAnual: (v: number) => void;
  percentualVendas: number;
  setPercentualVendas: (v: number) => void;
  percentualServicos: number;
  setPercentualServicos: (v: number) => void;
  regimeEspecial: RegimeEspecial;
  setRegimeEspecial: (v: RegimeEspecial) => void;
  temProdutosIS: boolean;
  setTemProdutosIS: (v: boolean) => void;
  categoriaIS: CategoriaIS;
  setCategoriaIS: (v: CategoriaIS) => void;
  regimesEspeciais: RegimeEspecialItem[];
  isSimulando: boolean;
  onExecutarProjecao: () => void;
}

export function SimuladorInputForm(props: SimuladorInputFormProps) {
  const {
    faturamentoAnual,
    setFaturamentoAnual,
    comprasAnual,
    setComprasAnual,
    servicosTomadosAnual,
    setServicosTomadosAnual,
    percentualVendas,
    setPercentualVendas,
    percentualServicos,
    setPercentualServicos,
    regimeEspecial,
    setRegimeEspecial,
    temProdutosIS,
    setTemProdutosIS,
    categoriaIS,
    setCategoriaIS,
    regimesEspeciais,
    isSimulando,
    onExecutarProjecao,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>Configure os parâmetros para simulação comparativa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Faturamento Anual</Label>
          <Input
            type="number"
            value={faturamentoAnual}
            onChange={(e) => setFaturamentoAnual(Number(e.target.value))}
            min={0}
            step={100000}
          />
          <p className="text-xs text-muted-foreground">{formatCurrency(faturamentoAnual)}</p>
        </div>

        <div className="space-y-4">
          <Label>Distribuição do Faturamento</Label>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Vendas de Produtos: {percentualVendas}%</span>
              <span>Serviços: {percentualServicos}%</span>
            </div>
            <Slider
              value={[percentualVendas]}
              onValueChange={([v]) => {
                setPercentualVendas(v);
                setPercentualServicos(100 - v);
              }}
              max={100}
              step={5}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Compras Anuais</Label>
            <Input
              type="number"
              value={comprasAnual}
              onChange={(e) => setComprasAnual(Number(e.target.value))}
              min={0}
              step={50000}
            />
          </div>
          <div className="space-y-2">
            <Label>Serviços Tomados</Label>
            <Input
              type="number"
              value={servicosTomadosAnual}
              onChange={(e) => setServicosTomadosAnual(Number(e.target.value))}
              min={0}
              step={50000}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Regime Especial</Label>
          <Select value={regimeEspecial} onValueChange={(v) => setRegimeEspecial(v as RegimeEspecial)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Nenhum (alíquota padrão)</SelectItem>
              {regimesEspeciais.map((regime) => (
                <SelectItem key={regime.regime} value={regime.regime}>
                  {regime.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Produtos Sujeitos ao IS</Label>
              <p className="text-xs text-muted-foreground">Imposto Seletivo sobre produtos nocivos</p>
            </div>
            <Switch checked={temProdutosIS} onCheckedChange={setTemProdutosIS} />
          </div>

          {temProdutosIS && (
            <Select value={categoriaIS} onValueChange={(v) => setCategoriaIS(v as CategoriaIS)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bebidas_alcoolicas">Bebidas Alcoólicas</SelectItem>
                <SelectItem value="bebidas_acucaradas">Bebidas Açucaradas</SelectItem>
                <SelectItem value="produtos_fumigenos">Produtos Fumígenos</SelectItem>
                <SelectItem value="veiculos">Veículos</SelectItem>
                <SelectItem value="combustiveis_fosseis">Combustíveis Fósseis</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Button className="w-full" onClick={onExecutarProjecao} disabled={isSimulando}>
          {isSimulando ? 'Calculando...' : 'Projetar 2026-2033'}
        </Button>
      </CardContent>
    </Card>
  );
}
