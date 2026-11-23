// ============================================
// EDGE FUNCTION: gerar-alertas-tributarios (cron diário)
// Detecta sublimite Simples, Fator R, vencimentos, desvios setoriais, IRPFM
// Hardened: structured logging, retry com exponential backoff, top-level try/catch
// ============================================
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { exigirChamadaInterna } from '../_shared/auth-guard.ts';
import {
  cargaDoPeriodo,
  porPrefixoMaisEspecifico,
  prefixosCnaeCandidatos,
  regimeParaBenchmark,
} from '../_shared/cnae.ts';
import { createLogger } from '../_shared/observability.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

const SIMPLES_SUBLIMITE = 4_800_000;
const SIMPLES_LIMITE_ALERTA = SIMPLES_SUBLIMITE * 0.9;
const FATOR_R_MIN = 0.28;
const IRPFM_MENSAL_LIMITE = 50_000;
const DIAS_VENCIMENTO_ALERTA = 5;
const FN_NAME = 'gerar-alertas-tributarios';

interface AlertaInsert {
  empresa_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  competencia?: string | null;
  data_vencimento?: string | null;
  acao_url?: string | null;
  acao_label?: string | null;
}

// ─── Structured logging helper ───────────────────────────────────────────────
type LogLevel = 'info' | 'warn' | 'error';
const loggers = createLogger(FN_NAME);
const LEVEL_FN = { info: 'info', warn: 'warn', error: 'error' } as const;
function log(level: LogLevel, event: string, ctx: Record<string, unknown> = {}) {
  loggers[LEVEL_FN[level]](event, { context: ctx });
}

