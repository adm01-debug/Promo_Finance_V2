import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import type { RetencaoFonte, TipoRetencao } from '@/hooks/useRetencoesFonte';

const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF', csrf: 'CSRF', pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS', iss: 'ISS', cbs: 'CBS', ibs: 'IBS',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning', recolhido: 'bg-success/10 text-success',
  compensado: 'bg-primary/10 text-primary', cancelado: 'bg-muted text-muted-foreground',
};

interface Props {
  retencoes: RetencaoFonte[];
  selectedRetencoes: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function RetencoesTable({ retencoes, selectedRetencoes, onSelectionChange }: Props) {
  if (retencoes.length === 0) {
    return (
      <Card><CardContent className="pt-6">
        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhuma retenção registrada</p>
          <p className="text-sm">Selecione uma empresa e adicione retenções</p>
        </div>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="pt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"><Checkbox /></TableHead>
            <TableHead>Tipo</TableHead><TableHead>Participante</TableHead><TableHead>Operação</TableHead>
            <TableHead className="text-right">Base</TableHead><TableHead className="text-right">Alíquota</TableHead>
            <TableHead className="text-right">Retido</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {retencoes.map((retencao) => (
            <TableRow key={retencao.id}>
              <TableCell>
                <Checkbox
                  checked={selectedRetencoes.includes(retencao.id)}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    onSelectionChange(checked ? [...selectedRetencoes, retencao.id] : selectedRetencoes.filter(id => id !== retencao.id));
                  }}
                />
              </TableCell>
              <TableCell><Badge variant="outline">{TIPO_LABELS[retencao.tipo_retencao]}</Badge></TableCell>
              <TableCell>
                <div><p className="font-medium">{retencao.nome_participante}</p>
                  {retencao.cnpj_participante && <p className="text-xs text-muted-foreground">{retencao.cnpj_participante}</p>}
                </div>
              </TableCell>
              <TableCell><Badge variant={retencao.tipo_operacao === 'pagamento' ? 'default' : 'secondary'}>{retencao.tipo_operacao === 'pagamento' ? 'Retivemos' : 'Retido de nós'}</Badge></TableCell>
              <TableCell className="text-right">{formatCurrency(retencao.valor_base)}</TableCell>
              <TableCell className="text-right">{(retencao.aliquota * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(retencao.valor_retido)}</TableCell>
              <TableCell>{format(parseISO(retencao.data_vencimento), 'dd/MM/yyyy')}</TableCell>
              <TableCell><Badge className={STATUS_COLORS[retencao.status]}>{retencao.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
