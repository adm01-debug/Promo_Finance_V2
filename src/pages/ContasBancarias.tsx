import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  CreditCard,
  Eye,
  EyeOff,
  Wallet,
  PiggyBank,
  Landmark,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContasBancarias, useEmpresas, ContaBancaria } from '@/hooks/useFinancialData';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmptyState } from '@/components/ui/micro-interactions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { TransferenciaDialog } from '@/components/contas-bancarias/TransferenciaDialog';
import { ContasBancariasKPIs } from '@/components/contas-bancarias/ContasBancariasKPIs';
import { NovaContaDialog } from '@/components/contas-bancarias/NovaContaDialog';
import { ContaBancariaCard } from '@/components/contas-bancarias/ContaBancariaCard';
import { DistribuicaoBancos } from '@/components/contas-bancarias/DistribuicaoBancos';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
  const [isDeleting] = useState(false);
  const [transferenciaOpen, setTransferenciaOpen] = useState(false);

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

  const getBancoInfo = (banco: string) => bancoLogos[banco] || { icon: Landmark, color: 'bg-muted-foreground' };

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
        const { error } = await supabase.from('contas_bancarias').update({ ativo: false }).eq('id', contaBackup.id);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Contas Bancárias</h1>
            <p className="text-muted-foreground">Configure multi-contas, regras de conciliação e mapeamentos por CNPJ</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTransferenciaOpen(true)}>
              <ArrowLeftRight className="h-4 w-4 mr-2" />Transferência
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaldos(!showSaldos)}>
              {showSaldos ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSaldos ? 'Ocultar Saldos' : 'Mostrar Saldos'}
            </Button>
            <NovaContaDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              empresas={empresas}
              bancos={Object.keys(bancoLogos)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label>Filtrar por empresa:</Label>
          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Todas as empresas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ContasBancariasKPIs
          saldoTotal={saldoTotal}
          saldoDisponivel={saldoDisponivel}
          contasAtivas={contasAtivas}
          totalContas={contasFiltradas.length}
          showSaldos={showSaldos}
        />

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
                    <Plus className="h-4 w-4" />Adicionar Conta
                  </Button>
                }
              />
            </div>
          ) : (
            contasFiltradas.map((conta) => {
              const info = getBancoInfo(conta.banco);
              return (
                <ContaBancariaCard
                  key={conta.id}
                  conta={conta}
                  empresaNome={getEmpresaNome(conta.empresa_id)}
                  showSaldos={showSaldos}
                  bancoIcon={info.icon}
                  bancoColor={info.color}
                  onDelete={handleOpenDeleteDialog}
                />
              );
            })
          )}

          <motion.div variants={itemVariants}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setDialogOpen(true)}
            >
              <div className="border border-dashed hover:border-primary/50 transition-colors cursor-pointer h-full min-h-[280px] flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-muted-foreground">Adicionar Nova Conta</h3>
                  <p className="text-sm text-muted-foreground mt-1">Conecte uma nova conta bancária</p>
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>

        <DistribuicaoBancos
          contas={contasFiltradas}
          saldoTotal={saldoTotal}
          showSaldos={showSaldos}
          getBancoInfo={getBancoInfo}
        />

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

        <TransferenciaDialog open={transferenciaOpen} onOpenChange={setTransferenciaOpen} />
      </div>
    </MainLayout>
  );
}
