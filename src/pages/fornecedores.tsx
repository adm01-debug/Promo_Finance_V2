import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Building2, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useFornecedores, useToggleFornecedorActive, useDeleteFornecedor } from '@/hooks/useFornecedores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatCNPJ, formatPhone } from '@/lib/utils';

export function FornecedoresPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedFornecedor, setSelectedFornecedor] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<string | null>(null);

  const { data: fornecedores, isLoading, error } = useFornecedores({
    search,
    ativo: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  const toggleActive = useToggleFornecedorActive();
  const deleteFornecedor = useDeleteFornecedor();

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActive.mutate({ id, ativo: !currentStatus });
  };

  const handleDelete = (id: string) => {
    setFornecedorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (fornecedorToDelete) {
      deleteFornecedor.mutate(fornecedorToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setFornecedorToDelete(null);
        },
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Erro ao carregar fornecedores. Tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fornecedores</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie os fornecedores da empresa
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Novo Fornecedor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'active', label: 'Ativos' },
            { value: 'inactive', label: 'Inativos' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="w-full sm:w-48"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {fornecedores?.length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {fornecedores?.filter((f) => f.ativo).length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inativos</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {fornecedores?.filter((f) => !f.ativo).length ?? 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        ) : fornecedores?.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fornecedores?.map((fornecedor) => (
                  <tr
                    key={fornecedor.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={fornecedor.nome} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {fornecedor.nome}
                          </p>
                          {fornecedor.razao_social && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {fornecedor.razao_social}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {formatCNPJ(fornecedor.cnpj)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {fornecedor.email && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="h-3.5 w-3.5" />
                            {fornecedor.email}
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="h-3.5 w-3.5" />
                            {formatPhone(fornecedor.telefone)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {fornecedor.cidade && fornecedor.estado ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="h-3.5 w-3.5" />
                          {fornecedor.cidade}/{fornecedor.estado}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        status={fornecedor.ativo ? 'active' : 'inactive'}
                        label={fornecedor.ativo ? 'Ativo' : 'Inativo'}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleActive(fornecedor.id, fornecedor.ativo)}
                          title={fornecedor.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {fornecedor.ativo ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(fornecedor.id)}
                          title="Excluir"
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        isLoading={deleteFornecedor.isPending}
      />
    </div>
  );
}

// Helper functions
function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}
