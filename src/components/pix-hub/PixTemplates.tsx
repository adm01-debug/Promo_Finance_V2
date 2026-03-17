import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Plus, Zap, Star, Trash2, Search, QrCode } from 'lucide-react';
import { usePixTemplates, useCreatePixTemplate, useDeletePixTemplate, useIncrementTemplateUso } from '@/hooks/usePixTemplates';
import { useEmpresas } from '@/hooks/useFinancialData';
import { toast } from 'sonner';

const TIPOS_CHAVE = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Aleatória' },
];

export function PixTemplates() {
  const { data: templates = [], isLoading } = usePixTemplates();
  const { data: empresas = [] } = useEmpresas();
  const createMutation = useCreatePixTemplate();
  const deleteMutation = useDeletePixTemplate();
  const incrementUso = useIncrementTemplateUso();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState({
    nome: '',
    favorecido_nome: '',
    favorecido_cpf_cnpj: '',
    chave_pix: '',
    tipo_chave_pix: 'cpf',
    valor_padrao: 0,
    valor_fixo: false,
    empresa_id: '',
    categoria: '',
    descricao: '',
  });

  const filtered = templates.filter(t => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return t.nome.toLowerCase().includes(b) || t.favorecido_nome.toLowerCase().includes(b) || t.chave_pix.toLowerCase().includes(b);
  });

  const handleCreate = () => {
    if (!form.nome || !form.favorecido_nome || !form.chave_pix) {
      toast.error('Preencha nome, favorecido e chave PIX');
      return;
    }
    createMutation.mutate({
      nome: form.nome,
      descricao: form.descricao || null,
      empresa_id: form.empresa_id || null,
      centro_custo_id: null,
      favorecido_nome: form.favorecido_nome,
      favorecido_cpf_cnpj: form.favorecido_cpf_cnpj || null,
      chave_pix: form.chave_pix,
      tipo_chave_pix: form.tipo_chave_pix,
      valor_padrao: form.valor_padrao,
      valor_fixo: form.valor_fixo,
      categoria: form.categoria || null,
      tags: [],
      ativo: true,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ nome: '', favorecido_nome: '', favorecido_cpf_cnpj: '', chave_pix: '', tipo_chave_pix: 'cpf', valor_padrao: 0, valor_fixo: false, empresa_id: '', categoria: '', descricao: '' });
      },
    });
  };

  const handleUseTemplate = (template: typeof templates[0]) => {
    incrementUso.mutate(template.id);
    toast.success(`Template "${template.nome}" selecionado — use na página ASAAS para executar o PIX`);
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar template..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Template
        </Button>
      </div>

      {/* Templates grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <QrCode className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum template PIX</p>
            <p className="text-xs mt-1">Crie templates para seus fornecedores recorrentes e ganhe agilidade</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(template => {
            const emp = empresas.find(e => e.id === template.empresa_id);
            return (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      {template.nome}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {template.uso_count > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Star className="h-3 w-3 mr-0.5" />{template.uso_count}x
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">{template.favorecido_nome}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chave</span>
                      <span className="font-mono text-xs truncate max-w-[180px]">{template.chave_pix}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <Badge variant="outline" className="text-[10px]">{template.tipo_chave_pix}</Badge>
                    </div>
                    {template.valor_padrao > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-bold tabular-nums">{formatCurrency(template.valor_padrao)}</span>
                      </div>
                    )}
                    {emp && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empresa</span>
                        <span className="text-xs truncate max-w-[150px]">{emp.nome_fantasia || emp.razao_social}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" className="flex-1 gap-1" onClick={() => handleUseTemplate(template)}>
                      <Zap className="h-3.5 w-3.5" /> Usar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(template.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Template PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Template *</Label>
              <Input placeholder="Ex: Fornecedor de Som" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Nome do Favorecido *</Label>
              <Input placeholder="Nome completo" value={form.favorecido_nome} onChange={e => setForm(f => ({ ...f, favorecido_nome: e.target.value }))} />
            </div>
            <div>
              <Label>CPF/CNPJ do Favorecido</Label>
              <Input placeholder="Opcional" value={form.favorecido_cpf_cnpj} onChange={e => setForm(f => ({ ...f, favorecido_cpf_cnpj: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Chave *</Label>
                <Select value={form.tipo_chave_pix} onValueChange={v => setForm(f => ({ ...f, tipo_chave_pix: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CHAVE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Chave PIX *</Label>
                <Input placeholder="Chave" value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Padrão (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.valor_padrao || ''} onChange={e => setForm(f => ({ ...f, valor_padrao: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Empresa</Label>
                <Select value={form.empresa_id} onValueChange={v => setForm(f => ({ ...f, empresa_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Categoria / Evento</Label>
              <Input placeholder="Ex: Shows, Infraestrutura" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
