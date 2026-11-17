// Edge: comparar-benchmark-setorial — versão determinística (stub)
// Substitui a versão que dependia de LOVABLE_API_KEY (ausente neste projeto).
// Calcula carga tributária 12m da empresa vs benchmarks por regime tributário.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { respostaPreflight, jsonComCors } from '../_shared/cors.ts';
import { z } from '../_shared/zod.ts';
import { exigirInternaOuUsuario } from '../_shared/auth-guard.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

const ReqBodySchema = z.object({ empresa_id: z.string().uuid() });
interface Benchmark {
  regime: string;
  p25: number;
  mediana: number;
  p75: number;
  media: number;
}

// Faixa de REFERENCIA interna por regime. Nao e amostra de empresas: a tabela
// public.benchmarks_setoriais existe para isso e esta vazia (0 linhas em
// 2026-11-17). Usada apenas quando a tabela nao tem linha vigente para o
// regime, e sempre declarada como referencia na resposta -- antes a funcao
// afirmava "Comparado a 1247 empresas do mesmo regime", numero que nao existe
// em lugar nenhum: nem a tabela real tem coluna de amostra.
const REFERENCIA: Record<string, Benchmark> = {
  simples: { regime: 'simples', p25: 4.5, mediana: 6.8, p75: 9.2, media: 7.1 },
  presumido: { regime: 'presumido', p25: 11.5, mediana: 14.2, p75: 17.8, media: 14.6 },
  real: { regime: 'real', p25: 18.2, mediana: 24.5, p75: 31.4, media: 25.1 },
};

