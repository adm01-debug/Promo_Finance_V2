import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Link2, Loader2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { TransacaoBancaria } from './BaixaAutomaticaDialog.types';

export interface ContaCandidata {
  id: string;
  cliente_nome: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
}

interface VincularManualmenteDialogProps {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  empresaId: string;
  transacao: TransacaoBancaria | null;
  idsJaVinculados: string[];
  onVincular: (conta: ContaCandidata) => void;
}

const LIMITE_CANDIDATOS = 200;

export function VincularManualmenteDialog({
  open,
  onOpenChange,
  empresaId,
  transacao,
  idsJaVinculados,
  onVincular,
}: VincularManualmenteDialogProps) {
  const [contas, setContas] = useState<ContaCandidata[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!open || !empresaId) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    setBusca('');
    setContas([]);

    void (async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, cliente_nome, descricao, valor, data_vencimento')
        .eq('empresa_id', empresaId)
        .neq('status', 'pago')
        .neq('status', 'cancelado')
        .order('data_vencimento', { ascending: true })
        .limit(LIMITE_CANDIDATOS);

      if (!ativo) return;
      if (error) {
        setErro(error.message);
      } else {
        setContas((data ?? []) as ContaCandidata[]);
      }
      setCarregando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [open, empresaId]);

  const candidatos = useMemo(() => {
    const vinculados = new Set(idsJaVinculados);
    const termo = busca.trim().toLowerCase();
    const valorTransacao = transacao?.valor ?? null;

    return contas
      .filter((c) => !vinculados.has(c.id))
      .filter(
        (c) =>
          !termo ||
          (c.cliente_nome ?? '').toLowerCase().includes(termo) ||
          (c.descricao ?? '').toLowerCase().includes(termo)
      )
      .sort((a, b) => {
        if (valorTransacao !== null) {
          const diferenca = Math.abs(a.valor - valorTransacao) - Math.abs(b.valor - valorTransacao);
          if (Math.abs(diferenca) > 0.005) return diferenca;
        }
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      });
  }, [contas, busca, idsJaVinculados, transacao]);

  const selecionar = (conta: ContaCandidata) => {
    onVincular(conta);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Vincular manualmente
          </DialogTitle>
          <DialogDescription>
            {transacao
              ? `Escolha o título em aberto que corresponde a ${formatCurrency(transacao.valor)} em ${formatDate(transacao.data)} — ${transacao.descricao}`
              : 'Escolha o título em aberto que corresponde a esta entrada bancária.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente ou descrição"
            aria-label="Buscar título em aberto"
            className="pl-9"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {carregando && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando títulos em aberto…
            </div>
          )}

          {!carregando && erro && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Não foi possível carregar os títulos: {erro}</span>
            </div>
          )}

          {!carregando && !erro && candidatos.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              {busca.trim()
                ? 'Nenhum título em aberto corresponde a essa busca.'
                : 'Nenhum título em aberto disponível para vincular nesta empresa.'}
            </div>
          )}

          {!carregando &&
            !erro &&
            candidatos.map((c) => {
              const diferenca = transacao ? c.valor - transacao.valor : 0;
              const valorDivergente = Math.abs(diferenca) > 0.05;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {c.cliente_nome || 'Cliente não informado'}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {c.descricao} • Venc: {formatDate(c.data_vencimento)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="font-black text-primary">{formatCurrency(c.valor)}</p>
                      {valorDivergente && (
                        <Badge
                          variant="outline"
                          className="h-4 border-none bg-warning/20 text-[8px] text-warning"
                        >
                          {diferenca > 0 ? '+' : ''}
                          {formatCurrency(diferenca)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-black uppercase"
                      onClick={() => selecionar(c)}
                      aria-label={`Vincular ${c.cliente_nome || c.descricao}`}
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
