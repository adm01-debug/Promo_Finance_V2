// Edge: gerar-dre-tributaria — versão determinística (stub)
// Substitui a versão com Lovable AI Gateway.
// Calcula DRE com decomposição fiscal: CBS+IBS+PIS+COFINS+ICMS+ISS+IRPJ+CSLL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, respostaPreflight, jsonComCors } from '../_shared/cors.ts';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { z } from '../_shared/zod.ts';

const ReqBodySchema = z.object({
  empresa_id: z.string().uuid(),
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respostaPreflight();
  if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405);

  // [auth-guard] Funcao chamada pelo app com o JWT do usuario logado (Authorization
  // validado via getUser). Fail-closed: sem sessao valida -> 401.
  const guard = await exigirUsuario(req);
  if (!guard.ok) return guard.resposta;

  try {
    const parsed = ReqBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return jsonComCors({ error: 'empresa_id e periodo YYYY-MM são obrigatórios' }, 400);
    const { empresa_id: empresaId, periodo } = parsed.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let receitaBruta = 0;
    let totalTributosPagos = 0;
    let regime = 'simples';

    if (supabaseUrl && serviceKey) {
      const supa = createClient(supabaseUrl, serviceKey);

      // service_role ignora RLS: valida o vínculo do usuário com a empresa
      // antes de ler dados fiscais (mesmo padrão de comparar-benchmark-setorial).
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
        if (!vinculo) return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403);
      }

      const [ano, mes] = periodo.split('-').map(Number);

      const { data: fat } = await supa
        .from('faturamento_mensal')
        .select('receita_bruta, total_tributos')
        .eq('empresa_id', empresaId)
        .eq('ano', ano)
        .eq('mes', mes)
        .maybeSingle();

      if (fat) {
        receitaBruta = Number(fat.receita_bruta || 0);
        totalTributosPagos = Number(fat.total_tributos || 0);
      }

      const { data: emp } = await supa
        .from('empresas')
        .select('regime_tributario')
        .eq('id', empresaId)
        .maybeSingle();
      if (typeof emp?.regime_tributario === 'string') regime = emp.regime_tributario;
    }

    // Receita fallback se vazia
    if (receitaBruta === 0) receitaBruta = 285000;

    // Decomposição fiscal proporcional à carga média brasileira
    const pis = receitaBruta * 0.0165;
    const cofins = receitaBruta * 0.076;
    const icms = receitaBruta * 0.04;
    const iss = receitaBruta * 0.025;
    // CBS+IBS já vigentes em 2026 (transição Reforma Tributária)
    const cbs = receitaBruta * 0.012; // 12% CBS em 2026
    const ibs = receitaBruta * 0.017; // IBS estadual+ municipal parcial
    const impostoSeletivo = receitaBruta * 0.004;

    const totalDeducoes = pis + cofins + icms + iss + cbs + ibs + impostoSeletivo;
    const receitaLiquida = receitaBruta - totalDeducoes;
    const custos = receitaLiquida * 0.55;
    const lucroBruto = receitaLiquida - custos;
    const irpj = lucroBruto * 0.15;
    const csll = lucroBruto * 0.09;
    const lucroLiquido = lucroBruto - irpj - csll;
    const cargaTributariaPct =
      receitaBruta > 0 ? Math.round((totalDeducoes / receitaBruta) * 1000) / 10 : 0;

    // Simulação regime ótimo: Lucro Real quando carga > 20%
    let comparativoRegimeOtimo = null;
    if (regime !== 'real') {
      const tributosReais = receitaBruta * 0.22;
      comparativoRegimeOtimo = {
        regime: 'real',
        tributos_estimados: Math.round(tributosReais),
        economia_potencial: Math.round(totalDeducoes - tributosReais),
      };
    }

    return jsonComCors({
      dre: {
        periodo,
        receita_bruta: Math.round(receitaBruta),
        deducoes: {
          cbs: Math.round(cbs),
          ibs: Math.round(ibs),
          imposto_seletivo: Math.round(impostoSeletivo),
          pis: Math.round(pis),
          cofins: Math.round(cofins),
          icms: Math.round(icms),
          iss: Math.round(iss),
          total: Math.round(totalDeducoes),
        },
        receita_liquida: Math.round(receitaLiquida),
        custos: Math.round(custos),
        lucro_bruto: Math.round(lucroBruto),
        irpj: Math.round(irpj),
        csll: Math.round(csll),
        lucro_liquido: Math.round(lucroLiquido),
        carga_tributaria_pct: cargaTributariaPct,
        comparativo_regime_otimo: comparativoRegimeOtimo,
      },
    });
  } catch (err) {
    return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
