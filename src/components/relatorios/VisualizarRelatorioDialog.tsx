import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface VisualizarRelatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoRelatorio: string;
  nomeRelatorio: string;
  dados: Record<string, unknown> | null;
  executadoEm: string;
}

export function VisualizarRelatorioDialog({
  open,
  onOpenChange,
  tipoRelatorio,
  nomeRelatorio,
  dados,
  executadoEm,
}: VisualizarRelatorioDialogProps) {
  const { toast } = useToast();

  const handleExportCSV = () => {
    if (!dados) return;

    let csvContent = '';
    
    try {
      csvContent = convertToCSV(tipoRelatorio, dados);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nomeRelatorio}_${format(new Date(executadoEm), 'yyyy-MM-dd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Exportado com sucesso',
        description: 'O arquivo CSV foi baixado.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const handleExportJSON = () => {
    if (!dados) return;

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeRelatorio}_${format(new Date(executadoEm), 'yyyy-MM-dd_HHmm')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Exportado com sucesso',
      description: 'O arquivo JSON foi baixado.',
    });
  };

  const renderContent = () => {
    if (!dados) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p>Nenhum dado disponível para este relatório.</p>
        </div>
      );
    }

    switch (tipoRelatorio) {
      case 'fluxo_caixa':
        return <FluxoCaixaView data={dados} />;
      case 'contas_pagar':
        return <ContasPagarView data={dados} />;
      case 'contas_receber':
        return <ContasReceberView data={dados} />;
      case 'dre':
        return <DREView data={dados} />;
      case 'balanco':
        return <BalancoView data={dados} />;
      case 'inadimplencia':
        return <InadimplenciaView data={dados} />;
      default:
        return <JSONView data={dados} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{nomeRelatorio}</DialogTitle>
              <DialogDescription>
                Gerado em {format(new Date(executadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Fluxo de Caixa View
function FluxoCaixaView({ data }: { data: Record<string, unknown> }) {
  const periodo = data.periodo as { inicio: string; fim: string } | undefined;
  const receitas = data.receitas as { previsto: number; realizado: number; pendente: number } | undefined;
  const despesas = data.despesas as { previsto: number; realizado: number; pendente: number } | undefined;
  const saldo = data.saldo as { previsto: number; realizado: number } | undefined;

  return (
    <div className="space-y-6">
      {periodo && (
        <div className="text-sm text-muted-foreground">
          Período: {format(new Date(periodo.inicio), 'dd/MM/yyyy')} a {format(new Date(periodo.fim), 'dd/MM/yyyy')}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Previsto:</span>
              <span className="font-medium">{formatCurrency(receitas?.previsto || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Realizado:</span>
              <span className="font-medium text-success">{formatCurrency(receitas?.realizado || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendente:</span>
              <span className="font-medium text-muted-foreground">{formatCurrency(receitas?.pendente || 0)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Previsto:</span>
              <span className="font-medium">{formatCurrency(despesas?.previsto || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Realizado:</span>
              <span className="font-medium text-destructive">{formatCurrency(despesas?.realizado || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendente:</span>
              <span className="font-medium text-muted-foreground">{formatCurrency(despesas?.pendente || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Previsto</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(saldo?.previsto || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Realizado</p>
              <p className="text-2xl font-bold">{formatCurrency(saldo?.realizado || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Contas a Pagar View
function ContasPagarView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total: number; valor_total: number; valor_pago: number; por_status: Record<string, number> } | undefined;
  const contas = data.contas as Array<{ id: string; descricao: string; fornecedor_nome: string; valor: number; status: string; data_vencimento: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{resumo?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Contas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(resumo?.valor_total || 0)}</p>
            <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-success">{formatCurrency(resumo?.valor_pago || 0)}</p>
            <p className="text-sm text-muted-foreground">Valor Pago</p>
          </CardContent>
        </Card>
      </div>
      
      {resumo?.por_status && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(resumo.por_status).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {status}: {count}
            </Badge>
          ))}
        </div>
      )}
      
      {contas && contas.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.slice(0, 20).map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="font-medium">{conta.descricao}</TableCell>
                <TableCell>{conta.fornecedor_nome}</TableCell>
                <TableCell>{format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{conta.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Contas a Receber View
function ContasReceberView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total: number; valor_total: number; valor_recebido: number; por_status: Record<string, number> } | undefined;
  const contas = data.contas as Array<{ id: string; descricao: string; cliente_nome: string; valor: number; status: string; data_vencimento: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{resumo?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Contas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(resumo?.valor_total || 0)}</p>
            <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-success">{formatCurrency(resumo?.valor_recebido || 0)}</p>
            <p className="text-sm text-muted-foreground">Valor Recebido</p>
          </CardContent>
        </Card>
      </div>
      
      {resumo?.por_status && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(resumo.por_status).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {status}: {count}
            </Badge>
          ))}
        </div>
      )}
      
      {contas && contas.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.slice(0, 20).map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="font-medium">{conta.descricao}</TableCell>
                <TableCell>{conta.cliente_nome}</TableCell>
                <TableCell>{format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{conta.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// DRE View
function DREView({ data }: { data: Record<string, unknown> }) {
  const periodo = data.periodo as { inicio: string; fim: string } | undefined;

  return (
    <div className="space-y-4">
      {periodo && (
        <div className="text-sm text-muted-foreground">
          Período: {format(new Date(periodo.inicio), 'dd/MM/yyyy')} a {format(new Date(periodo.fim), 'dd/MM/yyyy')}
        </div>
      )}
      
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between py-2 border-b">
          <span className="font-bold">RECEITA BRUTA</span>
          <span className="font-bold">{formatCurrency(Number(data.receita_bruta) || 0)}</span>
        </div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground">
          <span>(-) Deduções</span>
          <span>{formatCurrency(Number(data.deducoes) || 0)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-bold">RECEITA LÍQUIDA</span>
          <span className="font-bold">{formatCurrency(Number(data.receita_liquida) || 0)}</span>
        </div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground">
          <span>(-) Custos</span>
          <span>{formatCurrency(Number(data.custos) || 0)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-bold">LUCRO BRUTO</span>
          <span className="font-bold">{formatCurrency(Number(data.lucro_bruto) || 0)}</span>
        </div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground">
          <span>(-) Despesas Operacionais</span>
          <span>{formatCurrency(Number(data.despesas_operacionais) || 0)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-bold">LUCRO OPERACIONAL</span>
          <span className="font-bold">{formatCurrency(Number(data.lucro_operacional) || 0)}</span>
        </div>
        <div className="flex justify-between py-1 pl-4 text-muted-foreground">
          <span>(+/-) Resultado Financeiro</span>
          <span>{formatCurrency(Number(data.resultado_financeiro) || 0)}</span>
        </div>
        <div className="flex justify-between py-3 border-t-2 bg-primary/5 px-2 rounded">
          <span className="font-bold text-lg">LUCRO LÍQUIDO</span>
          <span className="font-bold text-lg text-primary">{formatCurrency(Number(data.lucro_liquido) || 0)}</span>
        </div>
      </div>
    </div>
  );
}

// Balanço Patrimonial View
function BalancoView({ data }: { data: Record<string, unknown> }) {
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
            <div className="flex justify-between">
              <span>Disponibilidades</span>
              <span>{formatCurrency(ativo?.circulante?.disponibilidades || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Contas a Receber</span>
              <span>{formatCurrency(ativo?.circulante?.contas_a_receber || 0)}</span>
            </div>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Circulante</span>
            <span>{formatCurrency(ativo?.circulante?.total || 0)}</span>
          </div>
          <Separator />
          <p className="font-medium">Ativo Não Circulante</p>
          <div className="flex justify-between">
            <span>Total</span>
            <span>{formatCurrency(ativo?.nao_circulante?.total || 0)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>TOTAL ATIVO</span>
            <span className="text-primary">{formatCurrency(ativo?.total || 0)}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">PASSIVO</h3>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Passivo Circulante</p>
          <div className="pl-4 space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Contas a Pagar</span>
              <span>{formatCurrency(passivo?.circulante?.contas_a_pagar || 0)}</span>
            </div>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Circulante</span>
            <span>{formatCurrency(passivo?.circulante?.total || 0)}</span>
          </div>
          <Separator />
          <p className="font-medium">Passivo Não Circulante</p>
          <div className="flex justify-between">
            <span>Total</span>
            <span>{formatCurrency(passivo?.nao_circulante?.total || 0)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total Passivo</span>
            <span>{formatCurrency(passivo?.total || 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Patrimônio Líquido</span>
            <span className={pl >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(pl)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inadimplência View
function InadimplenciaView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total_vencido: number; quantidade_vencidos: number; taxa_inadimplencia: number; valor_carteira: number } | undefined;
  const clientes = data.clientes_inadimplentes as Array<{ nome: string; valor: number; quantidade: number }> | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{formatCurrency(resumo?.total_vencido || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Vencido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{resumo?.quantidade_vencidos || 0}</p>
            <p className="text-sm text-muted-foreground">Títulos Vencidos</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{(resumo?.taxa_inadimplencia || 0).toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Taxa Inadimplência</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{formatCurrency(resumo?.valor_carteira || 0)}</p>
            <p className="text-sm text-muted-foreground">Valor da Carteira</p>
          </CardContent>
        </Card>
      </div>
      
      {clientes && clientes.length > 0 && (
        <>
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Clientes Inadimplentes
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Títulos</TableHead>
                <TableHead className="text-right">Valor em Atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {cliente.nome}
                  </TableCell>
                  <TableCell className="text-center">{cliente.quantidade}</TableCell>
                  <TableCell className="text-right text-red-500 font-medium">
                    {formatCurrency(cliente.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

// JSON View (fallback)
function JSONView({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// Convert to CSV helper
function convertToCSV(tipo: string, data: Record<string, unknown>): string {
  let csv = '';
  
  switch (tipo) {
    case 'fluxo_caixa': {
      const receitas = data.receitas as { previsto: number; realizado: number; pendente: number } | undefined;
      const despesas = data.despesas as { previsto: number; realizado: number; pendente: number } | undefined;
      const saldo = data.saldo as { previsto: number; realizado: number } | undefined;
      csv = 'Categoria,Previsto,Realizado,Pendente\n';
      csv += `Receitas,${receitas?.previsto || 0},${receitas?.realizado || 0},${receitas?.pendente || 0}\n`;
      csv += `Despesas,${despesas?.previsto || 0},${despesas?.realizado || 0},${despesas?.pendente || 0}\n`;
      csv += `Saldo,${saldo?.previsto || 0},${saldo?.realizado || 0},\n`;
      break;
    }
    case 'contas_pagar':
    case 'contas_receber': {
      const contas = data.contas as Array<Record<string, unknown>> | undefined;
      if (contas && contas.length > 0) {
        const headers = Object.keys(contas[0]);
        csv = headers.join(',') + '\n';
        contas.forEach(conta => {
          csv += headers.map(h => `"${conta[h] || ''}"`).join(',') + '\n';
        });
      }
      break;
    }
    case 'dre': {
      csv = 'Item,Valor\n';
      csv += `Receita Bruta,${data.receita_bruta || 0}\n`;
      csv += `Deduções,${data.deducoes || 0}\n`;
      csv += `Receita Líquida,${data.receita_liquida || 0}\n`;
      csv += `Custos,${data.custos || 0}\n`;
      csv += `Lucro Bruto,${data.lucro_bruto || 0}\n`;
      csv += `Despesas Operacionais,${data.despesas_operacionais || 0}\n`;
      csv += `Lucro Operacional,${data.lucro_operacional || 0}\n`;
      csv += `Resultado Financeiro,${data.resultado_financeiro || 0}\n`;
      csv += `Lucro Líquido,${data.lucro_liquido || 0}\n`;
      break;
    }
    case 'inadimplencia': {
      const clientes = data.clientes_inadimplentes as Array<{ nome: string; valor: number; quantidade: number }> | undefined;
      csv = 'Cliente,Quantidade,Valor\n';
      clientes?.forEach(c => {
        csv += `"${c.nome}",${c.quantidade},${c.valor}\n`;
      });
      break;
    }
    default:
      csv = JSON.stringify(data, null, 2);
  }
  
  return csv;
}
