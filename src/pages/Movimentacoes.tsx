import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List as FixedSizeList, useListRef, type RowComponentProps } from 'react-window';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  useMovimentacoes,
  MOVIMENTACOES_SAFETY_CAP,
  type Movimentacao,
} from '@/hooks/useFinancialOperations';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

// Acima disso, virtualizamos: renderizar centenas de <TableRow> de uma vez
// degrada o DOM (E-024). Abaixo, a tabela simples já é barata o bastante.
const VIRTUALIZE_THRESHOLD = 60;
const ROW_HEIGHT = 57;

// Larguras fixas para alinhar o cabeçalho estático com as linhas virtualizadas
// (cada linha virtualizada é sua própria mini-tabela `table-fixed`, mesmo
// padrão usado em src/pages/ContasPagar/components/List.tsx).
const COL_WIDTHS = {
  data: 'w-[110px]',
  tipo: 'w-[130px]',
  origem: 'w-[130px]',
  valor: 'w-[160px]',
  conciliada: 'w-[110px]',
};

function MovimentacaoRow({ mov }: { mov: Movimentacao }) {
  return (
    <TableRow data-highlight-id={mov.id}>
      <TableCell className={`whitespace-nowrap ${COL_WIDTHS.data}`}>
        {format(parseISO(mov.data_movimentacao), 'dd/MM/yyyy', { locale: ptBR })}
      </TableCell>
      <TableCell className={COL_WIDTHS.tipo}>
        {mov.tipo === 'entrada' ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
            <ArrowDownCircle className="h-3 w-3" /> Entrada
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/30 gap-1"
          >
            <ArrowUpCircle className="h-3 w-3" /> Saída
          </Badge>
        )}
      </TableCell>
      <TableCell className="max-w-[300px] truncate">{mov.descricao}</TableCell>
      <TableCell className={COL_WIDTHS.origem}>
        <Badge variant="secondary" className="text-xs capitalize">
          {mov.origem || 'manual'}
        </Badge>
      </TableCell>
      <TableCell
        className={`text-right font-mono font-semibold ${COL_WIDTHS.valor} ${mov.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}
      >
        {mov.tipo === 'entrada' ? '+' : '-'}
        {formatCurrency(mov.valor)}
      </TableCell>
      <TableCell className={COL_WIDTHS.conciliada}>
        {mov.conciliada ? (
          <Badge variant="outline" className="bg-success/10 text-success text-xs">
            Sim
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Não
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function VirtualRow({ index, style, items }: RowComponentProps<{ items: Movimentacao[] }>) {
  const mov = items[index];
  return (
    <div style={style} className="border-b border-border/50">
      <Table className="table-fixed min-w-[900px]">
        <TableBody>
          <MovimentacaoRow mov={mov} />
        </TableBody>
      </Table>
    </div>
  );
}

export default function Movimentacoes() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: movimentacoesResult, isLoading } = useMovimentacoes(undefined, {
    startDate,
    endDate,
  });
  const movimentacoes = movimentacoesResult?.items;
  const truncated = movimentacoesResult?.truncated ?? false;

  useHighlightFromUrl('highlight', !isLoading && (movimentacoes?.length ?? 0) > 0);

  const [searchParams] = useSearchParams();
  const listRef = useListRef(null);

  const filtered = useMemo(() => {
    if (!movimentacoes) return [];
    return movimentacoes.filter((m) => {
      const matchSearch = !search || m.descricao?.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFilter === 'all' || m.tipo === tipoFilter;
      return matchSearch && matchTipo;
    });
  }, [movimentacoes, search, tipoFilter]);

  // A virtualização só monta as linhas visíveis; useHighlightFromUrl procura
  // o elemento no DOM via querySelector e, se o alvo não estiver entre as
  // ~12 linhas iniciais renderizadas, nunca acha — mesmo com o dado
  // carregado — e mostra "Item não encontrado" por engano. Faz o scroll até
  // o índice do item na lista virtualizada antes do primeiro attempt do hook.
  useEffect(() => {
    if (filtered.length <= VIRTUALIZE_THRESHOLD) return;
    const highlightId = searchParams.get('highlight');
    if (!highlightId) return;
    const index = filtered.findIndex((m) => m.id === highlightId);
    if (index === -1) return;
    listRef.current?.scrollToRow({ index, align: 'center' });
  }, [filtered, searchParams, listRef]);

  const totalEntradas = useMemo(
    () => filtered.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + (m.valor || 0), 0),
    [filtered]
  );
  const totalSaidas = useMemo(
    () => filtered.filter((m) => m.tipo === 'saida').reduce((s, m) => s + (m.valor || 0), 0),
    [filtered]
  );
  const saldo = totalEntradas - totalSaidas;

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações Financeiras</h1>
          <p className="text-muted-foreground">
            Registro completo de entradas e saídas por conta bancária
          </p>
        </div>

        {truncated && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              Período com mais de {MOVIMENTACOES_SAFETY_CAP.toLocaleString('pt-BR')} movimentações
            </AlertTitle>
            <AlertDescription>
              Esta tela mostra apenas as {MOVIMENTACOES_SAFETY_CAP.toLocaleString('pt-BR')}{' '}
              movimentações mais recentes do período selecionado. Os totais de entradas, saídas e
              saldo abaixo estão incompletos — estreite o intervalo de datas para ver o período
              inteiro.
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entradas</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Saídas</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalSaidas)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Período</p>
                  <p
                    className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatCurrency(saldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Movimentações ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma movimentação"
                description="Sem movimentações no período selecionado"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-fixed min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={COL_WIDTHS.data}>Data</TableHead>
                      <TableHead className={COL_WIDTHS.tipo}>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className={COL_WIDTHS.origem}>Origem</TableHead>
                      <TableHead className={`text-right ${COL_WIDTHS.valor}`}>Valor</TableHead>
                      <TableHead className={COL_WIDTHS.conciliada}>Conciliada</TableHead>
                    </TableRow>
                  </TableHeader>
                  {filtered.length <= VIRTUALIZE_THRESHOLD && (
                    <TableBody>
                      {filtered.map((mov) => (
                        <MovimentacaoRow key={mov.id} mov={mov} />
                      ))}
                    </TableBody>
                  )}
                </Table>
                {filtered.length > VIRTUALIZE_THRESHOLD && (
                  <FixedSizeList
                    listRef={listRef}
                    rowCount={filtered.length}
                    rowHeight={ROW_HEIGHT}
                    style={{ height: Math.min(640, filtered.length * ROW_HEIGHT), width: '100%' }}
                    className="min-w-[900px] custom-scrollbar"
                    rowComponent={VirtualRow}
                    rowProps={{ items: filtered }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  );
}
