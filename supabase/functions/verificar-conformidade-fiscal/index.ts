// Edge: verificar-conformidade-fiscal — 8 checks automáticos + score 0-100
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckResult {
  id: string;
  titulo: string;
  descricao: string;
  status: 'aprovado' | 'atencao' | 'reprovado';
  peso: number; // 1-10 (criticidade)
  detalhes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('verificar-conformidade-fiscal');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const auth = req.headers.get('Authorization');
    if (!auth) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userData.user.id);
    const userRoles = (roles ?? []).map((r) => r.role);
    if (!userRoles.some((r) => ['admin', 'financeiro', 'visualizador'].includes(r))) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const empresa_id = body.empresa_id as string | undefined;
    const periodo = (body.periodo as string) ?? new Date().toISOString().slice(0, 7);

    if (!empresa_id) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'empresa_id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [ano, mes] = periodo.split('-').map(Number);
    const checks: CheckResult[] = [];

    // 1. Apurações em atraso
    const { data: apuracoes } = await admin
      .from('apuracoes_tributarias')
      .select('competencia, status')
      .eq('empresa_id', empresa_id)
      .order('competencia', { ascending: false })
      .limit(12);
    const atrasadas = (apuracoes ?? []).filter((a) => a.status !== 'transmitida' && a.status !== 'fechada').length;
    checks.push({
      id: 'apuracoes_atraso',
      titulo: 'Apurações tributárias em dia',
      descricao: 'Verifica se apurações dos últimos 12 meses foram fechadas/transmitidas',
      status: atrasadas === 0 ? 'aprovado' : atrasadas <= 2 ? 'atencao' : 'reprovado',
      peso: 9,
      detalhes: `${atrasadas} apurações pendentes nos últimos 12 meses`,
    });

    // 2. Alertas críticos abertos
    const { count: criticosCount } = await admin
      .from('alertas_tributarios')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .eq('prioridade', 'critica')
      .or('resolvido.is.null,resolvido.eq.false');
    const criticos = criticosCount ?? 0;
    checks.push({
      id: 'alertas_criticos',
      titulo: 'Alertas críticos sob controle',
      descricao: 'Máximo de 5 alertas críticos abertos',
      status: criticos === 0 ? 'aprovado' : criticos <= 5 ? 'atencao' : 'reprovado',
      peso: 8,
      detalhes: `${criticos} alertas críticos abertos`,
    });

    // 3. Contas a pagar tributárias vencidas (DARFs)
    const { count: darfVencidos } = await admin
      .from('contas_pagar')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .ilike('descricao', '%DARF%')
      .lt('data_vencimento', new Date().toISOString().slice(0, 10))
      .neq('status', 'pago');
    const darf = darfVencidos ?? 0;
    checks.push({
      id: 'darf_vencidos',
      titulo: 'DARFs sem atraso',
      descricao: 'Nenhum DARF vencido em aberto',
      status: darf === 0 ? 'aprovado' : darf <= 1 ? 'atencao' : 'reprovado',
      peso: 10,
      detalhes: `${darf} DARFs vencidos pendentes`,
    });

    // 4. Empresa com regime cadastrado
    const { data: empresa } = await admin
      .from('empresas')
      .select('regime_tributario, cnpj, razao_social')
      .eq('id', empresa_id)
      .maybeSingle();
    checks.push({
      id: 'regime_cadastrado',
      titulo: 'Regime tributário definido',
      descricao: 'Empresa possui regime tributário cadastrado',
      status: empresa?.regime_tributario ? 'aprovado' : 'reprovado',
      peso: 7,
      detalhes: empresa?.regime_tributario ?? 'Regime não cadastrado',
    });

    // 5. Cache de decisão de regime existente (sinal de análise recente)
    const { data: cacheRegime } = await admin
      .from('regime_decision_cache' as never)
      .select('expires_at')
      .eq('empresa_id', empresa_id)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const temAnaliseRegime = !!cacheRegime;
    checks.push({
      id: 'analise_regime',
      titulo: 'Análise de regime ótimo recente',
      descricao: 'Empresa teve simulação de regime nos últimos 7 dias',
      status: temAnaliseRegime ? 'aprovado' : 'atencao',
      peso: 5,
      detalhes: temAnaliseRegime ? 'Cache válido encontrado' : 'Recomenda-se rodar simulação',
    });

    // 6. Movimentações tributárias do período
    const { count: movPeriodo } = await admin
      .from('apuracoes_tributarias')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .eq('ano', ano)
      .eq('mes', mes);
    checks.push({
      id: 'apuracao_periodo',
      titulo: `Apuração de ${periodo} criada`,
      descricao: 'Apuração tributária do período de referência existe',
      status: (movPeriodo ?? 0) > 0 ? 'aprovado' : 'reprovado',
      peso: 8,
      detalhes: (movPeriodo ?? 0) > 0 ? 'Apuração presente' : 'Sem apuração para o período',
    });

    // 7. Score de saúde fiscal — alertas médios/altos
    const { count: altos } = await admin
      .from('alertas_tributarios')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .eq('prioridade', 'alta')
      .or('resolvido.is.null,resolvido.eq.false');
    const altosNum = altos ?? 0;
    checks.push({
      id: 'alertas_altos',
      titulo: 'Alertas de alta prioridade controlados',
      descricao: 'Máximo de 10 alertas de alta prioridade abertos',
      status: altosNum <= 3 ? 'aprovado' : altosNum <= 10 ? 'atencao' : 'reprovado',
      peso: 6,
      detalhes: `${altosNum} alertas de alta prioridade abertos`,
    });

    // 8. Relatórios agendados ativos (governança)
    const { count: relAtivos } = await admin
      .from('relatorios_tributarios_agendados' as never)
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa_id)
      .eq('ativo', true);
    checks.push({
      id: 'relatorios_agendados',
      titulo: 'Governança: relatórios automáticos',
      descricao: 'Pelo menos 1 relatório tributário agendado ativo',
      status: (relAtivos ?? 0) > 0 ? 'aprovado' : 'atencao',
      peso: 4,
      detalhes: `${relAtivos ?? 0} relatórios agendados ativos`,
    });

    // Calcular score ponderado
    const pesoTotal = checks.reduce((s, c) => s + c.peso, 0);
    const pesoObtido = checks.reduce((s, c) => {
      const fator = c.status === 'aprovado' ? 1 : c.status === 'atencao' ? 0.5 : 0;
      return s + c.peso * fator;
    }, 0);
    const score = Math.round((pesoObtido / pesoTotal) * 100);
    const aprovados = checks.filter((c) => c.status === 'aprovado').length;
    const nivel: 'excelente' | 'bom' | 'atencao' | 'critico' =
      score >= 90 ? 'excelente' : score >= 75 ? 'bom' : score >= 60 ? 'atencao' : 'critico';

    // Persistir
    const { data: persisted } = await admin
      .from('verificacoes_conformidade')
      .insert({
        empresa_id,
        periodo,
        score,
        nivel,
        itens: checks,
        total_checks: checks.length,
        checks_aprovados: aprovados,
      })
      .select()
      .maybeSingle();

    // Disparar alerta se score < 70
    if (score < 70) {
      await admin.from('alertas_tributarios').insert({
        empresa_id,
        tipo: 'conformidade_baixa',
        titulo: `Score de conformidade fiscal: ${score}/100`,
        mensagem: `A empresa está com nível "${nivel}" (${aprovados}/${checks.length} checks aprovados). Revise as pendências no dashboard tributário.`,
        prioridade: score < 50 ? 'critica' : 'alta',
        acao_url: '/tributario/dashboard',
        acao_label: 'Ver dashboard',
      });
    }

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { empresa_id, periodo, score, nivel, aprovados, total: checks.length },
    });
    await logger.flush();

    return new Response(
      JSON.stringify({
        id: persisted?.id,
        empresa_id,
        periodo,
        score,
        nivel,
        total_checks: checks.length,
        checks_aprovados: aprovados,
        itens: checks,
        gerado_em: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('fn_failure', { duration_ms: Date.now() - t0, status_code: 500, error_message: msg });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
