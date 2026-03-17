import { useState } from 'react';
import { FileText, Calendar, RefreshCw, Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useContratos, useCreateContrato, useUpdateContrato, useDeleteContrato } from '@/hooks/useContratos';

const statusColors: Record<string, string> = {
  ativo: 'bg-success/10 text-success border-success/30',
  suspenso: 'bg-warning/10 text-warning border-warning/30',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/30',
  vencido: 'bg-muted text-muted-foreground',
};

export function GestaoContratos() {
  const { data: contratos, isLoading } = useContratos();
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();
  const deleteContrato = useDeleteContrato();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: '', tipo: 'servico', data_inicio: '', data_fim: '',
    valor_mensal: '', valor_total: '', numero_contrato: '', observacoes: '',
    renovacao_automatica: false, dias_aviso_renovacao: '30',
  });

  const handleCreate = () => {
    createContrato.mutate({
      descricao: form.descricao,
      tipo: form.tipo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || undefined,
      valor_mensal: form.valor_mensal ? Number(form.valor_mensal) : undefined,
      valor_total: form.valor_total ? Number(form.valor_total) : undefined,
      numero_contrato: form.numero_contrato || undefined,
      observacoes: form.observacoes || undefined,
      renovacao_automatica: form.renovacao_automatica,
      dias_aviso_renovacao: Number(form.dias_aviso_renovacao),
    }, {
      onSuccess: () => {
        setFormOpen(false);
        setForm({ descricao: '', tipo: 'servico', data_inicio: '', data_fim: '', valor_mensal: '', valor_total: '', numero_contrato: '', observacoes: '', renovacao_automatica: false, dias_aviso_renovacao: '30' });
      },
    });
  };

  if (isLoading) return <Card><CardContent className="p-6"><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Gestão de Contratos</CardTitle>
              <CardDescription>Contratos com clientes e fornecedores</CardDescription>
            </div>
          </div>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Novo Contrato</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Descrição *</Label><Input value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="fornecimento">Fornecimento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nº Contrato</Label><Input value={form.numero_contrato} onChange={(e) => setForm(f => ({ ...f, numero_contrato: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data Início *</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
                  <div><Label>Data Fim</Label><Input type="date" value={form.data_fim} onChange={(e) => setForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor Mensal</Label><Input type="number" value={form.valor_mensal} onChange={(e) => setForm(f => ({ ...f, valor_mensal: e.target.value }))} /></div>
                  <div><Label>Valor Total</Label><Input type="number" value={form.valor_total} onChange={(e) => setForm(f => ({ ...f, valor_total: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Renovação Automática</Label>
                  <Switch checked={form.renovacao_automatica} onCheckedChange={(v) => setForm(f => ({ ...f, renovacao_automatica: v }))} />
                </div>
                {form.renovacao_automatica && (
                  <div><Label>Dias Aviso Renovação</Label><Input type="number" value={form.dias_aviso_renovacao} onChange={(e) => setForm(f => ({ ...f, dias_aviso_renovacao: e.target.value }))} /></div>
                )}
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
                <Button onClick={handleCreate} disabled={createContrato.isPending || !form.descricao || !form.data_inicio} className="w-full">
                  {createContrato.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar Contrato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!contratos || contratos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum contrato cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contratos.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.descricao}</p>
                    {c.numero_contrato && <Badge variant="outline" className="text-xs">{c.numero_contrato}</Badge>}
                    <Badge className={statusColors[c.status] || ''} variant="outline">{c.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.tipo} • {formatDate(c.data_inicio)} {c.data_fim ? `→ ${formatDate(c.data_fim)}` : '(indefinido)'}
                    {c.renovacao_automatica && <span className="ml-2">🔄 Auto-renova</span>}
                  </p>
                </div>
                <div className="text-right mr-4">
                  {c.valor_mensal && <p className="font-semibold">{formatCurrency(c.valor_mensal)}/mês</p>}
                  {c.valor_total && <p className="text-sm text-muted-foreground">Total: {formatCurrency(c.valor_total)}</p>}
                </div>
                <div className="flex gap-1">
                  {c.status === 'ativo' && (
                    <Button size="icon" variant="ghost" onClick={() => deleteContrato.mutate(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
