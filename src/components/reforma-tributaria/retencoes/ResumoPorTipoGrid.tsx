import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { TipoRetencao } from '@/hooks/useRetencoesFonte';

const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF', csrf: 'CSRF', pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS', iss: 'ISS', cbs: 'CBS', ibs: 'IBS',
};

interface ResumoDados { count: number; total: number; pendente: number; recolhido: number; }

interface Props {
  resumoPorTipo: Record<string, ResumoDados>;
  onGerarDARF: (tipo: TipoRetencao) => void;
}

export function ResumoPorTipoGrid({ resumoPorTipo, onGerarDARF }: Props) {
  const entries = Object.entries(resumoPorTipo);

  if (entries.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma retenção registrada na competência</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {entries.map(([tipo, dados]) => (
        <Card key={tipo}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{TIPO_LABELS[tipo as TipoRetencao]}</span>
              <Badge variant="outline">{dados.count} retenções</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Total:</span><span className="font-bold">{formatCurrency(dados.total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-warning">Pendente:</span><span>{formatCurrency(dados.pendente)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-success">Recolhido:</span><span>{formatCurrency(dados.recolhido)}</span></div>
            <Separator />
            <Button size="sm" className="w-full" variant="outline" onClick={() => onGerarDARF(tipo as TipoRetencao)} disabled={dados.pendente === 0}>
              <FileText className="h-4 w-4 mr-2" />Gerar DARF
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
