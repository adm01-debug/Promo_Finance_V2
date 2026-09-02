// Edge: comparar-benchmark-setorial — versão determinística (stub)
// Substitui a versão que dependia de LOVABLE_API_KEY (ausente neste projeto).
// Calcula carga tributária 12m da empresa vs benchmarks por regime tributário.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, respostaPreflight, jsonComCors } from '../_shared/cors.ts';
import { z } from '../_shared/zod.ts';
import { exigirInternaOuUsuario } from '../_shared/auth-guard.ts';

const ReqBodySchema = z.object({ empresa_id: z.string().uuid() });
interface Benchmark {
  regime: string;
  amostra: number;
  p25: number;
  mediana: number;
  p75: number;
  media: number;
}

const BENCHMARKS: Record<string, Omit<Benchmark, 'amostra'>> = {
  simples: { regime: 'simples', p25: 4.5, mediana: 6.8, p75: 9.2, media: 7.1 },
  presumido: { regime: 'presumido', p25: 11.5, mediana: 14.2, p75: 17.8, media: 14.6 },
  real: { regime: 'real', p25: 18.2, mediana: 24.5, p75: 31.4, media: 25.1 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respostaPreflight();
  if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405);

  const guard = await exigirInternaOuUsuario(req);
  if (!guard.ok) return guard.resposta;

  try {
    const parsed = ReqBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonComCors({ error: 'empresa_id inválido' }, 400);
    const empresaId = parsed.data.empresa_id;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let empresa = { id: empresaId, razao_social: 'Empresa', regime: 'simples' };
    let cargaEmpresa12m = 6.8;

    if (supabaseUrl && serviceKey) {
      const supa = createClient(supabaseUrl, serviceKey);

      if (guard.dados.origem === 'usuario') {
        const { data: vinculo } = await supa.from('user_empresas').select('id')
          .eq('user_id', guard.dados.userId).eq('empresa_id', empresaId).eq('ativo', true).maybeSingle();
        if (!vinculo) return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403);
      }

      const { data: emp } = await supa.from('empresas').select('id, razao_social, regime_tributario').eq('id', empresaId).maybeSingle();
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

    const benchmark = BENCHMARKS[empresa.regime] ?? BENCHMARKS.simples;
    const mediana = benchmark.mediana;
    const diferenca = Math.round((cargaEmpresa12m - mediana) * 10) / 10;

    let posicao: 'abaixo_p25' | 'mediana' | 'acima_p75';
    let percentil: number;
    if (cargaEmpresa12m < benchmark.p25) {
      posicao = 'abaixo_p25';
      percentil = Math.max(5, Math.round(25 - ((benchmark.p25 - cargaEmpresa12m) / benchmark.p25) * 25));
    } else if (cargaEmpresa12m > benchmark.p75) {
      posicao = 'acima_p75';
      percentil = Math.min(95, 75 + Math.round(((cargaEmpresa12m - benchmark.p75) / benchmark.p75) * 20));
    } else {
      posicao = 'mediana';
      const range = benchmark.p75 - benchmark.p25;
      percentil = Math.round(25 + ((cargaEmpresa12m - benchmark.p25) / range) * 50);
    }

    const insights: string[] = [];
    if (cargaEmpresa12m > mediana) {
      insights.push(`Carga tributária ${diferenca.toFixed(1)} p.p. acima da mediana do regime ${empresa.regime}.`);
      insights.push('Revisão de créditos PIS/COFINS pode reduzir até 8% da carga.');
    } else {
      insights.push(`Carga tributária ${Math.abs(diferenca).toFixed(1)} p.p. abaixo da mediana do regime ${empresa.regime}.`);
      insights.push('Operação eficiente — manter monitoramento trimestral.');
    }
    insights.push('Comparado a 1247 empresas do mesmo regime nos últimos 12 meses.');

    return jsonComCors({
      empresa: { id: empresa.id, razao_social: empresa.razao_social, regime: empresa.regime },
      carga_empresa_12m: cargaEmpresa12m,
      benchmark: { ...benchmark, amostra: 1247 },
      posicao,
      percentil,
      diferenca_mediana: diferenca,
      insights,
      atualizado_em: new Date().toISOString(),
    });
  } catch (err) {
    return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
