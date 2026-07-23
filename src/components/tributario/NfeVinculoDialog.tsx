// Diálogo para vincular NF-e recebida a uma conta a pagar.
// Mostra sugestões ranqueadas pela RPC `nfe_suggest_contas_pagar` e permite criar uma nova.
import { useState } from 'react';
import { Loader2, Sparkles, Plus, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useSugestoesContaPagar,
  useVincularNfe,
  useCriarContaDaNfe,
} from '@/hooks/useNfeVinculo';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  nfeId: string | null;
  nfeChave?: string;
  onClose: () => void;
}

export function NfeVinculoDialog({ nfeId, nfeChave, onClose }: Props) {
  const open = !!nfeId;
  const { data: sugestoes = [], isLoading } = useSugestoesContaPagar(nfeId);
  const vincular = useVincularNfe();
  const criar = useCriarContaDaNfe();
  const [venc, setVenc] = useState('');

  function handleVincular(contaPagarId: string) {
    if (!nfeId) return;
    vincular.mutate({ nfeId, contaPagarId }, { onSuccess: () => onClose() });
  }

  function handleCriar() {
    if (!nfeId) return;
    criar.mutate({ nfeId, dataVencimento: venc || undefined }, { onSuccess: () => onClose() });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Vincular NF-e a Conta a Pagar
          </DialogTitle>
          <DialogDescription>
            Chave: <span className="font-mono">{nfeChave ?? '—'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Sugestões ranqueadas
            </h3>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando candidatas…
              </div>
            ) : sugestoes.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Nenhuma conta a pagar em aberto compatível. Crie uma nova abaixo.
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {sugestoes.map((s) => (
                  <li
                    key={s.conta_pagar_id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{s.descricao}</span>
                        <Badge variant="outline">Score {Math.round(s.score)}</Badge>
                        {s.match_motivo && (
                          <Badge variant="secondary" className="font-normal">
                            {s.match_motivo}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.fornecedor_nome ?? 'sem fornecedor'} · vence {s.data_vencimento} · {s.status}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="tabular-nums font-medium">{currency.format(Number(s.valor))}</span>
                      <Button
                        size="sm"
                        onClick={() => handleVincular(s.conta_pagar_id)}
                        disabled={vincular.isPending}
                      >
                        {vincular.isPending && vincular.variables?.contaPagarId === s.conta_pagar_id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : null}
                        Vincular
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border p-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" /> Criar nova conta a pagar a partir da NF-e
            </h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Vencimento (padrão: emissão + 30 dias)</label>
                <Input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} />
              </div>
              <Button onClick={handleCriar} disabled={criar.isPending}>
                {criar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar e vincular
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
