import { useMemo, useState } from 'react';
import { BarChart3, Scale, Download, AlertTriangle, CheckCircle2, FileJson, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useDemonstrativosContabeis, type FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas, type PlanoContaRow } from '@/hooks/usePlanoContas';
import { useEmpresas } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { applyPdfLayout, getAutoTableMargins, getContentStartY, PDF_BRAND } from '@/lib/pdf-layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface Props { empresaId?: string; ano: number }

interface ContaSaldo {
  id: string;
  codigo: string;
  nome: string;
  natureza: string;
  tipo: string;
  parent_id: string | null;
  nivel: number;
  saldo: number;
}

function calcularNivel(c: PlanoContaRow): number {
  return c.codigo.split('.').length;
}

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

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === empresaId);

  // Calcula saldo de cada conta no período
  const saldos = useMemo<Map<string, number>>(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);
    const map = new Map<string, number>();
    for (const l of lancs as Array<Record<string, unknown>>) {
      const d = new Date(`${String(l.data_lancamento)}T00:00:00`);
      if (d < ini || d > fim) continue;
      const partidas = (l.partidas as Array<Record<string, unknown>>) || [];
      for (const p of partidas) {
        const id = String(p.conta_id ?? '');
        const valor = Number(p.valor) || 0;
        const delta = p.tipo === 'D' ? valor : -valor;
        map.set(id, (map.get(id) || 0) + delta);
      }
    }
    return map;
  }, [lancs, dataInicio, dataFim]);

  // Resultado do exercício (receitas − despesas)
  const resultadoExercicio = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    for (const c of plano) {
      const saldoDC = saldos.get(c.id) || 0; // D positivo
      if (c.natureza === 'receita') receitas += -saldoDC; // receita normal é credora
      else if (c.natureza === 'despesa') despesas += saldoDC; // despesa normal é devedora
    }
    return receitas - despesas;
  }, [plano, saldos]);

  // Monta DRE
  const dre = useMemo(() => {
    const receitas: ContaSaldo[] = [];
    const despesas: ContaSaldo[] = [];
    for (const c of plano) {
      const saldoBruto = saldos.get(c.id) || 0;
      if (c.natureza === 'receita') {
        const valor = -saldoBruto;
        if (Math.abs(valor) < 0.005) continue;
        receitas.push({
          id: c.id, codigo: c.codigo, nome: c.nome || c.descricao,
          natureza: c.natureza, tipo: c.tipo, parent_id: c.parent_id,
          nivel: calcularNivel(c), saldo: valor,
        });
      } else if (c.natureza === 'despesa') {
        if (Math.abs(saldoBruto) < 0.005) continue;
        despesas.push({
          id: c.id, codigo: c.codigo, nome: c.nome || c.descricao,
          natureza: c.natureza, tipo: c.tipo, parent_id: c.parent_id,
          nivel: calcularNivel(c), saldo: saldoBruto,
        });
      }
    }
    receitas.sort((a, b) => a.codigo.localeCompare(b.codigo));
    despesas.sort((a, b) => a.codigo.localeCompare(b.codigo));
    const totalReceitas = receitas.reduce((s, c) => s + (c.tipo === 'analitica' ? c.saldo : 0), 0);
    const totalDespesas = despesas.reduce((s, c) => s + (c.tipo === 'analitica' ? c.saldo : 0), 0);
    return { receitas, despesas, totalReceitas, totalDespesas, resultado: totalReceitas - totalDespesas };
  }, [plano, saldos]);

  // Monta Balanço
  const balanco = useMemo(() => {
    const ativo: ContaSaldo[] = [];
    const passivo: ContaSaldo[] = [];
    const patrimonio: ContaSaldo[] = [];
    for (const c of plano) {
      const saldoBruto = saldos.get(c.id) || 0; // D positivo
      let valor = 0;
      if (c.natureza === 'ativo') valor = saldoBruto;
      else if (c.natureza === 'passivo') valor = -saldoBruto;
      else if (c.natureza === 'patrimonio') valor = -saldoBruto;
      else continue;
      if (Math.abs(valor) < 0.005 && c.tipo === 'analitica') continue;
      const item: ContaSaldo = {
        id: c.id, codigo: c.codigo, nome: c.nome || c.descricao,
        natureza: c.natureza, tipo: c.tipo, parent_id: c.parent_id,
        nivel: calcularNivel(c), saldo: valor,
      };
      if (c.natureza === 'ativo') ativo.push(item);
      else if (c.natureza === 'passivo') passivo.push(item);
      else patrimonio.push(item);
    }
    [ativo, passivo, patrimonio].forEach((arr) => arr.sort((a, b) => a.codigo.localeCompare(b.codigo)));
    const totalAtivo = ativo.reduce((s, c) => s + (c.tipo === 'analitica' ? c.saldo : 0), 0);
    const totalPassivo = passivo.reduce((s, c) => s + (c.tipo === 'analitica' ? c.saldo : 0), 0);
    const totalPatrimonio = patrimonio.reduce((s, c) => s + (c.tipo === 'analitica' ? c.saldo : 0), 0);
    const totalPassivoMaisPL = totalPassivo + totalPatrimonio + resultadoExercicio;
    return {
      ativo, passivo, patrimonio,
      totalAtivo, totalPassivo, totalPatrimonio,
      totalPassivoMaisPL,
      diferenca: totalAtivo - totalPassivoMaisPL,
    };
  }, [plano, saldos, resultadoExercicio]);

  const empresaTitulo = empresa ? (empresa.nome_fantasia || empresa.razao_social) : 'Empresa';

  const exportarDRE = (format: 'pdf' | 'json') => {
    if (dre.receitas.length === 0 && dre.despesas.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }

    const filename = `DRE-${empresaTitulo}-${dataInicio}-a-${dataFim}`;

    if (format === 'json') {
      const payload = {
        empresa: {
          nome: empresaTitulo,
          cnpj: empresa?.cnpj || '—',
        },
        periodo: { inicio: dataInicio, fim: dataFim },
        totais: {
          receitas: dre.totalReceitas,
          despesas: dre.totalDespesas,
          resultado: dre.resultado,
        },
        receitas: dre.receitas.map(r => ({ codigo: r.codigo, nome: r.nome, saldo: r.saldo })),
        despesas: dre.despesas.map(d => ({ codigo: d.codigo, nome: d.nome, saldo: d.saldo })),
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
    doc.text('RESULTADO LÍQUIDO DO PERÍODO', margins.left + 4, cursorY + 6);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dre.resultado >= 0 ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], dre.resultado >= 0 ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], dre.resultado >= 0 ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.text(formatCurrency(dre.resultado), margins.left + 4, cursorY + 12);
    
    cursorY += 22;

    const rows: any[] = [
      [{ content: '(+) RECEITAS', styles: { fontStyle: 'bold', fillColor: [240, 248, 240] } }, ''],
      ...dre.receitas.map(r => [
        { content: r.nome, styles: { paddingLeft: r.nivel * 2 } },
        { content: formatCurrency(r.saldo), styles: { halign: 'right' } }
      ]),
      [{ content: 'TOTAL RECEITAS', styles: { fontStyle: 'bold' } }, { content: formatCurrency(dre.totalReceitas), styles: { halign: 'right', fontStyle: 'bold' } }],
      [{ content: ' ', styles: { cellPadding: 1 } }, ''],
      [{ content: '(−) DESPESAS', styles: { fontStyle: 'bold', fillColor: [252, 245, 245] } }, ''],
      ...dre.despesas.map(d => [
        { content: d.nome, styles: { paddingLeft: d.nivel * 2 } },
        { content: formatCurrency(d.saldo), styles: { halign: 'right' } }
      ]),
      [{ content: 'TOTAL DESPESAS', styles: { fontStyle: 'bold' } }, { content: formatCurrency(dre.totalDespesas), styles: { halign: 'right', fontStyle: 'bold' } }],
    ];

    autoTable(doc, {
      startY: cursorY,
      head: [['Descrição', 'Valor (R$)']],
      body: rows,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: PDF_BRAND.foreground, textColor: [255, 255, 255] },
      columnStyles: { 1: { cellWidth: 40 } },
      margin: margins,
    });

    applyPdfLayout(doc, {
      titulo: 'Demonstração do Resultado do Exercício',
      subtitulo: `${empresaTitulo} · ${dataInicio} a ${dataFim}`,
    });

    doc.save(`${filename}.pdf`);
    toast.success('DRE exportada em PDF');
  };

  const exportarBalanco = (format: 'pdf' | 'json') => {
    if (balanco.ativo.length === 0 && balanco.passivo.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }

    const filename = `Balanco-${empresaTitulo}-${dataInicio}-a-${dataFim}`;

    if (format === 'json') {
      const payload = {
        empresa: {
          nome: empresaTitulo,
          cnpj: empresa?.cnpj || '—',
        },
        periodo: { inicio: dataInicio, fim: dataFim },
        totais: {
          ativo: balanco.totalAtivo,
          passivo: balanco.totalPassivo,
          patrimonio: balanco.totalPatrimonio,
          resultado_exercicio: resultadoExercicio,
          diferenca: balanco.diferenca,
        },
        ativo: balanco.ativo.map(a => ({ codigo: a.codigo, nome: a.nome, saldo: a.saldo })),
        passivo: balanco.passivo.map(p => ({ codigo: p.codigo, nome: p.nome, saldo: p.saldo })),
        patrimonio: balanco.patrimonio.map(pl => ({ codigo: pl.codigo, nome: pl.nome, saldo: pl.saldo })),
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

    const rowsAtivo: any[] = [
      [{ content: 'ATIVO', styles: { fontStyle: 'bold', fillColor: PDF_BRAND.surface } }, ''],
      ...balanco.ativo.map(a => [
        { content: a.nome, styles: { paddingLeft: a.nivel * 2 } },
        { content: formatCurrency(a.saldo), styles: { halign: 'right' } }
      ]),
      [{ content: 'TOTAL ATIVO', styles: { fontStyle: 'bold' } }, { content: formatCurrency(balanco.totalAtivo), styles: { halign: 'right', fontStyle: 'bold' } }],
    ];

    const rowsPassivo: any[] = [
      [{ content: 'PASSIVO + PL', styles: { fontStyle: 'bold', fillColor: PDF_BRAND.surface } }, ''],
      [{ content: 'PASSIVO', styles: { fontStyle: 'bold', fontSize: 7, textColor: PDF_BRAND.muted } }, ''],
      ...balanco.passivo.map(p => [
        { content: p.nome, styles: { paddingLeft: p.nivel * 2 } },
        { content: formatCurrency(p.saldo), styles: { halign: 'right' } }
      ]),
      [{ content: 'PATRIMÔNIO LÍQUIDO', styles: { fontStyle: 'bold', fontSize: 7, textColor: PDF_BRAND.muted } }, ''],
      ...balanco.patrimonio.map(pl => [
        { content: pl.nome, styles: { paddingLeft: pl.nivel * 2 } },
        { content: formatCurrency(pl.saldo), styles: { halign: 'right' } }
      ]),
      ['Resultado do Exercício', { content: formatCurrency(resultadoExercicio), styles: { halign: 'right' } }],
      [{ content: 'TOTAL PASSIVO + PL', styles: { fontStyle: 'bold' } }, { content: formatCurrency(balanco.totalPassivoMaisPL), styles: { halign: 'right', fontStyle: 'bold' } }],
    ];

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

    const finalY = Math.max((doc as any).lastAutoTable.finalY || 0);
    const equilibrado = Math.abs(balanco.diferenca) < 0.01;

    doc.setFillColor(equilibrado ? 240 : 255, equilibrado ? 248 : 240, equilibrado ? 240 : 240);
    doc.setDrawColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.roundedRect(margins.left, finalY + 6, doc.internal.pageSize.getWidth() - margins.left - margins.right, 10, 1, 1, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(equilibrado ? PDF_BRAND.success[0] : PDF_BRAND.destructive[0], equilibrado ? PDF_BRAND.success[1] : PDF_BRAND.destructive[1], equilibrado ? PDF_BRAND.success[2] : PDF_BRAND.destructive[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(
      equilibrado ? 'BALANÇO EQUILIBRADO' : `DIVERGÊNCIA NO BALANÇO: ${formatCurrency(balanco.diferenca)}`,
      margins.left + 4,
      finalY + 12.5
    );

    applyPdfLayout(doc, {
      titulo: 'Balanço Patrimonial',
      subtitulo: `${empresaTitulo} · ${dataInicio} a ${dataFim}`,
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

  const renderLinha = (c: ContaSaldo) => (
    <div
      key={c.id}
      className={`flex items-center justify-between py-1.5 px-2 rounded ${
        c.tipo === 'sintetica' ? 'bg-muted/30 font-medium' : 'hover:bg-muted/20'
      }`}
      style={{ paddingLeft: `${0.5 + (c.nivel - 1) * 1}rem` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-xs text-muted-foreground shrink-0">{c.codigo}</span>
        <span className="truncate text-sm">{c.nome}</span>
      </div>
      <span className="font-mono text-sm tabular-nums">{formatCurrency(c.saldo)}</span>
    </div>
  );

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

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : modo === 'dre' ? (
          <div className="space-y-4">
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-success px-2">(+) Receitas</h3>
              {dre.receitas.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">Nenhuma receita no período.</p>
              ) : dre.receitas.map(renderLinha)}
              <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                <span>Total Receitas</span>
                <span className="font-mono tabular-nums text-success">{formatCurrency(dre.totalReceitas)}</span>
              </div>
            </section>
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-destructive px-2">(−) Despesas</h3>
              {dre.despesas.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">Nenhuma despesa no período.</p>
              ) : dre.despesas.map(renderLinha)}
              <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                <span>Total Despesas</span>
                <span className="font-mono tabular-nums text-destructive">{formatCurrency(dre.totalDespesas)}</span>
              </div>
            </section>
            <section className={`flex items-center justify-between px-3 py-3 rounded-md ${dre.resultado >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <span className="font-semibold">(=) Resultado do período</span>
              <span className={`font-mono tabular-nums font-bold text-base ${dre.resultado >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(dre.resultado)}
              </span>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const equilibrado = Math.abs(balanco.diferenca) < 0.01;
              const totalCellClass = equilibrado
                ? 'font-mono tabular-nums'
                : 'font-mono tabular-nums text-destructive';
              const sectionClass = equilibrado
                ? 'border rounded-md p-3 space-y-1'
                : 'border-l-4 border-l-destructive border rounded-md p-3 space-y-1';

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <section className={sectionClass}>
                      <h3 className="text-sm font-semibold mb-2">ATIVO</h3>
                      {balanco.ativo.length === 0
                        ? <p className="text-xs text-muted-foreground">Sem contas de ativo.</p>
                        : balanco.ativo.map(renderLinha)}
                      <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                        <span className={equilibrado ? '' : 'text-destructive'}>Total Ativo</span>
                        <span className={totalCellClass}>{formatCurrency(balanco.totalAtivo)}</span>
                      </div>
                    </section>
                    <section className={sectionClass}>
                      <h3 className="text-sm font-semibold mb-2">PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
                      <div className="text-xs uppercase text-muted-foreground px-2 mt-1">Passivo</div>
                      {balanco.passivo.length === 0
                        ? <p className="text-xs text-muted-foreground px-2">Sem passivos.</p>
                        : balanco.passivo.map(renderLinha)}
                      <div className="text-xs uppercase text-muted-foreground px-2 mt-2">Patrimônio Líquido</div>
                      {balanco.patrimonio.map(renderLinha)}
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm">Resultado do Exercício</span>
                        <span className="font-mono text-sm tabular-nums">{formatCurrency(resultadoExercicio)}</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                        <span className={equilibrado ? '' : 'text-destructive'}>Total Passivo + PL</span>
                        <span className={totalCellClass}>{formatCurrency(balanco.totalPassivoMaisPL)}</span>
                      </div>
                    </section>
                  </div>

                  {/* Indicador detalhado: Ativo · Passivo · PL+Resultado · Diferença */}
                  <div
                    className={`sticky bottom-0 rounded-md backdrop-blur px-4 py-3 ${
                      equilibrado
                        ? 'border border-success/30 bg-success/10'
                        : 'border-2 border-destructive/40 bg-destructive/10 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {equilibrado ? (
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 animate-pulse" />
                      )}
                      <span className={`font-semibold ${equilibrado ? 'text-success' : 'text-destructive'}`}>
                        {equilibrado ? 'Balanço equilibrado' : 'Balanço desequilibrado'}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        · Ativo = Passivo + Patrimônio Líquido (incl. resultado do exercício)
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                      <div className="rounded-md border bg-background/60 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Ativo</div>
                        <div className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                          {formatCurrency(balanco.totalAtivo)}
                        </div>
                      </div>
                      <div className="rounded-md border bg-background/60 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Passivo</div>
                        <div className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                          {formatCurrency(balanco.totalPassivo)}
                        </div>
                      </div>
                      <div className="rounded-md border bg-background/60 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Patrimônio Líquido
                        </div>
                        <div className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                          {formatCurrency(balanco.totalPatrimonio + resultadoExercicio)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          inclui resultado: {formatCurrency(resultadoExercicio)}
                        </div>
                      </div>
                      <div
                        className={`rounded-md border px-3 py-2 ${
                          equilibrado
                            ? 'border-success/30 bg-success/5'
                            : 'border-destructive/40 bg-destructive/5'
                        }`}
                      >
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Diferença (A − P+PL)
                        </div>
                        <div
                          className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                            equilibrado ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {balanco.diferenca >= 0 ? '+' : ''}
                          {formatCurrency(balanco.diferenca)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {equilibrado
                            ? 'dentro da tolerância'
                            : balanco.diferenca > 0
                              ? 'Ativo maior que Passivo + PL'
                              : 'Passivo + PL maior que Ativo'}
                        </div>
                      </div>
                    </div>

                    {!equilibrado && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Verifique lançamentos em aberto, contas sem mapeamento de natureza ou diferenças
                        de arredondamento. A equação contábil <strong>Ativo = Passivo + PL</strong> deve
                        sempre fechar.
                      </p>
                    )}
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
