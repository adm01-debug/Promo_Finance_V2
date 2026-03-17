import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Edit2, Trash2, Loader2, Mail, Phone, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';
import { useVendedores, useCreateVendedor, useUpdateVendedor, useDeleteVendedor } from '@/hooks/useVendedores';
import { formatCurrency } from '@/lib/formatters';
import { VendedorDashboard } from '@/components/vendedores/VendedorDashboard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function Vendedores() {
  const { data: vendedores, isLoading } = useVendedores();
  const createVendedor = useCreateVendedor();
  const updateVendedor = useUpdateVendedor();
  const deleteVendedor = useDeleteVendedor();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', meta_mensal: '' });

  const handleSubmit = () => {
    const payload = {
      nome: form.nome,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      meta_mensal: form.meta_mensal ? Number(form.meta_mensal) : undefined,
    };

    if (editingId) {
      updateVendedor.mutate({ id: editingId, ...payload }, {
        onSuccess: () => { setFormOpen(false); setEditingId(null); resetForm(); },
      });
    } else {
      createVendedor.mutate(payload, {
        onSuccess: () => { setFormOpen(false); resetForm(); },
      });
    }
  };

  const resetForm = () => setForm({ nome: '', email: '', telefone: '', meta_mensal: '' });

  const startEdit = (v: { id: string; nome: string; email: string | null; telefone: string | null; meta_mensal: number | null }) => {
    setEditingId(v.id);
    setForm({ nome: v.nome, email: v.email || '', telefone: v.telefone || '', meta_mensal: v.meta_mensal?.toString() || '' });
    setFormOpen(true);
  };

  const ativos = vendedores?.filter(v => v.ativo) || [];
  const inativos = vendedores?.filter(v => !v.ativo) || [];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md text-foreground">Vendedores</h1>
            <p className="text-muted-foreground mt-1">Gestão da equipe comercial</p>
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingId(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Novo Vendedor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Novo'} Vendedor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
                <div><Label>Meta Mensal (R$)</Label><Input type="number" value={form.meta_mensal} onChange={(e) => setForm(f => ({ ...f, meta_mensal: e.target.value }))} /></div>
                <Button onClick={handleSubmit} disabled={createVendedor.isPending || updateVendedor.isPending || !form.nome} className="w-full">
                  {(createVendedor.isPending || updateVendedor.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Ativos</p><p className="text-2xl font-bold">{ativos.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Meta Total Mensal</p><p className="text-2xl font-bold">{formatCurrency(ativos.reduce((s, v) => s + (v.meta_mensal || 0), 0))}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Inativos</p><p className="text-2xl font-bold">{inativos.length}</p></CardContent></Card>
        </motion.div>

        {/* Lista */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Equipe Comercial</CardTitle>
              <CardDescription>{ativos.length} vendedores ativos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : ativos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum vendedor cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ativos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{v.nome}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {v.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>}
                            {v.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.telefone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.meta_mensal && (
                          <Badge variant="outline" className="gap-1">
                            <Target className="h-3 w-3" />{formatCurrency(v.meta_mensal)}/mês
                          </Badge>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => startEdit(v)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteVendedor.mutate(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
