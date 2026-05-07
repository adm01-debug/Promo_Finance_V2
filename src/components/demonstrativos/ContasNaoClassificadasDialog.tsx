import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Save, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ContaNaoClassificada } from '@/hooks/useDemonstrativosContabeis';

const OPCOES_CENTRO_RESULTADO = [
  { value: 'receita_operacional', label: 'Receita Operacional' },
  { value: 'receita_financeira', label: 'Receita Financeira' },
  { value: 'deducao_receita', label: 'Dedução da Receita (impostos sobre venda)' },
  { value: 'cmv', label: 'CMV / Custo dos Produtos' },
  { value: 'despesa_administrativa', label: 'Despesa Administrativa' },
  { value: 'despesa_comercial', label: 'Despesa Comercial / Vendas' },
  { value: 'despesa_financeira', label: 'Despesa Financeira' },
  { value: 'despesa_operacional', label: 'Outras Despesas Operacionais' },
  { value: 'irpj_csll', label: 'IRPJ / CSLL' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contas: ContaNaoClassificada[];
  isLoading?: boolean;
}

export const ContasNaoClassificadasDialog = ({ open, onOpenChange, contas, isLoading }: Props) => {
  const qc = useQueryClient();
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Inicializa com sugestões
  useMemo(() => {
    if (open) {
      const initial: Record<string, string> = {};
      contas.forEach((c) => {
        if (c.conta_id && c.centro_resultado_sugerido) {
          initial[c.conta_id] = c.centro_resultado_sugerido;
        }
      });
      setSelecoes(initial);
    }
  }, [open, contas]);

  const aplicarSugestoes = () => {
    const novas: Record<string, string> = { ...selecoes };
    contas.forEach((c) => {
      if (c.conta_id && c.centro_resultado_sugerido && !novas[c.conta_id]) {
        novas[c.conta_id] = c.centro_resultado_sugerido;
      }
    });
    setSelecoes(novas);
    toast.success('Sugestões aplicadas');
  };

  const salvar = async () => {
    const updates = Object.entries(selecoes).filter(([, v]) => v);
    if (updates.length === 0) {
      toast.error('Selecione ao menos uma classificação');
      return;
    }
    setSalvando(true);
    try {
      for (const [conta_id, centro_resultado] of updates) {
        const { error } = await supabase
          .from('plano_contas')
          .update({ centro_resultado })
          .eq('id', conta_id);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ['demonstrativos-partidas'] });
      toast.success(`${updates.length} conta(s) reclassificada(s). Recalculando DRE...`);
      onOpenChange(false);
    } catch (e) {
      toast.error('Erro ao salvar', { description: (e as Error).message });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-none bg-background/60 backdrop-blur-3xl shadow-2xl rounded-[2rem] ring-1 ring-white/10 p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            Inteligência de Classificação ({contas.length})
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Contas detectadas sem o atributo <code className="text-xs font-bold text-primary">centro_resultado</code>. Reclassifique para sincronizar com a DRE Premium.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : contas.length === 0 ? (
          <Alert className="border-success/30 bg-success/5">
            <AlertDescription>Nenhuma conta sem classificação no período. ✅</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex justify-end px-8 mb-4">
              <Button variant="outline" size="sm" onClick={aplicarSugestoes} className="gap-2 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all active:scale-95">
                <Sparkles className="h-4 w-4" />
                Sincronizar Sugestões por IA
              </Button>
            </div>
            <ScrollArea className="max-h-[480px] px-8">
              <div className="space-y-3 pb-8">
                {contas.map((c) => (
                  <div
                    key={c.codigo}
                    className="rounded-2xl border border-border/40 bg-card/40 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 transition-all hover:bg-card/60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-mono font-bold text-muted-foreground">{c.codigo}</span>
                        <span className="text-sm font-bold truncate tracking-tight">{c.descricao}</span>
                        <Badge variant={c.tipo === 'receita' ? 'success' : 'destructive'} className="text-[9px]">
                          {c.tipo}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="opacity-70">{c.partidas} ocorrências</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="font-bold text-foreground">{formatCurrency(Math.abs(c.valor))}</span>
                      </div>
                    </div>
                    <Select
                      value={c.conta_id ? selecoes[c.conta_id] || '' : ''}
                      onValueChange={(v) => c.conta_id && setSelecoes((s) => ({ ...s, [c.conta_id!]: v }))}
                      disabled={!c.conta_id}
                    >
                      <SelectTrigger className="w-full sm:w-[280px] rounded-xl border-border/40 h-10 bg-background/50">
                        <SelectValue placeholder="Definir destino..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                        {OPCOES_CENTRO_RESULTADO.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="rounded-lg m-1">
                            <span className="text-sm font-medium">{o.label}</span>
                            {c.centro_resultado_sugerido === o.value && (
                              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20 scale-90">Sugerido IA</Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando} className="rounded-xl px-6 font-bold hover:bg-background/50 transition-all">
            Agora não
          </Button>
          <Button onClick={salvar} disabled={salvando || contas.length === 0} className="gap-2 rounded-xl px-8 font-extrabold shadow-lg shadow-primary/20 active:scale-95" variant="premium">
            {salvando ? 'Processando...' : 'Confirmar Mudanças'}
            <Save className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
