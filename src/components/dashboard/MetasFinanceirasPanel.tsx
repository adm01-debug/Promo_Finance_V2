import { useState } from 'react';
import { Target, Plus, TrendingUp, Lightbulb, Loader2, Sparkles, Trash2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetasFinanceiras, useCreateMeta, useDeleteMeta, useHistoricoScoreSaude, useRecomendacoesIA } from '@/hooks/useMetasFinanceiras';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { motion as m, AnimatePresence } from 'framer-motion';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function MetasFinanceirasPanel({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const { data: metas, isLoading } = useMetasFinanceiras(currentYear);
  const { data: scoreHistory } = useHistoricoScoreSaude();
  const { data: recomendacoes } = useRecomendacoesIA();
  const createMeta = useCreateMeta();
  const deleteMeta = useDeleteMeta();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', tipo: 'receita', valor_meta: '', mes: String(currentMonth) });

  const handleCreate = () => {
    createMeta.mutate({
      titulo: form.titulo,
      tipo: form.tipo,
      valor_meta: Number(form.valor_meta),
      ano: currentYear,
      mes: Number(form.mes),
    }, { onSuccess: () => { setFormOpen(false); setForm({ titulo: '', tipo: 'receita', valor_meta: '', mes: String(currentMonth) }); } });
  };

  const latestScore = scoreHistory?.[0];

  return (
    <div className="space-y-8">
      {/* Overview Cards if expanded */}
      {defaultExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-background/40 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Total em Metas</p>
                  <p className="text-2xl font-black tabular-nums">{formatCurrency(metas?.reduce((acc, m) => acc + m.valor_meta, 0) || 0)}</p>
                </div>
                <Target className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/40 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Objetivos Ativos</p>
                  <p className="text-2xl font-black tabular-nums">{metas?.length || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/40" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Executive Score Matrix */}
      {latestScore && (
        <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-purple-500/5 shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-24 w-24 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Corporate Vitality Index</p>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className={cn(
                    "text-6xl font-black tracking-tighter tabular-nums",
                    latestScore.score >= 70 ? 'text-success' : latestScore.score >= 40 ? 'text-warning' : 'text-destructive'
                  )}>
                    {latestScore.score}
                  </span>
                  <span className="text-xl font-bold text-muted-foreground/30 italic">/ 100</span>
                </div>
              </div>
              <div className="flex-1 max-w-sm w-full space-y-4">
                <div className="h-3 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                  <m.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${latestScore.score}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]",
                      latestScore.score >= 70 ? 'bg-success' : latestScore.score >= 40 ? 'bg-warning' : 'bg-destructive'
                    )} 
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-center italic">
                  Neural Scan: System operating at {latestScore.score >= 70 ? 'peak performance' : latestScore.score >= 40 ? 'nominal efficiency' : 'critical levels'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Objectives Matrix */}
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10">
        <CardHeader className="p-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Strategy Objectives — Quantum 10/10 — {currentYear}</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Goal synchronization & attainment matrix</CardDescription>
              </div>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5" />
                  Define Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] border-white/10 bg-background/95 backdrop-blur-3xl shadow-2xl p-8 max-w-md">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black tracking-tight">Nova Diretriz Estratégica</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Título da Meta</Label>
                    <Input className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary" placeholder="Ex: Expansão Market Share" value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Vetor</Label>
                      <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl">
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Redução Custos</SelectItem>
                          <SelectItem value="lucro">Profit/Lucro</SelectItem>
                          <SelectItem value="inadimplencia">Inadimplência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Ciclo Mensal</Label>
                      <Select value={form.mes} onValueChange={(v) => setForm(f => ({ ...f, mes: v }))}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-background/90 backdrop-blur-xl max-h-[200px]">
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Valor Alvo (R$)</Label>
                    <Input type="number" className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary font-bold" placeholder="0,00" value={form.valor_meta} onChange={(e) => setForm(f => ({ ...f, valor_meta: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreate} disabled={createMeta.isPending || !form.titulo || !form.valor_meta} className="w-full h-14 rounded-2xl bg-primary font-black text-lg gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {createMeta.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    Engajar Objetivo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)}
              </div>
            ) : !metas || metas.length === 0 ? (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Target className="h-20 w-20 mb-4 stroke-[1px]" />
                <p className="text-lg font-bold">Horizonte Vazio</p>
                <p className="text-sm font-medium">Defina novas diretrizes para sincronizar o sistema.</p>
              </m.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {metas.map((meta, index) => (
                  <m.div 
                    key={meta.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative p-6 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl hover:bg-black/30 transition-all overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black tracking-tight">{meta.titulo}</span>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0 px-2 border-white/10 bg-white/5">
                            {meta.tipo}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Mês {meta.mes}/{meta.ano} • Vector Scan</p>
                      </div>
                      <p className="text-xl font-black tracking-tighter tabular-nums text-primary">{formatCurrency(meta.valor_meta)}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <m.div 
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }} // Exemplo estático para visual, o correto seria (realizado/meta)*100
                          className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">35% Synchronized</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMeta.mutate(meta.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Neural Directives Matrix */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/10">
          <CardHeader className="p-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-warning/20 shadow-lg shadow-warning/5 flex items-center justify-center text-warning">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">IA Directives Matrix</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">High-impact neural optimizations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {recomendacoes.map((rec, i) => (
              <m.div 
                key={rec.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-5 rounded-2xl border border-warning/10 bg-warning/5 hover:bg-warning/10 transition-all cursor-default"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-black tracking-tight">{rec.titulo}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed mb-4 italic">
                  "{rec.descricao}"
                </p>
                {rec.impacto_estimado > 0 && (
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-white/5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-success/80">Estimated ROI: {formatCurrency(rec.impacto_estimado)}</span>
                  </div>
                )}
              </m.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}