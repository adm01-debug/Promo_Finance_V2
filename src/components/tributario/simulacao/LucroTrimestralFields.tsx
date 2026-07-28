// COMPONENTE: Lucro por trimestre (Lucro Real)
// Extraído de ParametrosForm.tsx para manter o formulário modular.

import { useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ParametrosSimulacao } from '@/lib/tributario';

interface LucroTrimestralFieldsProps {
  parametros: ParametrosSimulacao;
  setParametros: (p: ParametrosSimulacao) => void;
}

const formatador = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Converte a entrada do usuário em número finito (aceita negativos: prejuízo). */
function paraNumero(valor: string): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Permite informar o resultado de cada trimestre.
 *
 * O motor usa esses valores tanto no cenário trimestral (períodos autônomos,
 * adicional de R$ 60 mil por trimestre) quanto no anual (soma algébrica),
 * garantindo que o comparativo de periodicidade parta da mesma base.
 * Valores negativos representam prejuízo do trimestre.
 */
export function LucroTrimestralFields({ parametros, setParametros }: LucroTrimestralFieldsProps) {
  const ativo = parametros.lucroTrimestral?.length === 4;

  const lucroEstimado = useMemo(() => {
    const margem = Number.isFinite(parametros.margemLucro) ? Number(parametros.margemLucro) : 0;
    const anual = Math.max(0, Number(parametros.faturamentoAnual) || 0) * (margem / 100);
    return anual / 4;
  }, [parametros.faturamentoAnual, parametros.margemLucro]);

  const trimestres = parametros.lucroTrimestral ?? [];
  const soma = trimestres.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);

  const alternarModo = useCallback(
    (habilitado: boolean) => {
      if (!habilitado) {
        const { lucroTrimestral: _removido, ...resto } = parametros;
        setParametros(resto as ParametrosSimulacao);
        return;
      }
      const inicial = Math.round(lucroEstimado * 100) / 100;
      setParametros({ ...parametros, lucroTrimestral: [inicial, inicial, inicial, inicial] });
    },
    [lucroEstimado, parametros, setParametros],
  );

  const atualizarTrimestre = useCallback(
    (indice: number, valor: string) => {
      const base = parametros.lucroTrimestral?.length === 4
        ? [...parametros.lucroTrimestral]
        : [0, 0, 0, 0];
      base[indice] = paraNumero(valor);
      setParametros({ ...parametros, lucroTrimestral: base });
    },
    [parametros, setParametros],
  );

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="lucro-trimestral-switch">Informar lucro por trimestre</Label>
          <p className="text-xs text-muted-foreground">
            Sazonalidade real do resultado. Sem isso, o lucro é rateado uniformemente.
          </p>
        </div>
        <Switch
          id="lucro-trimestral-switch"
          checked={ativo}
          onCheckedChange={alternarModo}
          aria-label="Ativar informe de lucro por trimestre"
        />
      </div>

      {ativo && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Label htmlFor={`lucro-t${i + 1}`} className="text-xs">
                  {i + 1}º trimestre (R$)
                </Label>
                <Input
                  id={`lucro-t${i + 1}`}
                  type="number"
                  step="0.01"
                  value={trimestres[i] ?? 0}
                  onChange={(e) => atualizarTrimestre(i, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado do ano: <span className="font-medium text-foreground">{formatador.format(soma)}</span>.
            Valores negativos representam prejuízo do trimestre, compensável nos períodos
            seguintes com a trava dos 30% (Lei 9.065/95).
          </p>
        </>
      )}
    </div>
  );
}