// ─── Retry com exponential backoff (3 tentativas: 500ms, 1s, 2s) ─────────────
async function withRetry<T>(op: () => PromiseLike<T>, label: string, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await op();
    } catch (e) {
      lastErr = e;
      const delay = 250 * Math.pow(2, attempt); // 500, 1000, 2000
      log('warn', 'retry_attempt', {
        label,
        attempt,
        max_attempts: maxAttempts,
        delay_ms: delay,
        error: e instanceof Error ? e.message : String(e),
      });
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = corsHeadersPara(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await exigirChamadaInterna(req, 'gerar_alertas_tributarios');
  if (!auth.ok) return auth.resposta;

  const startedAt = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const novosAlertas: AlertaInsert[] = [];
    const hoje = new Date();
    const competenciaAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    log('info', 'fn_start', { competencia: competenciaAtual });

    const empresasRes = await withRetry(async () => {
      const r = await supabase
        .from('empresas')
        .select('id, razao_social, cnpj, regime_tributario, cnae_principal');
      if (r.error) throw r.error;
      return r;
    }, 'select_empresas');
    const empresas = empresasRes.data;

    log('info', 'empresas_loaded', { count: empresas?.length ?? 0 });

    for (const empresa of empresas ?? []) {
      try {
        // 1) Sublimite Simples Nacional
        const ano = hoje.getFullYear();
        const { data: faturamentos } = await withRetry(
          () =>
            supabase
              .from('faturamento_mensal')
              .select('receita_bruta, ano, mes')
              .eq('empresa_id', empresa.id)
              .gte('ano', ano - 1),
          `faturamento_${empresa.id}`
        );

        const rbt12 = (faturamentos ?? [])
          .filter((f) => {
            const data = new Date(f.ano, f.mes - 1, 1);
            const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1);
            return data >= limite;
          })
          .reduce((acc, f) => acc + Number(f.receita_bruta || 0), 0);

        if (empresa.regime_tributario === 'simples_nacional' && rbt12 >= SIMPLES_LIMITE_ALERTA) {
          novosAlertas.push({
            empresa_id: empresa.id,
            tipo: 'sublimite_simples',
            titulo: `Sublimite do Simples Nacional próximo (${((rbt12 / SIMPLES_SUBLIMITE) * 100).toFixed(1)}%)`,
            mensagem: `RBT12 atual de R$ ${rbt12.toLocaleString('pt-BR')} já atingiu ${((rbt12 / SIMPLES_SUBLIMITE) * 100).toFixed(1)}% do sublimite estadual de R$ 4.800.000. Avalie migração para Lucro Presumido antes do estouro.`,
            prioridade: rbt12 >= SIMPLES_SUBLIMITE * 0.95 ? 'critica' : 'alta',
            competencia: competenciaAtual,
            acao_url: '/tributario/simulacao-regimes',
            acao_label: 'Simular regimes',
          });
        }

        // 2) Fator R
        const { data: folha } = await withRetry(
          () =>
            supabase
              .from('folha_pagamento')
              .select('total_folha, ano, mes')
              .eq('empresa_id', empresa.id)
              .gte('ano', ano - 1),
          `folha_${empresa.id}`
        );

        const folhaUlt12 = (folha ?? [])
          .filter((f) => {
            const data = new Date(f.ano, f.mes - 1, 1);
            const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1);
            return data >= limite;
          })
          .reduce((acc, f) => acc + Number(f.total_folha || 0), 0);

        if (rbt12 > 0 && empresa.regime_tributario === 'simples_nacional') {
          const fatorR = folhaUlt12 / rbt12;
          if (fatorR < FATOR_R_MIN && fatorR > 0) {
            novosAlertas.push({
              empresa_id: empresa.id,
              tipo: 'fator_r_baixo',
              titulo: `Fator R em ${(fatorR * 100).toFixed(1)}% — abaixo de 28%`,
              mensagem: `O Fator R atual indica enquadramento no Anexo V (alíquotas mais altas). Aumentar folha em R$ ${(rbt12 * FATOR_R_MIN - folhaUlt12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} permitiria reenquadramento no Anexo III.`,
              prioridade: 'alta',
              competencia: competenciaAtual,
              acao_url: '/tributario/simulacao-regimes',
              acao_label: 'Simular Anexo III vs V',
            });
          }
        }

        // 3) Vencimentos DAS/DARF
        const { data: apuracoes } = await withRetry(
          () =>
            supabase
              .from('apuracoes_tributarias')
              .select('id, ano, mes, status, total_geral')
              .eq('empresa_id', empresa.id)
              .neq('status', 'pago'),
          `apuracoes_${empresa.id}`
        );

        for (const ap of apuracoes ?? []) {
          const vencimento = new Date(ap.ano, ap.mes, 20);
          const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);
          if (diasParaVencer >= 0 && diasParaVencer <= DIAS_VENCIMENTO_ALERTA) {
            novosAlertas.push({
              empresa_id: empresa.id,
              tipo: 'vencimento_darf',
              titulo: `DAS/DARF vence em ${diasParaVencer} dia(s)`,
              mensagem: `Apuração ${ap.mes}/${ap.ano}: R$ ${Number(ap.total_geral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${vencimento.toLocaleDateString('pt-BR')}.`,
              prioridade: diasParaVencer <= 2 ? 'critica' : 'alta',
              data_vencimento: vencimento.toISOString().slice(0, 10),
              competencia: `${ap.ano}-${String(ap.mes).padStart(2, '0')}`,
              acao_url: '/reforma-tributaria',
            });
          }
        }

        // 4) Desvio vs benchmark setorial
        const prefixosCnae = prefixosCnaeCandidatos(empresa.cnae_principal);
        // Regime NAO pode ter default: `?? 'simples_nacional'` fazia o cron
        // gravar alerta de desvio comparando a empresa com a faixa do Simples
        // sem saber se ela e do Simples. Antes isso nao aparecia porque o filtro
        // de CNAE nunca casava; corrigir o CNAE sem corrigir isto criaria o
        // alerta falso (achado do Devin na PR #407).
        const regimeCanonico = regimeParaBenchmark(empresa.regime_tributario);
        if (prefixosCnae.length > 0 && regimeCanonico && rbt12 > 0) {
          // `cnae_prefix` e o PREFIXO; o CNAE da empresa e o codigo completo.
          // O filtro anterior pedia `cnae_prefix ILIKE '<4 digitos>%'` e nunca
          // casava com prefixo de 2 digitos: para o CNAE 1091102 o padrao
          // '1091%' nao encontra a linha '10'. Resultado: o alerta de desvio vs
          // benchmark setorial nunca disparava por este caminho.
          const hoje = new Date().toISOString().slice(0, 10);
          const { data: benchRows } = await withRetry(
            () =>
              supabase
                .from('benchmarks_setoriais')
                .select('carga_media_pct, setor, cnae_prefix, vigencia_inicio')
                .eq('regime', regimeCanonico)
                .in('cnae_prefix', prefixosCnae)
                // vigencia: o catalogo guarda varias versoes por
                // (cnae_prefix, regime, vigencia_inicio). Sem este filtro, uma
                // faixa vencida podia virar alerta de desvio inexistente.
                .lte('vigencia_inicio', hoje)
                .or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`)
                .order('vigencia_inicio', { ascending: false }),
            `benchmark_${empresa.id}`
          );
          // mais especifico primeiro (4781 antes de 47); empate de tamanho
          // mantem a vigencia mais recente, que a consulta ja ordenou
          const bench = porPrefixoMaisEspecifico(benchRows ?? []);

          if (bench && bench.length > 0) {
            const { data: ultimaApuracao } = await withRetry(
              () =>
                supabase
                  .from('apuracoes_tributarias')
                  .select('total_geral, ano, mes')
                  .eq('empresa_id', empresa.id)
                  .order('ano', { ascending: false })
                  .order('mes', { ascending: false })
                  .limit(1),
              `ultima_apuracao_${empresa.id}`
            );

            // A carga sai do MESMO periodo da apuracao (ver cargaDoPeriodo):
            // dividir um mes de tributo por rbt12/12 comparava com a media de
            // 12 meses e, com historico parcial, gravava alerta errado.
            const cargaAtual = cargaDoPeriodo(ultimaApuracao?.[0], faturamentos);

            if (cargaAtual !== null) {
              const cargaBench = Number(bench[0].carga_media_pct);
              const desvio = Math.abs(cargaAtual - cargaBench);
              if (desvio > cargaBench * 0.2) {
                novosAlertas.push({
                  empresa_id: empresa.id,
                  tipo: 'desvio_benchmark',
                  titulo: `Carga tributária ${cargaAtual > cargaBench ? 'acima' : 'abaixo'} do setor`,
                  mensagem: `Sua carga atual é ${cargaAtual.toFixed(1)}% vs média do setor "${bench[0].setor}" de ${cargaBench.toFixed(1)}%. Desvio de ${desvio.toFixed(1)} p.p. — vale revisar oportunidades de elisão.`,
                  prioridade: cargaAtual > cargaBench * 1.3 ? 'alta' : 'media',
                  acao_url: '/tributario/oportunidades-elisao',
                });
              }
            }
          }
        }

        // 5) Dividendos PF (IRPFM 2026)
        const { data: divPF } = await withRetry(
          () =>
            supabase
              .from('movimentacoes')
              .select('valor, data_movimentacao, descricao')
              .eq('empresa_id', empresa.id)
              .ilike('descricao', '%dividend%')
              .gte(
                'data_movimentacao',
                new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 10)
              ),
          `dividendos_${empresa.id}`
        );

        const totalDividendos = (divPF ?? []).reduce(
          (acc: number, m: any) => acc + Number(m.valor || 0),
          0
        );
        if (totalDividendos > IRPFM_MENSAL_LIMITE) {
          novosAlertas.push({
            empresa_id: empresa.id,
            tipo: 'irpfm_2026',
            titulo: `Dividendos PF acima de R$ 50k — IRPFM 2026`,
            mensagem: `Pagamentos de dividendos no último mês somam R$ ${totalDividendos.toLocaleString('pt-BR')}. A partir de 2026, valores acima de R$ 50k/mês geram Imposto Mínimo PF (Lei 15.270/2025) — avalie Holding Patrimonial.`,
            prioridade: 'media',
            acao_url: '/tributario/oportunidades-elisao',
            acao_label: 'Ver Holding Patrimonial',
          });
        }

        // 6 e 7) Reforma Tributária — NF-e sem IBS/CBS após FG (CRT 3 e Simples)
        const countCrt3 = ['lucro_real', 'lucro_presumido'].includes(
          empresa.regime_tributario ?? ''
        )
          ? (async () => {
              const { count } = await withRetry(
                () =>
                  supabase
                    .from('notas_fiscais')
                    .select('*', { count: 'exact', head: true })
                    .eq('empresa_id', empresa.id)
                    .gte('data_emissao', '2026-08-03')
                    .is('v_cbs', null),
                `nfe_sem_ibscbs_crt3_${empresa.id}`
              );
              return count ?? 0;
            })()
          : Promise.resolve(0);
        const countSn =
          empresa.regime_tributario === 'simples_nacional'
            ? (async () => {
                const { count } = await withRetry(
                  () =>
                    supabase
                      .from('notas_fiscais')
                      .select('*', { count: 'exact', head: true })
                      .eq('empresa_id', empresa.id)
                      .gte('data_emissao', '2026-12-01')
                      .is('v_cbs', null),
                  `nfe_sem_ibscbs_sn_${empresa.id}`
                );
                return count ?? 0;
              })()
            : Promise.resolve(0);
        const [crt3Sem, snSem] = await Promise.all([countCrt3, countSn]);
        for (const a of determinarAlertasRt({
          empresa_id: empresa.id,
          regime_tributario: empresa.regime_tributario,
          countNfeSemIbscbsCrt3: crt3Sem,
          countNfeSemIbscbsSn: snSem,
        })) {
          novosAlertas.push(a);
        }
      } catch (empresaErr) {
        // Falha em uma empresa não derruba o cron inteiro
        log('error', 'empresa_processing_failed', {
          empresa_id: empresa.id,
          error: empresaErr instanceof Error ? empresaErr.message : String(empresaErr),
        });
      }
    }

    // Persiste alertas evitando duplicatas (mesmo tipo+empresa nos últimos 7d)
    let inseridos = 0;
    for (const alerta of novosAlertas) {
      try {
        const { data: existe } = await withRetry(
          () =>
            supabase
              .from('alertas_tributarios')
              .select('id')
              .eq('empresa_id', alerta.empresa_id)
              .eq('tipo', alerta.tipo)
              .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
              .limit(1),
          `dedup_${alerta.tipo}`
        );

        if (existe && existe.length > 0) continue;

        const { error } = await withRetry(
          () => supabase.from('alertas_tributarios').insert(alerta),
          `insert_${alerta.tipo}`
        );
        if (!error) inseridos++;
      } catch (insertErr) {
        log('error', 'alerta_insert_failed', {
          tipo: alerta.tipo,
          empresa_id: alerta.empresa_id,
          error: insertErr instanceof Error ? insertErr.message : String(insertErr),
        });
      }
    }

    const duration_ms = Date.now() - startedAt;
    log('info', 'fn_success', {
      empresas_processadas: empresas?.length ?? 0,
      alertas_avaliados: novosAlertas.length,
      alertas_inseridos: inseridos,
      duration_ms,
    });

    // Persistência em edge_function_logs (não-bloqueante)
    try {
      await supabase.from('edge_function_logs').insert({
        function_name: FN_NAME,
        level: 'info',
        event: 'fn_success',
        duration_ms,
        status_code: 200,
        context: {
          empresas_processadas: empresas?.length ?? 0,
          alertas_inseridos: inseridos,
        },
      });
    } catch {
      /* observability nunca derruba */
    }

    await loggers.flush();
    return new Response(
      JSON.stringify({
        ok: true,
        empresas_processadas: empresas?.length ?? 0,
        alertas_gerados: inseridos,
        alertas_avaliados: novosAlertas.length,
        duration_ms,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const duration_ms = Date.now() - startedAt;
    const error_message = e instanceof Error ? e.message : String(e);
    log('error', 'fn_failure', { error: error_message, duration_ms });

    try {
      const sb = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await sb.from('edge_function_logs').insert({
        function_name: FN_NAME,
        level: 'error',
        event: 'fn_failure',
        duration_ms,
        status_code: 500,
        error_message,
      });
    } catch {
      /* noop */
    }

    await loggers.flush();
    return new Response(JSON.stringify({ ok: false, error: error_message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

if (import.meta.main) Deno.serve(withEdgeObservability('gerar-alertas-tributarios', handler));

// ---------------------------------------------------------------------------
// Lógica RT/RFB extraída como função pura — testável sem banco
// ---------------------------------------------------------------------------

export interface AlertasRtParams {
  empresa_id: string;
  regime_tributario: string | null;
  /** Contagem de NF-e sem IBS/CBS após 03/08/2026 (CRT 3). */
  countNfeSemIbscbsCrt3: number;
  /** Contagem de NF-e sem IBS/CBS após 01/12/2026 (Simples Nacional). */
  countNfeSemIbscbsSn: number;
}

export interface AlertaRT {
  empresa_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  acao_url: string;
  acao_label: string;
}

/**
 * Gera os alertas da Reforma Tributária para uma empresa a partir dos
 * contadores já calculados. Sem I/O — testável diretamente.
 */
export function determinarAlertasRt(p: AlertasRtParams): AlertaRT[] {
  const alertas: AlertaRT[] = [];
  const esCrt3 = ['lucro_real', 'lucro_presumido'].includes(p.regime_tributario ?? '');
  const esSn = p.regime_tributario === 'simples_nacional';

  if (esCrt3 && p.countNfeSemIbscbsCrt3 > 0) {
    const n = p.countNfeSemIbscbsCrt3;
    alertas.push({
      empresa_id: p.empresa_id,
      tipo: 'nfe_sem_ibscbs_obrigatoria',
      titulo: `${n} NF-e${n > 1 ? 's' : ''} sem IBS/CBS após 03/08/2026 (CRT 3)`,
      mensagem:
        `A partir do Fato Gerador da Reforma Tributária (03/08/2026), toda NF-e emitida por ` +
        `contribuinte do Regime Normal (Lucro Real/Presumido, CRT 3) deve conter o grupo ` +
        `IBS/CBS destacado. ${n} nota${n > 1 ? 's' : ''} em aberto${n > 1 ? '' : ' em aberto'} sem o grupo — ` +
        `retifique ou reemita antes da fiscalização.`,
      prioridade: 'alta',
      acao_url: '/notas-fiscais',
      acao_label: 'Ver NF-e pendentes',
    });
  }

  if (esSn && p.countNfeSemIbscbsSn > 0) {
    const n = p.countNfeSemIbscbsSn;
    alertas.push({
      empresa_id: p.empresa_id,
      tipo: 'nfe_sem_ibscbs_simples_pos_dez26',
      titulo: `${n} NF-e${n > 1 ? 's' : ''} sem grupo IBS/CBS — nao contribuinte de ICMS desde 01/12/2026`,
      mensagem:
        `Contribuinte que nao e contribuinte do ICMS passa a ser obrigado a emitir NF-e com o ` +
        `grupo IBS/CBS a partir de 01/12/2026. ${n} nota${n > 1 ? 's' : ''} emitida${n > 1 ? 's' : ''} ` +
        `sem o grupo — ajuste o emissor antes do prazo. Se a empresa apura o IBS/CBS pelo ` +
        `regime regular, o destaque tambem passa a ser exigido.`,
      prioridade: 'alta',
      acao_url: '/notas-fiscais',
      acao_label: 'Ver NF-e Simples',
    });
  }

  return alertas;
}
