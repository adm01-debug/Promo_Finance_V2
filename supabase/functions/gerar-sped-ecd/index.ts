import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createErrorResponse, validatePayload } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { buildEcdLinhas, type EcdConta, type EcdEmpresa, type EcdLancamento } from './layout.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Os tipos de dados vêm de `layout.ts` — única definição da forma dos
// registros ECD, compartilhada entre o fetch (aqui) e a montagem pura das
// linhas (lá), para as duas nunca divergirem silenciosamente.
type Empresa = EcdEmpresa;
type Conta = EcdConta;
type Lancamento = EcdLancamento;

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
      'gerar-sped-ecd'
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

    // financeiro sem vínculo ativo com a empresa pedia ECD de QUALQUER
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
      .maybeSingle<Empresa>();
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
    const plano = (planoRaw || []) as Conta[];

    const { data: lancsRaw } = await supabase
      .from('lancamentos_contabeis')
      .select(
        'id, numero_lancamento, data_lancamento, historico, valor_total, partidas:partidas_contabeis(conta_id, tipo, valor, historico_complementar)'
      )
      .eq('empresa_id', empresa_id)
      .gte('data_lancamento', periodo_inicio)
      .lte('data_lancamento', periodo_fim)
      .order('data_lancamento');
    const lancamentos = (lancsRaw || []) as unknown as Lancamento[];

    // ===== Checklist =====
    const checklist: ChecklistItem[] = [];

    checklist.push({
      id: 'empresa',
      label: 'Dados da empresa (CNPJ + Razão Social)',
      status: empresa.cnpj && empresa.razao_social ? 'ok' : 'error',
      detail:
        empresa.cnpj && empresa.razao_social
          ? `${empresa.razao_social} · CNPJ ${empresa.cnpj}`
          : 'CNPJ ou razão social ausentes',
    });

    const analiticas = plano.filter((p) => p.tipo === 'analitica');
    checklist.push({
      id: 'plano',
      label: 'Plano de contas com contas analíticas',
      status: analiticas.length > 0 ? 'ok' : 'error',
      detail: `${analiticas.length} contas analíticas em ${plano.length} totais`,
    });

    checklist.push({
      id: 'lancs',
      label: 'Pelo menos 1 lançamento no período',
      status: lancamentos.length > 0 ? 'ok' : 'error',
      detail: `${lancamentos.length} lançamentos encontrados em ${ano_calendario}`,
    });

    const desbalanceados: string[] = [];
    let totalDeb = 0,
      totalCre = 0;
    for (const l of lancamentos) {
      const d = l.partidas.filter((p) => p.tipo === 'D').reduce((s, p) => s + Number(p.valor), 0);
      const c = l.partidas.filter((p) => p.tipo === 'C').reduce((s, p) => s + Number(p.valor), 0);
      totalDeb += d;
      totalCre += c;
      if (Math.abs(d - c) > 0.01)
        desbalanceados.push(
          `#${l.numero_lancamento} (${l.data_lancamento}): D=${d.toFixed(2)} C=${c.toFixed(2)}`
        );
    }
    checklist.push({
      id: 'partidas',
      label: 'Partidas dobradas (débito = crédito) em cada lançamento',
      status: desbalanceados.length === 0 ? 'ok' : 'error',
      detail:
        desbalanceados.length === 0
          ? 'Todos os lançamentos balanceados'
          : `${desbalanceados.length} lançamento(s) desbalanceado(s)`,
      itens: desbalanceados.slice(0, 20),
    });

    const foraPeriodo: string[] = [];
    for (const l of lancamentos) {
      if (l.data_lancamento < periodo_inicio || l.data_lancamento > periodo_fim) {
        foraPeriodo.push(`#${l.numero_lancamento}: ${l.data_lancamento}`);
      }
    }
    checklist.push({
      id: 'periodo',
      label: 'Lançamentos dentro do período',
      status: foraPeriodo.length === 0 ? 'ok' : 'error',
      detail: foraPeriodo.length === 0 ? 'OK' : `${foraPeriodo.length} fora do período`,
      itens: foraPeriodo.slice(0, 20),
    });

    const balanceteOk = Math.abs(totalDeb - totalCre) < 0.01;
    checklist.push({
      id: 'balancete',
      label: 'Balancete consolidado (∑ débitos = ∑ créditos)',
      status: balanceteOk ? 'ok' : 'error',
      detail: `D: ${totalDeb.toFixed(2)} · C: ${totalCre.toFixed(2)} · Δ: ${Math.abs(totalDeb - totalCre).toFixed(2)}`,
    });

    const nums = lancamentos.map((l) => l.numero_lancamento).sort((a, b) => a - b);
    const gaps: string[] = [];
    for (let i = 1; i < nums.length; i++)
      if (nums[i] !== nums[i - 1] + 1) gaps.push(`#${nums[i - 1]} → #${nums[i]}`);
    checklist.push({
      id: 'sequencial',
      label: 'Numeração sequencial dos lançamentos',
      status: gaps.length === 0 ? 'ok' : 'warn',
      detail: gaps.length === 0 ? 'Sequência contínua' : `${gaps.length} gap(s) encontrado(s)`,
      itens: gaps.slice(0, 20),
    });

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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== Bloqueio se houver erros =====
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
    // (Etapa 40). Duas correções ali em relação à versão anterior, que
    // montava tudo inline aqui: `I051` passa a vir logo após o `I050` da
    // mesma conta (era emitido num segundo loop, associando-o ao ÚLTIMO
    // `I050` do arquivo), e o bloco 9900 lista os tipos de registro
    // realmente emitidos em vez de uma lista `['0','I','J']` cravada.
    const linhas = buildEcdLinhas({
      empresa,
      plano,
      lancamentos,
      ano_calendario,
      periodo_inicio,
      periodo_fim,
    });

    const conteudo = linhas.join('\r\n') + '\r\n';
    const hash = await sha256(conteudo);
    const file_name = `ECD-${cleanCnpj(empresa.cnpj)}-${ano_calendario}.txt`;
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

    await supabase.from('sped_contabil_arquivos').insert({
      empresa_id,
      tipo: 'ECD',
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
    });

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
        observacao: 'Arquivo PRELIMINAR — validar no PVA-ECD da RFB antes da transmissão.',
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
