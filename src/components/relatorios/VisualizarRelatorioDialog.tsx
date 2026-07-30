import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { FluxoCaixaView } from './relatorio-views/FluxoCaixaView';
import { ContasPagarView, ContasReceberView } from './relatorio-views/ContasViews';
import { DREView, BalancoView, InadimplenciaView, JSONView } from './relatorio-views/DREBalancoViews';

interface VisualizarRelatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoRelatorio: string;
  nomeRelatorio: string;
  dados: Record<string, unknown> | null;
  executadoEm: string;
}

export function VisualizarRelatorioDialog({ open, onOpenChange, tipoRelatorio, nomeRelatorio, dados, executadoEm }: VisualizarRelatorioDialogProps) {
  const { toast } = useToast();

  const handleExportCSV = () => {
    if (!dados) return;
    try {
      const csvContent = convertToCSV(tipoRelatorio, dados);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `${nomeRelatorio}_${format(new Date(executadoEm), 'yyyy-MM-dd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Exportado com sucesso', description: 'O arquivo CSV foi baixado.' });
    } catch { toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o arquivo.', variant: 'destructive' }); }
  };

  const handleExportJSON = () => {
    if (!dados) return;
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${nomeRelatorio}_${format(new Date(executadoEm), 'yyyy-MM-dd_HHmm')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportado com sucesso', description: 'O arquivo JSON foi baixado.' });
  };

  const renderContent = () => {
    if (!dados) return <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mb-4 opacity-50" /><p>Nenhum dado disponível para este relatório.</p></div>;
    switch (tipoRelatorio) {
      case 'fluxo_caixa': return <FluxoCaixaView data={dados} />;
      case 'contas_pagar': return <ContasPagarView data={dados} />;
      case 'contas_receber': return <ContasReceberView data={dados} />;
      case 'dre': return <DREView data={dados} />;
      case 'balanco': return <BalancoView data={dados} />;
      case 'inadimplencia': return <InadimplenciaView data={dados} />;
      default: return <JSONView data={dados} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{nomeRelatorio}</DialogTitle>
              <DialogDescription>Gerado em {format(new Date(executadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}><FileSpreadsheet className="h-4 w-4 mr-2" />CSV</Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}><Download className="h-4 w-4 mr-2" />JSON</Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">{renderContent()}</ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function convertToCSV(tipo: string, data: Record<string, unknown>): string {
  switch (tipo) {
    case 'fluxo_caixa': {
      const r = data.receitas as { previsto: number; realizado: number; pendente: number } | undefined;
      const d = data.despesas as { previsto: number; realizado: number; pendente: number } | undefined;
      const s = data.saldo as { previsto: number; realizado: number } | undefined;
      return `Categoria,Previsto,Realizado,Pendente\nReceitas,${r?.previsto||0},${r?.realizado||0},${r?.pendente||0}\nDespesas,${d?.previsto||0},${d?.realizado||0},${d?.pendente||0}\nSaldo,${s?.previsto||0},${s?.realizado||0},\n`;
    }
    case 'contas_pagar': case 'contas_receber': {
      const contas = data.contas as Array<Record<string, unknown>> | undefined;
      if (contas && contas.length > 0) { const h = Object.keys(contas[0]); return h.join(',') + '\n' + contas.map(c => h.map(k => `"${c[k]||''}"`).join(',')).join('\n'); }
      return '';
    }
    case 'dre':
      return `Item,Valor\nReceita Bruta,${data.receita_bruta||0}\nDeduções,${data.deducoes||0}\nReceita Líquida,${data.receita_liquida||0}\nCustos,${data.custos||0}\nLucro Bruto,${data.lucro_bruto||0}\nDespesas Operacionais,${data.despesas_operacionais||0}\nLucro Operacional,${data.lucro_operacional||0}\nResultado Financeiro,${data.resultado_financeiro||0}\nLucro Líquido,${data.lucro_liquido||0}\n`;
    case 'inadimplencia': {
      const cl = data.clientes_inadimplentes as Array<{ nome: string; valor: number; quantidade: number }> | undefined;
      return 'Cliente,Quantidade,Valor\n' + (cl?.map(c => `"${c.nome}",${c.quantidade},${c.valor}`).join('\n') || '');
    }
    default: return JSON.stringify(data, null, 2);
  }
}
