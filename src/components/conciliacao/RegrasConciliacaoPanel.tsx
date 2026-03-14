import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export function RegrasConciliacaoPanel() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: regras, isLoading } = useQuery({
    queryKey: ['regras-conciliacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_conciliacao')
        .select('*')
        .order('vezes_aplicada', { ascending: false });
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

  const filtered = regras?.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.padrao_descricao.toLowerCase().includes(s) || r.entidade_nome.toLowerCase().includes(s);
  }) || [];

  return (
    <Card className="card-base">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-warning" />
            Regras Automáticas
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nova Regra
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar regras..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
