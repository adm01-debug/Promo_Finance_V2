import { motion } from 'framer-motion';
import { Plus, CheckCircle2, XCircle, ArrowUpDown, Sparkles } from 'lucide-react';
import { CategorizacaoLoteButton } from '@/components/contas-pagar/CategorizacaoIABadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportMenu } from '@/components/ui/export-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { contasPagarColumns } from '@/lib/export-utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContaPagarForm } from '@/components/contas-pagar/ContaPagarForm';
import { RegistrarPagamentoDialog } from '@/components/contas-pagar/RegistrarPagamentoDialog';
import { ContasPagarKPIs } from '@/components/contas-pagar/ContasPagarKPIs';
import { ContasPagarFilters } from '@/components/contas-pagar/ContasPagarFilters';
import { ContasPagarTableRow } from '@/components/contas-pagar/ContasPagarTableRow';
import { SolicitarAprovacaoDialog } from '@/components/contas-pagar/SolicitarAprovacaoDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { QuickDateFilters } from '@/components/ui/quick-date-filters';
import { useContasPagarLogic } from '@/hooks/useContasPagarLogic';
import { formatCurrency } from '@/lib/formatters';

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

  const bulkActions = [
    {
      id: 'mark-paid',
      label: 'Marcar como Pago',
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: logic.handleBulkMarkAsPaid,
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: logic.handleBulkCancel,
    },
  ];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-1">Controle todas as obrigações financeiras e fornecedores</p>
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
              size="sm" 
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              onClick={() => logic.setFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <ContasPagarKPIs
          totalPagar={logic.totalPagar}
          totalPagoMes={logic.totalPagoMes}
          totalVencido={logic.totalVencido}
          venceHoje={logic.venceHoje}
          countAprovacoesUrgentes={logic.countAprovacoesUrgentes}
          valorAprovacoesUrgentes={logic.valorAprovacoesUrgentes}
          onAprovacaoClick={() => logic.setAprovacaoFilter('pendente_aprovacao')}
        />

        {/* Quick Date Filters */}
        <motion.div variants={itemVariants}>
          <QuickDateFilters
            value={logic.filterType}
            onChange={logic.handleFilterChange}
            showOverdue
          />
        </motion.div>

        {/* Filters */}
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
        />

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {logic.isLoading ? (
              <TableShimmerSkeleton rows={logic.pageSize} columns={8} showCheckbox showAvatar />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={logic.isAllSelected}
                          onChange={logic.selectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead className="w-[250px]">
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Fornecedor
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Valor
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Vencimento
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logic.sortedContas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          Nenhuma conta encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      logic.sortedContas.map((conta, index) => {
                        const approvalStatus = logic.getApprovalStatus(conta);
                        const historico = logic.historicoAprovacaoPorConta.get(conta.id) || [];
                        
                        return (
                          <ContasPagarTableRow
                            key={conta.id}
                            conta={conta}
                            index={index}
                            isSelected={logic.isSelected(conta.id)}
                            onToggleSelect={() => logic.toggleSelect(conta.id)}
                            onEdit={() => {
                              logic.setEditingConta(conta);
                              logic.setFormOpen(true);
                            }}
                            onDelete={() => logic.handleOpenDeleteDialog(conta)}
                            onRegistrarPagamento={() => {
                              logic.setSelectedConta(conta);
                              logic.setPagamentoDialogOpen(true);
                            }}
                            onSolicitarAprovacao={() => logic.abrirModalAprovacao(conta)}
                            {...approvalStatus}
                            historico={historico}
                            profilesMap={logic.profilesMap}
                            valorMinimoAprovacao={logic.valorMinimoAprovacao}
                            getRowAnimation={logic.getRowAnimation}
                          />
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={logic.currentPage}
                  totalPages={logic.totalPages}
                  pageSize={logic.pageSize}
                  totalItems={logic.totalCount}
                  onPageChange={logic.setCurrentPage}
                  onPageSizeChange={logic.handlePageSizeChange}
                />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Dialogs */}
        <ContaPagarForm 
          open={logic.formOpen} 
          onOpenChange={(open) => {
            logic.setFormOpen(open);
            if (!open) logic.setEditingConta(null);
          }}
          conta={logic.editingConta}
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
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir a conta "${logic.deletingConta?.descricao}" no valor de ${logic.deletingConta?.valor ? formatCurrency(logic.deletingConta.valor) : ''}?`}
          confirmLabel="Excluir"
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
    </MainLayout>
  );
}
