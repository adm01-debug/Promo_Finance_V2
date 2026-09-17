import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createErrorResponse, validatePayload } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { buildEcfLinhas, calcularApuracaoEcf } from './layout.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanCnpj = (c: string) => c.replace(/\D/g, '');

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface ChecklistItem {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'error';
  detail?: string;
  itens?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader)
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);
    const allowed = (roles || []).some((r: { role: string }) =>
      ['admin', 'financeiro'].includes(r.role)
    );
    if (!allowed)
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    const body = await req.json();
    const __contract = validatePayload(
      z.object({
        empresa_id: z.string().uuid(),
        ano_calendario: z.number().int().min(2000).max(2100),
        mode: z.enum(['validate', 'generate']).optional(),
      }),
      (typeof body === 'object' ? body : {}) as unknown,
      'gerar-sped-ecf'
    );
    if (!__contract.success) return createErrorResponse(__contract.error, 422, __contract.details);

    const empresa_id: string = body.empresa_id;
    const ano_calendario: number = body.ano_calendario;
    const mode: 'validate' | 'generate' = body.mode === 'validate' ? 'validate' : 'generate';
    if (!empresa_id || !ano_calendario) {
      return new Response(
        JSON.stringify({ error: 'empresa_id e ano_calendario são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // financeiro sem vínculo ativo com a empresa pedia ECF de QUALQUER
    // empresa via empresa_id arbitrário (achado do cubic-dev-ai); admin
    // mantém acesso global, igual ao resto do sistema.
    if (!(roles || []).some((r: { role: string }) => r.role === 'admin')) {
      const { data: vinculo } = await supabase
        .from('user_empresas')
        .select('id')
        .eq('user_id', user.id)
        .eq('empresa_id', empresa_id)
        .eq('ativo', true)
        .maybeSingle();
      if (!vinculo) {
        return new Response(JSON.stringify({ error: 'Sem permissão para esta empresa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const periodo_inicio = `${ano_calendario}-01-01`;
    const periodo_fim = `${ano_calendario}-12-31`;

    const { data: empresa } = await supabase
      .from('empresas')
      .select('cnpj, razao_social, estado, inscricao_estadual')
      .eq('id', empresa_id)
      .maybeSingle();
    if (!empresa)
      return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    const { data: planoRaw } = await supabase
      .from('plano_contas')
      .select('id, codigo, nome, descricao, natureza, tipo, codigo_referencial')
      .or(`empresa_id.eq.${empresa_id},empresa_id.is.null`)
      .order('codigo');
    const plano = (planoRaw || []) as Array<{
      id: string;
      codigo: string;
      nome: string | null;
      descricao: string;
      natureza: string;
      tipo: string;
      codigo_referencial: string | null;
    }>;

    const { data: lancsRaw } = await supabase
      .from('lancamentos_contabeis')
      .select(
        'id, numero_lancamento, data_lancamento, historico, valor_total, partidas:partidas_contabeis(conta_id, tipo, valor)'
      )
      .eq('empresa_id', empresa_id)
      .gte('data_lancamento', periodo_inicio)
      .lte('data_lancamento', periodo_fim);
    const lancamentos = (lancsRaw || []) as unknown as Array<{
      id: string;
      numero_lancamento: number;
      data_lancamento: string;
      historico: string;
      valor_total: number;
      partidas: Array<{ conta_id: string; tipo: 'D' | 'C'; valor: number }>;
    }>;

    const { data: ecdAnterior } = await supabase
      .from('sped_contabil_arquivos')
      .select('id, recibo_transmissao, hash_sha256, status, created_at')
      .eq('empresa_id', empresa_id)
      .eq('tipo', 'ECD')
      .eq('ano_calendario', ano_calendario)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const idToCodigo = new Map(plano.map((c) => [c.id, c.codigo]));
    const naturezaDe = (cid: string) => plano.find((c) => c.id === cid)?.natureza;

    // `receitas`/`despesas` só alimentam o checklist abaixo (mensagem e
    // status). A apuração de fato (lucro_liquido/base_irpj/irpj/csll) vem
    // de `calcularApuracaoEcf`, em `layout.ts` — mesma função que
    // `buildEcfLinhas` usa internamente para montar M300/N500/N620/N650,
    // para as duas nunca divergirem.
    const receitas = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => naturezaDe(p.conta_id) === 'receita')
      .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
    const despesas = lancamentos
      .flatMap((l) => l.partidas)
      .filter((p) => naturezaDe(p.conta_id) === 'despesa')
      .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0);
    const { lucro_liquido, base_irpj, irpj, csll } = calcularApuracaoEcf({ plano, lancamentos });

    // ===== Checklist =====
    const checklist: ChecklistItem[] = [];

    checklist.push({
      id: 'empresa',
      label: 'Dados da empresa (CNPJ + Razão Social)',
      status: empresa.cnpj && empresa.razao_social ? 'ok' : 'error',
      detail:
        empresa.cnpj && empresa.razao_social
          ? `${empresa.razao_social} · CNPJ ${empresa.cnpj}`
          : 'Dados ausentes',
    });

    checklist.push({
      id: 'lancs',
      label: 'Pelo menos 1 lançamento contábil no período',
      status: lancamentos.length > 0 ? 'ok' : 'error',
      detail: `${lancamentos.length} lançamento(s) em ${ano_calendario}`,
    });

    checklist.push({
      id: 'ecd_ref',
      label: 'ECD do mesmo período localizada (cross-check)',
      status: ecdAnterior ? 'ok' : 'error',
      detail: ecdAnterior
        ? `ECD #${ecdAnterior.id.substring(0, 8)} · hash ${(ecdAnterior.hash_sha256 || '').substring(0, 12)}…${ecdAnterior.recibo_transmissao ? ` · recibo ${ecdAnterior.recibo_transmissao}` : ' · sem recibo'}`
        : 'Gere a ECD do período antes de transmitir a ECF',
    });

    const analiticas = plano.filter((p) => p.tipo === 'analitica');
    const semRef = analiticas.filter((p) => !p.codigo_referencial);
    const pctRef =
      analiticas.length > 0
        ? Math.round(((analiticas.length - semRef.length) / analiticas.length) * 100)
        : 100;
    checklist.push({
      id: 'cfc',
      label: 'Contas analíticas com código referencial CFC',
      status: semRef.length === 0 ? 'ok' : 'warn',
      detail: `${pctRef}% mapeadas (${analiticas.length - semRef.length}/${analiticas.length})`,
      itens: semRef.slice(0, 20).map((c) => `${c.codigo} — ${c.nome || c.descricao}`),
    });

    const temMovimento = receitas !== 0 || despesas !== 0;
    checklist.push({
      id: 'lucro',
      label: 'Lucro líquido coerente com movimentação',
      status: temMovimento && lucro_liquido !== 0 ? 'ok' : 'warn',
      detail: temMovimento
        ? `Lucro líquido: R$ ${lucro_liquido.toFixed(2)} (Rec ${receitas.toFixed(2)} − Desp ${despesas.toFixed(2)})`
        : 'Sem movimento de receita/despesa no período',
    });

    // K355 vs L100 cross-check (saldo patrimonial)
    let k355Total = 0,
      l100Total = 0;
    for (const c of plano.filter((p) => ['receita', 'despesa', 'resultado'].includes(p.natureza))) {
      const total = lancamentos
        .flatMap((l) => l.partidas)
        .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
        .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0);
      k355Total += Math.abs(total);
    }
    for (const c of plano.filter((p) => ['ativo', 'passivo', 'patrimonio'].includes(p.natureza))) {
      const saldo = lancamentos
        .flatMap((l) => l.partidas)
        .filter((p) => idToCodigo.get(p.conta_id) === c.codigo)
        .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0);
      l100Total += Math.abs(saldo);
    }
    checklist.push({
      id: 'cross_k355_l100',
      label: 'Cross-check K355 (resultado) vs L100 (balanço)',
      status: 'warn',
      detail: `K355 total: R$ ${k355Total.toFixed(2)} · L100 total: R$ ${l100Total.toFixed(2)}`,
    });

    checklist.push({
      id: 'apuracao',
      label: 'Apuração IRPJ/CSLL com base ≥ 0',
      status: base_irpj >= 0 ? 'ok' : 'error',
      detail: `Base R$ ${base_irpj.toFixed(2)} · IRPJ R$ ${irpj.toFixed(2)} · CSLL R$ ${csll.toFixed(2)}`,
    });

    const erros = checklist.filter((c) => c.status === 'error').map((c) => c.detail || c.label);
    const avisos = checklist.filter((c) => c.status === 'warn').map((c) => c.detail || c.label);

    if (mode === 'validate') {
      return new Response(
        JSON.stringify({
          mode: 'validate',
          empresa: { cnpj: empresa.cnpj, razao_social: empresa.razao_social },
          periodo: { inicio: periodo_inicio, fim: periodo_fim },
          total_lancamentos: lancamentos.length,
          checklist,
          validacoes: { erros, avisos },
          ecd_referencia: ecdAnterior || null,
          apuracao_preview: { lucro_liquido, base_irpj, irpj, csll },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (erros.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validações bloqueiam a geração do arquivo',
          checklist,
          validacoes: { erros, avisos },
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== Geração TXT =====
    // Montagem pura em `layout.ts`, testada com golden file + invariantes
    // (Etapa 40). Única correção ali: o bloco 9900 lista os tipos de
    // registro realmente emitidos em vez de uma lista
    // `['0','C','J','K','L','M','N']` cravada.
    const linhas = buildEcfLinhas({
      empresa,
      plano,
      lancamentos,
      ano_calendario,
      periodo_inicio,
      periodo_fim,
      ecdAnterior: ecdAnterior ?? null,
    });

    const conteudo = linhas.join('\r\n') + '\r\n';
    const hash = await sha256(conteudo);
    const file_name = `ECF-${cleanCnpj(empresa.cnpj)}-${ano_calendario}.txt`;
    const storage_path = `${empresa_id}/sped-contabil/${file_name}`;

    await supabase.storage
      .from('relatorios-tributarios')
      .upload(storage_path, new Blob([conteudo], { type: 'text/plain' }), {
        upsert: true,
        contentType: 'text/plain',
      });
    const { data: signed } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(storage_path, 60 * 60 * 24 * 7);

    const { data: inserted } = await supabase
      .from('sped_contabil_arquivos')
      .insert({
        empresa_id,
        tipo: 'ECF',
        ano_calendario,
        periodo_inicio,
        periodo_fim,
        storage_path,
        hash_sha256: hash,
        total_linhas: linhas.length,
        total_lancamentos: lancamentos.length,
        validacoes: { erros, avisos },
        status: erros.length > 0 ? 'rejeitado' : 'gerado',
        gerado_por: user.id,
      })
      .select('id')
      .maybeSingle();

    return new Response(
      JSON.stringify({
        url: signed?.signedUrl,
        file_name,
        total_linhas: linhas.length,
        total_lancamentos: lancamentos.length,
        hash_sha256: hash,
        checklist,
        validacoes: { erros, avisos },
        empresa: { cnpj: empresa.cnpj, razao_social: empresa.razao_social },
        periodo: { inicio: periodo_inicio, fim: periodo_fim },
        apuracao: { lucro_liquido, base_irpj, irpj, csll },
        arquivo_id: inserted?.id,
        observacao: 'Arquivo PRELIMINAR — validar no PVA-ECF da RFB antes da transmissão.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
