import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { InteractivePageWrapper, PrimaryActionButton, useCelebrations, KPICard } from '@/components/wrappers';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Link2,
  Unlink,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/micro-interactions';
import { MainLayout } from '@/components/layout/MainLayout';
import { useContasBancarias } from '@/hooks/useFinancialData';
import { useConciliacao } from '@/hooks/useConciliacao';
import { ImportarExtratoDialog } from '@/components/conciliacao/ImportarExtratoDialog';
import { SugestoesMatchIA } from '@/components/conciliacao/SugestoesMatchIA';
import { ConciliacaoManualDialog } from '@/components/conciliacao/ConciliacaoManualDialog';
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
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
  const [activeTab, setActiveTab] = useState('pendentes');
  const [selectedBanco, setSelectedBanco] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [selectedTransacaoManual, setSelectedTransacaoManual] = useState<TransacaoExtrato | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoExtrato[]>([]);
  const [extratoImportado, setExtratoImportado] = useState<ExtratoOFX | null>(null);
  const [transacoesImportadas, setTransacoesImportadas] = useState<TransacaoOFX[]>([]);

  // Fetch real data
  const { data: contasBancarias } = useContasBancarias();
  const { data: contasPagar } = useContasPagar();
  const { data: contasReceber } = useContasReceber();
  const { confirmarConciliacao } = useConciliacao();

  // Convert to LancamentoSistema format for matching
  const lancamentosSistema = useMemo((): LancamentoSistema[] => {
    const lancamentosPagar = contasPagar 
      ? converterContasPagarParaLancamentos(contasPagar as any) 
      : [];
    const lancamentosReceber = contasReceber 
      ? converterContasReceberParaLancamentos(contasReceber as any) 
      : [];
    return [...lancamentosPagar, ...lancamentosReceber];
  }, [contasPagar, contasReceber]);

  // Handle import from OFX/OFC/CSV
  const handleImportSuccess = useCallback((extrato: ExtratoOFX) => {
    // Convert imported transactions to the format used in the page
    const novasTransacoes = extrato.transacoes.map((t: TransacaoOFX) => ({
      id: t.id,
      data: t.data,
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      conciliada: false,
    }));

    setTransacoes(prev => [...novasTransacoes, ...prev]);
    setTransacoesImportadas(prev => [...extrato.transacoes, ...prev]);
    setExtratoImportado(extrato);
    
    toast.success(`${extrato.transacoes.length} transações importadas`, {
      description: `Arquivo: ${extrato.nomeArquivo}`,
    });
  }, []);

  // Handle match confirmation from AI suggestions
  const handleConfirmarMatch = useCallback((transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    setTransacoes(prev => prev.map(t => 
      t.id === transacaoId ? { ...t, conciliada: true } : t
    ));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
    
    toast.success('Transação conciliada', {
      description: `Vinculada ao lançamento de ${tipo === 'pagar' ? 'contas a pagar' : 'contas a receber'}`,
    });
  }, []);

  const handleRejeitarMatch = useCallback((transacaoId: string, lancamentoId: string) => {
    // Just removes from suggestions, keeps transaction pending
    toast.info('Sugestão rejeitada', {
      description: 'A transação permanece pendente para conciliação manual',
    });
  }, []);

  const handleConciliarManual = useCallback((transacaoId: string) => {
    const transacao = transacoes.find(t => t.id === transacaoId);
    if (transacao) {
      setSelectedTransacaoManual(transacao);
      setShowManualDialog(true);
    }
  }, [transacoes]);

  const handleManualSuccess = useCallback((transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    setTransacoes(prev => prev.map(t => 
      t.id === transacaoId ? { ...t, conciliada: true } : t
    ));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
    
    toast.success('Transação conciliada manualmente', {
      description: `Vinculada ao lançamento de ${tipo === 'pagar' ? 'contas a pagar' : 'contas a receber'}`,
    });
  }, []);

  // Conciliar transação
  const handleConciliar = (extratoId: string) => {
    setTransacoes(prev => prev.map(t => 
      t.id === extratoId ? { ...t, conciliada: true } : t
    ));
  };

  // Ignorar transação
  const handleIgnorar = (extratoId: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== extratoId));
  };

  // KPIs
  const totalTransacoes = transacoes.length;
  const conciliadas = transacoes.filter(t => t.conciliada).length;
  const pendentes = transacoes.filter(t => !t.conciliada).length;
  const percentualConciliado = totalTransacoes > 0 ? (conciliadas / totalTransacoes) * 100 : 0;
  const sugestoesDisponiveis = transacoesImportadas.filter(t => !transacoes.find(tr => tr.id === t.id)?.conciliada).length;

  const filteredTransacoes = useMemo(() => transacoes.filter(t => {
    const matchesSearch = t.descricao.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesTab = activeTab === 'todas' || 
      (activeTab === 'pendentes' && !t.conciliada) ||
      (activeTab === 'conciliadas' && t.conciliada);
    return matchesSearch && matchesTab;
  }), [transacoes, debouncedSearch, activeTab]);

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Conciliação Bancária</h1>
            <p className="text-muted-foreground mt-1">Reconcilie transações bancárias com lançamentos do sistema</p>
          </div>
          <div className="flex items-center gap-3">
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
            
