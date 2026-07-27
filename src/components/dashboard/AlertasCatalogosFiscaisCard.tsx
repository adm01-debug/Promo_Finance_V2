import { AlertTriangle, ArrowRight, Database, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCatalogosFiscais } from '@/hooks/useCatalogosFiscais';
import type { AlertaCatalogo } from '@/lib/tributario/catalogos/alertas';

export interface AlertasCatalogosFiscaisCardProps {
  /** Quantidade máxima de alertas listados antes do "ver todos". */
  limite?: number;
  className?: string;
}

function formatarValor(valor: AlertaCatalogo['valorMotor']): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  return String(valor);
}

function AlertaLinha({ alerta }: { alerta: AlertaCatalogo }) {
  const critico = alerta.severidade === 'critico';

  return (
    <li
      className={cn(
        'rounded-lg border p-3 transition-colors',
        critico
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-warning/30 bg-warning/5',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={critico ? 'destructive' : 'secondary'} className="shrink-0">
          {critico ? 'Crítico' : 'Atenção'}
        </Badge>
        <span className="text-sm font-medium text-foreground">{alerta.item}</span>
        <Badge variant="outline" className="font-mono text-[11px]">
          {alerta.campo}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{alerta.catalogoTitulo}</p>
      <p className="mt-1 text-xs text-foreground/80">{alerta.mensagem}</p>
      {(alerta.valorMotor !== null || alerta.valorBanco !== null) && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          motor: {formatarValor(alerta.valorMotor)} · banco: {formatarValor(alerta.valorBanco)}
        </p>
      )}
    </li>
  );
}

/**
 * Alerta proativo de divergência dos catálogos fiscais.
 *
 * Fica oculto quando todos os catálogos estão coerentes — o dashboard só é
 * interrompido quando existe drift real entre o banco (fonte de verdade) e as
 * tabelas embarcadas no motor.
 */
export function AlertasCatalogosFiscaisCard({
  limite = 5,
  className,
}: AlertasCatalogosFiscaisCardProps) {
  const { data, isLoading, isError } = useCatalogosFiscais();

  if (isLoading || isError || !data || data.alertas.total === 0) return null;

  const { alertas, total, criticos, atencoes, catalogosAfetados } = data.alertas;
  const visiveis = alertas.slice(0, limite);
  const restantes = total - visiveis.length;
  const temCritico = criticos > 0;

  return (
    <Card
      className={cn(
        'border-l-4',
        temCritico ? 'border-l-destructive' : 'border-l-warning',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border',
              temCritico
                ? 'border-destructive/20 bg-destructive/10 text-destructive'
                : 'border-warning/20 bg-warning/10 text-warning',
            )}
          >
            {temCritico ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">Catálogos fiscais divergentes</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} divergência{total > 1 ? 's' : ''} em {catalogosAfetados.length} catálogo
              {catalogosAfetados.length > 1 ? 's' : ''} · {criticos} crítica{criticos === 1 ? '' : 's'} ·{' '}
              {atencoes} de atenção
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/tributario/catalogos-fiscais" aria-label="Abrir painel de catálogos fiscais">
            <Database className="mr-2 h-3.5 w-3.5" />
            Painel
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {visiveis.map((alerta) => (
            <AlertaLinha key={alerta.id} alerta={alerta} />
          ))}
        </ul>

        {restantes > 0 && (
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/tributario/catalogos-fiscais">
              Ver mais {restantes} divergência{restantes > 1 ? 's' : ''}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
