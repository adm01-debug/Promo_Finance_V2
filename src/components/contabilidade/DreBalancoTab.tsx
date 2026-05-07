import { useMemo, useState } from 'react';
import { 
  BarChart3, Scale, Download, AlertTriangle, CheckCircle2, 
  FileJson, FileText, Calendar as CalendarIcon, Filter,
  TrendingUp, TrendingDown, Layers, PieChart, ArrowUpRight,
  ChevronRight, Info, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Props { empresaId?: string; ano: number }

export function DreBalancoTab({ empresaId, ano }: Props) {
  const [modo, setModo] = useState<'dre' | 'balanco'>('dre');
  const [fonte, setFonte] = useState<FonteDemonstrativo>('competencia');
  const [mes, setMes] = useState(new Date().getMonth());
  const [dataInicio, setDataInicio] = useState(`${ano}-01-01`);
  const [dataFim, setDataFim] = useState(`${ano}-12-31`);

  const {
    dre: dreNovo,
    balanco: balancoNovo,
    origem,
    isLoading: isLoadingNovo,
    error,
  } = useDemonstrativosContabeis({
    empresaId: empresaId || 'todas',
    ano,
    mes,
    fonte,
  });

  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === empresaId);
  const empresaTitulo = empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'Empresa';

  const exportarDRE = (format: 'pdf' | 'json') => {
    if (dreNovo.linhas.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }

    const filename = `DRE-${empresaTitulo}-${ano}-${mes + 1}-${fonte}`;

    if (format === 'json') {
      const payload = {
        empresa: {
          nome: empresaTitulo,
          cnpj: empresa?.cnpj || '—',
        },
        periodo: { ano, mes: mes + 1 },
        fonte,
        totais: {
          receitas: dreNovo.receitaBruta,
          resultado: dreNovo.lucroLiquido,
        },
        linhas: dreNovo.linhas,
        naoClassificadas: dreNovo.naoClassificadas,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('DRE exportada em JSON');
      return;
    }

    // PDF
    const doc = new jsPDF();
    const margins = getAutoTableMargins();
    let cursorY = getContentStartY();

    // Sumário
    const totalW = doc.internal.pageSize.getWidth() - margins.left - margins.right;
    doc.setFillColor(PDF_BRAND.surface[0], PDF_BRAND.surface[1], PDF_BRAND.surface[2]);
    doc.setDrawColor(PDF_BRAND.border[0], PDF_BRAND.border[1], PDF_BRAND.border[2]);
    doc.roundedRect(margins.left, cursorY, totalW, 16, 1, 1, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
    doc.text('LUCRO/PREJUÍZO LÍQUIDO DO PERÍODO', margins.left + 4, cursorY + 6);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], dreNovo.lucroLiquido >= 0 ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.text(formatCurrency(dreNovo.lucroLiquido), margins.left + 4, cursorY + 12);
    
    cursorY += 22;

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
        empresa: {
          nome: empresaTitulo,
          cnpj: empresa?.cnpj || '—',
        },
        periodo: { ano, mes: mes + 1 },
        fonte,
        balanco: balancoNovo,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Balanço exportado em JSON');
      return;
    }

    // PDF
    const doc = new jsPDF();
    const margins = getAutoTableMargins();
    let cursorY = getContentStartY();

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
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      margin: { ...margins, right: doc.internal.pageSize.getWidth() / 2 + 2 },
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['Passivo + PL', 'Valor (R$)']],
      body: rowsPassivo,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      margin: { ...margins, left: doc.internal.pageSize.getWidth() / 2 + 2 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || cursorY;
    const equilibrado = balancoNovo.equilibrado;

    doc.setFillColor(equilibrado ? 240 : 255, equilibrado ? 248 : 240, equilibrado ? 240 : 240);
    doc.setDrawColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.roundedRect(margins.left, finalY + 6, doc.internal.pageSize.getWidth() - margins.left - margins.right, 10, 1, 1, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(
      equilibrado ? 'BALANÇO EQUILIBRADO' : `DIVERGÊNCIA NO BALANÇO: ${formatCurrency(balancoNovo.totalAtivo - balancoNovo.totalPassivo)}`,
      margins.left + 4,
      finalY + 12.5
    );

    applyPdfLayout(doc, {
      titulo: 'Balanço Patrimonial',
      subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano} (${fonte})`,
    });

    doc.save(`${filename}.pdf`);
    toast.success('Balanço exportado em PDF');
  };

  if (!empresaId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Selecione uma empresa para visualizar a DRE e o Balanço.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {modo === 'dre' ? <BarChart3 className="h-5 w-5 text-primary" /> : <Scale className="h-5 w-5 text-primary" />}
          DRE & Balanço Patrimonial
        </CardTitle>
        <CardDescription className="text-xs">Visualize e exporte as demonstrações contábeis do período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as 'dre' | 'balanco')} className="bg-background border rounded-lg p-1">
              <ToggleGroupItem value="dre" className="px-4 text-xs font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">DRE</ToggleGroupItem>
              <ToggleGroupItem value="balanco" className="px-4 text-xs font-bold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Balanço</ToggleGroupItem>
            </ToggleGroup>
            
            <ToggleGroup type="single" value={fonte} onValueChange={(v) => v && setFonte(v as FonteDemonstrativo)} className="bg-background border rounded-lg p-1">
              <ToggleGroupItem value="competencia" className="px-3 text-[10px] font-bold data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">COMPETÊNCIA</ToggleGroupItem>
              <ToggleGroupItem value="caixa" className="px-3 text-[10px] font-bold data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">CAIXA</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="h-8 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-2">
            <Label className="text-[10px] font-bold uppercase opacity-50">Mês Ref.</Label>
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger className="h-9 w-[140px] text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[300px] opacity-50 pointer-events-none">
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="date" value={dataInicio} readOnly className="h-9 pl-8 text-xs bg-muted" />
            </div>
            <span className="text-muted-foreground">até</span>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="date" value={dataFim} readOnly className="h-9 pl-8 text-xs bg-muted" />
            </div>
          </div>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold shadow-sm">
                  <Download className="h-4 w-4" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Formato do Relatório</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => (modo === 'dre' ? exportarDRE('pdf') : exportarBalanco('pdf'))} className="gap-2 py-2">
                  <FileText className="h-4 w-4 text-destructive" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">Relatório PDF</span>
                    <span className="text-[10px] text-muted-foreground">Pronto para impressão</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (modo === 'dre' ? exportarDRE('json') : exportarBalanco('json'))} className="gap-2 py-2">
                  <FileJson className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">Dados Estruturados</span>
                    <span className="text-[10px] text-muted-foreground">Para integração (JSON)</span>
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
          <div className="space-y-4">
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-success px-2">(+) Receitas</h3>
              {dreNovo.linhas.filter(l => l.tipo === 'receita' && l.nivel > 0).length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">Nenhuma receita detalhada no período.</p>
              ) : dreNovo.linhas.filter(l => l.tipo === 'receita' && l.nivel > 0).map((l, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/20" style={{ paddingLeft: `${l.nivel * 1}rem` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{l.codigo}</span>
                    <span className="truncate text-sm">{l.descricao}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">{formatCurrency(l.valor)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                <span>Total Receita Bruta</span>
                <span className="font-mono tabular-nums text-success">{formatCurrency(dreNovo.receitaBruta)}</span>
              </div>
            </section>
            
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-destructive px-2">(−) Despesas e Deduções</h3>
              {dreNovo.linhas.filter(l => l.tipo === 'despesa').map((l, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/20" style={{ paddingLeft: `${l.nivel * 1}rem` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{l.codigo}</span>
                    <span className="truncate text-sm">{l.descricao}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-destructive">{formatCurrency(l.valor)}</span>
                </div>
              ))}
            </section>

            <section className={`flex items-center justify-between px-3 py-3 rounded-md ${dreNovo.lucroLiquido >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">(=) Lucro/Prejuízo Líquido</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Modo: {origem}</span>
              </div>
              <span className={`font-mono tabular-nums font-bold text-base ${dreNovo.lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(dreNovo.lucroLiquido)}
              </span>
            </section>

            {dreNovo.naoClassificadas.length > 0 && (
              <Alert variant="warning" className="bg-warning/5 border-warning/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase">Contas não classificadas</AlertTitle>
                <AlertDescription className="text-[11px] space-y-2">
                  <p>Existem {dreNovo.naoClassificadas.length} contas sem centro de resultado definido que impactam o resultado em {formatCurrency(dreNovo.totalNaoClassificado)}.</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-[11px] font-bold" onClick={() => toast.info('Acesse o Plano de Contas para configurar os centros de resultado.')}>
                    Como resolver?
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const equilibrado = balancoNovo.equilibrado;
              const sectionClass = cn(
                "border rounded-xl p-4 space-y-4 transition-all",
                equilibrado ? "bg-card/50" : "border-destructive/30 bg-destructive/5"
              );

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <section className={sectionClass}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">ATIVO</h3>
                        <Badge variant="outline" className="text-[10px]">{balancoNovo.ativo.length} itens</Badge>
                      </div>
                      <div className="space-y-1">
                        {balancoNovo.ativo.map((l, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/20" style={{ paddingLeft: `${l.nivel * 1}rem` }}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-muted-foreground">{l.codigo}</span>
                              <span className="text-xs font-medium">{l.descricao}</span>
                            </div>
                            <span className="font-mono text-xs tabular-nums">{formatCurrency(l.valor)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t flex items-center justify-between font-bold">
                        <span className="text-xs uppercase">Total Ativo</span>
                        <span className="font-mono text-sm tabular-nums">{formatCurrency(balancoNovo.totalAtivo)}</span>
                      </div>
                    </section>

                    <section className={sectionClass}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">PASSIVO + PL</h3>
                        <Badge variant="outline" className="text-[10px]">{balancoNovo.passivo.length} itens</Badge>
                      </div>
                      <div className="space-y-1">
                        {balancoNovo.passivo.map((l, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/20" style={{ paddingLeft: `${l.nivel * 1}rem` }}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-muted-foreground">{l.codigo}</span>
                              <span className="text-xs font-medium">{l.descricao}</span>
                            </div>
                            <span className="font-mono text-xs tabular-nums">{formatCurrency(l.valor)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t flex items-center justify-between font-bold">
                        <span className="text-xs uppercase">Total Passivo + PL</span>
                        <span className="font-mono text-sm tabular-nums">{formatCurrency(balancoNovo.totalPassivo)}</span>
                      </div>
                    </section>
                  </div>

                  <div className={cn(
                    "rounded-xl border p-4 backdrop-blur-sm transition-all shadow-sm",
                    equilibrado ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          equilibrado ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        )}>
                          {equilibrado ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5 animate-pulse" />}
                        </div>
                        <div>
                          <p className={cn("text-sm font-bold", equilibrado ? "text-success" : "text-destructive")}>
                            {equilibrado ? "BALANÇO EQUILIBRADO" : "DIVERGÊNCIA DETECTADA"}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Equação Contábil: Ativo = Passivo + PL</p>
                        </div>
                      </div>
                      {!equilibrado && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Diferença</p>
                          <p className="text-lg font-mono font-black text-destructive tabular-nums">
                            {formatCurrency(balancoNovo.totalAtivo - balancoNovo.totalPassivo)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Ativo Circulante', val: balancoNovo.ativoCirculante },
                        { label: 'Ativo Ñ Circulante', val: balancoNovo.ativoNaoCirculante },
                        { label: 'Passivo Circulante', val: balancoNovo.passivoCirculante },
                        { label: 'Patrimônio Líquido', val: balancoNovo.patrimonioLiquido },
                      ].map((item, i) => (
                        <div key={i} className="bg-background/40 border rounded-lg p-3">
                          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{item.label}</p>
                          <p className="text-xs font-mono font-bold mt-1 tabular-nums">{formatCurrency(item.val)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
