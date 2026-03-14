import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  CreditCard, 
  Eye,
  EyeOff,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Wallet,
  PiggyBank,
  Landmark,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContasBancarias, useEmpresas, ContaBancaria } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmptyState } from '@/components/ui/micro-interactions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';

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

const bancoLogos: Record<string, { icon: typeof Landmark; color: string }> = {
  'Itaú': { icon: Landmark, color: 'bg-streak' },
  'Bradesco': { icon: Building2, color: 'bg-destructive' },
  'Banco do Brasil': { icon: Landmark, color: 'bg-warning' },
  'Santander': { icon: Building2, color: 'bg-destructive' },
  'Caixa': { icon: PiggyBank, color: 'bg-secondary' },
  'Nubank': { icon: CreditCard, color: 'bg-accent' },
  'Inter': { icon: Wallet, color: 'bg-streak' },
  'C6 Bank': { icon: CreditCard, color: 'bg-foreground' },
};

export default function ContasBancarias() {
  const { data: contas = [], isLoading } = useContasBancarias();
  const { data: empresas = [] } = useEmpresas();
  const [showSaldos, setShowSaldos] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConta, setDeletingConta] = useState<ContaBancaria | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const contasFiltradas = selectedEmpresa === 'all' 
    ? contas 
    : contas.filter(c => c.empresa_id === selectedEmpresa);

  const saldoTotal = contasFiltradas.reduce((acc, c) => acc + c.saldo_atual, 0);
  const saldoDisponivel = contasFiltradas.reduce((acc, c) => acc + c.saldo_disponivel, 0);
  const contasAtivas = contasFiltradas.filter(c => c.ativo).length;

  const getEmpresaNome = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome_fantasia || empresa?.razao_social || 'Não identificado';
  };

  const getBancoInfo = (banco: string) => {
    return bancoLogos[banco] || { icon: Landmark, color: 'bg-muted-foreground' };
  };

  const handleOpenDeleteDialog = (conta: ContaBancaria) => {
    setDeletingConta(conta);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConta = async () => {
    if (!deletingConta) return;
    
    const contaBackup = { ...deletingConta };
    setDeleteDialogOpen(false);
    setDeletingConta(null);
    
    toastDeleteWithUndo({
      item: contaBackup,
      itemName: `Conta "${contaBackup.banco} - ${contaBackup.conta}"`,
      onDelete: async () => {
        const { error } = await supabase
          .from('contas_bancarias')
          .update({ ativo: false })
          .eq('id', contaBackup.id);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['contas-bancarias'] });
      },
      onRestore: async () => {
        queryClient.invalidateQueries({ queryKey: ['contas-bancarias'] });
      },
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
              <p className="text-muted-foreground">Gerencie suas contas e acompanhe saldos em tempo real</p>
            </div>
          </div>
          <LoadingSkeleton variant="stats" />
          <LoadingSkeleton variant="cards" rows={2} columns={3} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas e acompanhe saldos em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaldos(!showSaldos)}>
              {showSaldos ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSaldos ? 'Ocultar Saldos' : 'Mostrar Saldos'}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Conta Bancária</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Empresa</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome_fantasia || empresa.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Banco</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(bancoLogos).map(banco => (
                          <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Agência</Label>
                      <Input placeholder="0000" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Conta</Label>
                      <Input placeholder="00000-0" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo de Conta</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Saldo Inicial</Label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                  <Button className="w-full mt-2">Adicionar Conta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtro por Empresa */}
        <div className="flex items-center gap-4">
          <Label>Filtrar por empresa:</Label>
          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {empresas.map(empresa => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome_fantasia || empresa.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs Consolidados */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Total</p>
                    <p className="text-3xl font-bold">
                      {showSaldos ? formatCurrency(saldoTotal) : '••••••'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/20">
                    <DollarSign className="h-6 w-6 text-primary" />
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
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className="text-3xl font-bold">
                      {showSaldos ? formatCurrency(saldoDisponivel) : '••••••'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {saldoTotal > 0 ? ((saldoDisponivel / saldoTotal) * 100).toFixed(1) : 0}% do total
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Wallet className="h-6 w-6 text-green-600" />
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
                    <p className="text-sm text-muted-foreground">Contas Ativas</p>
                    <p className="text-3xl font-bold">{contasAtivas}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      de {contasFiltradas.length} cadastradas
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Cards de Contas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {contasFiltradas.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                title="Nenhuma conta bancária cadastrada"
                description="Adicione sua primeira conta bancária para gerenciar seus saldos."
                action={
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Conta
                  </Button>
                }
              />
            </div>
          ) : (
            contasFiltradas.map((conta) => {
              const bancoInfo = getBancoInfo(conta.banco);
              const BancoIcon = bancoInfo.icon;
              const percentualDisponivel = conta.saldo_atual > 0 ? (conta.saldo_disponivel / conta.saldo_atual) * 100 : 0;

              return (
                <motion.div key={conta.id} variants={itemVariants}>
                  <Card className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    !conta.ativo && "opacity-60"
                  )}>
                    {/* Barra colorida do banco */}
                    <div className={cn("absolute top-0 left-0 right-0 h-1", bancoInfo.color)} />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", bancoInfo.color)}>
                            <BancoIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{conta.banco}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Ag: {conta.agencia} | Cc: {conta.conta}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sincronizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenDeleteDialog(conta)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Saldo Atual</span>
                          <Badge variant={conta.ativo ? "default" : "secondary"}>
                            {conta.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className={cn(
                          "text-2xl font-bold",
                          conta.saldo_atual >= 0 ? "text-foreground" : "text-destructive"
                        )}>
                          {showSaldos ? formatCurrency(conta.saldo_atual) : '••••••'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Disponível</span>
                          <span className="text-sm font-medium">
                            {showSaldos ? formatCurrency(conta.saldo_disponivel) : '••••••'}
                          </span>
                        </div>
                        <Progress value={percentualDisponivel} className="h-2" />
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {getEmpresaNome(conta.empresa_id)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}

          {/* Card para adicionar nova conta */}
          <motion.div variants={itemVariants}>
            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer h-full min-h-[280px] flex items-center justify-center"
              onClick={() => setDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-muted-foreground">Adicionar Nova Conta</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte uma nova conta bancária
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Resumo por Banco */}
        {contasFiltradas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Distribuição por Banco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  contasFiltradas.reduce((acc, conta) => {
                    if (!acc[conta.banco]) {
                      acc[conta.banco] = { total: 0, count: 0 };
                    }
                    acc[conta.banco].total += conta.saldo_atual;
                    acc[conta.banco].count += 1;
                    return acc;
                  }, {} as Record<string, { total: number; count: number }>)
                ).map(([banco, data]) => {
                  const bancoInfo = getBancoInfo(banco);
                  const BancoIcon = bancoInfo.icon;
                  const percentual = saldoTotal > 0 ? (data.total / saldoTotal) * 100 : 0;

                  return (
                    <div key={banco} className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg", bancoInfo.color)}>
                        <BancoIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{banco}</span>
                          <span className="text-sm text-muted-foreground">
                            {data.count} conta{data.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentual} className="flex-1 h-2" />
                          <span className="text-sm font-medium w-24 text-right">
                            {showSaldos ? formatCurrency(data.total) : '••••••'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Conta Bancária"
          description={`Tem certeza que deseja excluir a conta ${deletingConta?.banco} - ${deletingConta?.conta}? Esta ação irá desativar a conta.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConta}
        />
      </div>
    </MainLayout>
  );
}
