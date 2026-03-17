import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Loader2,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronRight,
  FolderTree,
  LayoutGrid,
  List,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useAllCentrosCusto,
  useExcluirCentroCusto,
  useReativarCentroCusto,
  type CentroCusto,
} from '@/hooks/useCentrosCusto';
import { CentroCustoTree } from '@/components/centros-custo/CentroCustoTree';
import { CentroCustoForm } from '@/components/centros-custo/CentroCustoForm';
import { CentroCustoExport } from '@/components/centros-custo/CentroCustoExport';
import { CentroCustoHistorico } from '@/components/centros-custo/CentroCustoHistorico';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { toastWithUndo } from '@/lib/toast-with-undo';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

// Get parent name
function getParentName(parentId: string | null, centros: CentroCusto[]): string {
  if (!parentId) return '';
  const parent = centros.find((c) => c.id === parentId);
  return parent ? `${parent.codigo} - ${parent.nome}` : '';
}

export default function CentroCustos() {
  const { data: centros = [], isLoading } = useAllCentrosCusto();
  const excluirCentroCusto = useExcluirCentroCusto();
  const reativarCentroCusto = useReativarCentroCusto();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('tree');
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [historyCentro, setHistoryCentro] = useState<CentroCusto | null>(null);
  // Filtered data
  const filteredCentros = useMemo(() => {
    return centros.filter((c) => {
      const matchesSearch =
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive = showInactive || c.ativo;
      return matchesSearch && matchesActive;
    });
  }, [centros, searchTerm, showInactive]);

  const activeCentros = centros.filter((c) => c.ativo);

  // KPIs
  const totalOrcado = activeCentros.reduce((sum, c) => sum + c.orcamento_previsto, 0);
  const totalRealizado = activeCentros.reduce((sum, c) => sum + c.orcamento_realizado, 0);
  const percentualGasto = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;
  const saldoDisponivel = totalOrcado - totalRealizado;

  // Chart data
  const barData = activeCentros.slice(0, 8).map((c) => ({
    nome: c.codigo,
    Orçado: c.orcamento_previsto,
    Realizado: c.orcamento_realizado,
  }));

  const distribuicao = activeCentros.map((c) => ({
    nome: c.nome,
    valor: c.orcamento_realizado,
    percentual: totalRealizado > 0 ? (c.orcamento_realizado / totalRealizado) * 100 : 0,
  }));

  // Budget threshold alerts
  useEffect(() => {
    if (activeCentros.length === 0) return;
    const alertsShown = sessionStorage.getItem('cc_alerts_shown');
    if (alertsShown) return;

    const overBudget = activeCentros.filter(c => c.orcamento_previsto > 0 && c.orcamento_realizado > c.orcamento_previsto);
    const near100 = activeCentros.filter(c => {
      const pct = c.orcamento_previsto > 0 ? (c.orcamento_realizado / c.orcamento_previsto) * 100 : 0;
      return pct >= 90 && pct <= 100;
    });
    const near80 = activeCentros.filter(c => {
      const pct = c.orcamento_previsto > 0 ? (c.orcamento_realizado / c.orcamento_previsto) * 100 : 0;
      return pct >= 80 && pct < 90;
    });

    if (overBudget.length > 0) {
      toast.error(`🚨 ${overBudget.length} centro(s) estouraram o orçamento!`, {
        description: overBudget.map(c => c.nome).join(', '),
        duration: 8000,
      });
    }
    if (near100.length > 0) {
      toast.warning(`⚠️ ${near100.length} centro(s) acima de 90% do orçamento`, {
        description: near100.map(c => c.nome).join(', '),
        duration: 6000,
      });
    }
    if (near80.length > 0) {
      toast.info(`📊 ${near80.length} centro(s) acima de 80% do orçamento`, {
        description: near80.map(c => c.nome).join(', '),
        duration: 5000,
      });
    }

    if (overBudget.length > 0 || near100.length > 0 || near80.length > 0) {
      sessionStorage.setItem('cc_alerts_shown', 'true');
    }
  }, [activeCentros]);

  const handleOpenCreate = (parentId?: string) => {
    setEditingCentro(null);
    setParentIdForNew(parentId || null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (centro: CentroCusto) => {
    setEditingCentro(centro);
    setParentIdForNew(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (centro: CentroCusto) => {
    // Desativa imediatamente
    await excluirCentroCusto.mutateAsync(centro.id);
    
    // Mostra toast com opção de desfazer
    toastWithUndo({
      title: `"${centro.nome}" desativado`,
      description: 'O centro de custo foi desativado.',
      onUndo: async () => {
        await reativarCentroCusto.mutateAsync(centro.id);
      },
    });
  };

  const handleReactivate = async (centro: CentroCusto) => {
    await reativarCentroCusto.mutateAsync(centro.id);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCentro(null);
    setParentIdForNew(null);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Centro de Custos</h1>
            <p className="text-muted-foreground mt-1">Controle orçamentário e análise de custos por departamento</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'tree')}>
              <TabsList className="h-9">
                <TabsTrigger value="tree" className="gap-1.5 px-3">
                  <List className="h-4 w-4" />
                  Árvore
                </TabsTrigger>
                <TabsTrigger value="cards" className="gap-1.5 px-3">
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <CentroCustoExport centros={centros} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className={cn(showInactive && 'bg-muted')}
            >
              {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
            </Button>
            <Button
              size="sm"
              onClick={() => handleOpenCreate()}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            >
              <Plus className="h-4 w-4" />
              Novo Centro
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalOrcado)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Período atual</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Realizado</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalRealizado)}</p>
                  <div className="flex items-center gap-1 text-sm font-medium mt-1">
                    <span className={cn(percentualGasto > 100 ? 'text-destructive' : 'text-success')}>
                      {percentualGasto.toFixed(1)}% do orçamento
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
                  <p className={cn('text-2xl font-bold font-display mt-1', saldoDisponivel < 0 ? 'text-destructive' : 'text-success')}>
                    {formatCurrency(saldoDisponivel)}
                  </p>
                  <div className="mt-2 w-full">
                    <Progress value={percentualGasto > 100 ? 100 : percentualGasto} className="h-2" />
                  </div>
                </div>
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                    saldoDisponivel < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                  )}
                >
                  {saldoDisponivel < 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Centros Ativos</p>
                  <p className="text-2xl font-bold font-display mt-1">{activeCentros.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCentros.filter((c) => c.orcamento_realizado > c.orcamento_previsto).length} acima do orçamento
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center transition-transform group-hover:scale-110">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        {activeCentros.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="card-elevated h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Orçado vs Realizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="nome" width={50} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Centro: ${l}`} />
                      <Legend />
                      <Bar dataKey="Orçado" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Realizado" fill="hsl(24, 95%, 46%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="card-elevated h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Distribuição
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="75%">
                    <RePieChart>
                      <Pie
                        data={distribuicao}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {distribuicao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {distribuicao.slice(0, 3).map((item, i) => (
                      <Badge key={item.nome} variant="outline" className="text-xs">
                        <span className="h-2 w-2 rounded-full mr-1" style={{ background: COLORS[i] }} />
                        {item.nome} ({item.percentual.toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Centro de Custos - Tree or Cards View */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Detalhamento por Centro
          </h2>

          {viewMode === 'tree' ? (
            <Card className="p-4">
              <CentroCustoTree
                centros={filteredCentros}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
                onAddChild={(parentId) => handleOpenCreate(parentId)}
              />
            </Card>
          ) : filteredCentros.length === 0 ? (
            <EmptyState
              icon={<FolderTree className="h-8 w-8 text-muted-foreground" />}
              title={searchTerm ? 'Nenhum centro de custo encontrado' : 'Nenhum centro de custo cadastrado'}
              description="Crie seu primeiro centro de custo para organizar despesas e receitas."
              action={
                <Button onClick={() => handleOpenCreate()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Centro de Custo
                </Button>
              }
            />
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCentros.map((centro, index) => {
                const percentual =
                  centro.orcamento_previsto > 0 ? (centro.orcamento_realizado / centro.orcamento_previsto) * 100 : 0;
                const diferenca = centro.orcamento_realizado - centro.orcamento_previsto;
                const isOver = diferenca > 0;
                const parentName = getParentName(centro.parent_id, centros);

                return (
                  <StaggerItem key={centro.id}>
                    <Card className={cn('card-interactive h-full', !centro.ativo && 'opacity-60')}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{
                                background: `${COLORS[index % COLORS.length]}20`,
                                color: COLORS[index % COLORS.length],
                              }}
                            >
                              <span className="font-bold text-sm">{centro.codigo}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{centro.nome}</h3>
                                {!centro.ativo && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                              {parentName && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3 w-3" />
                                  {parentName}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">{centro.descricao || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(centro)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {centro.ativo ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(centro)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:text-success"
                                onClick={() => handleReactivate(centro)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Orçado</span>
                            <span className="font-medium">{formatCurrency(centro.orcamento_previsto)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Realizado</span>
                            <span className={cn('font-medium', isOver ? 'text-destructive' : 'text-success')}>
                              {formatCurrency(centro.orcamento_realizado)}
                            </span>
                          </div>
                          <Progress value={percentual > 100 ? 100 : percentual} className={cn('h-2', isOver && '[&>div]:bg-destructive')} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{percentual.toFixed(1)}% utilizado</span>
                            <span className={cn(isOver ? 'text-destructive' : 'text-success')}>
                              {isOver ? '+' : ''}
                              {formatCurrency(diferenca)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </motion.div>
      </motion.div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCentro ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
          </DialogHeader>
          <CentroCustoForm
            centroCusto={editingCentro}
            centrosCusto={centros}
            defaultParentId={parentIdForNew}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}
