import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Empresa { cnpj: string; razao_social: string; estado?: string; inscricao_estadual?: string; }
interface Conta { id: string; codigo: string; nome: string | null; descricao: string; natureza: string; tipo: string; codigo_referencial: string | null; }
interface Partida { conta_id: string; tipo: 'D' | 'C'; valor: number; historico_complementar?: string; }
interface Lancamento { id: string; numero_lancamento: number; data_lancamento: string; historico: string; valor_total: number; partidas: Partida[]; }

const fmtData = (iso: string) => { const d = new Date(iso + 'T00:00:00'); return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`; };
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');
const reg = (...c: (string|number)[]) => '|' + c.map(x => x===null||x===undefined?'':String(x)).join('|') + '|';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ChecklistItem { id: string; label: string; status: 'ok' | 'warn' | 'error'; detail?: string; itens?: string[] }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const allowed = (roles || []).some((r: { role: string }) => ['admin', 'financeiro'].includes(r.role));
    if (!allowed) return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const empresa_id: string = body.empresa_id;
    const ano_calendario: number = body.ano_calendario;
    const mode: 'validate' | 'generate' = body.mode === 'validate' ? 'validate' : 'generate';
    if (!empresa_id || !ano_calendario) {
      return new Response(JSON.stringify({ error: 'empresa_id e ano_calendario são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const periodo_inicio = `${ano_calendario}-01-01`;
    const periodo_fim = `${ano_calendario}-12-31`;

    const { data: empresa } = await supabase.from('empresas').select('cnpj, razao_social, estado, inscricao_estadual').eq('id', empresa_id).maybeSingle<Empresa>();
    if (!empresa) return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: planoRaw } = await supabase.from('plano_contas').select('id, codigo, nome, descricao, natureza, tipo, codigo_referencial').or(`empresa_id.eq.${empresa_id},empresa_id.is.null`).order('codigo');
    const plano = (planoRaw || []) as Conta[];

    const { data: lancsRaw } = await supabase
      .from('lancamentos_contabeis')
      .select('id, numero_lancamento, data_lancamento, historico, valor_total, partidas:partidas_contabeis(conta_id, tipo, valor, historico_complementar)')
      .eq('empresa_id', empresa_id)
      .gte('data_lancamento', periodo_inicio)
      .lte('data_lancamento', periodo_fim)
      .order('data_lancamento');
    const lancamentos = (lancsRaw || []) as unknown as Lancamento[];

    const idToCodigo = new Map(plano.map(c => [c.id, c.codigo]));

    // ===== Checklist =====
    const checklist: ChecklistItem[] = [];

    checklist.push({
      id: 'empresa',
      label: 'Dados da empresa (CNPJ + Razão Social)',
      status: empresa.cnpj && empresa.razao_social ? 'ok' : 'error',
      detail: empresa.cnpj && empresa.razao_social ? `${empresa.razao_social} · CNPJ ${empresa.cnpj}` : 'CNPJ ou razão social ausentes',
    });

    const analiticas = plano.filter(p => p.tipo === 'analitica');
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
    let totalDeb = 0, totalCre = 0;
    for (const l of lancamentos) {
      const d = l.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + Number(p.valor), 0);
      const c = l.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + Number(p.valor), 0);
      totalDeb += d; totalCre += c;
      if (Math.abs(d - c) > 0.01) desbalanceados.push(`#${l.numero_lancamento} (${l.data_lancamento}): D=${d.toFixed(2)} C=${c.toFixed(2)}`);
    }
    checklist.push({
      id: 'partidas',
      label: 'Partidas dobradas (débito = crédito) em cada lançamento',
      status: desbalanceados.length === 0 ? 'ok' : 'error',
      detail: desbalanceados.length === 0 ? 'Todos os lançamentos balanceados' : `${desbalanceados.length} lançamento(s) desbalanceado(s)`,
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

    const nums = lancamentos.map(l => l.numero_lancamento).sort((a, b) => a - b);
    const gaps: string[] = [];
    for (let i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1] + 1) gaps.push(`#${nums[i - 1]} → #${nums[i]}`);
    checklist.push({
      id: 'sequencial',
      label: 'Numeração sequencial dos lançamentos',
      status: gaps.length === 0 ? 'ok' : 'warn',
      detail: gaps.length === 0 ? 'Sequência contínua' : `${gaps.length} gap(s) encontrado(s)`,
      itens: gaps.slice(0, 20),
    });

    const semRef = analiticas.filter(p => !p.codigo_referencial);
    const pctRef = analiticas.length > 0 ? Math.round(((analiticas.length - semRef.length) / analiticas.length) * 100) : 100;
    checklist.push({
      id: 'cfc',
      label: 'Contas analíticas com código referencial CFC',
      status: semRef.length === 0 ? 'ok' : 'warn',
      detail: `${pctRef}% mapeadas (${analiticas.length - semRef.length}/${analiticas.length})`,
      itens: semRef.slice(0, 20).map(c => `${c.codigo} — ${c.nome || c.descricao}`),
    });

    const erros = checklist.filter(c => c.status === 'error').map(c => c.detail || c.label);
    const avisos = checklist.filter(c => c.status === 'warn').map(c => c.detail || c.label);

    if (mode === 'validate') {
      return new Response(JSON.stringify({
        mode: 'validate',
        empresa: { cnpj: empresa.cnpj, razao_social: empresa.razao_social },
        periodo: { inicio: periodo_inicio, fim: periodo_fim },
        total_lancamentos: lancamentos.length,
        checklist,
        validacoes: { erros, avisos },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== Bloqueio se houver erros =====
    if (erros.length > 0) {
      return new Response(JSON.stringify({
        error: 'Validações bloqueiam a geração do arquivo',
        checklist,
        validacoes: { erros, avisos },
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== Geração TXT =====
    const linhas: string[] = [];
    const blocoCount = new Map<string, number>();
    const push = (l: string) => {
      linhas.push(l);
      const t = l.split('|')[1]; if (t) { const b = t[0]; blocoCount.set(b, (blocoCount.get(b)||0)+1); }
    };

    push(reg('0000', 'LECD', fmtData(periodo_inicio), fmtData(periodo_fim), empresa.razao_social, cleanCnpj(empresa.cnpj), empresa.estado||'SP', empresa.inscricao_estadual||'', '', '', '0','0','0','0','0','0','','','0','0'));
    push(reg('0001','0'));
    push(reg('0007','G'));
    push(reg('0020','N','','','','','','','',''));
    push(reg('0990', (blocoCount.get('0')||0)+1));

    push(reg('I001','0'));
    push(reg('I010','G','9.00'));
    push(reg('I030','TERMO DE ABERTURA','1','12',ano_calendario,fmtData(periodo_inicio),fmtData(periodo_fim),empresa.razao_social,cleanCnpj(empresa.cnpj),'',''));

    const NAT_MAP: Record<string,string> = { ativo:'01', passivo:'02', patrimonio:'03', resultado:'04', receita:'04', despesa:'04' };
    for (const c of plano) {
      push(reg('I050', fmtData(periodo_inicio), NAT_MAP[c.natureza]||'04', c.tipo==='sintetica'?'S':'A', String(c.codigo.split('.').length), c.codigo, c.nome||c.descricao, ''));
    }
    for (const c of plano.filter(p => p.tipo==='analitica' && p.codigo_referencial)) {
      push(reg('I051','01','', c.codigo_referencial!));
    }

    push(reg('I150', fmtData(periodo_inicio), fmtData(periodo_fim)));
    for (const c of plano.filter(p => p.tipo==='analitica')) {
      const movD = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo && p.tipo==='D').reduce((s,p)=>s+Number(p.valor),0);
      const movC = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo && p.tipo==='C').reduce((s,p)=>s+Number(p.valor),0);
      const saldoFim = movD - movC;
      if (movD===0 && movC===0) continue;
      push(reg('I155', c.codigo,'','0,00','D', fmtNum(movD), fmtNum(movC), fmtNum(Math.abs(saldoFim)), saldoFim>=0?'D':'C'));
    }

    for (const l of lancamentos) {
      push(reg('I200', l.numero_lancamento, fmtData(l.data_lancamento), fmtNum(Number(l.valor_total)), 'N'));
      for (const p of l.partidas) {
        const codigo = idToCodigo.get(p.conta_id) || '';
        push(reg('I250', codigo, '', fmtNum(Number(p.valor)), p.tipo, l.historico.substring(0,700), p.historico_complementar||''));
      }
    }
    push(reg('I990', (blocoCount.get('I')||0)+1));

    push(reg('J001','0'));
    push(reg('J005', fmtData(periodo_inicio), fmtData(periodo_fim), '0','DEMONSTRACOES CONTABEIS'));

    let ord = 1;
    for (const c of plano.filter(p => ['ativo','passivo','patrimonio'].includes(p.natureza))) {
      const saldo = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo).reduce((s,p)=>s+(p.tipo==='D'?Number(p.valor):-Number(p.valor)),0);
      if (saldo===0) continue;
      push(reg('J100', String(ord++).padStart(4,'0'), c.natureza==='ativo'?'1':'2', c.tipo==='sintetica'?'S':'A', String(c.codigo.split('.').length), c.codigo, c.nome||c.descricao, fmtNum(Math.abs(saldo)), saldo>=0?'D':'C', '0,00','D'));
    }
    let ord2 = 1;
    for (const c of plano.filter(p => ['receita','despesa','resultado'].includes(p.natureza))) {
      const total = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo).reduce((s,p)=>s+(p.tipo==='C'?Number(p.valor):-Number(p.valor)),0);
      if (total===0) continue;
      push(reg('J150', String(ord2++).padStart(4,'0'), c.tipo==='sintetica'?'S':'A', String(c.codigo.split('.').length), c.codigo, c.nome||c.descricao, fmtNum(Math.abs(total)), total>=0?'C':'D','0,00','C'));
    }
    push(reg('J900','TERMO DE ENCERRAMENTO','1',empresa.razao_social,cleanCnpj(empresa.cnpj),fmtData(periodo_fim),'',''));
    push(reg('J990', (blocoCount.get('J')||0)+1));

    push(reg('9001','0'));
    for (const b of ['0','I','J']) { push(reg('9900',`${b}001`,'1')); push(reg('9900',`${b}990`,'1')); }
    push(reg('9900','9001','1')); push(reg('9900','9990','1')); push(reg('9900','9999','1'));
    push(reg('9990', (blocoCount.get('9')||0)+1));
    push(reg('9999', linhas.length+1));

    const conteudo = linhas.join('\r\n') + '\r\n';
    const hash = await sha256(conteudo);
    const file_name = `ECD-${cleanCnpj(empresa.cnpj)}-${ano_calendario}.txt`;
    const storage_path = `sped-contabil/${file_name}`;

    await supabase.storage.from('relatorios-tributarios').upload(storage_path, new Blob([conteudo], { type: 'text/plain' }), { upsert: true, contentType: 'text/plain' });
    const { data: signed } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(storage_path, 60*60*24*7);

    await supabase.from('sped_contabil_arquivos').insert({
      empresa_id, tipo: 'ECD', ano_calendario, periodo_inicio, periodo_fim,
      storage_path, hash_sha256: hash, total_linhas: linhas.length,
      total_lancamentos: lancamentos.length, validacoes: { erros, avisos },
      status: erros.length>0 ? 'rejeitado' : 'gerado', gerado_por: user.id,
    });

    return new Response(JSON.stringify({
      url: signed?.signedUrl, file_name, total_linhas: linhas.length,
      total_lancamentos: lancamentos.length, hash_sha256: hash,
      checklist, validacoes: { erros, avisos },
      empresa: { cnpj: empresa.cnpj, razao_social: empresa.razao_social },
      periodo: { inicio: periodo_inicio, fim: periodo_fim },
      observacao: 'Arquivo PRELIMINAR — validar no PVA-ECD da RFB antes da transmissão.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
