import { useState } from 'react';
import { useClientes, useDeleteCliente, useToggleClienteActive } from '@/hooks/useClientes';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Search, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import type { Cliente } from '@/integrations/supabase/types';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [ativoFilter, setAtivoFilter] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggleClient, setToggleClient] = useState<Cliente | null>(null);

  const { data: clientes, isLoading } = useClientes({
    search: search || undefined,
    ativo: ativoFilter ? ativoFilter === 'true' : undefined,
  });

  const deleteMutation = useDeleteCliente();
  const toggleMutation = useToggleClienteActive();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const handleToggle = () => {
    if (toggleClient) {
      toggleMutation.mutate(
        { id: toggleClient.id, ativo: !toggleClient.ativo },
        { onSuccess: () => setToggleClient(null) }
      );
    }
  };

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Cliente
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={ativoFilter}
            onChange={(e) => setAtivoFilter(e.target.value)}
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
        ) : !clientes?.length ? (
          <div className="py-12 text-center text-gray-500">
            Nenhum cliente encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500 dark:border-gray-700">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CPF/CNPJ</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="text-sm">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {cliente.nome}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cliente.cpf_cnpj || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cliente.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cliente.telefone || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cliente.ativo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="icon-sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setToggleClient(cliente)}
                        >
                          {cliente.ativo ? (
                            <PowerOff className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteId(cliente.id)}
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
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Toggle Confirmation */}
      <ConfirmDialog
        open={!!toggleClient}
        onClose={() => setToggleClient(null)}
        onConfirm={handleToggle}
        title={toggleClient?.ativo ? 'Desativar cliente' : 'Ativar cliente'}
        description={
          toggleClient?.ativo
            ? 'Deseja desativar este cliente?'
            : 'Deseja ativar este cliente?'
        }
        confirmText={toggleClient?.ativo ? 'Desativar' : 'Ativar'}
        variant={toggleClient?.ativo ? 'warning' : 'success'}
        loading={toggleMutation.isPending}
      />
    </div>
  );
}
