import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Plus, Edit, ArrowUpDown, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { useBlingContatos, useBlingContatoMutations } from '@/hooks/useBling';
import { PaginationControls } from './BlingShared';

export function BlingContatosPanel() {
  const [pesquisa, setPesquisa] = useState('');
  const [criterio, setCriterio] = useState('1');
  const [pagina, setPagina] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, refetch, isFetching } = useBlingContatos({ pesquisa: pesquisa || undefined, criterio: Number(criterio), pagina });
  const { criarContato, atualizarContato, excluirContatos, alterarSituacaoContato } = useBlingContatoMutations();
  const contatos = data?.data || [];

  const [formData, setFormData] = useState({ nome: '', fantasia: '', tipoPessoa: 'J', numeroDocumento: '', email: '', telefone: '' });

  const resetForm = () => setFormData({ nome: '', fantasia: '', tipoPessoa: 'J', numeroDocumento: '', email: '', telefone: '' });

  const handleSave = () => {
    const payload = { ...formData };
    if (editingId) {
      atualizarContato.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { setEditingId(null); resetForm(); refetch(); }
      });
    } else {
      criarContato.mutate(payload, {
        onSuccess: () => { setShowCreate(false); resetForm(); refetch(); }
      });
    }
  };

  const handleEdit = (c: any) => {
    setFormData({
      nome: c.nome || '', fantasia: c.fantasia || '', tipoPessoa: c.tipo || 'J',
      numeroDocumento: c.numeroDocumento || '', email: c.email || '', telefone: c.telefone || c.celular || ''
    });
    setEditingId(String(c.id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Contatos do Bling</CardTitle>
            <CardDescription>Clientes, fornecedores e transportadoras — CRUD completo, situação, lote</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Contato
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar por nome, CPF/CNPJ..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} className="max-w-sm" />
          <Select value={criterio} onValueChange={setCriterio}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Todos</SelectItem>
              <SelectItem value="2">Clientes</SelectItem>
              <SelectItem value="3">Fornecedores</SelectItem>
              <SelectItem value="4">Transportadoras</SelectItem>
              <SelectItem value="5">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
          </Button>
        </div>
        {contatos.length === 0 && !isFetching && (
          <EmptyState icon={Users} title="Nenhum contato encontrado" description="Clique em Buscar para carregar ou crie um novo contato" />
        )}
        {contatos.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatos.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.nome || c.fantasia}</TableCell>
                      <TableCell>{c.numeroDocumento || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell>{c.telefone || c.celular || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.tipo === 'F' ? 'Física' : c.tipo === 'J' ? 'Jurídica' : c.tipo === 'E' ? 'Estrangeiro' : c.tipo || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.situacao === 'A' ? 'default' : 'secondary'}>{c.situacao === 'A' ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(c)}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alterarSituacaoContato.mutate({ id: String(c.id), data: { situacao: c.situacao === 'A' ? 'I' : 'A' } })}>
                              <ArrowUpDown className="h-4 w-4 mr-2" /> {c.situacao === 'A' ? 'Inativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm(`Excluir contato #${c.id}?`)) excluirContatos.mutate([String(c.id)]);
                            }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={contatos.length === 100} onRefetch={refetch} />
          </>
        )}
      </CardContent>

      <Dialog open={showCreate || !!editingId} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>Preencha os dados do contato no Bling</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Razão Social / Nome</Label><Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Nome Fantasia</Label><Input value={formData.fantasia} onChange={e => setFormData(p => ({ ...p, fantasia: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo Pessoa</Label>
                <Select value={formData.tipoPessoa} onValueChange={v => setFormData(p => ({ ...p, tipoPessoa: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="J">Jurídica</SelectItem>
                    <SelectItem value="F">Física</SelectItem>
                    <SelectItem value="E">Estrangeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>CPF/CNPJ</Label><Input value={formData.numeroDocumento} onChange={e => setFormData(p => ({ ...p, numeroDocumento: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nome || criarContato.isPending || atualizarContato.isPending}>
              {(criarContato.isPending || atualizarContato.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
