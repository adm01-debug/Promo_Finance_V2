import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { formatCurrency } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';

interface Props {
  paymentId: string | null;
  onClose: () => void;
  empresaId?: string;
}

interface SimulacaoAntecipacao {
  totalValue: number;
  fee: number;
  netValue: number;
}

export function AntecipacaoDialog({ paymentId, onClose, empresaId }: Props) {
  const { simularAntecipacao, solicitarAntecipacao } = useAsaas(empresaId);
  const [simulation, setSimulation] = useState<SimulacaoAntecipacao | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const result = await simularAntecipacao.mutateAsync({ payment_id: paymentId });
      setSimulation(result as SimulacaoAntecipacao);
    } catch {
      // toast handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!paymentId) return;
    try {
      await solicitarAntecipacao.mutateAsync({ payment_id: paymentId });
      onClose();
    } catch {}
  };

  // Auto-simulate on open
  useState(() => {
    if (paymentId) handleSimulate();
  });

  return (
    <Dialog open={!!paymentId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Antecipação de Recebíveis
          </DialogTitle>
          <DialogDescription>Simule e solicite o adiantamento deste valor</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Consultando condições...</p>
          </div>
        ) : simulation ? (
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Bruto:</span>
                <span className="font-bold">{formatCurrency(simulation.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground text-destructive">Taxa de Antecipação:</span>
                <span className="font-medium text-destructive">-{formatCurrency(simulation.fee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-base font-bold">Valor Líquido a Receber:</span>
                <span className="text-lg font-black text-success">{formatCurrency(simulation.netValue)}</span>
              </div>
            </div>

            <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-700 leading-relaxed">
                Ao confirmar, o valor será creditado em sua conta Asaas imediatamente. 
                As taxas são calculadas com base no tempo restante até o vencimento.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Não foi possível simular para este título no momento.</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={solicitarAntecipacao.isPending}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!simulation || solicitarAntecipacao.isPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            {solicitarAntecipacao.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2 fill-current" /> Confirmar Antecipação</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
