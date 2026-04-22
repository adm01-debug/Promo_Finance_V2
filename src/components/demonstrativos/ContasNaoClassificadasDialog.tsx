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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Contas sem classificação ({contas.length})
          </DialogTitle>
          <DialogDescription>
            Estas contas têm partidas no período mas não possuem <code className="text-xs">centro_resultado</code> definido,
            por isso aparecem fora dos grupos da DRE. Defina a classificação correta — o próximo cálculo usará a nova classificação.
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
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={aplicarSugestoes} className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Aplicar sugestões automáticas
              </Button>
            </div>
            <ScrollArea className="max-h-[420px] pr-3">
              <div className="space-y-2">
                {contas.map((c) => (
                  <div
                    key={c.codigo}
                    className="rounded-md border border-border/50 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{c.codigo}</span>
                        <span className="text-sm font-medium truncate">{c.descricao}</span>
                        <Badge variant={c.tipo === 'receita' ? 'default' : 'destructive'} className="text-[10px]">
                          {c.tipo}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.partidas} partida{c.partidas !== 1 ? 's' : ''} • {formatCurrency(Math.abs(c.valor))}
                      </div>
                    </div>
                    <Select
                      value={c.conta_id ? selecoes[c.conta_id] || '' : ''}
                      onValueChange={(v) => c.conta_id && setSelecoes((s) => ({ ...s, [c.conta_id!]: v }))}
                      disabled={!c.conta_id}
                    >
                      <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Classificar como..." />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_CENTRO_RESULTADO.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                            {c.centro_resultado_sugerido === o.value && (
                              <span className="ml-2 text-[10px] text-primary">(sugerido)</span>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || contas.length === 0} className="gap-2">
            <Save className="h-4 w-4" />
            {salvando ? 'Salvando...' : 'Salvar classificações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
