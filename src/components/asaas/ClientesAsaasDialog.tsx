// ============================================
// DIALOG: Gestão de Clientes ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pencil, Trash2, Users, Loader2, Save, X } from 'lucide-react';
import { useAsaas, type AsaasCustomer } from '@/hooks/useAsaas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
}

export function ClientesAsaasDialog({ open, onOpenChange, empresaId }: Props) {
  const { customers, loadingCustomers, editarCliente, excluirCliente } = useAsaas(empresaId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ nome: string; email: string; telefone: string }>({ nome: '', email: '', telefone: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const startEdit = (c: AsaasCustomer) => {
    setEditingId(c.asaas_id);
    setEditData({ nome: c.nome, email: c.email || '', telefone: c.telefone || '' });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await editarCliente.mutateAsync({ asaas_id: editingId, ...editData });
      setEditingId(null);
    } catch { /* hook handles */ }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await excluirCliente.mutateAsync(deleteConfirm);
    } catch { /* hook handles */ }
    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Clientes ASAAS
            </DialogTitle>
            <DialogDescription>Gerencie os clientes cadastrados no ASAAS</DialogDescription>
          </DialogHeader>

          {loadingCustomers ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : customers.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum cliente" description="Crie clientes ao emitir cobranças" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id}>
                    {editingId === c.asaas_id ? (
                      <>
                        <TableCell>
                          <Input value={editData.nome} onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))} className="h-8 text-sm" />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.cpf_cnpj || '-'}</TableCell>
                        <TableCell>
                          <Input value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} className="h-8 text-sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave} disabled={editarCliente.isPending}>
                              {editarCliente.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.cpf_cnpj || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.email || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(c.asaas_id)} title="Excluir">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente do ASAAS? Cobranças existentes não serão afetadas."
        type="danger"
        confirmText="Excluir"
        onConfirm={handleDelete}
        isLoading={excluirCliente.isPending}
      />
    </>
  );
}
