import { useState } from 'react';
import { Target, Plus, TrendingUp, Lightbulb, Loader2, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-6">
      {latestScore && (
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Score de Vitalidade</p>
                <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                  <span className={cn(
                    "text-4xl font-bold tracking-tight tabular-nums",
                    latestScore.score >= 70 ? 'text-emerald-600' : latestScore.score >= 40 ? 'text-amber-600' : 'text-rose-600'
                  )}>
                    {latestScore.score}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="flex-1 max-w-xs w-full space-y-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <m.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${latestScore.score}%` }}
                    transition={{ duration: 1 }}
                    className={cn(
                      "h-full rounded-full",
                      latestScore.score >= 70 ? 'bg-emerald-500' : latestScore.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    )} 
                  />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground text-center italic leading-relaxed">
                  Sistema operando em nível {latestScore.score >= 70 ? 'ótimo' : latestScore.score >= 40 ? 'estável' : 'crítico'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Objetivos Estratégicos</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Metas para {currentYear}</CardDescription>
              </div>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 px-4 rounded-lg bg-primary text-white font-bold gap-2">
                  <Plus className="h-4 w-4" />
                  Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl p-6 max-w-sm">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-bold">Nova Meta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Título</Label>
                    <Input className="h-10 rounded-lg" placeholder="Ex: Meta de Faturamento" value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Tipo</Label>
                      <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                        <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                          <SelectItem value="lucro">Lucro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Mês</Label>
                      <Select value={form.mes} onValueChange={(v) => setForm(f => ({ ...f, mes: v }))}>
                        <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('pt-BR', { month: 'short' })}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">Valor Alvo</Label>
                    <Input type="number" className="h-10 rounded-lg font-bold" placeholder="0,00" value={form.valor_meta} onChange={(e) => setForm(f => ({ ...f, valor_meta: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreate} disabled={createMeta.isPending || !form.titulo || !form.valor_meta} className="w-full h-11 rounded-lg bg-primary text-white font-bold gap-2 mt-2">
                    {createMeta.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Definir Objetivo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg bg-muted/50" />)}
              </div>
            ) : !metas || metas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Target className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm font-bold">Sem metas definidas</p>
                <p className="text-xs">Clique em 'Meta' para começar.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {metas.map((meta, index) => (
                  <m.div 
                    key={meta.id} 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group relative p-4 rounded-lg border border-border bg-muted/30 hover:bg-card transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-foreground truncate">{meta.titulo}</span>
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-auto rounded-sm uppercase bg-card">
                            {meta.tipo}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">Mês {meta.mes}/{meta.ano}</p>
                      </div>
                      <p className="text-sm font-bold text-primary tabular-nums">{formatCurrency(meta.valor_meta)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <m.div 
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600">35% atingido</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMeta.mutate(meta.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Recomendações</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Otimizações de alto impacto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {recomendacoes.map((rec, i) => (
              <m.div 
                key={rec.id} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border border-amber-100 bg-amber-50/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-sm font-bold text-foreground">{rec.titulo}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {rec.descricao}
                </p>
                {rec.impacto_estimado > 0 && (
                  <div className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-card border border-amber-100">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">Impacto: {formatCurrency(rec.impacto_estimado)}</span>
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