import { useMemo, useState } from 'react';
import { 
  BarChart3, Scale, Download, AlertTriangle, CheckCircle2, 
  FileJson, FileText, Calendar as CalendarIcon, Filter,
  TrendingUp, TrendingDown, Layers, PieChart, ArrowUpRight,
  ChevronRight, Info as InfoIcon, Zap, RefreshCw, Eye, History, Globe, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useDemonstrativosContabeis, type FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmpresas } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { applyPdfLayout, getAutoTableMargins, getContentStartY, PDF_BRAND } from '@/lib/pdf-layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';

interface Props { empresaId?: string; ano: number; anoFim?: number }

interface DrillDownState {
  open: boolean;
  titulo?: string;
  subtitulo?: string;
  centro_resultado?: string;
  tipo_bp?: 'circulante_ativo' | 'nao_circ_ativo' | 'circulante_pas' | 'nao_circ_pas' | 'pl';
  natureza?: string;
}

export function DreBalancoTab({ empresaId, ano, anoFim }: Props) {
  const [modo, setModo] = useState<'dre' | 'balanco'>('dre');
  const [fonte, setFonte] = useState<FonteDemonstrativo>('competencia');
  const [mes, setMes] = useState(new Date().getMonth());
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(empresaId || 'todas');
  const [drillDown, setDrillDown] = useState<DrillDownState>({ open: false });

  const {
    dre: dreNovo,
    balanco: balancoNovo,
    origem,
    isLoading: isLoadingNovo,
    error,
  } = useDemonstrativosContabeis({
    empresaId: selectedEmpresaId,
    ano,
    mes,
    fonte,
  });

  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === selectedEmpresaId);
  const empresaTitulo = empresa ? (empresa.nome_fantasia || empresa.razao_social) : (selectedEmpresaId === 'todas' ? 'Consolidado' : 'Empresa');

  const exportarDRE = (format: 'pdf' | 'json') => {
    if (dreNovo.linhas.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }

    const filename = `DRE-${empresaTitulo}-${ano}-${mes + 1}-${fonte}`;

    if (format === 'json') {
      const payload = {
        empresa: { nome: empresaTitulo, cnpj: empresa?.cnpj || '—' },
        periodo: { ano, mes: mes + 1 },
        fonte,
        totais: { receitas: dreNovo.receitaBruta, resultado: dreNovo.lucroLiquido },
        linhas: dreNovo.linhas,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('DRE exportada em JSON');
      return;
    }

    // PDF Premium
    const doc = new jsPDF();
    const margins = getAutoTableMargins();
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = getContentStartY();

    // Sumário Executivo
    const totalW = pageWidth - margins.left - margins.right;
    doc.setFillColor(PDF_BRAND.surface[0], PDF_BRAND.surface[1], PDF_BRAND.surface[2]);
    doc.setDrawColor(PDF_BRAND.border[0], PDF_BRAND.border[1], PDF_BRAND.border[2]);
    doc.roundedRect(margins.left, cursorY, totalW, 20, 2, 2, 'FD');
    
    doc.setFontSize(7);
    doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
    doc.text('LUCRO/PREJUÍZO LÍQUIDO DO PERÍODO', margins.left + 5, cursorY + 7);
    doc.text(`FONTE: ${fonte.toUpperCase()} / EMPRESA: ${empresaTitulo.toUpperCase()}`, pageWidth - margins.right - 5, cursorY + 7, { align: 'right' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.text(formatCurrency(dreNovo.lucroLiquido), margins.left + 5, cursorY + 15);
    
    const margemLiq = ((dreNovo.lucroLiquido / (dreNovo.receitaBruta || 1)) * 100).toFixed(1);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
    doc.text(`MARGEM LÍQUIDA: ${margemLiq}%`, pageWidth - margins.right - 5, cursorY + 15, { align: 'right' });

    cursorY += 28;

    const rows: any[] = dreNovo.linhas.map(l => [
      { content: l.descricao, styles: { paddingLeft: l.nivel * 4, fontStyle: l.nivel === 0 ? 'bold' : 'normal' } },
      { content: formatCurrency(l.valor), styles: { halign: 'right', fontStyle: l.nivel === 0 ? 'bold' : 'normal' } },
      { content: `${l.percentual.toFixed(1)}%`, styles: { halign: 'right', textColor: PDF_BRAND.muted } }
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Descrição', 'Valor (R$)', '% Rec. Bruta']],
      body: rows,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 25 } },
      margin: margins,
    });

    applyPdfLayout(doc, {
      titulo: 'Demonstração do Resultado do Exercício',
      subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano} (${fonte})`,
    });

    doc.save(`${filename}.pdf`);
    toast.success('DRE exportada em PDF');
  };

  const exportarBalanco = (format: 'pdf' | 'json') => {
    if (balancoNovo.ativo.length === 0 && balancoNovo.passivo.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }

    const filename = `Balanco-${empresaTitulo}-${ano}-${mes + 1}-${fonte}`;

    if (format === 'json') {
      const payload = {
        empresa: { nome: empresaTitulo, cnpj: empresa?.cnpj || '—' },
        periodo: { ano, mes: mes + 1 },
        fonte,
        balanco: balancoNovo,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Balanço exportado em JSON');
      return;
    }

    // PDF Premium
    const doc = new jsPDF();
    const margins = getAutoTableMargins();
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = getContentStartY();

    // Cabeçalho de Status
    const totalW = pageWidth - margins.left - margins.right;
    const equilibrado = balancoNovo.equilibrado;
    doc.setFillColor(equilibrado ? 240 : 255, equilibrado ? 248 : 240, equilibrado ? 240 : 240);
    doc.setDrawColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.roundedRect(margins.left, cursorY, totalW, 12, 1.5, 1.5, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(
      equilibrado ? 'SITUAÇÃO PATRIMONIAL: BALANÇO CONSOLIDADO' : `DIVERGÊNCIA IDENTIFICADA: ${formatCurrency(balancoNovo.totalAtivo - balancoNovo.totalPassivo)}`,
      margins.left + 5,
      cursorY + 7.5
    );
    cursorY += 18;

    const rowsAtivo: any[] = balancoNovo.ativo.map(a => [
      { content: a.descricao, styles: { paddingLeft: a.nivel * 3, fontStyle: a.nivel === 0 ? 'bold' : 'normal' } },
      { content: formatCurrency(a.valor), styles: { halign: 'right', fontStyle: a.nivel === 0 ? 'bold' : 'normal' } }
    ]);

    const rowsPassivo: any[] = balancoNovo.passivo.map(p => [
      { content: p.descricao, styles: { paddingLeft: p.nivel * 3, fontStyle: p.nivel === 0 ? 'bold' : 'normal' } },
      { content: formatCurrency(p.valor), styles: { halign: 'right', fontStyle: p.nivel === 0 ? 'bold' : 'normal' } }
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Ativo', 'Valor (R$)']],
      body: rowsAtivo,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      margin: { ...margins, right: pageWidth / 2 + 2 },
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['Passivo + PL', 'Valor (R$)']],
      body: rowsPassivo,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      margin: { ...margins, left: pageWidth / 2 + 2 },
    });

    applyPdfLayout(doc, {
      titulo: 'Balanço Patrimonial',
      subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano} (${fonte})`,
    });

    doc.save(`${filename}.pdf`);
    toast.success('Balanço exportado em PDF');
  };

  if (!empresaId) {
    return (
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="relative z-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-3xl w-fit mx-auto animate-pulse">
            <PieChart className="h-12 w-12 text-primary opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black tracking-tight">DRE & Balanço</p>
            <p className="text-sm font-medium opacity-60 max-w-xs mx-auto">Selecione uma empresa para visualizar as demonstrações financeiras e patrimoniais.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Modal de Drill Down Analítico */}
      <Dialog open={drillDown.open} onOpenChange={(open) => setDrillDown({ ...drillDown, open })}>
        <DialogContent className="max-w-5xl border-none bg-background/95 backdrop-blur-3xl shadow-3xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">{drillDown.titulo}</DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{drillDown.subtitulo}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 pt-0 relative z-10">
            <LancamentosDrillDown 
              empresaId={selectedEmpresaId} 
              ano={ano} 
              mes={mes} 
              centroResultado={drillDown.centro_resultado}
              tipoBp={drillDown.tipo_bp}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="p-8 pb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn("p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500")}>
              {modo === 'dre' ? <BarChart3 className="h-8 w-8" /> : <Scale className="h-8 w-8" />}
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter">
                {modo === 'dre' ? 'Demonstração de Resultado' : 'Balanço Patrimonial'}
              </CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Performance financeira e saúde patrimonial corporativa</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 relative z-10 space-y-8">
        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-sm relative overflow-hidden group/filter">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover/filter:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <ToggleGroup 
              type="single" 
              value={modo} 
              onValueChange={(v) => v && setModo(v as 'dre' | 'balanco')} 
              className="bg-background/40 p-1 rounded-2xl border border-white/10"
            >
              <ToggleGroupItem 
                value="dre" 
                className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/20 transition-all px-6 font-black uppercase text-[10px] tracking-widest"
              >
                DRE
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="balanco" 
                className="rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/20 transition-all px-6 font-black uppercase text-[10px] tracking-widest"
              >
                Balanço
              </ToggleGroupItem>
            </ToggleGroup>
            
            <ToggleGroup 
              type="single" 
              value={fonte} 
              onValueChange={(v) => v && setFonte(v as FonteDemonstrativo)} 
              className="bg-background/40 p-1 rounded-2xl border border-white/10"
            >
              <ToggleGroupItem 
                value="competencia" 
                className="rounded-xl data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground transition-all px-4 font-black uppercase text-[9px] tracking-tight"
              >
                Competência
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="caixa" 
                className="rounded-xl data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground transition-all px-4 font-black uppercase text-[9px] tracking-tight"
              >
                Caixa
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Empresa</Label>
              <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                <SelectTrigger className="h-12 w-[220px] rounded-2xl border-white/5 bg-white/5 font-bold">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                  <SelectItem value="todas">Consolidado (Todas)</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mês de Referência</Label>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="h-12 w-[140px] rounded-2xl border-white/5 bg-white/5 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m} / {ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Governança Fiscal</span>
              <span className="text-[9px] font-bold text-primary">Nível de Auditoria: Máximo</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-10 rounded-2xl font-black gap-2 border-white/10 bg-white/5 hover:bg-white/10 px-6 transition-all hover:translate-y-[-2px]">
                  <Download className="h-4 w-4 text-primary" /> Exportar Livros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Selecionar Formato</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => (modo === 'dre' ? exportarDRE('pdf') : exportarBalanco('pdf'))} className="rounded-xl gap-3 py-3 cursor-pointer">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <FileText className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">Relatório Executivo (PDF)</span>
                    <span className="text-[10px] opacity-50">Pronto para conselho/bancos</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (modo === 'dre' ? exportarDRE('json') : exportarBalanco('json'))} className="rounded-xl gap-3 py-3 cursor-pointer">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FileJson className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">Dataset Estruturado (JSON)</span>
                    <span className="text-[10px] opacity-50">Integração com BI & Auditoria</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoadingNovo ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : modo === 'dre' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/5 p-4 rounded-3xl relative overflow-hidden group/kpi">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/kpi:scale-110 transition-transform">
                  <TrendingUp className="h-12 w-12 text-success" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Receita Bruta</p>
                <p className="text-2xl font-black mt-2 font-mono text-success tabular-nums">{formatCurrency(dreNovo.receitaBruta)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <span className="text-[10px] font-bold text-success/60">Faturamento Mensal</span>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/5 p-4 rounded-3xl relative overflow-hidden group/kpi">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/kpi:scale-110 transition-transform">
                  <TrendingDown className="h-12 w-12 text-destructive" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Custos & Despesas</p>
                <p className="text-2xl font-black mt-2 font-mono text-destructive tabular-nums">
                  {formatCurrency(dreNovo.receitaBruta - dreNovo.lucroLiquido)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Layers className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-bold text-destructive/60">Operacional Total</span>
                </div>
              </Card>

              <Card className={cn(
                "border-none p-4 rounded-3xl relative overflow-hidden group/kpi",
                dreNovo.lucroLiquido >= 0 ? "bg-success/20 shadow-lg shadow-success/10" : "bg-destructive/20 shadow-lg shadow-destructive/10"
              )}>
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover/kpi:scale-110 transition-transform">
                  <Zap className="h-12 w-12" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lucro Líquido</p>
                <p className="text-2xl font-black mt-2 font-mono tabular-nums">{formatCurrency(dreNovo.lucroLiquido)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Margem Líquida: {((dreNovo.lucroLiquido / (dreNovo.receitaBruta || 1)) * 100).toFixed(1)}%</span>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <section className="bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" /> (+) Receitas Operacionais
                  </h3>
                  <Badge variant="outline" className="font-mono text-[10px] border-success/20 bg-success/10 text-success">
                    {formatCurrency(dreNovo.receitaBruta)}
                  </Badge>
                </div>
                <div className="p-2">
                  <AnimatePresence>
                    {dreNovo.linhas.filter(l => l.tipo === 'receita' && l.nivel > 0).length === 0 ? (
                      <div className="py-8 text-center opacity-40 text-xs font-bold uppercase tracking-widest">Nenhuma receita detalhada</div>
                    ) : dreNovo.linhas.filter(l => l.tipo === 'receita' && l.nivel > 0).map((l, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setDrillDown({ 
                          open: true, 
                          titulo: `Partidas: ${l.descricao}`, 
                          subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano}`,
                          centro_resultado: l.codigo === '1' ? 'receita_operacional' : 
                                          l.codigo === '4' ? 'cmv' : 
                                          l.codigo === '6.1' ? 'despesa_administrativa' : 
                                          l.codigo === '6.2' ? 'despesa_comercial' : undefined
                        })}
                        className="flex items-center justify-between py-4 px-5 rounded-2xl hover:bg-white/10 transition-all group/row cursor-pointer border border-transparent hover:border-white/5" 
                        style={{ marginLeft: `${(l.nivel - 1) * 1.5}rem` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all group-hover/row:scale-125",
                            l.nivel === 1 ? "bg-success" : "bg-success/40"
                          )} />
                          <div className="flex flex-col">
                            <span className={cn("text-xs font-black transition-colors group-hover/row:text-primary", l.nivel === 1 ? "text-foreground" : "text-foreground/70")}>{l.descricao}</span>
                            <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{l.codigo}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] font-black opacity-30 tracking-tighter group-hover/row:opacity-60 transition-opacity">{l.percentual.toFixed(1)}%</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 p-2 rounded-xl">
                                <p className="text-[10px] font-bold">Representatividade na Receita Bruta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-mono text-sm font-black tabular-nums text-success group-hover/row:scale-105 transition-transform">{formatCurrency(l.valor)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
              
              <section className="bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" /> (−) Custos e Despesas
                  </h3>
                  <Badge variant="outline" className="font-mono text-[10px] border-destructive/20 bg-destructive/10 text-destructive">
                    {formatCurrency(dreNovo.receitaBruta - dreNovo.lucroLiquido)}
                  </Badge>
                </div>
                <div className="p-2">
                  <AnimatePresence>
                    {dreNovo.linhas.filter(l => l.tipo === 'despesa').map((l, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setDrillDown({ 
                          open: true, 
                          titulo: `Partidas: ${l.descricao}`, 
                          subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano}`,
                          centro_resultado: l.codigo === '1' ? 'receita_operacional' : 
                                          l.codigo === '4' ? 'cmv' : 
                                          l.codigo === '6.1' ? 'despesa_administrativa' : 
                                          l.codigo === '6.2' ? 'despesa_comercial' : undefined
                        })}
                        className="flex items-center justify-between py-4 px-5 rounded-2xl hover:bg-white/10 transition-all group/row cursor-pointer border border-transparent hover:border-white/5" 
                        style={{ marginLeft: `${(l.nivel - 1) * 1.5}rem` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all group-hover/row:scale-125",
                            l.nivel === 1 ? "bg-destructive" : "bg-destructive/40"
                          )} />
                          <div className="flex flex-col">
                            <span className={cn("text-xs font-black transition-colors group-hover/row:text-primary", l.nivel === 1 ? "text-foreground" : "text-foreground/70")}>{l.descricao}</span>
                            <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{l.codigo}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] font-black opacity-30 tracking-tighter group-hover/row:opacity-60 transition-opacity">{l.percentual.toFixed(1)}%</span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 p-2 rounded-xl">
                                <p className="text-[10px] font-bold">Impacto sobre a Receita Bruta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="font-mono text-sm font-black tabular-nums text-destructive group-hover/row:scale-105 transition-transform">{formatCurrency(l.valor)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {dreNovo.naoClassificadas.length > 0 && (
                <Alert className="bg-warning/10 border-warning/20 rounded-3xl p-6">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <div className="ml-4">
                    <AlertTitle className="text-sm font-black uppercase tracking-widest text-warning">Divergência de Classificação</AlertTitle>
                    <AlertDescription className="text-xs font-medium opacity-70 mt-1">
                      Existem {dreNovo.naoClassificadas.length} contas sem centro de resultado definido impactando o lucro em {formatCurrency(dreNovo.totalNaoClassificado)}.
                    </AlertDescription>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-warning mt-2 flex items-center gap-1">
                      Corrigir no Plano de Contas <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const equilibrado = balancoNovo.equilibrado;
              const sectionClass = cn(
                "border-none bg-white/[0.02] shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/5 group/card"
              );

              return (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className={sectionClass}>
                      <div className="bg-white/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/20 rounded-2xl">
                            <ArrowUpRight className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-80">Ativo Total</h3>
                            <p className="text-[10px] font-bold text-primary uppercase">Bens e Direitos</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs border-none bg-white/5 px-4 h-10 rounded-xl">
                          {balancoNovo.ativo.length} Contas
                        </Badge>
                      </div>
                      <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                          {balancoNovo.ativo.map((l, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              onClick={() => setDrillDown({ 
                                open: true, 
                                titulo: `Analítico: ${l.descricao}`, 
                                subtitulo: `${empresaTitulo} · Acumulado até ${mes + 1}/${ano}`,
                                tipo_bp: l.codigo === '1.1' ? 'circulante_ativo' : 
                                        l.codigo === '1.2' ? 'nao_circ_ativo' : undefined
                              })}
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/5 transition-colors group/row cursor-pointer" 
                              style={{ marginLeft: `${l.nivel * 1.5}rem` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full opacity-40", l.nivel === 0 ? "bg-primary" : "bg-white/40")} />
                                <div className="flex flex-col">
                                  <span className={cn("text-xs font-bold", l.nivel === 0 ? "text-foreground" : "text-foreground/70")}>{l.descricao}</span>
                                  <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{l.codigo}</span>
                                </div>
                              </div>
                              <span className={cn("font-mono text-xs font-black tabular-nums", l.nivel === 0 ? "text-primary" : "text-foreground/60")}>
                                {formatCurrency(l.valor)}
                              </span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="bg-white/5 p-6 border-t border-white/5 flex items-center justify-between font-black">
                        <span className="text-xs uppercase tracking-widest opacity-60">Total do Ativo</span>
                        <span className="font-mono text-lg text-primary tabular-nums">{formatCurrency(balancoNovo.totalAtivo)}</span>
                      </div>
                    </section>

                    <section className={sectionClass}>
                      <div className="bg-white/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-secondary/20 rounded-2xl">
                            <Scale className="h-6 w-6 text-secondary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-80">Passivo + PL</h3>
                            <p className="text-[10px] font-bold text-secondary uppercase">Dívidas e Capital</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs border-none bg-white/5 px-4 h-10 rounded-xl">
                          {balancoNovo.passivo.length} Contas
                        </Badge>
                      </div>
                      <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <AnimatePresence>
                          {balancoNovo.passivo.map((l, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/5 transition-colors group/row" 
                              style={{ marginLeft: `${l.nivel * 1.5}rem` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full opacity-40", l.nivel === 0 ? "bg-secondary" : "bg-white/40")} />
                                <div className="flex flex-col">
                                  <span className={cn("text-xs font-bold", l.nivel === 0 ? "text-foreground" : "text-foreground/70")}>{l.descricao}</span>
                                  <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{l.codigo}</span>
                                </div>
                              </div>
                              <span className={cn("font-mono text-xs font-black tabular-nums", l.nivel === 0 ? "text-secondary" : "text-foreground/60")}>
                                {formatCurrency(l.valor)}
                              </span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="bg-white/5 p-6 border-t border-white/5 flex items-center justify-between font-black">
                        <span className="text-xs uppercase tracking-widest opacity-60">Total Passivo + PL</span>
                        <span className="font-mono text-lg text-secondary tabular-nums">{formatCurrency(balancoNovo.totalPassivo)}</span>
                      </div>
                    </section>
                  </div>

                  <Card className={cn(
                    "rounded-[2.5rem] border-none p-8 transition-all shadow-3xl relative overflow-hidden group",
                    equilibrado ? "bg-success/20 ring-1 ring-success/30" : "bg-destructive/20 ring-1 ring-destructive/30"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "p-5 rounded-[2rem] shadow-xl transform group-hover:scale-110 transition-transform duration-500",
                          equilibrado ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                        )}>
                          {equilibrado ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8 animate-bounce" />}
                        </div>
                        <div>
                          <h2 className={cn("text-2xl font-black tracking-tighter", equilibrado ? "text-success" : "text-destructive")}>
                            {equilibrado ? "BALANÇO CONSOLIDADO" : "ERRO DE EQUILÍBRIO PATRIMONIAL"}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <InfoIcon className="h-3 w-3 opacity-40" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Verificação de Integridade Contábil (Ativo = Passivo + PL)</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-12">
                        {!equilibrado && (
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive opacity-60">Diferença Residual</p>
                            <p className="text-4xl font-mono font-black text-destructive tabular-nums mt-1 tracking-tighter">
                              {formatCurrency(balancoNovo.totalAtivo - balancoNovo.totalPassivo)}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Liquidez', val: balancoNovo.ativoCirculante, icon: <Zap className="h-3 w-3" />, color: 'text-primary' },
                            { label: 'Equity', val: balancoNovo.patrimonioLiquido, icon: <Scale className="h-3 w-3" />, color: 'text-secondary' },
                          ].map((item, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                              <div className="flex items-center gap-2 opacity-40">
                                {item.icon}
                                <p className="text-[9px] font-black uppercase tracking-widest">{item.label}</p>
                              </div>
                              <p className={cn("text-sm font-mono font-black mt-2 tabular-nums", item.color)}>{formatCurrency(item.val)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}

function LancamentosDrillDown({ empresaId, ano, mes, centroResultado, tipoBp }: { 
  empresaId: string; ano: number; mes: number; centroResultado?: string; tipoBp?: string 
}) {
  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId === 'todas' ? undefined : empresaId, ano);
  
  const partidasFiltradas = useMemo(() => {
    const dataRefInicio = new Date(ano, mes, 1);
    const dataRefFim = new Date(ano, mes + 1, 0);
    
    const todasPartidas: any[] = [];
    lancs.forEach((l: any) => {
      const dataL = new Date(l.data_lancamento + 'T00:00:00');
      // Filtro de data: se for BP (saldo acumulado), pega tudo até o fim do mês. Se for DRE, pega só o mês.
      const dataOk = tipoBp ? dataL <= dataRefFim : (dataL >= dataRefInicio && dataL <= dataRefFim);
      
      if (dataOk && l.partidas) {
        l.partidas.forEach((p: any) => {
          todasPartidas.push({
            ...p,
            data_lancamento: l.data_lancamento,
            historico: l.historico,
            numero_lancamento: l.numero_lancamento
          });
        });
      }
    });

    return todasPartidas.filter(p => {
      if (centroResultado) {
        return p.conta?.centro_resultado === centroResultado;
      }
      if (tipoBp) {
        // Lógica simplificada de classificação BP
        const codigo = p.conta?.codigo || '';
        const tipo = p.conta?.tipo?.toLowerCase() || '';
        if (tipoBp === 'circulante_ativo') return (tipo === 'ativo' || codigo.startsWith('1')) && !codigo.startsWith('1.2');
        if (tipoBp === 'nao_circ_ativo') return (tipo === 'ativo' || codigo.startsWith('1')) && codigo.startsWith('1.2');
        if (tipoBp === 'circulante_pas') return (tipo === 'passivo' || codigo.startsWith('2')) && !codigo.startsWith('2.2') && !codigo.startsWith('2.3') && !codigo.startsWith('3');
        if (tipoBp === 'nao_circ_pas') return (tipo === 'passivo' || codigo.startsWith('2')) && codigo.startsWith('2.2');
        if (tipoBp === 'pl') return (tipo === 'passivo' || codigo.startsWith('2')) && (codigo.startsWith('2.3') || codigo.startsWith('3'));
      }
      return true;
    });
  }, [lancs, mes, centroResultado, tipoBp, ano]);

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black">
          {partidasFiltradas.length} Partidas Encontradas
        </Badge>
        <span className="text-xs font-black uppercase opacity-40">Total: {formatCurrency(partidasFiltradas.reduce((a, b) => a + Number(b.valor), 0))}</span>
      </div>
      
      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="bg-white/5 sticky top-0 z-20">
              <TableRow className="border-white/5">
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Data</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Lanç.</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Conta</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">D/C</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partidasFiltradas.map((p, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-[10px] font-bold py-3">{format(new Date(p.data_lancamento + 'T00:00:00'), 'dd/MM/yy')}</TableCell>
                  <TableCell className="text-[10px] font-mono py-3">#{p.numero_lancamento}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black">{p.conta?.descricao || p.conta?.nome}</span>
                      <span className="text-[9px] opacity-40 font-mono">{p.conta?.codigo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black px-1.5 py-0 border-none",
                      p.tipo === 'D' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {p.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] font-black py-3">{formatCurrency(p.valor)}</TableCell>
                </TableRow>
              ))}
              {partidasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 opacity-40 text-xs font-bold uppercase">Nenhum lançamento analítico encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
