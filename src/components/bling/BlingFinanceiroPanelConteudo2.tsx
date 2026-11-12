import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

import type { Dispatch, SetStateAction } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any -- tipos herdados dos valores de origem (já eram any) */
interface BlingFinanceiroPanelConteudo2Props {
  setShowBaixa: Dispatch<SetStateAction<{ id: string; tipo: 'receber' | 'pagar' } | null>>;
  showBaixa: { id: string; tipo: 'receber' | 'pagar' } | null;
  baixaForm: { valorRecebido: string; data: string };
  darBaixaReceber: import('@tanstack/react-query').UseMutationResult<
    any,
    Error,
    { id: string; data: Record<string, unknown> },
    unknown
  >;
  darBaixaPagar: import('@tanstack/react-query').UseMutationResult<
    any,
    Error,
    { id: string; data: Record<string, unknown> },
    unknown
  >;
  refetch: (
    options?: import('@tanstack/react-query').RefetchOptions
  ) => Promise<import('@tanstack/react-query').QueryObserverResult<any, Error>>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BlingFinanceiroPanelConteudo2({
  setShowBaixa,
  showBaixa,
  baixaForm,
  darBaixaReceber,
  darBaixaPagar,
  refetch,
}: BlingFinanceiroPanelConteudo2Props) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowBaixa(null)}>
        Cancelar
      </Button>
      <Button
        onClick={() => {
          if (!showBaixa) return;
          const payload = {
            valorRecebido: Number(baixaForm.valorRecebido),
            data: baixaForm.data,
          };
          const mutation = showBaixa.tipo === 'receber' ? darBaixaReceber : darBaixaPagar;
          mutation.mutate(
            { id: showBaixa.id, data: payload },
            {
              onSuccess: () => {
                setShowBaixa(null);
                refetch();
              },
            }
          );
        }}
        disabled={!baixaForm.valorRecebido || darBaixaReceber.isPending || darBaixaPagar.isPending}
      >
        {(darBaixaReceber.isPending || darBaixaPagar.isPending) && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}{' '}
        Confirmar Baixa
      </Button>
    </DialogFooter>
  );
}
