import { motion } from 'framer-motion';
import { Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHeader } from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { EmptyState } from '@/components/ui/micro-interactions';
import { StandardTableCard } from '@/components/shared/StandardTableCard';
import { ContasReceberKanban } from '@/components/contas-receber/ContasReceberKanban';
import { ContasReceberTableRow } from '@/components/contas-receber/ContasReceberTableRow';
import { itemVariants } from './ContasReceber.helpers';

interface ContasReceberConteudoConteudoProps {
  viewMode: 'table' | 'kanban';
  sortedContas: ReturnType<
    typeof import('@/hooks/useContasReceberLogic').useContasReceberLogic
  >['sortedContas'];
  handleViewConta: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  isLoading: boolean;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: import('react').Dispatch<import('react').SetStateAction<number>>;
  handlePageSizeChange: (size: number) => void;
  isAllSelected: boolean;
  selectAll: () => void;
  sortKey: string;
  sortDirection: import('@/components/ui/sortable-header').SortDirection;
  handleSort: (key: string) => void;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  colCount: number;
  contas: ReturnType<
    typeof import('@/hooks/useContasReceberLogic').useContasReceberLogic
  >['contas'];
  setFormOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  setEditingConta: import('react').Dispatch<
    import('react').SetStateAction<
      import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  handleOpenDeleteDialog: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  setSelectedConta: import('react').Dispatch<
    import('react').SetStateAction<
      import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  setRecebimentoDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  handleEnviarCobranca: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  handleAplicarDesconto: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
}

export function ContasReceberConteudoConteudo({
  viewMode,
  sortedContas,
  handleViewConta,
  isLoading,
  pageSize,
  currentPage,
  totalPages,
  totalCount,
  setCurrentPage,
  handlePageSizeChange,
  isAllSelected,
  selectAll,
  sortKey,
  sortDirection,
  handleSort,
  empresas,
  colCount,
  contas,
  setFormOpen,
  isSelected,
  toggleSelect,
  setEditingConta,
  handleOpenDeleteDialog,
  setSelectedConta,
  setRecebimentoDialogOpen,
  handleEnviarCobranca,
  handleAplicarDesconto,
}: ContasReceberConteudoConteudoProps) {
  return (
    <motion.div variants={itemVariants} className="min-h-[600px]">
      {viewMode === 'kanban' ? (
        <ContasReceberKanban
          contas={
            sortedContas as unknown as React.ComponentProps<typeof ContasReceberKanban>['contas']
          }
          onSelectConta={handleViewConta}
        />
      ) : (
        <StandardTableCard
          isLoading={isLoading}
          pageSize={pageSize}
          pagination={{
            currentPage,
            totalPages,
            pageSize,
            totalItems: totalCount,
            onPageChange: setCurrentPage,
            onPageSizeChange: handlePageSizeChange,
          }}
        >
          <Table>
            <TableHeader>
              <tr className="bg-card/[0.02] border-b border-white/5">
                <th className="w-16 p-6 text-center">
                  <Checkbox checked={isAllSelected} onChange={selectAll} />
                </th>
                <th className="w-[300px] p-6">
                  <SortableHeader
                    label="Entity / Client"
                    sortKey="cliente_nome"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="p-6 text-caption text-left">Reference Description</th>
                <th className="p-6">
                  <SortableHeader
                    label="Nominal Value"
                    sortKey="valor"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="p-6">
                  <SortableHeader
                    label="Maturity Date"
                    sortKey="data_vencimento"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="w-24 p-6 text-center">
                  <SortableHeader
                    label="Delay"
                    sortKey="data_vencimento"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="p-6 text-caption text-center">Status</th>
                <th className="p-6 text-caption text-left">Conta Bancária</th>
                {empresas.length > 1 && <th className="p-6 text-caption text-left">Corporate</th>}
                <th className="p-6 text-caption text-center">Credit Score</th>
                <th className="w-20 p-6"></th>
              </tr>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {sortedContas.length === 0 ? (
                <tr>
                  <TableCell colSpan={colCount} className="p-0 h-[400px]">
                    <EmptyState
                      icon={<Inbox className="h-12 w-12 text-muted-foreground/30" />}
                      title={contas.length === 0 ? 'Repositório Vazio' : 'Nenhuma Correspondência'}
                      description={
                        contas.length === 0
                          ? 'Inicie a governança de ativos adicionando seu primeiro título.'
                          : 'Ajuste os algoritmos de busca para encontrar o registro.'
                      }
                      action={
                        contas.length === 0 ? (
                          <Button
                            size="lg"
                            className="h-12 rounded-xl bg-primary text-primary-foreground font-black mt-6"
                            onClick={() => setFormOpen(true)}
                          >
                            <Plus className="h-5 w-5" /> Adicionar Título Alpha
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </tr>
              ) : (
                sortedContas.map((conta, index) => (
                  <ContasReceberTableRow
                    key={conta.id}
                    conta={
                      conta as unknown as React.ComponentProps<
                        typeof ContasReceberTableRow
                      >['conta']
                    }
                    index={index}
                    isSelected={isSelected(conta.id)}
                    onToggleSelect={toggleSelect}
                    onEdit={(c) => {
                      setEditingConta(c);
                      setFormOpen(true);
                    }}
                    onDelete={handleOpenDeleteDialog}
                    onRegistrarRecebimento={(c) => {
                      setSelectedConta(c);
                      setRecebimentoDialogOpen(true);
                    }}
                    onView={handleViewConta}
                    onEnviarCobranca={handleEnviarCobranca}
                    onAplicarDesconto={handleAplicarDesconto}
                    showEmpresa={empresas.length > 1}
                    showDiasAtraso
                  />
                ))
              )}
            </TableBody>
          </Table>
        </StandardTableCard>
      )}
    </motion.div>
  );
}
