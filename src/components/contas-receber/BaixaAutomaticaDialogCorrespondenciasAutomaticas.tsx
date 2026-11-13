import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { MatchResult, TransacaoBancaria } from './BaixaAutomaticaDialog.types';

interface BaixaAutomaticaDialogCorrespondenciasAutomaticasProps {
  matches: MatchResult[];
  unmatched: TransacaoBancaria[];
}

export function BaixaAutomaticaDialogCorrespondenciasAutomaticas({
  matches,
  unmatched,
}: BaixaAutomaticaDialogCorrespondenciasAutomaticasProps) {
  return (
    <motion.div key="preview" className="py-4 space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs leading-relaxed">
          Revise as correspondências automáticas abaixo. As divergências (itens sem par
          correspondente) serão registradas como alertas para reprocessamento manual.
        </p>
      </div>

      <div className="space-y-4">
        {matches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> Correspondências Automáticas ({matches.length})
            </h4>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {matches.map((m, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-success/20 bg-success/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">{m.cliente}</p>
                    <p className="text-muted-foreground">
                      Venc: {formatDate(m.vencimento)} • {m.transacao.descricao}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{formatCurrency(m.valor)}</p>
                    <Badge
                      variant="outline"
                      className="text-[8px] bg-success/20 text-success border-none h-4"
                    >
                      MATCH ALTO
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unmatched.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-warning flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Divergências Detectadas ({unmatched.length})
            </h4>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {unmatched.map((t, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-warning/20 bg-warning/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">Entrada não identificada</p>
                    <p className="text-muted-foreground">
                      {t.descricao} • {formatDate(t.data)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-warning">{formatCurrency(t.valor)}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-4 p-0 text-[8px] uppercase font-black"
                      onClick={() => {
                        // Futuro: Abrir modal de busca manual
                        toast.info('Funcionalidade de vinculação manual em desenvolvimento');
                      }}
                    >
                      Vincular Manualmente
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
