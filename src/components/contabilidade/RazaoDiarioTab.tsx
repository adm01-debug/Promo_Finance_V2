import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BookText, Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { exportToCSV, exportToPDF, type ExportColumn } from '@/lib/export-utils';
import { toast } from 'sonner';

interface Props { empresaId?: string; ano: number }

interface PartidaFlat {
  data: string;
  numero: number | null;
  historico: string;
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  debito: number;
  credito: number;
}

export function RazaoDiarioTab({ empresaId, ano }: Props) {
  const [modo, setModo] = useState<'diario' | 'razao'>('diario');
  const [dataInicio, setDataInicio] = useState(`${ano}-01-01`);
  const [dataFim, setDataFim] = useState(`${ano}-12-31`);
  const [contaId, setContaId] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);

  // Achata todas as partidas com metadados do lançamento
  const todasPartidas = useMemo<PartidaFlat[]>(() => {
    const arr: PartidaFlat[] = [];
    for (const l of lancs as Array<Record<string, unknown>>) {
      const partidas = (l.partidas as Array<Record<string, unknown>>) || [];
      for (const p of partidas) {
        const conta = (p.conta as Record<string, unknown>) || {};
        const valor = Number(p.valor) || 0;
        arr.push({
          data: String(l.data_lancamento),
          numero: (l.numero_lancamento as number) ?? null,
          historico: String(l.historico ?? ''),
          conta_id: String(p.conta_id ?? ''),
          conta_codigo: String(conta.codigo ?? ''),
          conta_nome: String(conta.nome ?? conta.descricao ?? ''),
          debito: p.tipo === 'D' ? valor : 0,
          credito: p.tipo === 'C' ? valor : 0,
        });
      }
    }
    return arr;
  }, [lancs]);

  const partidasFiltradas = useMemo(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);
    const term = busca.trim().toLowerCase();
    return todasPartidas.filter((p) => {
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini || d > fim) return false;
      if (contaId !== 'todas' && p.conta_id !== contaId) return false;
      if (term && !`${p.historico} ${p.conta_codigo} ${p.conta_nome}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [todasPartidas, dataInicio, dataFim, contaId, busca]);

  // Diário ordenado cronologicamente
  const diario = useMemo(
    () => [...partidasFiltradas].sort((a, b) => a.data.localeCompare(b.data)),
    [partidasFiltradas],
  );

  const totaisDiario = useMemo(() => {
    return diario.reduce(
      (acc, p) => ({ debito: acc.debito + p.debito, credito: acc.credito + p.credito }),
      { debito: 0, credito: 0 },
    );
  }, [diario]);

  // Razão: agrupado por conta, com saldo inicial calculado
  const razao = useMemo(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    // saldo inicial = movimentos antes do período
    const saldoInicialMap = new Map<string, number>();
    for (const p of todasPartidas) {
      if (contaId !== 'todas' && p.conta_id !== contaId) continue;
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini) {
        saldoInicialMap.set(p.conta_id, (saldoInicialMap.get(p.conta_id) || 0) + p.debito - p.credito);
      }
    }

    const grupos = new Map<string, { conta_id: string; codigo: string; nome: string; saldo_inicial: number; movs: PartidaFlat[] }>();
    for (const p of partidasFiltradas) {
      let g = grupos.get(p.conta_id);
      if (!g) {
        g = {
          conta_id: p.conta_id,
          codigo: p.conta_codigo,
          nome: p.conta_nome,
          saldo_inicial: saldoInicialMap.get(p.conta_id) || 0,
          movs: [],
        };
        grupos.set(p.conta_id, g);
      }
      g.movs.push(p);
    }
    // ordena movimentos cronologicamente
    for (const g of grupos.values()) {
      g.movs.sort((a, b) => a.data.localeCompare(b.data));
    }
    return Array.from(grupos.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [partidasFiltradas, todasPartidas, dataInicio, contaId]);

  const sufixoArquivo = `${dataInicio}_${dataFim}`;

  const exportarDiario = (formato: 'csv' | 'pdf') => {
    if (diario.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    const linhas = diario.map((p) => ({
      Data: format(new Date(`${p.data}T00:00:00`), 'dd/MM/yyyy'),
      Nº: p.numero ?? '',
      Histórico: p.historico,
      Conta: `${p.conta_codigo} — ${p.conta_nome}`,
      Débito: p.debito ? formatCurrency(p.debito) : '',
      Crédito: p.credito ? formatCurrency(p.credito) : '',
    }));
    const colunas: ExportColumn<Record<string, string | number>>[] = [
      { header: 'Data', key: 'Data' },
      { header: 'Nº', key: 'Nº' },
      { header: 'Histórico', key: 'Histórico' },
      { header: 'Conta', key: 'Conta' },
      { header: 'Débito', key: 'Débito' },
      { header: 'Crédito', key: 'Crédito' },
    ];
    if (formato === 'csv') exportToCSV(linhas, colunas, `livro-diario_${sufixoArquivo}`);
    else exportToPDF(linhas, colunas, `Livro Diário · ${dataInicio} a ${dataFim}`);
  };

  const exportarRazao = (formato: 'csv' | 'pdf') => {
    if (razao.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    const linhas: Record<string, string>[] = [];
    for (const g of razao) {
      let saldo = g.saldo_inicial;
      linhas.push({
        Conta: `${g.codigo} — ${g.nome}`,
        Data: '',
        Histórico: 'SALDO INICIAL',
        Débito: '',
        Crédito: '',
        Saldo: formatCurrency(saldo),
      });
      for (const m of g.movs) {
        saldo += m.debito - m.credito;
        linhas.push({
          Conta: `${g.codigo} — ${g.nome}`,
          Data: format(new Date(`${m.data}T00:00:00`), 'dd/MM/yyyy'),
          Histórico: m.historico,
          Débito: m.debito ? formatCurrency(m.debito) : '',
          Crédito: m.credito ? formatCurrency(m.credito) : '',
          Saldo: formatCurrency(saldo),
        });
      }
      linhas.push({
        Conta: `${g.codigo} — ${g.nome}`,
        Data: '',
        Histórico: 'SALDO FINAL',
        Débito: '',
        Crédito: '',
        Saldo: formatCurrency(saldo),
      });
    }
    const colunas: ExportColumn<Record<string, string>>[] = [
      { header: 'Conta', key: 'Conta' },
      { header: 'Data', key: 'Data' },
      { header: 'Histórico', key: 'Histórico' },
      { header: 'Débito', key: 'Débito' },
      { header: 'Crédito', key: 'Crédito' },
      { header: 'Saldo', key: 'Saldo' },
    ];
    if (formato === 'csv') exportToCSV(linhas, colunas, `livro-razao_${sufixoArquivo}`);
    else exportToPDF(linhas, colunas, `Livro Razão · ${dataInicio} a ${dataFim}`);
  };

  const exportar = (formato: 'csv' | 'pdf') => (modo === 'diario' ? exportarDiario(formato) : exportarRazao(formato));

  if (!empresaId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Selecione uma empresa para visualizar o Razão e o Diário.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookText className="h-5 w-5 text-primary" />
          Razão & Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Conta</Label>
            <Select value={contaId} onValueChange={setContaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as contas</SelectItem>
                {plano.filter((c) => c.tipo === 'analitica').map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nome || c.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-7" placeholder="Histórico..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as 'diario' | 'razao')}>
            <ToggleGroupItem value="diario">Diário</ToggleGroupItem>
            <ToggleGroupItem value="razao">Razão</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {modo === 'diario'
                ? `${diario.length.toLocaleString('pt-BR')} partidas`
                : `${razao.length} conta(s) com movimento`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportar('csv')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportar('pdf')} className="gap-2">
                  <FileText className="h-4 w-4" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : modo === 'diario' ? (
          diario.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma partida no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nº</TableHead>
                  <TableHead>Histórico</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diario.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">{format(new Date(`${p.data}T00:00:00`), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-mono text-xs">{p.numero ?? '—'}</TableCell>
                    <TableCell className="max-w-[260px] truncate" title={p.historico}>{p.historico}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{p.conta_codigo}</span>
                      <span className="text-muted-foreground"> — {p.conta_nome}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{p.debito ? formatCurrency(p.debito) : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{p.credito ? formatCurrency(p.credito) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Totais</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(totaisDiario.debito)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(totaisDiario.credito)}</TableCell>
                </TableRow>
                {Math.abs(totaisDiario.debito - totaisDiario.credito) > 0.01 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-warning text-xs">
                      ⚠ Débitos e créditos não fecham (diferença: {formatCurrency(Math.abs(totaisDiario.debito - totaisDiario.credito))})
                    </TableCell>
                  </TableRow>
                )}
              </TableFooter>
            </Table>
          )
        ) : razao.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma conta com movimento no período.</p>
        ) : (
          <div className="space-y-6">
            {razao.map((g) => {
              let saldo = g.saldo_inicial;
              const linhas = g.movs.map((m) => {
                saldo += m.debito - m.credito;
                return { ...m, saldoAcumulado: saldo };
              });
              const saldoFinal = saldo;
              return (
                <div key={g.conta_id} className="border rounded-md overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs">{g.codigo}</span>
                      <span className="font-medium ml-2">{g.nome}</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      Saldo inicial: {formatCurrency(g.saldo_inicial)}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Histórico</TableHead>
                        <TableHead className="text-right">Débito</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linhas.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap">{format(new Date(`${m.data}T00:00:00`), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={m.historico}>{m.historico}</TableCell>
                          <TableCell className="text-right font-mono">{m.debito ? formatCurrency(m.debito) : '—'}</TableCell>
                          <TableCell className="text-right font-mono">{m.credito ? formatCurrency(m.credito) : '—'}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(m.saldoAcumulado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-semibold">Saldo final</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(saldoFinal)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
