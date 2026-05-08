import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Zap, CheckCircle2, AlertTriangle, Trash2, Power, Activity, Edit2, Copy, Play, Save, X, Info } from 'lucide-react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
// Tabelas novas ainda não refletidas em types.ts — cast controlado.
const supabase = supabaseTyped as unknown as {
  from: (t: string) => any;
};
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Regra {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_evento: 'conta_pagar' | 'conta_receber' | 'movimentacao';
  categoria_id: string | null;
  conta_debito_id: string;
  conta_credito_id: string;
  historico_template: string;
  prioridade: number;
  ativo: boolean;
}

interface PlanoConta {
  id: string;
  codigo: string;
  nome: string | null;
  descricao: string;
  natureza: string;
  tipo: string;
}

interface EventoLog {
  id: string;
  tipo_evento: string;
  evento_id: string;
  status: string;
  detalhe: string | null;
  created_at: string;
  lancamento_id: string | null;
}

const EVENTOS = [
  { value: 'conta_pagar', label: 'Pagamento (Conta a Pagar)' },
  { value: 'conta_receber', label: 'Recebimento (Conta a Receber)' },
  { value: 'movimentacao', label: 'Movimentação Bancária' },
] as const;

export function ContabilizacaoAutomaticaTab({ empresaId }: { empresaId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<Regra | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simForm, setSimForm] = useState({
    tipo_evento: 'conta_pagar' as Regra['tipo_evento'],
    valor: 100,
    data: new Date().toISOString().split('T')[0],
    descricao: 'Simulação de teste',
    categoria_id: '',
  });
  const [simResult, setSimResult] = useState<any>(null);

  const [form, setForm] = useState({
    nome: '',
    tipo_evento: 'conta_pagar' as Regra['tipo_evento'],
    conta_debito_id: '',
    conta_credito_id: '',
    historico_template: '{descricao}',
    prioridade: 100,
  });

  const { data: regras = [], isLoading: loadingRegras } = useQuery<Regra[]>({
    queryKey: ['regras_contab', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_contabilizacao_automatica')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('tipo_evento')
        .order('prioridade');
      if (error) throw error;
      return (data as unknown as Regra[]) ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: contas = [] } = useQuery<PlanoConta[]>({
    queryKey: ['plano_contas_analiticas', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('id, codigo, nome, descricao, natureza, tipo')
        .eq('tipo', 'analitica')
        .order('codigo');
      if (error) throw error;
      return (data as PlanoConta[]) ?? [];
    },
  });

  const { data: categorias = [] } = useQuery<{ id: string; nome: string }[]>({
    queryKey: ['categorias', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('empresa_id', empresaId)
        .order('nome');
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery<EventoLog[]>({
    queryKey: ['eventos_contab_log', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos_contabilizacao_log')
        .select('id, tipo_evento, evento_id, status, detalhe, created_at, lancamento_id')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as EventoLog[]) ?? [];
    },
    enabled: !!empresaId,
    refetchInterval: 30_000,
  });

  const createRegra = useMutation({
    mutationFn: async () => {
      if (!form.nome || !form.conta_debito_id || !form.conta_credito_id) {
        throw new Error('Preencha nome, conta débito e conta crédito');
      }
      if (form.conta_debito_id === form.conta_credito_id) {
        throw new Error('Conta de débito e crédito devem ser diferentes');
      }
      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .insert({ empresa_id: empresaId, ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra criada');
      setOpen(false);
      setForm({
        nome: '',
        tipo_evento: 'conta_pagar',
        conta_debito_id: '',
        conta_credito_id: '',
        historico_template: '{descricao}',
        prioridade: 100,
      });
      qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRegra = useMutation({
    mutationFn: async (regra: Partial<Regra> & { id: string }) => {
      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .update(regra)
        .eq('id', regra.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra atualizada');
      setEditingRegra(null);
      qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateRegra = useMutation({
    mutationFn: async (regra: Regra) => {
      const { id, ...data } = regra;
      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .insert({
          ...data,
          nome: `${data.nome} (Cópia)`,
          prioridade: (data.prioridade ?? 0) + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra duplicada');
      qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dryRunSimulation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseTyped.functions.invoke('contabilizar-evento', {
        body: {
          ...simForm,
          categoria_id: simForm.categoria_id || null,
          empresa_id: empresaId,
          evento_id: 'sim-preview-' + Date.now(),
          dry_run: true,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSimResult(data);
      toast.info('Simulação concluída');
    },
    onError: (e: Error) => toast.error('Falha na simulação: ' + e.message),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] }),
  });

  const deleteRegra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra removida');
      qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });
    },
  });

  const stats = {
    sucesso: logs.filter((l) => l.status === 'sucesso').length,
    sem_regra: logs.filter((l) => l.status === 'sem_regra').length,
    erro: logs.filter((l) => l.status === 'erro').length,
  };

  if (!empresaId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Selecione uma empresa</AlertTitle>
        <AlertDescription>
          Escolha uma empresa no topo para configurar a contabilização automática.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sucesso (50 últimos)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sucesso}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sem regra</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sem_regra}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.erro}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Regras de Contabilização Automática
            </CardTitle>
            <CardDescription>
              Cada evento financeiro dispara uma regra que gera lançamento em partidas dobradas.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={simulating} onOpenChange={setSimulating}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Play className="h-4 w-4" />Simular dry-run
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Simulação de Contabilização (Dry-run)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de evento</Label>
                      <Select
                        value={simForm.tipo_evento}
                        onValueChange={(v) => setSimForm({ ...simForm, tipo_evento: v as any })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EVENTOS.map((e) => (
                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        value={simForm.valor}
                        onChange={(e) => setSimForm({ ...simForm, valor: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={simForm.descricao}
                        onChange={(e) => setSimForm({ ...simForm, descricao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria (Opcional)</Label>
                      <Select
                        value={simForm.categoria_id}
                        onValueChange={(v) => setSimForm({ ...simForm, categoria_id: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Qualquer uma" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {categorias.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {simResult && (
                    <Alert className={simResult.status === 'simulado' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'}>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Resultado da Simulação</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Status:</span>
                          <Badge variant="outline">{simResult.status}</Badge>
                        </div>
                        {simResult.regra && (
                          <div className="flex justify-between text-xs">
                            <span>Regra aplicada:</span>
                            <span className="font-medium">{simResult.regra.nome}</span>
                          </div>
                        )}
                        {simResult.debito && (
                          <div className="flex flex-col gap-1 text-[11px] bg-background/50 p-2 rounded border border-border/50">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Débito:</span>
                              <span className="font-mono">{contas.find(c => c.id === simResult.debito)?.codigo || simResult.debito}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Crédito:</span>
                              <span className="font-mono">{contas.find(c => c.id === simResult.credito)?.codigo || simResult.credito}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-border/30">
                              <span className="text-muted-foreground">Valor:</span>
                              <span className="font-bold">R$ {simResult.valor?.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        {simResult.status === 'sem_regra' && (
                          <p className="text-xs text-amber-600">Nenhuma regra ativa foi encontrada para este tipo de evento.</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setSimulating(false); setSimResult(null); }}>Fechar</Button>
                  <Button
                    onClick={() => dryRunSimulation.mutate()}
                    disabled={dryRunSimulation.isPending}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Executar teste
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />Nova regra
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova regra de contabilização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: Pagamento de fornecedores via banco"
                  />
                </div>
                <div>
                  <Label>Tipo de evento</Label>
                  <Select
                    value={form.tipo_evento}
                    onValueChange={(v) =>
                      setForm({ ...form, tipo_evento: v as Regra['tipo_evento'] })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENTOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Conta de débito</Label>
                    <Select
                      value={form.conta_debito_id}
                      onValueChange={(v) => setForm({ ...form, conta_debito_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {contas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.codigo} — {c.nome ?? c.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Conta de crédito</Label>
                    <Select
                      value={form.conta_credito_id}
                      onValueChange={(v) => setForm({ ...form, conta_credito_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {contas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.codigo} — {c.nome ?? c.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Histórico (template)</Label>
                  <Input
                    value={form.historico_template}
                    onChange={(e) => setForm({ ...form, historico_template: e.target.value })}
                    placeholder="Use {descricao}, {valor}, {data}"
                  />
                </div>
                <div>
                  <Label>Prioridade (menor = mais alta)</Label>
                  <Input
                    type="number"
                    value={form.prioridade}
                    onChange={(e) => setForm({ ...form, prioridade: Number(e.target.value) || 100 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => createRegra.mutate()}
                  disabled={createRegra.isPending}
                >
                  Criar regra
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRegras ? (
            <Skeleton className="h-32 w-full" />
          ) : regras.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma regra cadastrada ainda. Crie a primeira para iniciar a contabilização automática.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>D / C</TableHead>
                  <TableHead className="text-right">Prio</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((r) => {
                  const dCta = contas.find((c) => c.id === r.conta_debito_id);
                  const cCta = contas.find((c) => c.id === r.conta_credito_id);
                  const isEditing = editingRegra?.id === r.id;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editingRegra.nome}
                            onChange={(e) => setEditingRegra({ ...editingRegra, nome: e.target.value })}
                            className="h-8"
                          />
                        ) : (
                          r.nome
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editingRegra.tipo_evento}
                            onValueChange={(v) =>
                              setEditingRegra({ ...editingRegra, tipo_evento: v as Regra['tipo_evento'] })
                            }
                          >
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {EVENTOS.map((e) => (
                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{r.tipo_evento}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <Select
                              value={editingRegra.conta_debito_id}
                              onValueChange={(v) => setEditingRegra({ ...editingRegra, conta_debito_id: v })}
                            >
                              <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Débito" /></SelectTrigger>
                              <SelectContent className="max-h-60">
                                {contas.map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">
                                    {c.codigo} - {c.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={editingRegra.conta_credito_id}
                              onValueChange={(v) => setEditingRegra({ ...editingRegra, conta_credito_id: v })}
                            >
                              <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Crédito" /></SelectTrigger>
                              <SelectContent className="max-h-60">
                                {contas.map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">
                                    {c.codigo} - {c.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <>D {dCta?.codigo ?? '?'} / C {cCta?.codigo ?? '?'}</>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingRegra.prioridade}
                            onChange={(e) => setEditingRegra({ ...editingRegra, prioridade: Number(e.target.value) })}
                            className="h-8 w-16 ml-auto"
                          />
                        ) : (
                          r.prioridade
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.ativo}
                          onCheckedChange={(v) =>
                            toggleAtivo.mutate({ id: r.id, ativo: v })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-500"
                                onClick={() => updateRegra.mutate(editingRegra)}
                                disabled={updateRegra.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => setEditingRegra(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingRegra(r)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => duplicateRegra.mutate(r)}
                                disabled={duplicateRegra.isPending}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  if (confirm('Deseja remover esta regra?')) {
                                    deleteRegra.mutate(r.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Últimos eventos contabilizados
          </CardTitle>
          <CardDescription>50 eventos mais recentes com regra aplicada.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <Skeleton className="h-32 w-full" />
          ) : logs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento processado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      {new Date(l.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.tipo_evento}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === 'sucesso'
                            ? 'default'
                            : l.status === 'erro'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                      {l.detalhe ?? (l.lancamento_id ? `Lançamento #${l.lancamento_id.slice(0, 8)}` : '—')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
