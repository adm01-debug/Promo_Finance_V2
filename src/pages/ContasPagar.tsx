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
  useHighlightFromUrl('highlight', (logic.sortedContas?.length ?? 0) > 0);

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
      <div className="relative min-h-screen">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-destructive/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 space-y-10 pb-20">
          {/* Hero Header Section */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Payables Optimization
              </div>
              <h1 className="text-5xl font-black tracking-tighter md:text-6xl lg:text-7xl">
                Contas a <span className="text-transparent bg-clip-text bg-gradient-to-r from-destructive via-red-500 to-orange-600">Pagar</span>
              </h1>
              <p className="text-xl text-muted-foreground/70 max-w-2xl leading-relaxed font-medium italic">
                Sincronize fluxos de saída e otimize relações estratégicas com fornecedores.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/40 p-2.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
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
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
                  onClick={() => logic.setFormOpen(true)}
                >
                  <Plus className="h-5 w-5" /> Novo Registro
                </Button>
              </div>
            </div>
          </motion.div>

          {/* KPI Cards */}
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

          {/* Filters & Content Intelligence */}
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <QuickDateFilters
                value={logic.filterType}
                onChange={logic.handleFilterChange}
                showOverdue
              />
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
              />
            </motion.div>
          </div>

          {/* Core Content: High-Fidelity Table */}
          <motion.div variants={itemVariants} className="min-h-[600px]">
            <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
              {logic.isLoading ? (
                <TableShimmerSkeleton rows={logic.pageSize} columns={8} showCheckbox showAvatar />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="w-16 p-6 text-center">
                          <Checkbox 
                            checked={logic.isAllSelected}
                            onChange={logic.selectAll}
                            aria-label="Selecionar todos"
                          />
                        </th>
                        <th className="w-[300px] p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Supplier / Entity</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Internal Reference</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Gross Value</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Maturity Horizon</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Operational Unit</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Governance</th>
                        <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Ledger Status</th>
                        <th className="w-20 p-6"></th>
                      </tr>
                    </TableHeader>
                    <TableBody className="divide-y divide-white/5">
                      {logic.sortedContas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-[400px] text-center p-0">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <Sparkles className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Global Vault Cleared</p>
                            </div>
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
                  <div className="p-6 border-t border-white/5 bg-black/20">
                    <TablePagination
                      currentPage={logic.currentPage}
                      totalPages={logic.totalPages}
                      pageSize={logic.pageSize}
                      totalItems={logic.totalCount}
                      onPageChange={logic.setCurrentPage}
                      onPageSizeChange={logic.handlePageSizeChange}
                    />
                  </div>
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
