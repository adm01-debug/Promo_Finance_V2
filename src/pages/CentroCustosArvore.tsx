import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Target,
  PieChart,
  Search,
  FolderTree,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CentroCusto } from '@/hooks/useCentrosCusto';
import { CentroCustoTree } from '@/components/centros-custo/CentroCustoTree';
import { CentroCustoExport } from '@/components/centros-custo/CentroCustoExport';
import { CentroCustoCards } from './centro-custos/CentroCustoCards';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/micro-interactions';
import { containerVariants, itemVariants } from './CentroCustos.helpers';
import { CentroCustosArvoreOrcadoVsRealizado } from './CentroCustosArvoreOrcadoVsRealizado';

interface CentroCustosArvoreProps {
  viewMode: 'cards' | 'tree';
  setViewMode: import('react').Dispatch<import('react').SetStateAction<'cards' | 'tree'>>;
  centros: {
    ativo: boolean | null;
    codigo: string | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    orcamento_previsto: number | null;
    orcamento_realizado: number | null;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  setShowInactive: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  showInactive: boolean;
  handleOpenCreate: (parentId?: string) => void;
  searchTerm: string;
  setSearchTerm: import('react').Dispatch<import('react').SetStateAction<string>>;
  totalOrcado: number;
  totalRealizado: number;
  percentualGasto: number;
  saldoDisponivel: number;
  activeCentros: {
    codigo: string;
    orcamento_previsto: number;
    orcamento_realizado: number;
    ativo: boolean | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  barData: { nome: string; Orçado: number; Realizado: number }[];
  distribuicao: { nome: string; valor: number; percentual: number }[];
  filteredCentros: {
    codigo: string;
    orcamento_previsto: number;
    orcamento_realizado: number;
    ativo: boolean | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  handleOpenEdit: (centro: CentroCusto) => void;
  handleDelete: (centro: CentroCusto) => Promise<void>;
  handleReactivate: (centro: CentroCusto) => Promise<void>;
  setHistoryCentro: import('react').Dispatch<
    import('react').SetStateAction<{
      ativo: boolean | null;
      codigo: string | null;
      created_at: string | null;
      descricao: string | null;
      empresa_id: string | null;
      id: string;
      nome: string;
      orcamento_previsto: number | null;
      orcamento_realizado: number | null;
      parent_id: string | null;
      responsavel: string | null;
      tipo: string | null;
      updated_at: string | null;
      user_id: string | null;
    }>
  >;
}

export function CentroCustosArvore({
  viewMode,
  setViewMode,
  centros,
  setShowInactive,
  showInactive,
  handleOpenCreate,
  searchTerm,
  setSearchTerm,
  totalOrcado,
  totalRealizado,
  percentualGasto,
  saldoDisponivel,
  activeCentros,
  barData,
  distribuicao,
  filteredCentros,
  handleOpenEdit,
  handleDelete,
  handleReactivate,
  setHistoryCentro,
}: CentroCustosArvoreProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-display-md text-foreground">Centro de Custos</h1>
          <p className="text-muted-foreground mt-1">
            Controle orçamentário e análise de custos por departamento
          </p>
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

      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="stat-card group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                <p className="text-2xl font-bold font-display mt-1">
                  {formatCurrency(totalOrcado)}
                </p>
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
                <p className="text-2xl font-bold font-display mt-1">
                  {formatCurrency(totalRealizado)}
                </p>
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
                <p
                  className={cn(
                    'text-2xl font-bold font-display mt-1',
                    saldoDisponivel < 0 ? 'text-destructive' : 'text-success'
                  )}
                >
                  {formatCurrency(saldoDisponivel)}
                </p>
                <div className="mt-2 w-full">
                  <Progress value={percentualGasto > 100 ? 100 : percentualGasto} className="h-2" />
                </div>
              </div>
              <div
                className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                  saldoDisponivel < 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-success/10 text-success'
                )}
              >
                {saldoDisponivel < 0 ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
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
                  {activeCentros.filter((c) => c.orcamento_realizado > c.orcamento_previsto).length}{' '}
                  acima do orçamento
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center transition-transform group-hover:scale-110">
                <PieChart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      {activeCentros.length > 0 && (
        <CentroCustosArvoreOrcadoVsRealizado barData={barData} distribuicao={distribuicao} />
      )}

      {/* List */}
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
              onHistory={(centro) => setHistoryCentro(centro)}
            />
          </Card>
        ) : filteredCentros.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="h-8 w-8 text-muted-foreground" />}
            title={
              searchTerm ? 'Nenhum centro de custo encontrado' : 'Nenhum centro de custo cadastrado'
            }
            description="Crie seu primeiro centro de custo para organizar despesas e receitas."
            action={
              <Button onClick={() => handleOpenCreate()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Centro de Custo
              </Button>
            }
          />
        ) : (
          <CentroCustoCards
            filteredCentros={filteredCentros}
            allCentros={centros}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
