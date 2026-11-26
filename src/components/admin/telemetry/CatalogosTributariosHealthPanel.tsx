import { useQuery } from '@tanstack/react-query';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { supabase } from '@/integrations/supabase/client';
import {
  avaliarFrescorCatalogosRfb,
  DIAS_ALERTA_CATALOGO_RFB_SEMANAL,
  entradaIndisponivel,
  entradaSemLinhas,
  escolherRunComEscopo,
  escolherUltimaCarga,
  exigeProvaDeEscopo,
  type CatalogoRfbId,
  type EntradaFrescorCatalogoRfb,
  type LinhaLedgerRun,
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

/** Job de borda que alimenta cada catálogo espelhado. */
const FUNCAO_SYNC_CATALOGO_RFB: Record<CatalogoRfbId, string> = {
  cclasstrib: 'sync-catalogo-cclasstrib',
  ncm: 'sync-catalogo-ncm-nbs',
  nbs: 'sync-catalogo-ncm-nbs',
  aliquota_cbs: 'sync-aliquota-referencia',
  aliquota_ibs_uf: 'sync-aliquota-referencia',
  aliquota_ibs_mun: 'sync-aliquota-referencia',
  fundamentacao: 'sync-fundamentacao-legal',
};

/**
 * Evidência de run de um job no ledger de observabilidade. `erro` separa
 * "nunca rodou" de "não foi possível consultar o ledger".
 */
interface EvidenciaRun {
  em: string | null;
  erro: boolean;
}

/** Linha do carimbo de carga de um catálogo. */
interface LinhaCarimbo {
  created_at?: string | null;
  carregado_em?: string | null;
  versao_it?: string | null;
}

/**
 * Último run bem-sucedido do job que alimenta um catálogo, pelo ledger de
 * observabilidade (`edge_function_logs`).
 *
 * O carimbo da própria tabela não prova carga: o `upsert` preserva
 * `created_at`/`carregado_em` das chaves que já existem, então o catálogo
 * congela a data mesmo com o job rodando todo dia.
 *
 * Escopos que dividem o job com outro escopo exigem prova do proprio escopo: o
 * 2xx de `request_end` so diz que a funcao respondeu. As aliquotas alternam
 * rodadas (a diaria consulta UF e CBS, a municipal consulta municipio e nao
 * passa pela UF) e o job de NCM/NBS responde 200 gravando so o NCM. A prova
 * vem do `sync concluido` da mesma requisicao, que registra o que o job
 * consultou.
 */
async function ultimoRunOkCatalogo(id: CatalogoRfbId): Promise<EvidenciaRun> {
  const funcao = FUNCAO_SYNC_CATALOGO_RFB[id];

  if (exigeProvaDeEscopo(id)) {
    const { data, error } = await supabase
      .from('edge_function_logs')
      .select('created_at, event, status_code, metadata')
      .eq('function_name', funcao)
      .in('event', ['sync concluido', 'request_end'])
      .order('created_at', { ascending: false })
      .limit(120);
    if (error) return { em: null, erro: true };
    return { em: escolherRunComEscopo(id, (data ?? []) as LinhaLedgerRun[]), erro: false };
  }

  const { data, error } = await supabase
    .from('edge_function_logs')
    .select('created_at')
    .eq('function_name', funcao)
    .eq('event', 'request_end')
    .gte('status_code', 200)
    .lt('status_code', 300)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) return { em: null, erro: true };
  return { em: data?.[0]?.created_at ?? null, erro: false };
}

/**
 * Etapa 83: carga mais recente de cada catálogo RFB, por escopo.
 *
 * Uma leitura por catálogo (limit 1, ordenada pela carga) mais o último run
 * bem-sucedido do job correspondente, tudo em paralelo: os catálogos guardam o
 * carimbo em colunas diferentes e as alíquotas têm um registro por escopo
 * (CBS diário, IBS/UF diário, IBS municipal semanal). Falha em uma leitura não
 * derruba as outras: o catálogo afetado volta como "não foi possível consultar",
 * que é diferente de "nenhuma linha carregada".
 */
async function carregarFrescorCatalogosRfb(): Promise<EntradaFrescorCatalogoRfb[]> {
  const [
    cclasstrib,
    ncm,
    nbs,
    aliquotaCbs,
    aliquotaUf,
    aliquotaMun,
    fundamentacao,
    runCclasstrib,
    runNcm,
    runNbs,
    runAliquotaDiario,
    runMunicipio,
    runFundamentacao,
  ] = await Promise.all([
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
      .from('catalogo_nbs')
      .select('carregado_em')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_aliquota_referencia')
      .select('carregado_em')
      .eq('tributo', 'cbs')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_aliquota_referencia')
      .select('carregado_em')
      .eq('tributo', 'ibs_uf')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_aliquota_referencia')
      .select('carregado_em')
      .eq('tributo', 'ibs_mun')
      .order('carregado_em', { ascending: false })
      .limit(1),
    supabase
      .from('catalogo_fundamentacao')
      .select('created_at, versao_it')
      .order('created_at', { ascending: false })
      .limit(1),
    ultimoRunOkCatalogo('cclasstrib'),
    ultimoRunOkCatalogo('ncm'),
    ultimoRunOkCatalogo('nbs'),
    ultimoRunOkCatalogo('aliquota_cbs'),
    ultimoRunOkCatalogo('aliquota_ibs_mun'),
    ultimoRunOkCatalogo('fundamentacao'),
  ]);

  const entrada = (
    id: CatalogoRfbId,
    leitura: { data: readonly LinhaCarimbo[] | null; error: unknown },
    run: EvidenciaRun,
    campo: 'created_at' | 'carregado_em'
  ): EntradaFrescorCatalogoRfb => {
    // Leitura que falhou é estado desconhecido: não dá para afirmar que o
    // catálogo está vazio nem que está em dia.
    if (leitura.error || run.erro) return entradaIndisponivel(id);
    const linha = leitura.data?.[0] ?? null;
    const carimbo = linha?.[campo] ?? null;
    const versaoIt = linha?.versao_it ?? null;
    // Catálogo sem nenhuma linha não tem carga para consultar: o job pode ter
    // concluído sem gravar (escopo ainda não publicado pela RFB, por exemplo).
    // O veredito passa a vir da idade do run, com a nota dizendo que não há linha.
    return carimbo
      ? { id, ultimaCarga: escolherUltimaCarga(carimbo, run.em), versaoIt }
      : entradaSemLinhas(id, run.em, versaoIt);
  };

  return [
    entrada('cclasstrib', cclasstrib, runCclasstrib, 'created_at'),
    entrada('ncm', ncm, runNcm, 'carregado_em'),
    entrada('nbs', nbs, runNbs, 'carregado_em'),
    entrada('aliquota_cbs', aliquotaCbs, runAliquotaDiario, 'carregado_em'),
    entrada('aliquota_ibs_uf', aliquotaUf, runAliquotaDiario, 'carregado_em'),
    {
      // O cron municipal roda aos domingos: o prazo de 7 dias não dá margem
      // para a rodada terminar, então este escopo usa o limite semanal.
      ...entrada('aliquota_ibs_mun', aliquotaMun, runMunicipio, 'carregado_em'),
      limiteDias: DIAS_ALERTA_CATALOGO_RFB_SEMANAL,
    },
    entrada('fundamentacao', fundamentacao, runFundamentacao, 'created_at'),
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
                title={`Prazo de 7 dias (9 para escopos semanais)`}
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
                    {catalogo.indisponivel ? 'Sem leitura' : ROTULO_FRESCOR[catalogo.status]}
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
