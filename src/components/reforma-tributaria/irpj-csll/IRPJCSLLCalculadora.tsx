import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface FormCalculo {
  apuracaoId: string;
  lucroContabil: number;
  adicoesPermanentes: number;
  adicoesTemporarias: number;
  exclusoesPermanentes: number;
  exclusoesTemporarias: number;
}

interface Props {
  apuracoesAno: any[];
  formCalculo: FormCalculo;
  setFormCalculo: React.Dispatch<React.SetStateAction<FormCalculo>>;
  saldoPrejuizos: { irpj: number; csll: number };
  handleCalcular: () => void;
  isPending: boolean;
}

export function IRPJCSLLCalculadora({ apuracoesAno, formCalculo, setFormCalculo, saldoPrejuizos, handleCalcular, isPending }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calcular IRPJ/CSLL</CardTitle>
        <CardDescription>Informe o lucro contábil e ajustes do LALUR</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Selecione a Apuração</Label>
          <Select value={formCalculo.apuracaoId} onValueChange={v => setFormCalculo(p => ({ ...p, apuracaoId: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {apuracoesAno.filter(a => a.status === 'rascunho').map(ap => (
                <SelectItem key={ap.id} value={ap.id}>
                  {ap.tipo_apuracao === 'trimestral' ? `${ap.trimestre}º Trim/${ap.ano}` : `Anual ${ap.ano}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Lucro Contábil</h4>
            <Input type="number" value={formCalculo.lucroContabil}
              onChange={e => setFormCalculo(p => ({ ...p, lucroContabil: Number(e.target.value) }))} placeholder="0,00" />
          </div>

          <div className="p-4 border rounded-lg border-success/20 bg-success/5">
            <h4 className="font-medium mb-3 text-success">Adições</h4>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Permanentes</Label>
                <Input type="number" value={formCalculo.adicoesPermanentes}
                  onChange={e => setFormCalculo(p => ({ ...p, adicoesPermanentes: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Temporárias</Label>
                <Input type="number" value={formCalculo.adicoesTemporarias}
                  onChange={e => setFormCalculo(p => ({ ...p, adicoesTemporarias: Number(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg border-destructive/20 bg-destructive/5">
            <h4 className="font-medium mb-3 text-destructive">Exclusões</h4>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Permanentes</Label>
                <Input type="number" value={formCalculo.exclusoesPermanentes}
                  onChange={e => setFormCalculo(p => ({ ...p, exclusoesPermanentes: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Temporárias</Label>
                <Input type="number" value={formCalculo.exclusoesTemporarias}
                  onChange={e => setFormCalculo(p => ({ ...p, exclusoesTemporarias: Number(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-3">Prejuízos Compensáveis</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>IRPJ:</span><span className="font-medium">{formatCurrency(saldoPrejuizos.irpj)}</span></div>
              <div className="flex justify-between"><span>CSLL:</span><span className="font-medium">{formatCurrency(saldoPrejuizos.csll)}</span></div>
              <p className="text-xs text-muted-foreground mt-2">Limite de compensação: 30% do lucro real</p>
            </div>
          </div>
        </div>

        <Button onClick={handleCalcular} disabled={!formCalculo.apuracaoId || isPending} className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          {isPending ? 'Calculando...' : 'Calcular IRPJ/CSLL'}
        </Button>
      </CardContent>
    </Card>
  );
}
