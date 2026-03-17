import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Search,
  SplitSquareHorizontal, Link2, Unlink, Eye, Calendar,
  TrendingUp, TrendingDown, Sparkles, Check, MoreHorizontal,
  BarChart3, Zap, History, Keyboard, Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/micro-interactions';
import { MainLayout } from '@/components/layout/MainLayout';
import { useContasBancarias } from '@/hooks/useFinancialData';
import { useConciliacao } from '@/hooks/useConciliacao';
import { ImportarExtratoDialog } from '@/components/conciliacao/ImportarExtratoDialog';
import { SugestoesMatchIA } from '@/components/conciliacao/SugestoesMatchIA';
import { ConciliacaoManualDialog } from '@/components/conciliacao/ConciliacaoManualDialog';
import { ConciliacaoSplitDialog } from '@/components/conciliacao/ConciliacaoSplitDialog';
import { ConciliacaoDashboard } from '@/components/conciliacao/ConciliacaoDashboard';
import { RegrasConciliacaoPanel } from '@/components/conciliacao/RegrasConciliacaoPanel';
import { ConciliacaoFilters, ConciliacaoFilterState, INITIAL_FILTERS } from '@/components/conciliacao/ConciliacaoFilters';
import { ConciliacaoExport } from '@/components/conciliacao/ConciliacaoExport';
import { ExtratoBancarioPanel } from '@/components/conciliacao/ExtratoBancarioPanel';
import { SessoesConciliacaoPanel } from '@/components/conciliacao/SessoesConciliacaoPanel';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { ExtratoOFX, TransacaoOFX } from '@/lib/ofx-parser';
import { 
  LancamentoSistema, 
  converterContasPagarParaLancamentos, 
  converterContasReceberParaLancamentos 
} from '@/lib/transaction-matcher';
import { useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
}

