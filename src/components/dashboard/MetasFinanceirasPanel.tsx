import { useState } from 'react';
import { Target, Plus, TrendingUp, Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetasFinanceiras, useCreateMeta, useDeleteMeta, useHistoricoScoreSaude, useRecomendacoesIA } from '@/hooks/useMetasFinanceiras';
import { formatCurrency } from '@/lib/formatters';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function MetasFinanceirasPanel() {
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
      {/* Score de Saúde Financeira */}
      {latestScore && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score de Saúde Financeira</p>
                <p className={`text-4xl font-bold ${latestScore.score >= 70 ? 'text-success' : latestScore.score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                  {latestScore.score}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={latestScore.score} className="mt-3" />
          </CardContent>
        </Card>
      )}

      {/* Metas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Metas Financeiras {currentYear}</CardTitle>
                <CardDescription>Acompanhamento de metas e objetivos</CardDescription>
              </div>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nova Meta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Meta Financeira</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Redução de Despesa</SelectItem>
                        <SelectItem value="lucro">Lucro</SelectItem>
                        <SelectItem value="inadimplencia">Redução de Inadimplência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valor Meta (R$)</Label><Input type="number" value={form.valor_meta} onChange={(e) => setForm(f => ({ ...f, valor_meta: e.target.value }))} /></div>
                  <div>
                    <Label>Mês</Label>
                    <Select value={form.mes} onValueChange={(v) => setForm(f => ({ ...f, mes: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} disabled={createMeta.isPending || !form.titulo || !form.valor_meta} className="w-full">
                    {createMeta.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar Meta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : !metas || metas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma meta definida para {currentYear}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metas.map((meta) => (
                <div key={meta.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{meta.titulo}</p>
                      <p className="text-xs text-muted-foreground capitalize">{meta.tipo} • Mês {meta.mes}/{meta.ano}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(meta.valor_meta)}</p>
                  </div>
                  <Progress value={((meta.valor_realizado || 0) / meta.valor_meta) * 100} className="h-2" />
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatCurrency(meta.valor_realizado || 0)} realizado</span>
                    <span>{(((meta.valor_realizado || 0) / meta.valor_meta) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações IA */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              <CardTitle>Recomendações IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recomendacoes.map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg border border-warning/20 bg-warning/5">
                <p className="font-medium text-sm">{rec.titulo}</p>
                <p className="text-xs text-muted-foreground mt-1">{rec.descricao}</p>
                {rec.impacto_estimado > 0 && (
                  <Badge variant="outline" className="mt-2 text-xs">Impacto: {formatCurrency(rec.impacto_estimado)}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
