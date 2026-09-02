// Edge: prever-carga-tributaria — versão determinística
// Substitui a versão com Lovable AI Gateway (que exigia LOVABLE_API_KEY inexistente neste projeto).
// Mantém o MESMO contrato consumido por usePrevisaoTributaria.ts:
//   { empresa_id, gerado_em, historico_meses, previsao_base[], cenario_conservador_total,
//     cenario_agressivo_total, acoes_recomendadas[], resumo_executivo }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, respostaPreflight, jsonComCors } from '../_shared/cors.ts';
import { z } from '../_shared/zod.ts';
import { exigirInternaOuUsuario } from '../_shared/auth-guard.ts';

const ReqBodySchema = z.object({
  empresa_id: z.string().uuid(),
  meses_historico: z.number().int().min(3).max(24).default(12),
});

interface PrevisaoMes {
  mes_offset: number;
  total_tributos: number;
  cbs: number;
  ibs: number;
  imposto_seletivo: number;
  confianca_pct: number;
}

interface AcaoRecomendada {
  titulo: string;
  descricao: string;
  impacto_estimado_brl: number;
  prioridade: 'alta' | 'media' | 'baixa';
}

interface PrevisaoResponse {
  empresa_id: string;
  gerado_em: string;
  historico_meses: number;
  previsao_base: PrevisaoMes[];
  cenario_conservador_total: number;
  cenario_agressivo_total: number;
  acoes_recomendadas: AcaoRecomendada[];
  resumo_executivo: string;
  origem: 'dados_reais' | 'stub_deterministico';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respostaPreflight();
  if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405);

  const guard = await exigirInternaOuUsuario(req);
  if (!guard.ok) return guard.resposta;

  try {
    const parsed = ReqBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonComCors({ error: 'empresa_id ou meses_historico inválido' }, 400);
    const { empresa_id: empresaId, meses_historico: mesesHistorico } = parsed.data;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let baseTributosMensal = 28500; // fallback determinístico (≈ carga efetiva de 33% sobre ~R$ 86k de receita)
    let origem: PrevisaoResponse['origem'] = 'stub_deterministico';
    let historicoUsado = 0;

    if (SUPABASE_URL && SERVICE_KEY) {
      const supa = createClient(SUPABASE_URL, SERVICE_KEY);

      if (guard.dados.origem === 'usuario') {
        const { data: vinculo } = await supa.from('user_empresas').select('id')
          .eq('user_id', guard.dados.userId).eq('empresa_id', empresaId).eq('ativo', true).maybeSingle();
        if (!vinculo) return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403);
      }

      const { data: fat } = await supa
        .from('faturamento_mensal')
        .select('receita_bruta')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(mesesHistorico);

      if (fat && fat.length > 0) {
        const mediaReceita = fat.reduce((acc, r) => acc + Number(r.receita_bruta || 0), 0) / fat.length;
        // Carga tributária efetiva média nacional ~33% (cesta Simples/LP/LR)
        baseTributosMensal = Math.max(2000, Math.round(mediaReceita * 0.33));
        origem = 'dados_reais';
        historicoUsado = fat.length;
      }
    }

    const previsaoBase: PrevisaoMes[] = [];
    let cenarioConservadorTotal = 0;
    let cenarioAgressivoTotal = 0;

    for (let i = 1; i <= 6; i++) {
      const sazonal = 1 + Math.sin(i / 2) * 0.08;
      // +1.2% a.m. simulando transição progressiva da Reforma Tributária (CBS+IBS)
      const tendenciaReforma = 1 + i * 0.012;
      const total = Math.round(baseTributosMensal * sazonal * tendenciaReforma);

      // CBS (12%) + IBS (média regional ~17%) + IS (média ~4% em produtos incentivados)
      const cbs = Math.round(total * 0.36);
      const ibs = Math.round(total * 0.51);
      const impostoSeletivo = Math.max(0, total - cbs - ibs);

      const confianca = Math.max(55, 70 - i * 2.5);

      previsaoBase.push({
        mes_offset: i,
        total_tributos: total,
        cbs,
        ibs,
        imposto_seletivo: impostoSeletivo,
        confianca_pct: Math.round(confianca),
      });

      cenarioConservadorTotal += Math.round(total * 1.15); // pior caso: +15%
      cenarioAgressivoTotal += Math.round(total * 0.90);  // melhor caso: -10% via otimizações
    }

    const acoesRecomendadas: AcaoRecomendada[] = [
      {
        titulo: 'Revisão de créditos PIS/COFINS sobre insumos',
        descricao: 'Apurar créditos não-cumulativos sobre energia elétrica, insumos industriais e fretes nos últimos 5 anos (Lei 10.637/02 + Lei 10.833/03).',
        impacto_estimado_brl: Math.round(baseTributosMensal * 0.08),
        prioridade: 'alta',
      },
      {
        titulo: 'Simulação do regime tributário ótimo',
        descricao: 'Comparar Simples Nacional vs Lucro Presumido vs Lucro Real considerando a transição CBS+IBS a partir de 2026.',
        impacto_estimado_brl: Math.round(baseTributosMensal * 0.05),
        prioridade: 'alta',
      },
      {
        titulo: 'Aproveitamento de créditos de ICMS-ST',
        descricao: 'Recuperar ICMS pago a maior em operações com substituição tributária (Art. 166 CTN + Convênio CONFAZ 13/97).',
        impacto_estimado_brl: Math.round(baseTributosMensal * 0.03),
        prioridade: 'media',
      },
      {
        titulo: 'Adesão ao split payment voluntário',
        descricao: 'Reduzir ICMS próprio devido em até 1% via programa de conformidade tributária.',
        impacto_estimado_brl: Math.round(baseTributosMensal * 0.01),
        prioridade: 'baixa',
      },
    ];

    const totalEconomiaPotencial = acoesRecomendadas.reduce((acc, a) => acc + a.impacto_estimado_brl, 0);

    const resumoExecutivo =
      origem === 'dados_reais'
        ? `Projeção conservadora soma R$ ${cenarioConservadorTotal.toLocaleString('pt-BR')} em 6 meses; cenário agressivo alcança R$ ${cenarioAgressivoTotal.toLocaleString('pt-BR')}. ${historicoUsado} meses de histórico analisados. Economia potencial identificada: até R$ ${totalEconomiaPotencial.toLocaleString('pt-BR')}/mês.`
        : `Histórico de faturamento insuficiente (${historicoUsado} meses) — projeção baseada em carga tributária efetiva média (33%). Cadastre pelo menos 3 meses em /tributario/reforma-tributaria para previsões precisas.`;

    const resposta: PrevisaoResponse = {
      empresa_id: empresaId,
      gerado_em: new Date().toISOString(),
      historico_meses: historicoUsado,
      previsao_base: previsaoBase,
      cenario_conservador_total: cenarioConservadorTotal,
      cenario_agressivo_total: cenarioAgressivoTotal,
      acoes_recomendadas: acoesRecomendadas,
      resumo_executivo: resumoExecutivo,
      origem,
    };

    return jsonComCors(resposta);
  } catch (err) {
    return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