export default function Conciliacao() {
  const [mainTab, setMainTab] = useState('conciliacao');
  const [statusTab, setStatusTab] = useState('pendentes');
  const [selectedBanco, setSelectedBanco] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [selectedTransacaoManual, setSelectedTransacaoManual] = useState<TransacaoExtrato | null>(null);
  const [selectedTransacaoSplit, setSelectedTransacaoSplit] = useState<TransacaoExtrato | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoExtrato[]>([]);
  const [extratoImportado, setExtratoImportado] = useState<ExtratoOFX | null>(null);
  const [transacoesImportadas, setTransacoesImportadas] = useState<TransacaoOFX[]>([]);
  const [filters, setFilters] = useState<ConciliacaoFilterState>(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Real data
  const { data: contasBancarias } = useContasBancarias();
  const { data: contasPagar } = useContasPagar();
  const { data: contasReceber } = useContasReceber();
  const { confirmarConciliacao } = useConciliacao();

  // Convert to LancamentoSistema
  const lancamentosSistema = useMemo((): LancamentoSistema[] => {
    const lancamentosPagar = contasPagar 
      ? converterContasPagarParaLancamentos(contasPagar.map(cp => ({
          id: cp.id, descricao: cp.descricao, valor: cp.valor,
          data_vencimento: cp.data_vencimento, fornecedor_nome: cp.fornecedor_nome,
          status: cp.status, numero_documento: cp.numero_documento, fornecedores: cp.fornecedores,
        }))) 
      : [];
    const lancamentosReceber = contasReceber 
      ? converterContasReceberParaLancamentos(contasReceber.map(cr => ({
          id: cr.id, descricao: cr.descricao, valor: cr.valor,
          data_vencimento: cr.data_vencimento, cliente_nome: cr.cliente_nome,
          status: cr.status, numero_documento: cr.numero_documento, clientes: cr.clientes,
        }))) 
      : [];
    return [...lancamentosPagar, ...lancamentosReceber];
  }, [contasPagar, contasReceber]);

  // Import handler
  const handleImportSuccess = useCallback((extrato: ExtratoOFX) => {
    const novasTransacoes = extrato.transacoes.map((t: TransacaoOFX) => ({
      id: t.id, data: t.data, descricao: t.descricao,
      valor: t.valor, tipo: t.tipo, conciliada: false,
    }));
    setTransacoes(prev => [...novasTransacoes, ...prev]);
    setTransacoesImportadas(prev => [...extrato.transacoes, ...prev]);
    setExtratoImportado(extrato);
    toast.success(`${extrato.transacoes.length} transações importadas`, {
      description: `Arquivo: ${extrato.nomeArquivo}`,
    });
  }, []);

  // Match handlers
  const handleConfirmarMatch = useCallback((transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    setTransacoes(prev => prev.map(t => t.id === transacaoId ? { ...t, conciliada: true } : t));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
    toast.success('Transação conciliada');
  }, []);

  const handleRejeitarMatch = useCallback((transacaoId: string, lancamentoId: string) => {
    toast.info('Sugestão rejeitada');
  }, []);

  const handleConciliarManual = useCallback((transacaoId: string) => {
    const transacao = transacoes.find(t => t.id === transacaoId);
    if (transacao) { setSelectedTransacaoManual(transacao); setShowManualDialog(true); }
  }, [transacoes]);

  const handleConciliarSplit = useCallback((transacaoId: string) => {
    const transacao = transacoes.find(t => t.id === transacaoId);
    if (transacao) { setSelectedTransacaoSplit(transacao); setShowSplitDialog(true); }
  }, [transacoes]);

  const handleManualSuccess = useCallback((transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    setTransacoes(prev => prev.map(t => t.id === transacaoId ? { ...t, conciliada: true } : t));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
    toast.success('Transação conciliada manualmente');
  }, []);

  const handleConciliar = (id: string) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, conciliada: true } : t));
  };

  const handleIgnorar = (id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  // Bulk actions
  const handleBulkConciliar = useCallback(() => {
    setTransacoes(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, conciliada: true } : t));
    toast.success(`${selectedIds.size} transações conciliadas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkIgnorar = useCallback(() => {
    setTransacoes(prev => prev.filter(t => !selectedIds.has(t.id)));
    toast.success(`${selectedIds.size} transações ignoradas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredTransacoes.filter(t => !t.conciliada).map(t => t.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowImportDialog(true); }
      if (e.key === 'Escape') setSelectedIds(new Set());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // KPIs
  const totalTransacoes = transacoes.length;
  const conciliadas = transacoes.filter(t => t.conciliada).length;
  const pendentes = transacoes.filter(t => !t.conciliada).length;
  const percentualConciliado = totalTransacoes > 0 ? (conciliadas / totalTransacoes) * 100 : 0;

  // Apply filters
  const filteredTransacoes = useMemo(() => transacoes.filter(t => {
    const matchesSearch = t.descricao.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesTab = statusTab === 'todas' || 
      (statusTab === 'pendentes' && !t.conciliada) ||
      (statusTab === 'conciliadas' && t.conciliada);
    
    // Advanced filters
    if (filters.tipo !== 'todos' && t.tipo !== filters.tipo) return false;
    if (filters.periodoInicio) {
      const start = new Date(filters.periodoInicio);
      if (t.data < start) return false;
    }
    if (filters.periodoFim) {
      const end = new Date(filters.periodoFim);
      end.setHours(23, 59, 59);
      if (t.data > end) return false;
    }
    if (filters.valorMin && t.valor < parseFloat(filters.valorMin)) return false;
    if (filters.valorMax && t.valor > parseFloat(filters.valorMax)) return false;

    return matchesSearch && matchesTab;
  }), [transacoes, debouncedSearch, statusTab, filters]);

  // Export data
  const exportData = useMemo(() => ({
    transacoes: transacoes.map(t => ({
      descricao: t.descricao, data: t.data, valor: t.valor,
      tipo: t.tipo, status: t.conciliada ? 'conciliada' : 'pendente',
    })),
    stats: {
      total: totalTransacoes, conciliadas, pendentes,
      percentual: percentualConciliado,
      valorConciliado: transacoes.filter(t => t.conciliada).reduce((s, t) => s + t.valor, 0),
      valorPendente: transacoes.filter(t => !t.conciliada).reduce((s, t) => s + t.valor, 0),
    },
  }), [transacoes, totalTransacoes, conciliadas, pendentes, percentualConciliado]);

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Conciliação Bancária</h1>
            <p className="text-muted-foreground mt-1">Reconcilie transações bancárias com lançamentos do sistema</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedBanco} onValueChange={setSelectedBanco}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {(contasBancarias || []).map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: conta.cor || '#3B82F6' }} />
                      {conta.banco} - {conta.conta}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ConciliacaoExport transacoes={exportData.transacoes} stats={exportData.stats} />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={() => setShowImportDialog(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                >
                  <Upload className="h-4 w-4" />
                  Importar Extrato
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Ctrl+I</p>
              </TooltipContent>
            </Tooltip>

            <ImportarExtratoDialog open={showImportDialog} onOpenChange={setShowImportDialog} onImportSuccess={handleImportSuccess} />
          </div>
        </motion.div>

        {/* Global Progress Bar */}
        {totalTransacoes > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="card-base border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progresso da Conciliação</span>
                  <div className="flex items-center gap-3">
                    <Badge variant={percentualConciliado === 100 ? 'default' : 'secondary'} className={cn(
                      percentualConciliado === 100 && "bg-success text-success-foreground"
                    )}>
                      {percentualConciliado.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {conciliadas}/{totalTransacoes} transações · {pendentes} pendentes
                    </span>
                  </div>
                </div>
                <Progress value={percentualConciliado} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="conciliacao" className="gap-2">
                <Link2 className="h-4 w-4" />
                Conciliação
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="regras" className="gap-2">
                <Zap className="h-4 w-4" />
                Regras
              </TabsTrigger>
              <TabsTrigger value="extrato" className="gap-2">
                <Database className="h-4 w-4" />
                Extrato
              </TabsTrigger>
              <TabsTrigger value="sessoes" className="gap-2">
                <History className="h-4 w-4" />
                Sessões
              </TabsTrigger>
            </TabsList>

            {/* === TAB: CONCILIAÇÃO === */}
            <TabsContent value="conciliacao" className="space-y-4 mt-4">
              {/* Status Tabs + Filters */}
              <Card className="card-base">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <Tabs value={statusTab} onValueChange={setStatusTab}>
                      <TabsList>
                        <TabsTrigger value="pendentes" className="gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Pendentes
                          <Badge variant="secondary" className="ml-1">{pendentes}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="conciliadas" className="gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Conciliadas
                          <Badge variant="secondary" className="ml-1">{conciliadas}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="todas">Todas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <div className="relative flex-1 lg:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar transações..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <ConciliacaoFilters filters={filters} onFiltersChange={setFilters} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Match Suggestions */}
              {transacoesImportadas.length > 0 && lancamentosSistema.length > 0 && (
                <SugestoesMatchIA
                  transacoes={transacoesImportadas}
                  lancamentos={lancamentosSistema}
                  onConfirmarMatch={handleConfirmarMatch}
                  onRejeitarMatch={handleRejeitarMatch}
                  onConciliarManual={handleConciliarManual}
                />
              )}

              {/* Select All */}
              {statusTab === 'pendentes' && filteredTransacoes.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === filteredTransacoes.filter(t => !t.conciliada).length}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selecionadas` : 'Selecionar todas'}
                  </span>
                </div>
              )}

              {/* Transactions List */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredTransacoes.map((transacao, index) => {
                    const isCredito = transacao.tipo === 'credito';
                    const isSelected = selectedIds.has(transacao.id);
                    
                    return (
                      <motion.div
                        key={transacao.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      >
                        <Card className={cn(
                          "card-base transition-all hover:shadow-md",
                          transacao.conciliada && "opacity-70",
                          isSelected && "ring-2 ring-primary/50 bg-primary/5",
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Checkbox for pending */}
                              {!transacao.conciliada && (
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => toggleSelect(transacao.id)}
                                  className="flex-shrink-0"
                                />
                              )}
                              
                              {/* Icon */}
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                              )}>
                                {isCredito ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{formatDate(transacao.data)}</span>
                                </div>
                              </div>

                              {/* Amount */}
                              <p className={cn(
                                "font-bold text-base whitespace-nowrap",
                                isCredito ? "text-success" : "text-destructive"
                              )}>
                                {isCredito ? '+' : ''}{formatCurrency(transacao.valor)}
                              </p>

                              {/* Status Badge */}
                              {transacao.conciliada && (
                                <Badge className="bg-success/10 text-success border-success/20 gap-1 flex-shrink-0">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Conciliada
                                </Badge>
                              )}

                              {/* Actions */}
                              {!transacao.conciliada && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button size="sm" variant="outline" className="gap-1.5 h-8"
                                    onClick={() => handleConciliar(transacao.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                    Conciliar
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => handleConciliarManual(transacao.id)}>
                                        <Link2 className="h-4 w-4" /> Vincular manualmente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="gap-2" onClick={() => handleConciliarSplit(transacao.id)}>
                                        <SplitSquareHorizontal className="h-4 w-4" /> Conciliação parcial
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleIgnorar(transacao.id)}>
                                        <Unlink className="h-4 w-4" /> Ignorar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredTransacoes.length === 0 && (
                  <Card className="card-base">
                    <CardContent className="p-12 text-center">
                      {totalTransacoes === 0 ? (
                        <div className="space-y-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Comece importando um extrato</h3>
                            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                              1. Selecione o banco acima → 2. Clique em "Importar Extrato" → 3. A IA analisa e sugere matches automaticamente
                            </p>
                          </div>
                          <Button onClick={() => setShowImportDialog(true)} className="gap-2">
                            <Upload className="h-4 w-4" /> Importar Extrato
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                          </div>
                          <h3 className="font-semibold text-lg">
                            {statusTab === 'pendentes' ? 'Todas as transações foram conciliadas! 🎉' : 'Nenhuma transação encontrada'}
                          </h3>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* === TAB: DASHBOARD === */}
            <TabsContent value="dashboard" className="space-y-6 mt-4">
              <ConciliacaoDashboard />
              
              {/* Inline summary KPIs for imported batch */}
              {totalTransacoes > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="stat-card group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Importação Atual</p>
                          <p className="text-2xl font-bold font-display mt-1">{totalTransacoes}</p>
                          <p className="text-xs text-muted-foreground mt-1">transações no lote</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <FileText className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stat-card group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Conciliadas (Lote)</p>
                          <p className="text-2xl font-bold font-display mt-1 text-success">{conciliadas}</p>
                          <Progress value={percentualConciliado} className="h-1.5 mt-2 w-24" />
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stat-card group border-warning/50">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pendentes (Lote)</p>
                          <p className="text-2xl font-bold font-display mt-1 text-warning">{pendentes}</p>
                          <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* === TAB: REGRAS === */}
            <TabsContent value="regras" className="mt-4">
              <RegrasConciliacaoPanel />
            </TabsContent>

            <TabsContent value="extrato" className="mt-4">
              <ExtratoBancarioPanel contaBancariaId={selectedBanco || undefined} />
            </TabsContent>

            <TabsContent value="sessoes" className="mt-4">
              <SessoesConciliacaoPanel />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                id: 'conciliar',
                label: `Conciliar (${selectedIds.size})`,
                icon: <Check className="h-4 w-4" />,
                onClick: handleBulkConciliar,
              },
              {
                id: 'ignorar',
                label: 'Ignorar',
                icon: <Unlink className="h-4 w-4" />,
                variant: 'destructive' as const,
                onClick: handleBulkIgnorar,
              },
            ]}
          />
        )}

        {/* Dialogs */}
        <ConciliacaoManualDialog
          open={showManualDialog}
          onOpenChange={setShowManualDialog}
          transacao={selectedTransacaoManual}
          lancamentos={lancamentosSistema}
          onSuccess={handleManualSuccess}
        />
        <ConciliacaoSplitDialog
          open={showSplitDialog}
          onOpenChange={setShowSplitDialog}
          transacao={selectedTransacaoSplit}
          lancamentos={lancamentosSistema}
          onSuccess={() => {
            if (selectedTransacaoSplit) {
              setTransacoes(prev => prev.map(t => 
                t.id === selectedTransacaoSplit.id ? { ...t, conciliada: true } : t
              ));
            }
          }}
        />
      </motion.div>
    </MainLayout>
  );
}
