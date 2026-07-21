import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Link2 } from 'lucide-react';
import type { SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';

export interface ResumoAlertas {
  bloqueadas: { row: SpedEcfHistoricoRow; erros: number }[];
  divergencias: { row: SpedEcfHistoricoRow; total: number }[];
  anosBloq: Set<number>;
  anosDiv: Set<number>;
}

interface Props {
  resumo: ResumoAlertas;
  onOpenErros: (row: SpedEcfHistoricoRow) => void;
  onFilterBloqueadas: () => void;
}

export function AlertasResumo({ resumo, onOpenErros, onFilterBloqueadas }: Props) {
  if (resumo.bloqueadas.length === 0 && resumo.divergencias.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Alertas do histórico ECF">
      {resumo.bloqueadas.length > 0 && (
        <Alert variant="error" role="alert">
          <AlertTitle>
            {resumo.bloqueadas.length} execução(ões) bloqueada(s) por erros de validação
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-xs">
              Ano(s) afetado(s):{' '}
              <span className="font-medium">
                {Array.from(resumo.anosBloq).sort((a, b) => b - a).join(', ')}
              </span>
              . O download do TXT/ZIP fica indisponível enquanto houver erros pendentes.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resumo.bloqueadas.slice(0, 4).map(({ row, erros }) => (
                <Button
                  key={row.id}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => { onFilterBloqueadas(); onOpenErros(row); }}
                  aria-label={`Ver ${erros} erro(s) da ECF ${row.ano_calendario}`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  ECF {row.ano_calendario} · {erros} erro(s)
                </Button>
              ))}
              {resumo.bloqueadas.length > 4 && (
                <Badge variant="outline" className="text-[10px]">+{resumo.bloqueadas.length - 4}</Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {resumo.divergencias.length > 0 && (
        <Alert variant="warning" role="alert">
          <AlertTitle>
            Divergência(s) com a ECD do mesmo período em {resumo.divergencias.length} execução(ões)
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-xs">
              Ano(s) com cross-check pendente:{' '}
              <span className="font-medium">
                {Array.from(resumo.anosDiv).sort((a, b) => b - a).join(', ')}
              </span>
              . Verifique hash, recibo e saldos K355 × L100 antes de transmitir.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resumo.divergencias.slice(0, 4).map(({ row, total }) => (
                <Button
                  key={row.id}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs border-warning/40"
                  onClick={() => onOpenErros(row)}
                  aria-label={`Ver ${total} divergência(s) ECD da ECF ${row.ano_calendario}`}
                >
                  <Link2 className="h-3 w-3" />
                  ECF {row.ano_calendario} · {total} ponto(s)
                </Button>
              ))}
              {resumo.divergencias.length > 4 && (
                <Badge variant="outline" className="text-[10px] border-warning/40">+{resumo.divergencias.length - 4}</Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
