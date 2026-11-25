import { useQuery } from '@tanstack/react-query';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { supabase } from '@/integrations/supabase/client';
import {
  avaliarFrescorCatalogosRfb,
  type EntradaFrescorCatalogoRfb,
  type SaudeCatalogosRfb,
  type StatusFrescorRfb,
} from '@/lib/tributario/catalogos/saude';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, RefreshCw, Scale } from 'lucide-react';

type Severidade = 'critical' | 'warning' | 'info';

/** Achado individual retornado por public.get_catalogos_tributarios_health. */
interface AchadoCatalogo {
  invariante: string;
  severidade: Severidade;
  afetados: number;
  detalhe: string;
}

/** Payload agregado da RPC (admin-only). */
interface CatalogoHealth {
  gerado_em: string;
  ultima_verificacao: string | null;
  criticos: number;
  avisos: number;
  infos: number;
  /** Alertas tributários encerrados automaticamente nas últimas 24h. */
  auto_resolvidos_24h: number;
  /** Alertas tributários ainda em aberto. */
  alertas_abertos: number;
  saudavel: boolean;
  achados: AchadoCatalogo[];
}

const ESTILO_SEVERIDADE: Record<Severidade, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-muted text-muted-foreground border-border',
};

const ROTULO_SEVERIDADE: Record<Severidade, string> = {
  critical: 'Crítico',
  warning: 'Aviso',
  info: 'Informativo',
};

const ESTILO_FRESCOR: Record<StatusFrescorRfb, string> = {
  ok: 'bg-success/10 text-success border-success/30',
  atencao: 'bg-warning/10 text-warning border-warning/30',
  critico: 'bg-destructive/10 text-destructive border-destructive/30',
};

const ROTULO_FRESCOR: Record<StatusFrescorRfb, string> = {
  ok: 'Em dia',
  atencao: 'Desatualizado',
  critico: 'Nunca sincronizado',
};

/**
 * Etapa 83: carga mais recente de cada catálogo RFB.
 *
 * Uma leitura por tabela (limit 1, ordenada pela carga) em paralelo: os quatro
 * catálogos guardam o carimbo em colunas diferentes, então cada consulta é
 * explícita em vez de uma varredura genérica. Erro em uma tabela não derruba as
 * outras — a entrada volta com `ultimaCarga: null`, que o avaliador trata como
 * "nunca sincronizado".
 */
async function carregarFrescorCatalogosRfb(): Promise<EntradaFrescorCatalogoRfb[]> {
  const [cclasstrib, ncm, aliquota, fundamentacao] = await Promise.all([
    supabase
      .from('catalogo_cclasstrib')
      .select('created_at, versao_it')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_ncm')
      .select('carregado_em')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_aliquota_referencia')
      .select('carregado_em')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_fundamentacao')
      .select('created_at, versao_it')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  return [
    {
      id: 'cclasstrib',
      ultimaCarga: cclasstrib.data?.[0]?.created_at ?? null,
      versaoIt: cclasstrib.data?.[0]?.versao_it ?? null,
    },
    { id: 'ncm', ultimaCarga: ncm.data?.[0]?.carregado_em ?? null },
    { id: 'aliquota', ultimaCarga: aliquota.data?.[0]?.carregado_em ?? null },
    {
      id: 'fundamentacao',
      ultimaCarga: fundamentacao.data?.[0]?.created_at ?? null,
      versaoIt: fundamentacao.data?.[0]?.versao_it ?? null,
    },
  ];
}

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Saúde dos catálogos fiscais (UFs, NCM, CNAE, Simples Nacional, ISS, ST).
 * Consome a RPC `get_catalogos_tributarios_health`, protegida por papel admin,
 * expondo em tempo real as invariantes violadas nos seeds tributários.
 */
export function CatalogosTributariosHealthPanel() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<CatalogoHealth>({
    queryKey: ['catalogos-tributarios-health'],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<CatalogoHealth>(
        'get_catalogos_tributarios_health',
        {}
      );
      if (error) throw error;
      return data as CatalogoHealth;
    },
    staleTime: 120_000,
  });

  const achados = data?.achados ?? [];

  // Frescor dos catálogos espelhados da RFB (etapas 79-82). Consulta separada
  // da RPC de integridade: uma mede invariante, a outra mede envelhecimento.
  const frescor = useQuery<SaudeCatalogosRfb>({
    queryKey: ['catalogos-rfb-frescor'],
    queryFn: async () => avaliarFrescorCatalogosRfb(await carregarFrescorCatalogosRfb()),
    staleTime: 300_000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Saúde dos catálogos tributários</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isRefetching}
          aria-label="Revalidar catálogos tributários"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="ml-2">Revalidar</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a auditoria dos catálogos. Esta visão é restrita a
            administradores.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Críticos</p>
                <p className="text-2xl font-semibold text-destructive">{data?.criticos ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Avisos</p>
                <p className="text-2xl font-semibold text-warning">{data?.avisos ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Informativos</p>
                <p className="text-2xl font-semibold text-foreground">{data?.infos ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Alertas em aberto</p>
                <p className="text-2xl font-semibold text-foreground">
                  {data?.alertas_abertos ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-xs text-muted-foreground">Auto-resolvidos (24h)</p>
                <p className="text-2xl font-semibold text-success">
                  {data?.auto_resolvidos_24h ?? 0}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Última gravação de alerta fiscal: {formatarData(data?.ultima_verificacao ?? null)} ·
              Verificado em {formatarData(data?.gerado_em ?? null)}
            </p>

            {achados.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Todos os catálogos fiscais estão íntegros.
              </div>
            ) : (
              <ul className="space-y-2">
                {achados.map((achado) => (
                  <li
                    key={achado.invariante}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium">{achado.invariante}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{achado.detalhe}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={ESTILO_SEVERIDADE[achado.severidade]}>
                        {ROTULO_SEVERIDADE[achado.severidade]}
                      </Badge>
                      <Badge variant="secondary">{achado.afetados} ocorrência(s)</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">Catálogos RFB (dados abertos)</p>
              <p className="text-xs text-muted-foreground">
                {frescor.isLoading
                  ? 'Verificando frescor...'
                  : (frescor.data?.resumo ?? 'Sem leitura')}
              </p>
            </div>
            {frescor.data && (
              <Badge
                variant="outline"
                className={ESTILO_FRESCOR[frescor.data.status]}
                title={`Limite de ${7} dias sem sincronização`}
              >
                {ROTULO_FRESCOR[frescor.data.status]}
              </Badge>
            )}
          </div>
          <ul className="divide-y divide-border">
            {(frescor.data?.catalogos ?? []).map((catalogo) => (
              <li
                key={catalogo.id}
                className="flex flex-col gap-1 py-2 text-sm md:flex-row md:items-center md:justify-between"
              >
                <span className="truncate font-medium">{catalogo.titulo}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{catalogo.detalhe}</span>
                  <span className="text-xs text-muted-foreground">
                    {catalogo.ultimaCarga ? formatarData(catalogo.ultimaCarga) : '—'}
                  </span>
                  <Badge variant="secondary">
                    {catalogo.versaoIt ? `IT ${catalogo.versaoIt}` : 'sem versão IT'}
                  </Badge>
                  <Badge variant="outline" className={ESTILO_FRESCOR[catalogo.status]}>
                    {ROTULO_FRESCOR[catalogo.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
