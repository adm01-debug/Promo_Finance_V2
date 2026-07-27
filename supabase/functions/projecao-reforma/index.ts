import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Tipos e Cronograma (Sincronizado com lib/tributario/projecao-reforma.ts) ---
interface AliquotaTransicao {
  ano: number;
  cbs: number;
  ibs: number;
  pisCofinsResidual: number;
  icmsResidual: number;
  issResidual: number;
  fase: string;
}

const CRONOGRAMA_REFORMA: AliquotaTransicao[] = [
  { ano: 2026, cbs: 0.9, ibs: 0.1, pisCofinsResidual: 100, icmsResidual: 100, issResidual: 100, fase: 'Teste — alíquotas simbólicas' },
  { ano: 2027, cbs: 8.8, ibs: 0.1, pisCofinsResidual: 0, icmsResidual: 100, issResidual: 100, fase: 'CBS plena, IBS simbólica' },
  { ano: 2028, cbs: 8.8, ibs: 0.1, pisCofinsResidual: 0, icmsResidual: 100, issResidual: 100, fase: 'CBS plena, IBS simbólica' },
  { ano: 2029, cbs: 8.8, ibs: 1.77, pisCofinsResidual: 0, icmsResidual: 90, issResidual: 90, fase: 'IBS começa transição (10%)' },
  { ano: 2030, cbs: 8.8, ibs: 3.54, pisCofinsResidual: 0, icmsResidual: 80, issResidual: 80, fase: 'IBS 20% / ICMS-ISS 80%' },
  { ano: 2031, cbs: 8.8, ibs: 5.31, pisCofinsResidual: 0, icmsResidual: 70, issResidual: 70, fase: 'IBS 30% / ICMS-ISS 70%' },
  { ano: 2032, cbs: 8.8, ibs: 7.08, pisCofinsResidual: 0, icmsResidual: 60, issResidual: 60, fase: 'IBS 40% / ICMS-ISS 60%' },
  { ano: 2033, cbs: 8.8, ibs: 17.7, pisCofinsResidual: 0, icmsResidual: 0, issResidual: 0, fase: 'Sistema novo pleno' },
];

function redutorSetorial(setor?: string): number {
  switch (setor) {
    case 'saude':
    case 'educacao':
    case 'agro':
      return 0.4;
    default:
      return 1;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('projecao-reforma');
  const t0 = Date.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const raw = await req.json();
    const { z } = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
    const { validatePayload, createErrorResponse } = await import('../_shared/validation.ts');
    const Schema = z.object({
      faturamentoAnual: z.number().nonnegative(),
      percentualServicos: z.number().min(0).max(100),
      pisCofinsAtual: z.number().optional(),
      icmsAtual: z.number().optional(),
      issAtual: z.number().optional(),
      setor: z.string().optional(),
    }).passthrough();
    const parsed = validatePayload(Schema, raw, 'projecao-reforma');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details);
    const { faturamentoAnual, percentualServicos, pisCofinsAtual = 9.25, icmsAtual = 18, issAtual = 5, setor = 'geral' } = parsed.data as Record<string, any>;

    const redutor = redutorSetorial(setor);
    const pctServ = percentualServicos / 100;
    const pctCom = (100 - percentualServicos) / 100;

    const baseServicos = faturamentoAnual * pctServ;
    const baseComercio = faturamentoAnual * pctCom;
    const tributosAtuais = faturamentoAnual * (pisCofinsAtual / 100) + baseComercio * (icmsAtual / 100) + baseServicos * (issAtual / 100);
    const cargaAtual = (tributosAtuais / faturamentoAnual) * 100;

    const projecoes = CRONOGRAMA_REFORMA.map((ano) => {
      const cbs = (faturamentoAnual * (ano.cbs / 100)) * redutor;
      const ibs = (faturamentoAnual * (ano.ibs / 100)) * redutor;
      const pisCofins = faturamentoAnual * (pisCofinsAtual / 100) * (ano.pisCofinsResidual / 100);
      const icms = baseComercio * (icmsAtual / 100) * (ano.icmsResidual / 100);
      const iss = baseServicos * (issAtual / 100) * (ano.issResidual / 100);
      const total = cbs + ibs + pisCofins + icms + iss;
      const carga = (total / faturamentoAnual) * 100;

      return {
        ano: ano.ano,
        fase: ano.fase,
        cbs,
        ibs,
        pisCofins,
        icms,
        iss,
        totalTributos: total,
        cargaEfetiva: carga,
        variacaoVsAtual: carga - cargaAtual,
      };
    });

    const economiaAcumulada = projecoes.reduce((acc, p) => acc + (tributosAtuais - p.totalTributos), 0);

    logger.info('projecao_concluida', { duration: Date.now() - t0 });
    await logger.flush();

    return new Response(JSON.stringify({
      cargaAtual,
      projecoes,
      economiaAcumulada,
      parametros: body
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logger.error('erro_projecao', { error: err.message });
    await logger.flush();
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
