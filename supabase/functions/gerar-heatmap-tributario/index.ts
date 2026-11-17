// Edge: gerar-heatmap-tributario — versão determinística (stub)
// Substitui a versão com Lovable AI Gateway.
// Gera heatmap 12m × 8 tributos com intensidade normalizada e variação MoM.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { respostaPreflight, jsonComCors } from '../_shared/cors.ts';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { z } from '../_shared/zod.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

/**
 * Contrato COMPLETO (com zeros) para ano sem nenhum lancamento de faturamento.
 *
 * Exportado para o teste Deno deste diretorio assertar o contrato de verdade:
 * a primeira versao desta correcao devolvia so `{ celulas: [], motivo }`, e o
 * cabecalho do painel le `data.insights?.mes_pico` dentro de `{data && ...}`
 * (HeatmapTributarioAnual.tsx:83) ANTES da guarda de vazio -- a resposta curta
 * trocava o numero inventado por TypeError na renderizacao. `mes_pico` e
 * `mes_vale` vao nulos de proposito: nao existe pico num ano sem lancamento.
 */
export function respostaSemFaturamento(ano: number, empresaId: string) {
  return {
    success: true as const,
    ano,
    empresa_id: empresaId,
    celulas: [] as CelulaHeatmap[],
    meses_com_lancamento: [] as number[],
    total_por_mes: Array.from({ length: 12 }, () => 0),
    total_ano: 0,
    max_valor: 0,
    insights: { mes_pico: null as number | null, mes_vale: null as number | null },
    motivo: 'sem_faturamento_no_ano' as const,
    detalhe:
      'Nao ha faturamento lancado para o ano informado. Lance o faturamento mensal para o mapa de calor ser calculado.',
  };
}

const ReqBodySchema = z.object({
  empresa_id: z.string().uuid(),
  ano: z
    .number()
    .int()
    .min(2000)
    .max(2100)
    .default(() => new Date().getFullYear()),
});
interface CelulaHeatmap {
  mes: number;
  tributo: string;
  valor: number;
  intensidade: number;
  variacao_mom: number | null;
}

const TRIBUTOS = [
  'cbs',
  'ibs',
  'imposto_seletivo',
  'pis',
  'cofins',
  'icms',
  'iss',
  'irpj_csll',
] as const;
const ALIQUOTAS: Record<string, number> = {
  cbs: 0.012,
  ibs: 0.017,
  imposto_seletivo: 0.004,
  pis: 0.0165,
  cofins: 0.076,
  icms: 0.04,
  iss: 0.025,
  irpj_csll: 0.034,
};

