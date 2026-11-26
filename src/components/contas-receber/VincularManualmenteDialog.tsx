import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

const LIMITE_SEM_BUSCA = 200;
const LIMITE_COM_BUSCA = 50;
const TAMANHO_MINIMO_BUSCA = 2;
const DEBOUNCE_BUSCA_MS = 300;

export function VincularManualmenteDialog({
  open,
  onOpenChange,
  empresaId,
  transacao,
  idsJaVinculados,
  onVincular,
}: VincularManualmenteDialogProps) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [idSelecionado, setIdSelecionado] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca.trim()), DEBOUNCE_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setTermo('');
      setIdSelecionado(null);
    }
  }, [open]);

  const buscaAtiva = termo.length >= TAMANHO_MINIMO_BUSCA;

  const {
    data: contas = [],
    isLoading: carregando,
    error: erroConsulta,
  } = useQuery({
    queryKey: ['contas-receber-candidatas', empresaId, termo],
    enabled: open && !!empresaId,
    staleTime: 30_000,
    queryFn: async () => {
      const base = supabase
        .from('contas_receber')
        .select('id, cliente_nome, descricao, valor, data_vencimento')
        .eq('empresa_id', empresaId)
        .neq('status', 'pago')
        .neq('status', 'recebido')
        .neq('status', 'cancelado');

      const filtrada = buscaAtiva
        ? base.or(`cliente_nome.ilike.%${termo}%,descricao.ilike.%${termo}%`)
        : base;

      const { data, error } = await filtrada
        .order('data_vencimento', { ascending: true })
        .limit(buscaAtiva ? LIMITE_COM_BUSCA : LIMITE_SEM_BUSCA);

      if (error) throw new Error(error.message);
      return (data ?? []) as ContaCandidata[];
    },
  });

  const candidatos = useMemo(() => {
    const vinculados = new Set(idsJaVinculados);
    const termoLocal = buscaAtiva ? '' : busca.trim().toLowerCase();
    const valorTransacao = transacao?.valor ?? null;

    return contas
      .filter((c) => !vinculados.has(c.id))
      .filter(
        (c) =>
          !termoLocal ||
          (c.cliente_nome ?? '').toLowerCase().includes(termoLocal) ||
          (c.descricao ?? '').toLowerCase().includes(termoLocal)
      )
      .sort((a, b) => {
        if (valorTransacao !== null) {
          const diferenca = Math.abs(a.valor - valorTransacao) - Math.abs(b.valor - valorTransacao);
          if (Math.abs(diferenca) > 0.005) return diferenca;
        }
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      });
  }, [contas, busca, buscaAtiva, idsJaVinculados, transacao]);

  const selecionar = (conta: ContaCandidata) => {
    setIdSelecionado(conta.id);
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
              ? `Escolha o título em aberto de ${formatCurrency(transacao.valor)} (${formatDate(transacao.data)} — ${transacao.descricao}).`
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

          {!carregando && erroConsulta && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Não foi possível carregar os títulos: {erroConsulta.message}</span>
            </div>
          )}

          {!carregando && !erroConsulta && candidatos.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              {busca.trim()
                ? 'Nenhum título em aberto corresponde a essa busca.'
                : 'Nenhum título em aberto disponível para vincular nesta empresa.'}
            </div>
          )}

          {!carregando &&
            !erroConsulta &&
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
                      disabled={valorDivergente || idSelecionado === c.id}
                      onClick={() => selecionar(c)}
                      aria-label={`Vincular ${c.cliente_nome || c.descricao}`}
                      title={
                        valorDivergente
                          ? 'A baixa em lote quita o título pelo valor integral — use Registrar Recebimento para baixa parcial'
                          : 'Liquidar este título com o valor da entrada bancária'
                      }
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        <p className="text-[10px] text-muted-foreground">
          A baixa em lote quita o título pelo valor da entrada bancária. Títulos com valor diferente
          não podem ser vinculados aqui — use <strong>Registrar Recebimento</strong> para baixa
          parcial.
        </p>
      </DialogContent>
    </Dialog>
  );
}
