import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, CheckCircle2, AlertTriangle, Trash2, Power, Activity, Edit2, Copy, Play, Save, X, Info, ArrowDownAZ, ArrowUpAZ, History as HistoryIcon, ArrowRightLeft, Layers, RefreshCcw } from 'lucide-react';
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
  const [originalRegra, setOriginalRegra] = useState<Regra | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [simulating, setSimulating] = useState(false);
  const [simForm, setSimForm] = useState({
    tipo_evento: 'conta_pagar' as Regra['tipo_evento'],
    valor: 100,
    data: new Date().toISOString().split('T')[0],
    descricao: 'Simulação de teste',
    categoria_id: '',
    lote_quantidade: 1,
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [dryRunBefore, setDryRunBefore] = useState<any>(null);
  const [isLote, setIsLote] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    tipo_evento: 'conta_pagar' as Regra['tipo_evento'],
    categoria_id: null as string | null,
    conta_debito_id: '',
    conta_credito_id: '',
    historico_template: '{descricao}',
    prioridade: 100,
  });

  const { data: rawRegras = [], isLoading: loadingRegras } = useQuery<Regra[]>({
    queryKey: ['regras_contab', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_contabilizacao_automatica')
        .select('*')
        .eq('empresa_id', empresaId);
      if (error) throw error;
      return (data as unknown as Regra[]) ?? [];
    },
    enabled: !!empresaId,
  });

  const regras = [...rawRegras].sort((a, b) => {
    return sortOrder === 'asc' ? a.prioridade - b.prioridade : b.prioridade - a.prioridade;
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
        categoria_id: null,
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
      if (!regra.nome || !regra.conta_debito_id || !regra.conta_credito_id) {
        throw new Error('Mapeamento incompleto: preencha nome e contas de D/C');
      }
      if (regra.prioridade === undefined || isNaN(regra.prioridade) || regra.prioridade < 0) {
        throw new Error('Prioridade inválida: deve ser um número positivo');
      }
      if (regra.conta_debito_id === regra.conta_credito_id) {
        throw new Error('Contas de débito e crédito devem ser diferentes');
      }

      const { error } = await supabase
        .from('regras_contabilizacao_automatica')
        .update(regra)
        .eq('id', regra.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra atualizada');
      setEditingRegra(null);
      setOriginalRegra(null);
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
      setSimResult(null);
      setDryRunBefore(null);

      const payload = {
        ...simForm,
        categoria_id: simForm.categoria_id === 'none' ? null : (simForm.categoria_id || null),
        empresa_id: empresaId,
        dry_run: true,
      };

      if (isLote) {
        const results = [];
        for (let i = 0; i < simForm.lote_quantidade; i++) {
          const { data, error } = await supabaseTyped.functions.invoke('contabilizar-evento', {
            body: { ...payload, evento_id: `sim-lote-${i}-${Date.now()}` },
          });
          if (error) throw error;
          results.push(data);
        }
        return { type: 'lote', results };
      }

      // 1. Antes (Sem regras)
      const { data: before, error: errBefore } = await supabaseTyped.functions.invoke('contabilizar-evento', {
        body: { ...payload, evento_id: 'sim-before-' + Date.now(), ignore_rules: true },
      });
      if (errBefore) throw errBefore;
      setDryRunBefore(before);

      // 2. Depois (Com regras)
      const { data: after, error: errAfter } = await supabaseTyped.functions.invoke('contabilizar-evento', {
        body: { ...payload, evento_id: 'sim-after-' + Date.now() },
      });
      if (errAfter) throw errAfter;

      return { type: 'single', after };
    },
    onSuccess: (data) => {
      setSimResult(data);
      toast.info(isLote ? 'Simulação em lote concluída' : 'Simulação concluída');
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
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              Prioridade
            </Button>
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
                  <div className="flex items-center gap-2 mb-4 bg-muted/30 p-1 rounded-md">
                    <Button 
                      variant={!isLote ? "secondary" : "ghost"} 
                      size="sm" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => setIsLote(false)}
                    >
                      Evento Único
                    </Button>
                    <Button 
                      variant={isLote ? "secondary" : "ghost"} 
                      size="sm" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => setIsLote(true)}
                    >
                      Lote (Stress Test)
                    </Button>
                  </div>

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
                      <Label>{isLote ? 'Valor base' : 'Valor'}</Label>
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

                  {isLote && (
                    <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Quantidade no lote
                        </Label>
                        <Badge variant="secondary">{simForm.lote_quantidade} eventos</Badge>
                      </div>
                      <Input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={simForm.lote_quantidade} 
                        onChange={(e) => setSimForm({...simForm, lote_quantidade: parseInt(e.target.value)})}
                        className="h-4"
                      />
                    </div>
                  )}

                  {simResult && simResult.type === 'single' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium border-b pb-2">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                        Visualização Comparativa "Antes e Depois"
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Estado Atual (Sem Regras)</Label>
                          <div className="min-h-[120px] rounded-lg border border-dashed flex flex-col p-3 bg-muted/10">
                            {dryRunBefore?.status === 'sem_regra' ? (
                              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                <X className="h-6 w-6 text-muted-foreground/30 mb-1" />
                                <span className="text-[10px] text-muted-foreground">Nenhum lançamento automático configurado para este evento.</span>
                              </div>
                            ) : (
                              <div className="text-[10px] space-y-2">
                                <div className="flex justify-between items-center border-b border-muted pb-1 mb-1">
                                  <span className="font-bold text-muted-foreground">Lançamento Padrão</span>
                                  <Badge variant="outline" className="text-[8px] h-3 px-1">ATIVO</Badge>
                                </div>
                                <div className="grid grid-cols-5 gap-1 font-mono">
                                  <span className="col-span-1 text-muted-foreground">D:</span>
                                  <span className="col-span-4">{contas.find(c => c.id === dryRunBefore?.debito)?.codigo || '—'}</span>
                                  <span className="col-span-1 text-muted-foreground">C:</span>
                                  <span className="col-span-4">{contas.find(c => c.id === dryRunBefore?.credito)?.codigo || '—'}</span>
                                  <span className="col-span-1 text-muted-foreground">V:</span>
                                  <span className="col-span-4 text-emerald-600 font-bold">R$ {dryRunBefore?.valor?.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase text-emerald-600 font-bold">Simulação (Com Regras)</Label>
                          <div className={`min-h-[120px] rounded-lg border ${simResult.after.status === 'simulado' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'} p-3`}>
                            {simResult.after.status === 'simulado' ? (
                              <div className="text-[10px] space-y-2">
                                <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1 mb-1">
                                  <Badge variant="outline" className="text-[8px] h-3 px-1 border-emerald-500/50 text-emerald-700 bg-emerald-100/50">NOVO FLUXO</Badge>
                                  <span className="font-bold text-emerald-700">R$ {simResult.after.valor?.toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1 font-mono">
                                  <span className="col-span-1 text-emerald-600/70">D:</span>
                                  <span className="col-span-4 font-bold">{contas.find(c => c.id === simResult.after.debito)?.codigo || '?'}</span>
                                  <span className="col-span-1 text-emerald-600/70">C:</span>
                                  <span className="col-span-4 font-bold">{contas.find(c => c.id === simResult.after.credito)?.codigo || '?'}</span>
                                </div>
                                <div className="mt-2 pt-1 border-t border-emerald-500/10 text-[9px] text-emerald-800/70 flex items-center gap-1">
                                  <Zap className="h-2 w-2" /> {simResult.after.regra.nome}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full py-4">
                                <AlertTriangle className="h-6 w-6 text-amber-500 mb-1" />
                                <span className="text-[10px] text-amber-600 text-center font-medium">Nenhuma regra compatível encontrada.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simResult && simResult.type === 'lote' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          Resumo do Processamento em Lote
                        </div>
                        <Badge variant="outline">{simResult.results.length} Eventos</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-emerald-700">
                            {simResult.results.filter((r: any) => r.status === 'simulado').length}
                          </div>
                          <div className="text-[10px] uppercase text-emerald-600 font-bold">Sucesso</div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-amber-700">
                            {simResult.results.filter((r: any) => r.status === 'sem_regra').length}
                          </div>
                          <div className="text-[10px] uppercase text-amber-600 font-bold">Sem Regra</div>
                        </div>
                        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-destructive">
                            {simResult.results.filter((r: any) => r.error).length}
                          </div>
                          <div className="text-[10px] uppercase text-destructive font-bold">Falhas</div>
                        </div>
                      </div>

                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                        {simResult.results.map((r: any, idx: number) => (
                          <div key={idx} className="text-[9px] flex items-center justify-between p-1 border-b last:border-0 hover:bg-muted/50">
                            <span className="text-muted-foreground">Evento #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              {r.status === 'simulado' ? (
                                <>
                                  <span className="font-mono">{contas.find(c => c.id === r.debito)?.codigo} / {contas.find(c => c.id === r.credito)?.codigo}</span>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                </>
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label>Categoria (Filtro)</Label>
                    <Select
                      value={form.categoria_id || 'all'}
                      onValueChange={(v) =>
                        setForm({ ...form, categoria_id: v === 'all' ? null : v })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Qualquer uma</SelectItem>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Prio
                      {sortOrder === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />}
                    </div>
                  </TableHead>
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
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingRegra.nome}
                              onChange={(e) => setEditingRegra({ ...editingRegra, nome: e.target.value })}
                              className="h-8"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              title="Restaurar nome"
                              onClick={() => setEditingRegra({ ...editingRegra, nome: originalRegra?.nome || '' })}
                            >
                              <RefreshCcw className="h-3 w-3" />
                            </Button>
                          </div>
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
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">{r.tipo_evento}</Badge>
                            {r.categoria_id && (
                              <Badge variant="secondary" className="text-[9px] h-4">
                                {categorias.find(c => c.id === r.categoria_id)?.nome || 'Cat. externa'}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 relative group">
                            <div className="flex items-center gap-1">
                              <Select
                                value={editingRegra.conta_debito_id}
                                onValueChange={(v) => setEditingRegra({ ...editingRegra, conta_debito_id: v })}
                              >
                                <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Débito" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {contas.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                      {c.codigo} - {c.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-1">
                              <Select
                                value={editingRegra.conta_credito_id}
                                onValueChange={(v) => setEditingRegra({ ...editingRegra, conta_credito_id: v })}
                              >
                                <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Crédito" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {contas.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                      {c.codigo} - {c.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Restaurar contas"
                              onClick={() => setEditingRegra({ 
                                ...editingRegra, 
                                conta_debito_id: originalRegra?.conta_debito_id || '',
                                conta_credito_id: originalRegra?.conta_credito_id || ''
                              })}
                            >
                              <RefreshCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>D {dCta?.codigo ?? '?'} / C {cCta?.codigo ?? '?'}</>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              value={editingRegra.prioridade}
                              onChange={(e) => setEditingRegra({ ...editingRegra, prioridade: Number(e.target.value) })}
                              className="h-8 w-16"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground"
                              title="Restaurar prioridade"
                              onClick={() => setEditingRegra({ ...editingRegra, prioridade: originalRegra?.prioridade || 100 })}
                            >
                              <RefreshCcw className="h-3 w-3" />
                            </Button>
                          </div>
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
                                onClick={() => {
                                  setEditingRegra(null);
                                  setOriginalRegra(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {originalRegra && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-blue-500"
                                  title="Restaurar valores originais"
                                  onClick={() => setEditingRegra(originalRegra)}
                                >
                                  <HistoryIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingRegra(r);
                                  setOriginalRegra(r);
                                }}
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
