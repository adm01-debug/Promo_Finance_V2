import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Calendar, DollarSign, AlertTriangle, Filter } from 'lucide-react';
import { useContasPagar, useContasPagarTotals, useMarkContaPagarAsPaid, useMarkContaPagarAsCanceled, useDeleteContaPagar } from '@/hooks/useContasPagar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ui/modal';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type ContaStatus = 'all' | 'pendente' | 'pago' | 'cancelado' | 'vencido';

export function ContasPagarPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContaStatus>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedContaId, setSelectedContaId] = useState<string | null>(null);

  const { data: contas, isLoading, error } = useContasPagar({
    search,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: totals } = useContasPagarTotals();
  const markAsPaid = useMarkContaPagarAsPaid();
  const markAsCanceled = useMarkContaPagarAsCanceled();
  const deleteConta = useDeleteContaPagar();

  const handleMarkAsPaid = (id: string) => {
    setSelectedContaId(id);
    setIsPaidModalOpen(true);
  };

  const handleMarkAsCanceled = (id: string) => {
    setSelectedContaId(id);
    setIsCancelModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedContaId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmPaid = () => {
    if (selectedContaId) {
      markAsPaid.mutate(selectedContaId, {
        onSuccess: () => {
          setIsPaidModalOpen(false);
          setSelectedContaId(null);
        },
      });
    }
  };

  const confirmCancel = () => {
    if (selectedContaId) {
      markAsCanceled.mutate(selectedContaId, {
        onSuccess: () => {
          setIsCancelModalOpen(false);
          setSelectedContaId(null);
        },
      });
    }
  };

  const confirmDelete = () => {
    if (selectedContaId) {
      deleteConta.mutate(selectedContaId, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedContaId(null);
        },
      });
    }
  };

  const getStatusConfig = (status: string, vencimento: string) => {
    const isOverdue = new Date(vencimento) < new Date() && status === 'pendente';

    if (isOverdue) {
      return { status: 'error' as const, label: 'Vencido' };
    }

    switch (status) {
      case 'pago':
        return { status: 'completed' as const, label: 'Pago' };
      case 'cancelado':
        return { status: 'cancelled' as const, label: 'Cancelado' };
      default:
        return { status: 'pending' as const, label: 'Pendente' };
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Erro ao carregar contas a pagar. Tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas a Pagar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie suas despesas e pagamentos
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Nova Conta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendente</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals?.pendente ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vencidas</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totals?.vencido ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pago (Mês)</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totals?.pago ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Próximos 7 dias</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(totals?.proximo7dias ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descrição ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'vencido', label: 'Vencidos' },
            { value: 'pago', label: 'Pagos' },
            { value: 'cancelado', label: 'Cancelados' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContaStatus)}
          className="w-full sm:w-48"
          leftElement={<Filter className="h-4 w-4" />}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        ) : contas?.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contas?.map((conta) => {
                  const statusConfig = getStatusConfig(conta.status, conta.vencimento);
                  const isOverdue = statusConfig.label === 'Vencido';

                  return (
                    <tr
                      key={conta.id}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        isOverdue && 'bg-red-50/50 dark:bg-red-900/10'
                      )}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {conta.descricao}
                          </p>
                          {conta.categoria && (
                            <Badge variant="outline" size="sm">
                              {conta.categoria}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                        {conta.fornecedor?.nome ?? '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'text-gray-600 dark:text-gray-300',
                          isOverdue && 'text-red-600 dark:text-red-400 font-medium'
                        )}>
                          {formatDate(conta.vencimento)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(conta.valor)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge {...statusConfig} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {conta.status === 'pendente' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleMarkAsPaid(conta.id)}
                                title="Marcar como pago"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleMarkAsCanceled(conta.id)}
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4 text-orange-500" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon-sm" title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(conta.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={isPaidModalOpen}
        onClose={() => setIsPaidModalOpen(false)}
        onConfirm={confirmPaid}
        title="Confirmar Pagamento"
        message="Confirma que esta conta foi paga?"
        confirmText="Confirmar Pagamento"
        variant="info"
        isLoading={markAsPaid.isPending}
      />

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancelar Conta"
        message="Tem certeza que deseja cancelar esta conta?"
        confirmText="Cancelar Conta"
        variant="warning"
        isLoading={markAsCanceled.isPending}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        isLoading={deleteConta.isPending}
      />
    </div>
  );
}
