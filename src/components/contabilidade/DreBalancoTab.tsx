import { useMemo, useState } from 'react';
import { BarChart3, Scale, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas, type PlanoContaRow } from '@/hooks/usePlanoContas';
import { useEmpresas } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { exportToPDF, type ExportColumn } from '@/lib/export-utils';
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
  const [dataInicio, setDataInicio] = useState(`${ano}-01-01`);
  const [dataFim, setDataFim] = useState(`${ano}-12-31`);

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

  const exportarDRE = () => {
    if (dre.receitas.length === 0 && dre.despesas.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }
    const linhas: Record<string, string>[] = [
      { Grupo: 'RECEITAS', Código: '', Conta: '', Valor: '' },
      ...dre.receitas.map((c) => ({ Grupo: '', Código: c.codigo, Conta: c.nome, Valor: formatCurrency(c.saldo) })),
      { Grupo: '', Código: '', Conta: 'Total Receitas', Valor: formatCurrency(dre.totalReceitas) },
      { Grupo: 'DESPESAS', Código: '', Conta: '', Valor: '' },
      ...dre.despesas.map((c) => ({ Grupo: '', Código: c.codigo, Conta: c.nome, Valor: formatCurrency(c.saldo) })),
      { Grupo: '', Código: '', Conta: 'Total Despesas', Valor: formatCurrency(dre.totalDespesas) },
      { Grupo: 'RESULTADO', Código: '', Conta: 'Resultado do Período', Valor: formatCurrency(dre.resultado) },
    ];
    const cols: ExportColumn<Record<string, string>>[] = [
      { header: 'Grupo', key: 'Grupo' },
      { header: 'Código', key: 'Código' },
      { header: 'Conta', key: 'Conta' },
      { header: 'Valor', key: 'Valor' },
    ];
    exportToPDF(linhas, cols, `DRE — ${empresaTitulo} · ${dataInicio} a ${dataFim}`);
  };

  const exportarBalanco = () => {
    if (balanco.ativo.length === 0 && balanco.passivo.length === 0) {
      toast.warning('Sem dados para exportar.');
      return;
    }
    const equilibrado = Math.abs(balanco.diferenca) < 0.01;
    const linhas: Record<string, string>[] = [
      { Grupo: 'ATIVO', Código: '', Conta: '', Valor: '' },
      ...balanco.ativo.map((c) => ({ Grupo: '', Código: c.codigo, Conta: c.nome, Valor: formatCurrency(c.saldo) })),
      { Grupo: '', Código: '', Conta: 'Total Ativo', Valor: formatCurrency(balanco.totalAtivo) },
      { Grupo: 'PASSIVO', Código: '', Conta: '', Valor: '' },
      ...balanco.passivo.map((c) => ({ Grupo: '', Código: c.codigo, Conta: c.nome, Valor: formatCurrency(c.saldo) })),
      { Grupo: 'PATRIMÔNIO LÍQUIDO', Código: '', Conta: '', Valor: '' },
      ...balanco.patrimonio.map((c) => ({ Grupo: '', Código: c.codigo, Conta: c.nome, Valor: formatCurrency(c.saldo) })),
      { Grupo: '', Código: '', Conta: 'Resultado do Exercício', Valor: formatCurrency(resultadoExercicio) },
      { Grupo: '', Código: '', Conta: 'Total Passivo + PL', Valor: formatCurrency(balanco.totalPassivoMaisPL) },
      {
        Grupo: equilibrado ? 'EQUILIBRADO' : 'DESEQUILÍBRIO',
        Código: '',
        Conta: equilibrado
          ? 'Diferença (Ativo − Passivo+PL)'
          : `Diferença (Ativo − Passivo+PL) — ${balanco.diferenca > 0 ? 'Ativo maior' : 'Passivo+PL maior'}`,
        Valor: `${balanco.diferenca >= 0 ? '+' : ''}${formatCurrency(balanco.diferenca)}`,
      },
    ];
    const cols: ExportColumn<Record<string, string>>[] = [
      { header: 'Grupo', key: 'Grupo' },
      { header: 'Código', key: 'Código' },
      { header: 'Conta', key: 'Conta' },
      { header: 'Valor', key: 'Valor' },
    ];
    exportToPDF(linhas, cols, `Balanço Patrimonial — ${empresaTitulo} · ${dataInicio} a ${dataFim}`);
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="w-full" onClick={modo === 'dre' ? exportarDRE : exportarBalanco}>
              <Download className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
          </div>
        </div>

        <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as 'dre' | 'balanco')}>
          <ToggleGroupItem value="dre">DRE</ToggleGroupItem>
          <ToggleGroupItem value="balanco">Balanço Patrimonial</ToggleGroupItem>
        </ToggleGroup>

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
            <div className="grid gap-4 md:grid-cols-2">
              <section className="border rounded-md p-3 space-y-1">
                <h3 className="text-sm font-semibold mb-2">ATIVO</h3>
                {balanco.ativo.length === 0
                  ? <p className="text-xs text-muted-foreground">Sem contas de ativo.</p>
                  : balanco.ativo.map(renderLinha)}
                <div className="flex items-center justify-between px-2 py-2 border-t font-semibold">
                  <span>Total Ativo</span>
                  <span className="font-mono tabular-nums">{formatCurrency(balanco.totalAtivo)}</span>
                </div>
              </section>
              <section className="border rounded-md p-3 space-y-1">
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
                  <span>Total Passivo + PL</span>
                  <span className="font-mono tabular-nums">{formatCurrency(balanco.totalPassivoMaisPL)}</span>
                </div>
              </section>
            </div>

            {Math.abs(balanco.diferenca) < 0.01 ? (
              <Alert className="border-success/30 bg-success/5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-sm">
                  Balanço equilibrado: Ativo = Passivo + PL = <strong>{formatCurrency(balanco.totalAtivo)}</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-warning/40 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm">
                  Diferença entre Ativo e Passivo+PL: <Badge variant="outline" className="ml-1 font-mono">{formatCurrency(balanco.diferenca)}</Badge>
                  {' '}— revise lançamentos do período.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
