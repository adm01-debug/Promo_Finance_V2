import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Search,
  MoreVertical,
  Edit,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Copy,
  Star,
  Loader2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useContasBancarias, useContasReceber, useContasPagar } from '@/hooks/useFinancialData';
import { useAllEmpresas, useExcluirEmpresa, useReativarEmpresa, type Empresa } from '@/hooks/useEmpresas';
import { EmpresaForm } from '@/components/empresas/EmpresaForm';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { EmptyState, StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';
import { useToast } from '@/hooks/use-toast';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { toast as sonnerToast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
      titulosPagar: pagar.length
    };
  };

  const consolidado = useMemo(() => ({
    saldoTotal: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).saldoTotal, 0),
    totalReceber: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aReceber, 0),
    totalPagar: empresas.reduce((acc, e) => acc + getEmpresaStats(e.id).aPagar, 0),
    empresasAtivas: empresas.filter(e => e.ativo).length
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
    toast({
      title: "Copiado!",
      description: "CNPJ copiado para a área de transferência",
    });
  };

  const handleOpenDialog = (empresa?: Empresa) => {
    setEditingEmpresa(empresa || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmpresa(null);
  };

  const handleFormSuccess = () => {
    handleCloseDialog();
  };

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
        onDelete: async () => {
          await excluirEmpresa.mutateAsync(empresaBackup.id);
        },
        onRestore: async () => {
          await reativarEmpresa.mutateAsync(empresaBackup.id);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas (CNPJs)</h1>
          <p className="text-muted-foreground">
            Gerencie múltiplas empresas e consolide dados financeiros
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <EmpresaForm
            empresa={editingEmpresa}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Desativar Empresa"
        description={`Tem certeza que deseja desativar a empresa "${empresaToDelete?.nome_fantasia || empresaToDelete?.razao_social}"? Ela não aparecerá mais nas listagens, mas os dados serão mantidos.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Desativar"
        variant="danger"
      />

      {/* KPIs Consolidados */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Consolidado</p>
                  <p className="text-2xl font-bold">{formatCurrency(consolidado.saldoTotal)}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Receber</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(consolidado.totalReceber)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(consolidado.totalPagar)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                  <p className="text-2xl font-bold">{consolidado.empresasAtivas}</p>
                  <p className="text-xs text-muted-foreground">de {empresas.length} cadastradas</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      {/* Lista de Empresas - Cards */}
      {viewMode === 'cards' && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresasFiltradas.map((empresa) => {
            const stats = getEmpresaStats(empresa.id);
            
            return (
              <StaggerItem key={empresa.id}>
                <Card className={cn(
                  "relative overflow-hidden transition-all hover:shadow-lg",
                  !empresa.ativo && "opacity-60",
                  selectedEmpresa === empresa.id && "ring-2 ring-primary"
                )}>
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    empresa.ativo ? "bg-green-500" : "bg-gray-400"
                  )} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{empresa.nome_fantasia || empresa.razao_social}</CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1">{empresa.razao_social}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Selecionar Contexto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Documentos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleAtivo(empresa)}
                            className={empresa.ativo ? "text-destructive" : "text-green-600"}
                          >
                            {empresa.ativo ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="font-mono text-xs cursor-pointer hover:bg-muted"
                        onClick={() => copyToClipboard(empresa.cnpj)}
                      >
                        {formatCNPJ(empresa.cnpj)}
                        <Copy className="h-3 w-3 ml-1" />
                      </Badge>
                      <Badge variant={empresa.ativo ? "default" : "secondary"}>
                        {empresa.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(stats.aReceber)}</p>
                        <p className="text-xs text-muted-foreground">A Receber ({stats.titulosReceber})</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-red-500">{formatCurrency(stats.aPagar)}</p>
                        <p className="text-xs text-muted-foreground">A Pagar ({stats.titulosPagar})</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{stats.contasBancarias} conta{stats.contasBancarias !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(stats.saldoTotal)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}

          {/* Card para adicionar nova empresa */}
          <StaggerItem>
            <Card 
              className="border-dashed hover:border-primary/50 transition-colors cursor-pointer h-full min-h-[280px] flex items-center justify-center"
              onClick={() => handleOpenDialog()}
            >
              <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-muted-foreground">Adicionar Nova Empresa</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre um novo CNPJ
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Lista de Empresas - Tabela */}
      {viewMode === 'table' && (
        <Card>
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
                      !empresa.ativo && "opacity-60",
                      selectedEmpresa === empresa.id && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{empresa.nome_fantasia || empresa.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{empresa.razao_social}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="font-mono text-xs cursor-pointer"
                        onClick={() => copyToClipboard(empresa.cnpj)}
                      >
                        {formatCNPJ(empresa.cnpj)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={empresa.ativo ? "default" : "secondary"}>
                        {empresa.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(stats.saldoTotal)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(stats.aReceber)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {formatCurrency(stats.aPagar)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setSelectedEmpresa(empresa.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Selecionar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(empresa)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleAtivo(empresa)}
                            className={empresa.ativo ? "text-destructive" : "text-green-600"}
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
      )}

      {/* Contexto Selecionado */}
      {selectedEmpresa && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contexto Ativo</p>
                  <p className="font-medium">
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
      )}
    </div>
  );
}