Deno.serve(
  withEdgeObservability('gerar-heatmap-tributario', async (req) => {
    if (req.method === 'OPTIONS') return respostaPreflight(req);
    if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405, req);

    // [auth-guard] Funcao chamada pelo app com o JWT do usuario logado (Authorization
    // validado via getUser). Fail-closed: sem sessao valida -> 401.
    const guard = await exigirUsuario(req);
    if (!guard.ok) return guard.resposta;

    try {
      const parsed = ReqBodySchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return jsonComCors({ error: 'empresa_id ou ano inválido' }, 400, req);
      const { empresa_id: empresaId, ano } = parsed.data;

      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      // Buscar faturamento mensal real do ano (se houver)
      let receitaPorMes: Record<number, number> = {};
      if (supabaseUrl && serviceKey) {
        const supa = createClient(supabaseUrl, serviceKey);

        // service_role ignora RLS: valida o vínculo do usuário com a empresa
        // antes de ler o faturamento (mesmo padrão de comparar-benchmark-setorial).
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
          if (!vinculo) return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403, req);
        }

        const { data: fat } = await supa
          .from('faturamento_mensal')
          .select('mes, receita_bruta')
          .eq('empresa_id', empresaId)
          .eq('ano', ano);

        if (fat && fat.length > 0) {
          for (const r of fat) receitaPorMes[r.mes] = Number(r.receita_bruta || 0);
        }
      }

      // Mes sem faturamento lancado fica vazio, e nao preenchido com receita
      // ficticia. Antes, cada mes sem dado recebia 285000 fixos multiplicados
      // por uma curva de sazonalidade escrita no codigo, e o mapa de calor saia
      // inteiro preenchido -- indistinguivel de um ano de dados reais.
      // O painel ja trata a ausencia (HeatmapTributarioAnual.tsx:102).
      const mesesComLancamento = Object.keys(receitaPorMes)
        .map(Number)
        .filter((m) => m >= 1 && m <= 12)
        .sort((a, b) => a - b);

      if (mesesComLancamento.length === 0) {
        return jsonComCors(respostaSemFaturamento(ano, empresaId), 200, req);
      }

      // Gerar células
      const celulas: CelulaHeatmap[] = [];
      let maxValor = 0;
      const totaisPorTributo: Record<string, number> = {};
      for (const t of TRIBUTOS) totaisPorTributo[t] = 0;

      const variacoesMesAnterior: Record<string, number | null> = {};
      for (const t of TRIBUTOS) variacoesMesAnterior[t] = null;

      // So gera celula para mes COM lancamento. Preencher mes ausente com receita
      // zero fazia a ausencia virar vale do ano e variacao de -100% em relacao ao
      // mes anterior -- ausencia de dado lida como queda real de tributo. Sem
      // celula, o mes nao entra em pico/vale e a variacao do mes seguinte fica
      // nula, porque nao existe celula anterior para comparar.
      for (const mes of mesesComLancamento) {
        const receita = receitaPorMes[mes] ?? 0;
        for (const t of TRIBUTOS) {
          const valor = receita * ALIQUOTAS[t];
          if (valor > maxValor) maxValor = valor;
          celulas.push({
            mes,
            tributo: t,
            valor: Math.round(valor),
            intensidade: 0, // preenchido depois
            variacao_mom: null,
          });
        }
      }

      // Calcula intensidade (0-1 normalizado pelo máximo do mês+tributo) e variação MoM
      for (const c of celulas) {
        c.intensidade = maxValor > 0 ? Math.round((c.valor / maxValor) * 100) / 100 : 0;
        // variação MoM: pegar célula do mês anterior do mesmo tributo
        if (c.mes > 1) {
          const anterior = celulas.find((x) => x.mes === c.mes - 1 && x.tributo === c.tributo);
          if (anterior && anterior.valor > 0) {
            c.variacao_mom = Math.round(((c.valor - anterior.valor) / anterior.valor) * 1000) / 10;
          }
        }
      }

      const totalPorMes = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return celulas.filter((c) => c.mes === m).reduce((acc, c) => acc + c.valor, 0);
      });

      const totalAno = totalPorMes.reduce((a, b) => a + b, 0);

      // Pico e vale so entre meses COM lancamento. Antes o indexOf percorria os 12
      // e um mes sem dado, valendo zero, era eleito vale do ano.
      const comDado = mesesComLancamento.map((m) => ({ mes: m, total: totalPorMes[m - 1] }));
      const mesPico = comDado.reduce((a, b) => (b.total > a.total ? b : a)).mes;
      // Com um unico mes lancado, pico e vale seriam o mesmo mes: vale fica nulo.
      const mesVale =
        comDado.length > 1 ? comDado.reduce((a, b) => (b.total < a.total ? b : a)).mes : null;

      return jsonComCors(
        {
          success: true,
          ano,
          empresa_id: empresaId,
          celulas,
          meses_com_lancamento: mesesComLancamento,
          total_por_mes: totalPorMes.map((v) => Math.round(v)),
          total_ano: Math.round(totalAno),
          max_valor: Math.round(maxValor),
          insights: { mes_pico: mesPico, mes_vale: mesVale },
        },
        200,
        req
      );
    } catch (err) {
      return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500, req);
    }
  })
);