<>
              <Button 
                size="sm" 
                onClick={() => setShowImportDialog(true)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              >
                <Upload className="h-4 w-4" />
                Importar Extrato
              </Button>
              
              <ImportarExtratoDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onImportSuccess={handleImportSuccess}
              />
            </>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transações</p>
                  <p className="text-2xl font-bold font-display mt-1">{totalTransacoes}</p>
                  <p className="text-xs text-muted-foreground mt-1">No período</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conciliadas</p>
                  <p className="text-2xl font-bold font-display mt-1 text-success">{conciliadas}</p>
                  <Progress value={percentualConciliado} className="h-1.5 mt-2 w-24" />
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group border-warning/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold font-display mt-1 text-warning">{pendentes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Aguardando análise</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sugestões IA</p>
                  <p className="text-2xl font-bold font-display mt-1 text-accent">{sugestoesDisponiveis}</p>
                  <p className="text-xs text-accent mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Match automático
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center transition-transform group-hover:scale-110">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters & Tabs */}
        <motion.div variants={itemVariants}>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="pendentes" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Pendentes
                      <Badge variant="secondary" className="ml-1">{pendentes}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="conciliadas" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Conciliadas
                    </TabsTrigger>
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar transações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Match Suggestions */}
        {transacoesImportadas.length > 0 && lancamentosSistema.length > 0 && (
          <motion.div variants={itemVariants}>
            <SugestoesMatchIA
              transacoes={transacoesImportadas}
              lancamentos={lancamentosSistema}
              onConfirmarMatch={handleConfirmarMatch}
              onRejeitarMatch={handleRejeitarMatch}
              onConciliarManual={handleConciliarManual}
            />
          </motion.div>
        )}

        {/* Transactions List */}
        <motion.div variants={itemVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransacoes.map((transacao, index) => {
              const isCredito = transacao.tipo === 'credito';
              
              return (
                <motion.div
                  key={transacao.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={cn(
                    "card-base transition-all hover:shadow-md",
                    transacao.conciliada && "opacity-75"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Transação do Extrato */}
                        <div className="flex-1 flex items-start gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {isCredito ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(transacao.data)}
                                  </span>
                                </div>
                              </div>
                              <p className={cn(
                                "font-bold text-lg whitespace-nowrap",
                                isCredito ? "text-success" : "text-destructive"
                              )}>
                                {isCredito ? '+' : ''}{formatCurrency(transacao.valor)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {transacao.conciliada && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Conciliada
                            </Badge>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 lg:ml-4">
                          {!transacao.conciliada && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleConciliar(transacao.id)}
                              >
                                <Check className="h-4 w-4" />
                                Conciliar
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-9 w-9">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2">
                                    <Link2 className="h-4 w-4" />
                                    Vincular manualmente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="gap-2 text-destructive"
                                    onClick={() => handleIgnorar(transacao.id)}
                                  >
                                    <Unlink className="h-4 w-4" />
                                    Ignorar transação
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
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
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Nenhuma transação encontrada</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === 'pendentes' 
                    ? 'Todas as transações foram conciliadas!' 
                    : 'Não há transações para exibir'}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Dialog de Conciliação Manual */}
        <ConciliacaoManualDialog
          open={showManualDialog}
          onOpenChange={setShowManualDialog}
          transacao={selectedTransacaoManual}
          lancamentos={lancamentosSistema}
          onSuccess={handleManualSuccess}
        />
      </motion.div>
    </MainLayout>
  );
}
