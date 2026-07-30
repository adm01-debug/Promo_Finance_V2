import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BellOff, BellRing, Loader2 } from 'lucide-react';
import { SilenciamentosExpirando } from '@/components/admin/SilenciamentosExpirando';
import {
  useFrontendErrorAlertState,
  useSilenciarAlertaErro,
  type FrontendErrorAlertState,
} from '@/hooks/useFrontendErrorLogs';


const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/** Opções de silenciamento oferecidas ao administrador (o backend limita a 720h). */
const OPCOES_SILENCIO: ReadonlyArray<{ horas: number; label: string }> = [
  { horas: 1, label: '1 hora' },
  { horas: 4, label: '4 horas' },
  { horas: 24, label: '24 horas' },
  { horas: 72, label: '3 dias' },
  { horas: 168, label: '7 dias' },
];

/** Uma assinatura está silenciada apenas enquanto o prazo não expirou. */
function estaSilenciado(alerta: FrontendErrorAlertState): boolean {
  return Boolean(alerta.silenciado_ate && new Date(alerta.silenciado_ate) > new Date());
}

/**
 * Painel do estado dos alertas proativos de erro.
 * O disparo é feito no backend (cron a cada 15 min) com cooldown por assinatura;
 * aqui o admin audita o que já foi notificado e pode silenciar/reativar cada
 * assinatura ruidosa — toda ação é registrada na trilha de auditoria.
 */
export function AlertasProativosErros() {
  const { data, isLoading, isError } = useFrontendErrorAlertState();
  const silenciar = useSilenciarAlertaErro();
  const linhas = data ?? [];

  const pendente = (assinatura: string) =>
    silenciar.isPending && silenciar.variables?.assinatura === assinatura;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-warning" />
          Alertas proativos disparados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SilenciamentosExpirando />
        {isLoading && <Skeleton className="h-24 w-full" />}

        {isError && (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico de alertas.</p>
        )}
        {!isLoading && !isError && linhas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum alerta disparado até agora — o monitor roda a cada 15 minutos.
          </p>
        )}
        {linhas.map((a) => {
          const silenciado = estaSilenciado(a);
          return (
            <div
              key={a.assinatura}
              className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-foreground">{a.assinatura}</p>
                <p className="text-xs text-muted-foreground">
                  Último disparo: {fmt(a.ultimo_alerta_em)} · {a.ocorrencias_no_ultimo_alerta} ocorrências
                  {silenciado && ` · silenciado até ${fmt(a.silenciado_ate)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge variant="secondary">{a.severity}</Badge>
                <Badge variant="outline">{a.alertas_enviados}x notificado</Badge>
                {silenciado && <Badge className="bg-muted text-muted-foreground">Silenciado</Badge>}
                {silenciado ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendente(a.assinatura)}
                    onClick={() => silenciar.mutate({ assinatura: a.assinatura, horas: 0 })}
                  >
                    {pendente(a.assinatura) ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BellRing className="mr-1 h-3.5 w-3.5" />
                    )}
                    Reativar
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" disabled={pendente(a.assinatura)}>
                        {pendente(a.assinatura) ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BellOff className="mr-1 h-3.5 w-3.5" />
                        )}
                        Silenciar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Silenciar alertas por</DropdownMenuLabel>
                      {OPCOES_SILENCIO.map((op) => (
                        <DropdownMenuItem
                          key={op.horas}
                          onSelect={() =>
                            silenciar.mutate({
                              assinatura: a.assinatura,
                              horas: op.horas,
                              motivo: `Silenciado pela UI admin por ${op.label}`,
                            })
                          }
                        >
                          {op.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
