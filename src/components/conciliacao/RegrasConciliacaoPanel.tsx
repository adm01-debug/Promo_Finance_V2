import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Trash2, Search, Table, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';

export function RegrasConciliacaoPanel() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [previewExtrato, setPreviewExtrato] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { currentEmpresaId } = useAuth();
  const queryClient = useQueryClient();

  const { data: regras, isLoading } = useQuery({
    queryKey: ['regras-conciliacao', currentEmpresaId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('regras_conciliacao')
        .select('*')
        .order('vezes_aplicada', { ascending: false });
      
      if (currentEmpresaId) {
        query = query.eq('empresa_id', currentEmpresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleRegra = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('regras_conciliacao')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] }),
  });

  const deleteRegra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('regras_conciliacao').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
      toast.success('Regra removida');
    },
  });

  const generatePreview = () => {
    const mockExtrato = [
      { id: 'm1', data: '2024-05-01', descricao: 'PIX FORNECEDOR ABC SERVICOS', valor: -1500.00, tipo: 'debito' },
      { id: 'm2', data: '2024-05-02', descricao: 'RECEBIMENTO CLIENTE XYZ LTDA', valor: 4500.00, tipo: 'credito' },
      { id: 'm3', data: '2024-05-03', descricao: 'TARIFA BANCARIA MANUTENCAO', valor: -45.90, tipo: 'debito' },
    ];

    const preview = mockExtrato.map(item => {
      const match = regras?.find(r => 
        r.ativo && item.descricao.toUpperCase().includes(r.padrao_descricao.toUpperCase())
      );
      return { ...item, match };
    });

    setPreviewExtrato(preview);
    setShowPreview(true);
  };

  const filtered = regras?.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.padrao_descricao || '').toLowerCase().includes(s) || (r.entidade_nome || '').toLowerCase().includes(s);
  }) || [];

  return (
    <Card className="card-base group overflow-hidden border-primary/10 shadow-xl shadow-primary/5">
      <CardHeader className="pb-3 border-b border-primary/5 bg-primary/[0.02]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-black">
              <Zap className="h-5 w-5 text-warning animate-pulse" />
              Regras de Conciliação
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/40">
              Mapeamento Inteligente por CNPJ
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={generatePreview} className="gap-2 h-9 px-4 rounded-xl hover:bg-primary/10 text-primary font-bold">
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 font-black shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Nova Regra
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {filtered.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
            <Input 
              placeholder="Buscar regras por descrição ou entidade..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-11 h-12 rounded-2xl border-primary/10 bg-primary/[0.02] focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isLoading ? 'Carregando...' : 'Nenhuma regra cadastrada. Regras são criadas automaticamente ao confirmar matches manuais.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filtered.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Switch
                  checked={r.ativo}
                  onCheckedChange={(checked) => toggleRegra.mutate({ id: r.id, ativo: checked })}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    "{r.padrao_descricao}" → {r.entidade_nome}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {r.lancamento_tipo === 'pagar' ? 'Despesa' : 'Receita'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Aplicada {r.vezes_aplicada}x
                    </span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteRegra.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddRegraDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-primary/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Prévia de Conciliação
            </DialogTitle>
            <CardDescription>
              Demonstração de como as regras atuais seriam aplicadas a um extrato simulado.
            </CardDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] mt-4 rounded-2xl border border-primary/5 bg-primary/[0.01]">
            <div className="p-4 space-y-3">
              {previewExtrato.map(item => (
                <div key={item.id} className="flex flex-col p-4 rounded-2xl border bg-card/50 transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black opacity-40 uppercase tracking-tighter">{item.data}</span>
                    <span className={cn("text-sm font-black", item.valor < 0 ? "text-destructive" : "text-success")}>
                      {formatCurrency(item.valor)}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate mb-3">{item.descricao}</p>
                  
                  {item.match ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/10 animate-in fade-in slide-in-from-bottom-2">
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-success/60">Match Encontrado</p>
                        <p className="text-sm font-black truncate">{item.match.entidade_nome}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 border-dashed">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                        <Search className="h-4 w-4 text-primary/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Sem Match Automático</p>
                        <p className="text-sm font-bold text-muted-foreground/60 italic">Requer conciliação manual</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowPreview(false)} className="rounded-xl px-8 font-black">Fechar Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddRegraDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [padrao, setPadrao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [tipo, setTipo] = useState<string>('pagar');
  const queryClient = useQueryClient();

  const addRegra = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from('regras_conciliacao').insert({
        padrao_descricao: padrao,
        entidade_nome: entidade,
        lancamento_tipo: tipo,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-conciliacao'] });
      toast.success('Regra criada');
      onOpenChange(false);
      setPadrao('');
      setEntidade('');
    },
    onError: () => toast.error('Erro ao criar regra'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Regra de Conciliação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Padrão de descrição (extrato)</Label>
            <Input placeholder="Ex: PIX FORNECEDOR ABC" value={padrao} onChange={e => setPadrao(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Texto que aparece no extrato bancário</p>
          </div>
          <div>
            <Label>Entidade (fornecedor/cliente)</Label>
            <Input placeholder="Ex: ABC Comércio Ltda" value={entidade} onChange={e => setEntidade(e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pagar">Despesa (Contas a Pagar)</SelectItem>
                <SelectItem value="receber">Receita (Contas a Receber)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => addRegra.mutate()} disabled={!padrao || !entidade}>Criar Regra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
