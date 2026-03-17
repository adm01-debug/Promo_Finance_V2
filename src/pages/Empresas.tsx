import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, MoreVertical, Edit,
  CheckCircle2, XCircle, FileText, CreditCard,
  TrendingUp, TrendingDown, Users, Copy, Wallet,
  ArrowUpRight, ArrowDownRight, LayoutGrid, List,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useContasBancarias, useContasReceber, useContasPagar } from '@/hooks/useFinancialData';
import { useAllEmpresas, useExcluirEmpresa, useReativarEmpresa, type Empresa } from '@/hooks/useEmpresas';
import { EmpresaForm } from '@/components/empresas/EmpresaForm';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
} as const;

export default function Empresas() {
  const { data: empresas = [], isLoading } = useAllEmpresas();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: contasReceber = [] } = useContasReceber();
  const { data: contasPagar = [] } = useContasPagar();
  const excluirEmpresa = useExcluirEmpresa();
  const reativarEmpresa = useReativarEmpresa();

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const { toast } = useToast();

  const empresasFiltradas = useMemo(() => empresas.filter(e =>
    e.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    e.cnpj.includes(searchTerm)
  ), [empresas, searchTerm]);

  const getEmpresaStats = (empresaId: string) => {
    const contas = contasBancarias.filter(c => c.empresa_id === empresaId);
    const receber = contasReceber.filter(c => c.empresa_id === empresaId);
    const pagar = contasPagar.filter(c => c.empresa_id === empresaId);
    return {
      saldoTotal: contas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0),
      contasBancarias: contas.length,
      aReceber: receber.reduce((acc, c) => acc + (c.valor || 0), 0),
      aPagar: pagar.reduce((acc, c) => acc + (c.valor || 0), 0),
      titulosReceber: receber.length,
      titulosPagar: pagar.length,
    };
  };

  const consolidado = useMemo(() => ({
    saldoTotal: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).saldoTotal, 0),
    totalReceber: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aReceber, 0),
    totalPagar: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aPagar, 0),
    empresasAtivas: empresas.filter(e => e.ativo).length,
    titulosPendentesReceber: contasReceber.filter(c => c.status === 'pendente').length,
    titulosPendentesPagar: contasPagar.filter(c => c.status === 'pendente').length,
  }), [empresas, contasBancarias, contasReceber, contasPagar]);

  const saldoLiquido = consolidado.saldoTotal + consolidado.totalReceber - consolidado.totalPagar;

  const formatCNPJ = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14) {
      return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "CNPJ copiado para a área de transferência" });
  };

  const handleOpenDialog = (empresa?: Empresa) => {
    setEditingEmpresa(empresa || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmpresa(null);
  };

  const handleFormSuccess = () => handleCloseDialog();

  const handleToggleAtivo = async (empresa: Empresa) => {
    if (empresa.ativo) {
      setEmpresaToDelete(empresa);
      setDeleteConfirmOpen(true);
    } else {
      await reativarEmpresa.mutateAsync(empresa.id);
    }
  };

  const handleConfirmDelete = async () => {
    if (empresaToDelete) {
      const empresaBackup = { ...empresaToDelete };
      setDeleteConfirmOpen(false);
      setEmpresaToDelete(null);
      toastDeleteWithUndo({
        item: empresaBackup,
        itemName: `Empresa "${empresaBackup.nome_fantasia || empresaBackup.razao_social}"`,
        onDelete: async () => { await excluirEmpresa.mutateAsync(empresaBackup.id); },
        onRestore: async () => { await reativarEmpresa.mutateAsync(empresaBackup.id); },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Empresas</h1>
            <p className="text-muted-foreground">Gerencie múltiplas empresas e consolide dados financeiros</p>
          </div>
        </div>
        <Card><TableShimmerSkeleton rows={6} columns={7} /></Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-1"
    >
      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</DialogTitle>
          </DialogHeader>
          <EmpresaForm empresa={editingEmpresa} onSuccess={handleFormSuccess} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Desativar Empresa"
        description={`Tem certeza que deseja desativar a empresa "${empresaToDelete?.nome_fantasia || empresaToDelete?.razao_social}"? Os dados serão mantidos.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Desativar"
        variant="danger"
      />

      {/* ═══════════════════════════════════════════════════════════
          HEADER — Title + CTA
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">Empresas</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seus CNPJs e acompanhe a saúde financeira de cada unidade
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          KPI BENTO GRID — 5 columns on desktop
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Hero KPI — Saldo Consolidado (spans 2 cols on mobile, 1 on desktop) */}
        <Card className="card-base relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Consolidado</p>
              <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-display text-foreground leading-none">
              {formatCurrency(consolidado.saldoTotal)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                saldoLiquido >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              )}>
                {saldoLiquido >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                Líq. {formatCurrency(saldoLiquido)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card className="card-base group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">A Receber</p>
              <div className="h-9 w-9 rounded-lg bg-success/15 text-success flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-display text-success leading-none">
              {formatCurrency(consolidado.totalReceber)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              <span className="font-semibold text-foreground/70">{consolidado.titulosPendentesReceber}</span> títulos pendentes
            </p>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card className="card-base group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">A Pagar</p>
              <div className="h-9 w-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-display text-destructive leading-none">
              {formatCurrency(consolidado.totalPagar)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              <span className="font-semibold text-foreground/70">{consolidado.titulosPendentesPagar}</span> títulos pendentes
            </p>
          </CardContent>
        </Card>

        {/* Empresas Ativas */}
        <Card className="card-base group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Ativas</p>
              <div className="h-9 w-9 rounded-lg bg-accent/40 text-accent-foreground flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold font-display text-foreground leading-none">
                {consolidado.empresasAtivas}
              </p>
              <span className="text-sm text-muted-foreground font-medium">/ {empresas.length}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">empresas cadastradas</p>
          </CardContent>
        </Card>

        {/* Quick Add — Mini CTA card */}
        <Card
          className="card-base border-dashed border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group hidden lg:flex"
          onClick={() => handleOpenDialog()}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center mb-2 transition-all group-hover:bg-primary/15 group-hover:scale-110">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
              Novo CNPJ
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          SEARCH + VIEW TOGGLE
      ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNPJ, razão social ou nome fantasia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card border-border/60 focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            className={cn("gap-1.5 h-8", viewMode === 'cards' && "shadow-sm")}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className={cn("gap-1.5 h-8", viewMode === 'table' && "shadow-sm")}
            onClick={() => setViewMode('table')}
          >
            <List className="h-3.5 w-3.5" />
            Tabela
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          EMPTY STATE
      ═══════════════════════════════════════════════════════════ */}
      {empresasFiltradas.length === 0 && !isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="card-base border-dashed border-2">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-5">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma empresa cadastrada'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                {searchTerm
                  ? `Não encontramos empresas para "${searchTerm}". Tente ajustar os termos.`
                  : 'Comece cadastrando sua primeira empresa para gerenciar as finanças por CNPJ.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenDialog()} className="gap-2 mt-6" size="lg">
                  <Plus className="h-4 w-4" /> Cadastrar Primeira Empresa
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CARDS VIEW
      ═══════════════════════════════════════════════════════════ */}
      {viewMode === 'cards' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {empresasFiltradas.map((empresa) => {
              const stats = getEmpresaStats(empresa.id);
              const isSelected = selectedEmpresa === empresa.id;
              const saldoEmpresa = stats.saldoTotal + stats.aReceber - stats.aPagar;

              return (
                <StaggerItem key={empresa.id}>
                  <Card className={cn(
                    "card-base relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
                    !empresa.ativo && "opacity-50 grayscale-[30%]",
                    isSelected && "ring-2 ring-primary shadow-primary/10 shadow-lg"
                  )}>
                    {/* Top accent bar */}
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-[3px]",
                      empresa.ativo
                        ? saldoEmpresa >= 0 ? "bg-gradient-to-r from-success via-success/80 to-success/40" : "bg-gradient-to-r from-warning via-warning/80 to-warning/40"
                        : "bg-muted-foreground/20"
                    )} />

                    <CardHeader className="pb-2 pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold",
                            empresa.ativo
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold truncate leading-tight">
                              {empresa.nome_fantasia || empresa.razao_social}
                            </CardTitle>
                            {empresa.nome_fantasia && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {empresa.razao_social}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar Contexto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" /> Ver Documentos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleAtivo(empresa)}
                              className={empresa.ativo ? "text-destructive" : "text-success"}
                            >
                              {empresa.ativo ? (
                                <><XCircle className="h-4 w-4 mr-2" /> Desativar</>
                              ) : (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Ativar</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-4">
                      {/* CNPJ + Status pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] cursor-pointer hover:bg-muted transition-colors gap-1 px-2 py-0.5"
                          onClick={() => copyToClipboard(empresa.cnpj)}
                        >
                          {formatCNPJ(empresa.cnpj)}
                          <Copy className="h-2.5 w-2.5" />
                        </Badge>
                        <Badge
                          variant={empresa.ativo ? "default" : "secondary"}
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            empresa.ativo && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                          )}
                        >
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>

                      {/* Financial mini-grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-success/8 dark:bg-success/10 border border-success/10">
                          <div className="flex items-center gap-1 mb-1">
                            <ArrowUpRight className="h-3 w-3 text-success" />
                            <span className="text-[10px] font-medium text-muted-foreground">Receber</span>
                          </div>
                          <p className="text-sm font-bold text-success">{formatCurrency(stats.aReceber)}</p>
                          <p className="text-[10px] text-muted-foreground">{stats.titulosReceber} título{stats.titulosReceber !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-destructive/8 dark:bg-destructive/10 border border-destructive/10">
                          <div className="flex items-center gap-1 mb-1">
                            <ArrowDownRight className="h-3 w-3 text-destructive" />
                            <span className="text-[10px] font-medium text-muted-foreground">Pagar</span>
                          </div>
                          <p className="text-sm font-bold text-destructive">{formatCurrency(stats.aPagar)}</p>
                          <p className="text-[10px] text-muted-foreground">{stats.titulosPagar} título{stats.titulosPagar !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Footer — bank accounts + balance */}
                      <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          <span className="text-[11px] font-medium">
                            {stats.contasBancarias} conta{stats.contasBancarias !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm font-bold",
                          stats.saldoTotal >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {formatCurrency(stats.saldoTotal)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}

            {/* Add New Card — visible only in cards view */}
            <StaggerItem>
              <Card
                className="card-base border-dashed border-2 border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[260px] flex items-center justify-center group"
                onClick={() => handleOpenDialog()}
              >
                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3 transition-all group-hover:bg-primary/15 group-hover:scale-110">
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">Nova Empresa</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Cadastre um novo CNPJ</p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TABLE VIEW
      ═══════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="card-base overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Empresa</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">CNPJ</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Saldo</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">A Receber</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">A Pagar</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresasFiltradas.map((empresa) => {
                  const stats = getEmpresaStats(empresa.id);
                  return (
                    <TableRow
                      key={empresa.id}
                      className={cn(
                        "transition-colors",
                        !empresa.ativo && "opacity-50",
                        selectedEmpresa === empresa.id && "bg-primary/5"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold",
                            empresa.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {(empresa.nome_fantasia || empresa.razao_social).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{empresa.nome_fantasia || empresa.razao_social}</p>
                            {empresa.nome_fantasia && (
                              <p className="text-[11px] text-muted-foreground">{empresa.razao_social}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(empresa.cnpj)}>
                          {formatCNPJ(empresa.cnpj)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={empresa.ativo ? "default" : "secondary"}
                          className={cn("text-[10px]", empresa.ativo && "bg-success/15 text-success border-success/30")}
                        >
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold text-sm", stats.saldoTotal >= 0 ? "text-foreground" : "text-destructive")}>
                        {formatCurrency(stats.saldoTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-success">
                        {formatCurrency(stats.aReceber)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm text-destructive">
                        {formatCurrency(stats.aPagar)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Selecionar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleAtivo(empresa)}
                              className={empresa.ativo ? "text-destructive" : "text-success"}
                            >
                              {empresa.ativo ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CONTEXTO SELECIONADO — Sticky bar
      ═══════════════════════════════════════════════════════════ */}
      {selectedEmpresa && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="card-base border-primary/30 bg-primary/5">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contexto Ativo</p>
                    <p className="text-sm font-bold text-foreground">
                      {empresas.find(e => e.id === selectedEmpresa)?.nome_fantasia || empresas.find(e => e.id === selectedEmpresa)?.razao_social}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedEmpresa(null)} className="text-xs">
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
