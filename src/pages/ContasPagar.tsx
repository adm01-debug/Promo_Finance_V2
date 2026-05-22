import { motion } from 'framer-motion';
import { Plus, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CategorizacaoLoteButton } from '@/components/contas-pagar/CategorizacaoIABadge';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/ui/export-menu';
import { contasPagarColumns } from '@/lib/export-utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StandardTableCard } from '@/components/shared/StandardTableCard';
import { ContaPagarForm } from '@/components/contas-pagar/ContaPagarForm';
import { RegistrarPagamentoDialog } from '@/components/contas-pagar/RegistrarPagamentoDialog';
import { ContasPagarKPIs } from '@/components/contas-pagar/ContasPagarKPIs';
import { ContasPagarList } from './ContasPagar/components/List';
import { ContasPagarFilters } from './ContasPagar/components/Filters';
import { BankAccountSwitcher } from '@/components/financeiro/BankAccountSwitcher';
import { SolicitarAprovacaoDialog } from '@/components/contas-pagar/SolicitarAprovacaoDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { QuickDateFilters } from '@/components/ui/quick-date-filters';
import { useContasPagarLogic } from '@/hooks/useContasPagarLogic';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export default function ContasPagar() {
  const logic = useContasPagarLogic();
  const navigate = useNavigate();
  useHighlightFromUrl('highlight', (logic.sortedContas?.length ?? 0) > 0);

  const bulkActions = [
    { id: 'mark-paid', label: 'Marcar como Pago', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' as const, onClick: logic.handleBulkMarkAsPaid },
    { id: 'cancel', label: 'Cancelar', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const, onClick: logic.handleBulkCancel },
  ];

  const headerActions = (
    <>
      <div className="hidden lg:flex items-center gap-3 pr-3 border-r border-white/10">
        <BankAccountSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <CategorizacaoLoteButton
          despesas={logic.sortedContas
            .filter(c => !c.categoria)
            .map(c => ({
              id: c.id,
              descricao: c.descricao,
              valor: c.valor,
              fornecedor_nome: c.fornecedor_nome,
            }))}
        />
        <ExportMenu
          data={logic.sortedContas}
          columns={contasPagarColumns}
          filename="contas_pagar"
          title="Relatório de Contas a Pagar"
        />
        <Button 
          size="lg" 
          variant="outline"
          className="h-12 px-4 rounded-xl font-black gap-2 transition-all hover:bg-destructive/10 hover:text-destructive"
          onClick={() => navigate('/contas-pagar/bloqueios')}
        >
          <ShieldAlert className="h-5 w-5" /> Auditoria
        </Button>
        <Button 
          size="lg" 
          className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
          onClick={() => logic.setFormOpen(true)}
        >
          <Plus className="h-5 w-5" /> Novo Registro
        </Button>
      </div>
    </>
  );

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-destructive/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 space-y-10 pb-20">
          <PageHeader 
            title="Contas a Pagar" 
            subtitle="Sincronize fluxos de saída e otimize relações estratégicas com fornecedores." 
            badge="Payables Optimization"
            showEmpresaSwitcher
            actions={headerActions}
            gradientFrom="from-destructive"
            gradientVia="via-red-500"
            gradientTo="to-orange-600"
          />

          <motion.div variants={itemVariants}>
            <ContasPagarKPIs
              totalPagar={logic.totalPagar}
              totalPagoMes={logic.totalPagoMes}
              totalVencido={logic.totalVencido}
              venceHoje={logic.venceHoje}
              countAprovacoesUrgentes={logic.countAprovacoesUrgentes}
              valorAprovacoesUrgentes={logic.valorAprovacoesUrgentes}
              onAprovacaoClick={() => logic.setAprovacaoFilter('pendente_aprovacao')}
            />
          </motion.div>

          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <QuickDateFilters value={logic.filterType} onChange={logic.handleFilterChange} showOverdue />
            </motion.div>

            <motion.div variants={itemVariants}>
              <ContasPagarFilters
                searchTerm={logic.searchTerm}
                onSearchChange={logic.handleSearchChange}
                statusFilter={logic.statusFilter}
                onStatusChange={logic.handleStatusChange}
                centroCustoFilter={logic.centroCustoFilter}
                onCentroCustoChange={logic.handleCentroCustoChange}
                aprovacaoFilter={logic.aprovacaoFilter}
                onAprovacaoChange={logic.setAprovacaoFilter}
                ordenacao={logic.ordenacao}
                onOrdenacaoChange={logic.setOrdenacao}
                advancedFilters={logic.advancedFilters}
                onAdvancedFiltersChange={logic.setAdvancedFilters}
                centrosCusto={logic.centrosCusto}
                countPendentesAprovacao={logic.countPendentesAprovacao}
                empresas={logic.empresas}
                contasBancarias={logic.contasBancarias}
              />
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="min-h-[600px]">
            <StandardTableCard
              isLoading={logic.isLoading}
              pageSize={logic.pageSize}
              pagination={{
                currentPage: logic.currentPage,
                totalPages: logic.totalPages,
                pageSize: logic.pageSize,
                totalItems: logic.totalCount,
                onPageChange: logic.setCurrentPage,
                onPageSizeChange: logic.handlePageSizeChange
              }}
            >
              <ContasPagarList
                contas={logic.sortedContas}
                isLoading={logic.isLoading}
                isAllSelected={logic.isAllSelected}
                selectAll={logic.selectAll}
                isSelected={logic.isSelected}
                toggleSelect={logic.toggleSelect}
                onEdit={(conta) => {
                  logic.setEditingConta(conta);
                  logic.setFormOpen(true);
                }}
                onDelete={logic.handleOpenDeleteDialog}
                onRegistrarPagamento={(conta) => {
                  logic.setSelectedConta(conta);
                  logic.setPagamentoDialogOpen(true);
                }}
                onSolicitarAprovacao={logic.abrirModalAprovacao}
                getApprovalStatus={logic.getApprovalStatus}
                historicoAprovacaoPorConta={logic.historicoAprovacaoPorConta}
                profilesMap={logic.profilesMap}
                valorMinimoAprovacao={logic.valorMinimoAprovacao}
                getRowAnimation={logic.getRowAnimation}
              />
            </StandardTableCard>
          </motion.div>

          <ContaPagarForm 
            open={logic.formOpen} 
            onOpenChange={(open) => {
              logic.setFormOpen(open);
              if (!open) logic.setEditingConta(null);
            }}
            conta={logic.editingConta as any}
          />

          <RegistrarPagamentoDialog 
            conta={logic.selectedConta} 
            open={logic.pagamentoDialogOpen} 
            onOpenChange={logic.setPagamentoDialogOpen} 
          />

          <SolicitarAprovacaoDialog
            open={logic.aprovacaoDialogOpen}
            onOpenChange={logic.setAprovacaoDialogOpen}
            conta={logic.contaParaAprovacao}
            observacoes={logic.observacoesAprovacao}
            onObservacoesChange={logic.setObservacoesAprovacao}
            onConfirm={logic.handleConfirmarSolicitacao}
            isLoading={logic.criarSolicitacaoMutation.isPending}
          />

          <ConfirmDialog
            open={logic.deleteDialogOpen}
            onOpenChange={logic.setDeleteDialogOpen}
            title="Purge Command"
            description={`Confirmar a remoção definitiva da obrigação "${logic.deletingConta?.descricao}" no valor de ${logic.deletingConta?.valor ? formatCurrency(logic.deletingConta.valor) : ''}?`}
            confirmLabel="Confirmar Purge"
            variant="danger"
            isLoading={logic.isDeleting}
            onConfirm={logic.handleDeleteConta}
          />

          <BulkActionsBar
            selectedCount={logic.selectedCount}
            isProcessing={logic.isProcessing}
            progress={logic.progress}
            actions={bulkActions}
            onClear={logic.clearSelection}
          />
        </motion.div>
      </div>
    </MainLayout>
  );
}
