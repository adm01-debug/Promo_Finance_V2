import { useState } from 'react';
import { useContasReceber, useDeleteContaReceber, useMarkContaReceberAsReceived } from '@/hooks/useContasReceber';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Trash2, Check, Eye } from 'lucide-react';
import type { ContaReceber } from '@/integrations/supabase/types';

export default function ContasReceberPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiveId, setReceiveId] = useState<string | null>(null);

  const { data: contas, isLoading } = useContasReceber({
    search: search || undefined,
    status: statusFilter as ContaReceber['status'] || undefined,
  });

  const deleteMutation = useDeleteContaReceber();
  const receiveMutation = useMarkContaReceberAsReceived();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleReceive = () => {
    if (receiveId) {
      receiveMutation.mutate(
        { id: receiveId, dataRecebimento: new Date().toISOString().split('T')[0] },
        { onSuccess: () => setReceiveId(null) }
      );
    }
  };

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'recebido', label: 'Recebido' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas a Receber"
        description="Gerencie suas contas a receber"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Nova Conta
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !contas?.length ? (
          <div className="py-12 text-center text-gray-500">
            Nenhuma conta encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500 dark:border-gray-700">
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contas.map((conta) => (
                  <tr key={conta.id} className="text-sm">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {conta.descricao}
                    </td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">
                      {formatCurrency(conta.valor)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(conta.data_vencimento)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={conta.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="icon-sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {conta.status === 'pendente' && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setReceiveId(conta.id)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteId(conta.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir conta"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Receive Confirmation */}
      <ConfirmDialog
        open={!!receiveId}
        onClose={() => setReceiveId(null)}
        onConfirm={handleReceive}
        title="Confirmar recebimento"
        description="Deseja marcar esta conta como recebida?"
        confirmText="Confirmar"
        variant="success"
        loading={receiveMutation.isPending}
      />
    </div>
  );
}
