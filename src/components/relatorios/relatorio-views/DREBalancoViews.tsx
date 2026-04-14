import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

export function DREView({ data }: { data: Record<string, unknown> }) {
  const periodo = data.periodo as { inicio: string; fim: string } | undefined;
  return (
    <div className="space-y-4">
      {periodo && <div className="text-sm text-muted-foreground">Período: {format(new Date(periodo.inicio), 'dd/MM/yyyy')} a {format(new Date(periodo.fim), 'dd/MM/yyyy')}</div>}
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between py-2 border-b"><span className="font-bold">RECEITA BRUTA</span><span className="font-bold">{formatCurrency(Number(data.receita_bruta) || 0)}</span></div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground"><span>(-) Deduções</span><span>{formatCurrency(Number(data.deducoes) || 0)}</span></div>
        <div className="flex justify-between py-2 border-b"><span className="font-bold">RECEITA LÍQUIDA</span><span className="font-bold">{formatCurrency(Number(data.receita_liquida) || 0)}</span></div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground"><span>(-) Custos</span><span>{formatCurrency(Number(data.custos) || 0)}</span></div>
        <div className="flex justify-between py-2 border-b"><span className="font-bold">LUCRO BRUTO</span><span className="font-bold">{formatCurrency(Number(data.lucro_bruto) || 0)}</span></div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground"><span>(-) Despesas Operacionais</span><span>{formatCurrency(Number(data.despesas_operacionais) || 0)}</span></div>
        <div className="flex justify-between py-2 border-b"><span className="font-bold">LUCRO OPERACIONAL</span><span className="font-bold">{formatCurrency(Number(data.lucro_operacional) || 0)}</span></div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground"><span>(+/-) Resultado Financeiro</span><span>{formatCurrency(Number(data.resultado_financeiro) || 0)}</span></div>
        <div className="flex justify-between py-3 border-t-2 bg-primary/5 px-2 rounded"><span className="font-bold text-lg">LUCRO LÍQUIDO</span><span className="font-bold text-lg text-primary">{formatCurrency(Number(data.lucro_liquido) || 0)}</span></div>
      </div>
    </div>
  );
}

export function BalancoView({ data }: { data: Record<string, unknown> }) {
  const ativo = data.ativo as { circulante: { disponibilidades: number; contas_a_receber: number; total: number }; nao_circulante: { total: number }; total: number } | undefined;
  const passivo = data.passivo as { circulante: { contas_a_pagar: number; total: number }; nao_circulante: { total: number }; total: number } | undefined;
  const pl = Number(data.patrimonio_liquido) || 0;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">ATIVO</h3>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Ativo Circulante</p>
          <div className="pl-4 space-y-1 text-muted-foreground">
            <div className="flex justify-between"><span>Disponibilidades</span><span>{formatCurrency(ativo?.circulante?.disponibilidades || 0)}</span></div>
            <div className="flex justify-between"><span>Contas a Receber</span><span>{formatCurrency(ativo?.circulante?.contas_a_receber || 0)}</span></div>
          </div>
          <div className="flex justify-between font-medium"><span>Total Circulante</span><span>{formatCurrency(ativo?.circulante?.total || 0)}</span></div>
          <Separator />
          <p className="font-medium">Ativo Não Circulante</p>
          <div className="flex justify-between"><span>Total</span><span>{formatCurrency(ativo?.nao_circulante?.total || 0)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-lg pt-2"><span>TOTAL ATIVO</span><span className="text-primary">{formatCurrency(ativo?.total || 0)}</span></div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">PASSIVO</h3>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Passivo Circulante</p>
          <div className="pl-4 space-y-1 text-muted-foreground"><div className="flex justify-between"><span>Contas a Pagar</span><span>{formatCurrency(passivo?.circulante?.contas_a_pagar || 0)}</span></div></div>
          <div className="flex justify-between font-medium"><span>Total Circulante</span><span>{formatCurrency(passivo?.circulante?.total || 0)}</span></div>
          <Separator />
          <p className="font-medium">Passivo Não Circulante</p>
          <div className="flex justify-between"><span>Total</span><span>{formatCurrency(passivo?.nao_circulante?.total || 0)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold"><span>Total Passivo</span><span>{formatCurrency(passivo?.total || 0)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Patrimônio Líquido</span><span className={pl >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(pl)}</span></div>
        </div>
      </div>
    </div>
  );
}

export function InadimplenciaView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total_vencido: number; quantidade_vencidos: number; taxa_inadimplencia: number; valor_carteira: number } | undefined;
  const clientes = data.clientes_inadimplentes as Array<{ nome: string; valor: number; quantidade: number }> | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/20"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{formatCurrency(resumo?.total_vencido || 0)}</p><p className="text-sm text-muted-foreground">Total Vencido</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{resumo?.quantidade_vencidos || 0}</p><p className="text-sm text-muted-foreground">Títulos Vencidos</p></CardContent></Card>
        <Card className="bg-warning/5 border-warning/20"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{(resumo?.taxa_inadimplencia || 0).toFixed(1)}%</p><p className="text-sm text-muted-foreground">Taxa Inadimplência</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{formatCurrency(resumo?.valor_carteira || 0)}</p><p className="text-sm text-muted-foreground">Valor da Carteira</p></CardContent></Card>
      </div>
      {clientes && clientes.length > 0 && (
        <>
          <h4 className="font-medium flex items-center gap-2"><Users className="h-4 w-4" />Top Clientes Inadimplentes</h4>
          <Table>
            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-center">Títulos</TableHead><TableHead className="text-right">Valor em Atraso</TableHead></TableRow></TableHeader>
            <TableBody>{clientes.map((c, i) => (
              <TableRow key={i}><TableCell className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />{c.nome}</TableCell><TableCell className="text-center">{c.quantidade}</TableCell><TableCell className="text-right text-destructive font-medium">{formatCurrency(c.valor)}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

export function JSONView({ data }: { data: Record<string, unknown> }) {
  return <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px]">{JSON.stringify(data, null, 2)}</pre>;
}
