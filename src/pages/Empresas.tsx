import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, MoreVertical, Edit,
  CheckCircle2, XCircle, FileText, CreditCard,
  TrendingUp, TrendingDown, Users, Copy, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
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
  }), [empresas, contasBancarias, contasReceber, contasPagar]);

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

  // Saldo líquido
  const saldoLiquido = consolidado.saldoTotal + consolidado.totalReceber - consolidado.totalPagar;

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md text-foreground">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus CNPJs e acompanhe a saúde financeira de cada unidade
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </motion.div>

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

      {/* KPIs Consolidados — Redesigned */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Consolidado — Hero Card */}
        <Card className="card-base relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-primary/2 dark:from-primary/12 dark:to-primary/4" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Consolidado</p>
                <p className="text-2xl font-bold font-display mt-1.5 text-foreground">
                  {formatCurrency(consolidado.saldoTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Líquido: <span className={cn("font-medium", saldoLiquido >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(saldoLiquido)}
                  </span>
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card className="card-base group hover:shadow-lg transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total a Receber</p>
                <p className="text-2xl font-bold font-display mt-1.5 text-success">
                  {formatCurrency(consolidado.totalReceber)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {contasReceber.filter(c => c.status === 'pendente').length} títulos pendentes
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-success/15 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card className="card-base group hover:shadow-lg transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total a Pagar</p>
                <p className="text-2xl font-bold font-display mt-1.5 text-destructive">
                  {formatCurrency(consolidado.totalPagar)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {contasPagar.filter(c => c.status === 'pendente').length} títulos pendentes
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empresas Ativas */}
        <Card className="card-base group hover:shadow-lg transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresas Ativas</p>
                <p className="text-2xl font-bold font-display mt-1.5 text-foreground">
                  {consolidado.empresasAtivas}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {empresas.length} cadastradas
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros e View Toggle */}
      <motion.div variants={itemVariants}>
        <Card className="card-base">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por CNPJ, razão social ou nome fantasia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')}>
                <TabsList>
                  <TabsTrigger value="cards">Cards</TabsTrigger>
                  <TabsTrigger value="table">Tabela</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty State */}
      {empresasFiltradas.length === 0 && !isLoading && (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="Nenhuma empresa encontrada"
            description={searchTerm ? "Tente ajustar sua busca" : "Cadastre sua primeira empresa para começar"}
            action={!searchTerm ? (
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Empresa
              </Button>
            ) : undefined}
          />
        </motion.div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {empresasFiltradas.map((empresa) => {
              const stats = getEmpresaStats(empresa.id);
              const isSelected = selectedEmpresa === empresa.id;
              
              return (
                <StaggerItem key={empresa.id}>
                  <Card className={cn(
                    "card-base relative overflow-hidden transition-all duration-200 hover:shadow-lg group",
                    !empresa.ativo && "opacity-50",
                    isSelected && "ring-2 ring-primary shadow-lg"
                  )}>
                    {/* Status bar */}
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1 transition-colors",
                      empresa.ativo ? "bg-success" : "bg-muted-foreground/30"
                    )} />
                    
                    <CardHeader className="pb-3 pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-bold truncate">
                            {empresa.nome_fantasia || empresa.razao_social}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {empresa.razao_social}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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

                    <CardContent className="space-y-4 pb-5">
                      {/* CNPJ + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs cursor-pointer hover:bg-muted transition-colors gap-1"
                          onClick={() => copyToClipboard(empresa.cnpj)}
                        >
                          {formatCNPJ(empresa.cnpj)}
                          <Copy className="h-3 w-3" />
                        </Badge>
                        <Badge 
                          variant={empresa.ativo ? "default" : "secondary"}
                          className={cn(
                            empresa.ativo && "bg-success/15 text-success border-success/30 hover:bg-success/20"
                          )}
                        >
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>

                      {/* Financial Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-success/8 dark:bg-success/10 border border-success/15 text-center">
                          <p className="text-base font-bold text-success">{formatCurrency(stats.aReceber)}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">A Receber ({stats.titulosReceber})</p>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive/8 dark:bg-destructive/10 border border-destructive/15 text-center">
                          <p className="text-base font-bold text-destructive">{formatCurrency(stats.aPagar)}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">A Pagar ({stats.titulosPagar})</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              {stats.contasBancarias} conta{stats.contasBancarias !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{formatCurrency(stats.saldoTotal)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}

            {/* Add New Card */}
            <StaggerItem>
              <Card 
                className="card-base border-dashed border-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[280px] flex items-center justify-center group"
                onClick={() => handleOpenDialog()}
              >
                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 transition-all group-hover:bg-primary/15 group-hover:scale-110">
                    <Plus className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-foreground">Adicionar Nova Empresa</h3>
                  <p className="text-sm text-muted-foreground mt-1">Cadastre um novo CNPJ</p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === 'table' && empresasFiltradas.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="card-base overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">A Receber</TableHead>
                  <TableHead className="text-right">A Pagar</TableHead>
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
                        <div>
                          <p className="font-medium text-foreground">{empresa.nome_fantasia || empresa.razao_social}</p>
                          <p className="text-xs text-muted-foreground">{empresa.razao_social}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs cursor-pointer" onClick={() => copyToClipboard(empresa.cnpj)}>
                          {formatCNPJ(empresa.cnpj)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={empresa.ativo ? "default" : "secondary"}
                          className={cn(empresa.ativo && "bg-success/15 text-success border-success/30")}
                        >
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(stats.saldoTotal)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(stats.aReceber)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
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

      {/* Contexto Selecionado */}
      {selectedEmpresa && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="card-base border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contexto Ativo</p>
                    <p className="font-semibold text-foreground">
                      {empresas.find(e => e.id === selectedEmpresa)?.nome_fantasia || empresas.find(e => e.id === selectedEmpresa)?.razao_social}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedEmpresa(null)}>
                  Limpar Contexto
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