Deno.serve(
  withEdgeObservability('comparar-benchmark-setorial', async (req) => {
    if (req.method === 'OPTIONS') return respostaPreflight(req);
    if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405, req);

    const guard = await exigirInternaOuUsuario(req);
    if (!guard.ok) return guard.resposta;

    try {
      const parsed = ReqBodySchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return jsonComCors({ error: 'empresa_id inválido' }, 400, req);
      const empresaId = parsed.data.empresa_id;

      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      let empresa = { id: empresaId, razao_social: 'Empresa', regime: 'simples' };
      // Sem default: 6.8 era exatamente a mediana do Simples, entao empresa sem
      // faturamento aparecia "na mediana do setor" com 0,0 p.p. de diferenca.
      let cargaEmpresa12m: number | null = null;

      if (supabaseUrl && serviceKey) {
        const supa = createClient(supabaseUrl, serviceKey);

        if (guard.dados.origem === 'usuario') {
          const { data: isAdmin } = await supa.rpc('has_role', {
            _user_id: guard.dados.userId,
            _role: 'admin',
          });
          if (!isAdmin) {
            const { data: vinculo } = await supa
              .from('user_empresas')
              .select('id')
              .eq('user_id', guard.dados.userId)
              .eq('empresa_id', empresaId)
              .eq('ativo', true)
              .maybeSingle();
            if (!vinculo)
              return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403, req);
          }
        }

        const { data: emp } = await supa
          .from('empresas')
          .select('id, razao_social, regime_tributario')
          .eq('id', empresaId)
          .maybeSingle();
        if (emp) {
          empresa = {
            id: emp.id,
            razao_social: emp.razao_social || 'Empresa',
            regime: (emp as any).regime_tributario || 'simples',
          };
        }

        const { data: fat } = await supa
          .from('faturamento_mensal')
          .select('receita_bruta, total_tributos')
          .eq('empresa_id', empresaId)
          .order('ano', { ascending: false })
          .order('mes', { ascending: false })
          .limit(12);

        if (fat && fat.length > 0) {
          const totReceita = fat.reduce((acc, r) => acc + Number(r.receita_bruta || 0), 0);
          const totTrib = fat.reduce((acc, r) => acc + Number(r.total_tributos || 0), 0);
          if (totReceita > 0) cargaEmpresa12m = Math.round((totTrib / totReceita) * 1000) / 10;
        }
      }

      // Benchmark vigente da tabela real; so cai na referencia interna se nao
      // houver linha para o regime.
      let origemBenchmark: 'tabela' | 'referencia_interna' = 'referencia_interna';
      let fonteBenchmark = 'Faixa de referência interna por regime tributário';
      let benchmark = REFERENCIA[empresa.regime] ?? REFERENCIA.simples;

      if (supabaseUrl && serviceKey) {
        const supa2 = createClient(supabaseUrl, serviceKey);
        const hoje = new Date().toISOString().slice(0, 10);
        const { data: bm } = await supa2
          .from('benchmarks_setoriais')
          .select('regime, carga_p25_pct, mediana, carga_p75_pct, carga_media_pct, fonte')
          .eq('regime', empresa.regime)
          .lte('vigencia_inicio', hoje)
          .or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`)
          .order('vigencia_inicio', { ascending: false })
          .limit(1);

        const linha = bm?.[0];
        if (
          linha &&
          linha.carga_p25_pct != null &&
          linha.mediana != null &&
          linha.carga_p75_pct != null
        ) {
          benchmark = {
            regime: empresa.regime,
            p25: Number(linha.carga_p25_pct),
            mediana: Number(linha.mediana),
            p75: Number(linha.carga_p75_pct),
            media: Number(linha.carga_media_pct ?? linha.mediana),
          };
          origemBenchmark = 'tabela';
          fonteBenchmark =
            typeof linha.fonte === 'string' && linha.fonte
              ? linha.fonte
              : 'public.benchmarks_setoriais';
        }
      }

      // Sem faturamento nos ultimos 12 meses nao ha carga para comparar. O card
      // ja ganha estado vazio nesta mudanca: devolver numero inventado aqui
      // produzia badge "Na mediana do setor" e percentil para empresa sem
      // nenhum lancamento.
      if (cargaEmpresa12m === null) {
        return jsonComCors(
          {
            empresa,
            carga_empresa_12m: null,
            benchmark: null,
            posicao: null,
            percentil: null,
            diferenca_mediana: null,
            motivo: 'sem_faturamento_12m',
            insights: [
              'Sem faturamento lançado nos últimos 12 meses: não há carga tributária a comparar.',
            ],
            atualizado_em: new Date().toISOString(),
          },
          200,
          req
        );
      }
      const mediana = benchmark.mediana;
      const diferenca = Math.round((cargaEmpresa12m - mediana) * 10) / 10;

      let posicao: 'abaixo_p25' | 'mediana' | 'acima_p75';
      let percentil: number;
      if (cargaEmpresa12m < benchmark.p25) {
        posicao = 'abaixo_p25';
        percentil = Math.max(
          5,
          Math.round(25 - ((benchmark.p25 - cargaEmpresa12m) / benchmark.p25) * 25)
        );
      } else if (cargaEmpresa12m > benchmark.p75) {
        posicao = 'acima_p75';
        percentil = Math.min(
          95,
          75 + Math.round(((cargaEmpresa12m - benchmark.p75) / benchmark.p75) * 20)
        );
      } else {
        posicao = 'mediana';
        const range = benchmark.p75 - benchmark.p25;
        percentil = Math.round(25 + ((cargaEmpresa12m - benchmark.p25) / range) * 50);
      }

      const insights: string[] = [];
      if (cargaEmpresa12m > mediana) {
        insights.push(
          `Carga tributária ${diferenca.toFixed(1)} p.p. acima da mediana do regime ${empresa.regime}.`
        );
        insights.push('Revisão de créditos PIS/COFINS pode reduzir até 8% da carga.');
      } else {
        insights.push(
          `Carga tributária ${Math.abs(diferenca).toFixed(1)} p.p. abaixo da mediana do regime ${empresa.regime}.`
        );
        insights.push('Operação eficiente — manter monitoramento trimestral.');
      }
      insights.push(
        origemBenchmark === 'tabela'
          ? `Comparado ao benchmark vigente do regime ${empresa.regime} (fonte: ${fonteBenchmark}).`
          : `Comparado à faixa de referência interna do regime ${empresa.regime} — não há benchmark de mercado carregado no sistema.`
      );

      return jsonComCors(
        {
          empresa: { id: empresa.id, razao_social: empresa.razao_social, regime: empresa.regime },
          carga_empresa_12m: cargaEmpresa12m,
          benchmark: { ...benchmark, origem: origemBenchmark, fonte: fonteBenchmark },
          posicao,
          percentil,
          diferenca_mediana: diferenca,
          insights,
          atualizado_em: new Date().toISOString(),
        },
        200,
        req
      );
    } catch (err) {
      return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500, req);
    }
  })
);
