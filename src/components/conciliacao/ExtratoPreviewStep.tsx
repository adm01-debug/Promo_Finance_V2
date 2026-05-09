import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ExtratoOFX, TransacaoOFX } from '@/lib/ofx-parser';
import {
  Building2, Calendar, Hash, TrendingUp, TrendingDown, FileCheck,
  AlertTriangle, CheckCircle2, Zap, Settings2, Search, Table as TableIcon,
  ChevronDown, CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  extrato: ExtratoOFX;
  avisos: string[];
  selectedTransacoes: Set<string>;
  onToggleTransacao: (id: string) => void;
  onToggleAll: () => void;
}

export function ExtratoPreviewStep({ extrato, avisos, selectedTransacoes, onToggleTransacao, onToggleAll }: Props) {
  const { currentEmpresaId } = useAuth();
  const [showMapping, setShowMapping] = useState(false);

  // Buscar regras para mostrar sugestões no preview
  const { data: regras } = useQuery({
    queryKey: ['regras-conciliacao', currentEmpresaId],
    queryFn: async () => {
      if (!currentEmpresaId) return [];
      const { data, error } = await supabase
        .from('regras_conciliacao')
        .select('*')
        .eq('empresa_id', currentEmpresaId)
        .eq('ativo', true);
      if (error) throw error;
      return data;
    },
    enabled: !!currentEmpresaId
  });

  const transacoesComMatch = useMemo(() => {
    return extrato.transacoes.map(t => {
      const match = regras?.find(r => 
        t.descricao.toUpperCase().includes(r.padrao_descricao.toUpperCase())
      );
      return { ...t, match };
    });
  }, [extrato.transacoes, regras]);

  const totalComMatch = transacoesComMatch.filter(t => t.match).length;

  return (
    <div className="space-y-4">
      {/* File Info */}
      <Card className="bg-accent/30 border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center border border-success/20">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{extrato.nomeArquivo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-black h-4 px-1">{extrato.formato}</Badge>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    {extrato.transacoes.length} transações detectadas
                  </p>
                </div>
              </div>
            </div>
            
            {extrato.formato === 'CSV' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMapping(!showMapping)}
                className={cn("gap-2 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest", showMapping && "bg-primary/10 text-primary")}
              >
                <Settings2 className="h-3 w-3" />
                Mapeamento
              </Button>
            )}
          </div>

          <Collapsible open={showMapping} onOpenChange={setShowMapping}>
            <CollapsibleContent className="mt-4 pt-4 border-t border-primary/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Coluna de Data</Label>
                  <Input placeholder="Ex: Data" className="h-8 text-xs rounded-lg bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Coluna de Valor</Label>
                  <Input placeholder="Ex: Valor" className="h-8 text-xs rounded-lg bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Coluna de Descrição</Label>
                  <Input placeholder="Ex: Descrição" className="h-8 text-xs rounded-lg bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase opacity-60">Coluna de Tipo (D/C)</Label>
                  <Input placeholder="Ex: Tipo" className="h-8 text-xs rounded-lg bg-background/50" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="h-7 text-[10px] font-black rounded-lg">Salvar Layout Alpha</Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {extrato.conta.banco && <Separator className="my-3 opacity-50" />}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {extrato.conta.banco && (
              <div><span className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1"><Building2 className="h-3 w-3" />Banco</span><p className="font-bold mt-0.5">{extrato.conta.banco}</p></div>
            )}
            {extrato.conta.conta && (
              <div><span className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1"><Hash className="h-3 w-3" />Conta</span><p className="font-bold mt-0.5">{extrato.conta.conta}</p></div>
            )}
            {extrato.conta.dataInicio && (
              <div><span className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1"><Calendar className="h-3 w-3" />Período</span><p className="font-bold mt-0.5">{formatDate(extrato.conta.dataInicio)} - {formatDate(extrato.conta.dataFim!)}</p></div>
            )}
            {extrato.conta.saldoFinal !== undefined && (
              <div><span className="text-[10px] font-black uppercase opacity-40">Saldo Final</span><p className="font-bold mt-0.5">{formatCurrency(extrato.conta.saldoFinal)}</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matching Stats */}
      {totalComMatch > 0 && (
        <div className="px-4 py-2 rounded-xl bg-success/5 border border-success/10 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-success animate-pulse" />
            <span className="text-xs font-bold text-success/80">
              {totalComMatch} transações mapeadas automaticamente por regras IA
            </span>
          </div>
          <Badge className="bg-success text-success-foreground text-[10px] font-black">ALPHA MATCH</Badge>
        </div>
      )}

      {/* Warnings */}
      {avisos.length > 0 && (
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-warning/80">Avisos de Integridade</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 italic">
                {avisos.map((aviso, i) => <li key={i}>• {aviso}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            Fila de Importação ({selectedTransacoes.size} / {extrato.transacoes.length})
          </p>
          <Button variant="ghost" size="sm" onClick={onToggleAll} className="h-6 text-[10px] font-black uppercase tracking-tighter hover:bg-primary/5">
            {selectedTransacoes.size === extrato.transacoes.length ? 'Desmarcar todas' : 'Selecionar todas'}
          </Button>
        </div>
        <ScrollArea className="h-[280px] rounded-[1.5rem] border border-primary/5 bg-primary/[0.01]">
          <div className="divide-y divide-primary/5">
            {transacoesComMatch.map((transacao) => (
              <TransacaoPreviewItem 
                key={transacao.id} 
                transacao={transacao} 
                selected={selectedTransacoes.has(transacao.id)} 
                onToggle={() => onToggleTransacao(transacao.id)} 
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Summary Footer */}
      <Card className="bg-background/50 border-primary/5 backdrop-blur-sm shadow-inner">
        <CardContent className="p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase opacity-40">Créditos</span>
              <div className="flex items-center gap-1 text-success font-bold">
                <TrendingUp className="h-3 w-3" />
                <span>{formatCurrency(extrato.transacoes.filter(t => selectedTransacoes.has(t.id) && t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0))}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase opacity-40">Débitos</span>
              <div className="flex items-center gap-1 text-destructive font-bold">
                <TrendingDown className="h-3 w-3" />
                <span>{formatCurrency(Math.abs(extrato.transacoes.filter(t => selectedTransacoes.has(t.id) && t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0)))}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase opacity-40 block">Total Líquido</span>
            <span className="font-black text-lg tracking-tighter">
              {formatCurrency(extrato.transacoes.filter(t => selectedTransacoes.has(t.id)).reduce((sum, t) => sum + t.valor, 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransacaoPreviewItem({ transacao, selected, onToggle }: { transacao: any; selected: boolean; onToggle: () => void }) {
  const isCredito = transacao.tipo === 'credito';
  return (
    <div className={cn("flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-primary/[0.03]", selected ? "bg-primary/[0.01]" : "opacity-60")} onClick={onToggle}>
      <div className={cn("h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all", selected ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "border-muted-foreground/20")}>
        {selected && <CheckCircle className="h-3.5 w-3.5" />}
      </div>
      
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border", isCredito ? "bg-success/5 text-success border-success/10" : "bg-destructive/5 text-destructive border-destructive/10")}>
        {isCredito ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold truncate">{transacao.descricao}</p>
          {transacao.match && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-success/20 text-success border-none hover:bg-success/30 px-1 h-4 gap-0.5">
                    <Zap className="h-2 w-2 fill-current" />
                    <span className="text-[8px] font-black">MATCH</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs font-bold">Mapeado via regra Alpha: {transacao.match.entidade_nome}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] font-black uppercase opacity-40">{formatDate(transacao.data)}</p>
          {transacao.numeroReferencia && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]">REF: {transacao.numeroReferencia}</p>
            </>
          )}
        </div>
      </div>
      
      <span className={cn("font-black text-sm tabular-nums tracking-tighter", isCredito ? "text-success" : "text-destructive")}>
        {isCredito ? '+' : ''}{formatCurrency(transacao.valor)}
      </span>
    </div>
  );
}
