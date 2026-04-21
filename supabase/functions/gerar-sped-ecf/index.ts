import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fmtData = (iso: string) => { const d = new Date(iso + 'T00:00:00'); return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`; };
const fmtNum = (v: number) => v.toFixed(2).replace('.', ',');
const cleanCnpj = (c: string) => c.replace(/\D/g, '');
const reg = (...c: (string|number)[]) => '|' + c.map(x => x===null||x===undefined?'':String(x)).join('|') + '|';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    if (!empresa_id || !ano_calendario) {
      return new Response(JSON.stringify({ error: 'empresa_id e ano_calendario são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const periodo_inicio = `${ano_calendario}-01-01`;
    const periodo_fim = `${ano_calendario}-12-31`;

    const { data: empresa } = await supabase.from('empresas').select('cnpj, razao_social, estado, inscricao_estadual').eq('id', empresa_id).maybeSingle();
    if (!empresa) return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: planoRaw } = await supabase.from('plano_contas').select('id, codigo, nome, descricao, natureza, tipo, codigo_referencial').or(`empresa_id.eq.${empresa_id},empresa_id.is.null`).order('codigo');
    const plano = (planoRaw || []) as Array<{ id: string; codigo: string; nome: string|null; descricao: string; natureza: string; tipo: string; codigo_referencial: string|null }>;

    const { data: lancsRaw } = await supabase
      .from('lancamentos_contabeis')
      .select('id, numero_lancamento, data_lancamento, historico, valor_total, partidas:partidas_contabeis(conta_id, tipo, valor)')
      .eq('empresa_id', empresa_id)
      .gte('data_lancamento', periodo_inicio)
      .lte('data_lancamento', periodo_fim);
    const lancamentos = (lancsRaw || []) as unknown as Array<{ id: string; numero_lancamento: number; data_lancamento: string; historico: string; valor_total: number; partidas: Array<{ conta_id: string; tipo: 'D'|'C'; valor: number }> }>;

    // Tenta recuperar recibo ECD do mesmo período
    const { data: ecdAnterior } = await supabase
      .from('sped_contabil_arquivos')
      .select('recibo_transmissao, hash_sha256')
      .eq('empresa_id', empresa_id)
      .eq('tipo', 'ECD')
      .eq('ano_calendario', ano_calendario)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const idToCodigo = new Map(plano.map(c => [c.id, c.codigo]));
    const naturezaDe = (cid: string) => plano.find(c => c.id === cid)?.natureza;

    const receitas = lancamentos.flatMap(l=>l.partidas).filter(p => naturezaDe(p.conta_id)==='receita').reduce((s,p)=>s+(p.tipo==='C'?Number(p.valor):-Number(p.valor)),0);
    const despesas = lancamentos.flatMap(l=>l.partidas).filter(p => naturezaDe(p.conta_id)==='despesa').reduce((s,p)=>s+(p.tipo==='D'?Number(p.valor):-Number(p.valor)),0);
    const lucro_liquido = receitas - despesas;
    const base_irpj = Math.max(0, lucro_liquido);
    const irpj = base_irpj * 0.15 + Math.max(0, base_irpj - 240000) * 0.10;
    const csll = base_irpj * 0.09;

    // Validações
    const erros: string[] = [];
    const avisos: string[] = [];
    if (lancamentos.length === 0) erros.push('Nenhum lançamento contábil no período');
    if (!ecdAnterior) avisos.push('ECD do período não localizado — gere a ECD antes de transmitir a ECF');
    const semRef = plano.filter(p => p.tipo==='analitica' && !p.codigo_referencial).length;
    if (semRef > 0) avisos.push(`${semRef} contas analíticas sem código referencial`);

    // Geração
    const linhas: string[] = [];
    const bc = new Map<string, number>();
    const push = (l: string) => { linhas.push(l); const t = l.split('|')[1]; if (t) { const b = t[0]; bc.set(b, (bc.get(b)||0)+1); } };

    push(reg('0000','LECF','0010',ano_calendario,cleanCnpj(empresa.cnpj),empresa.razao_social,'',fmtData(periodo_inicio),fmtData(periodo_fim),'0','0','N','N','N'));
    push(reg('0001','0'));
    push(reg('0010','A','1','L','01','N','N','N','N','N','N','N','N'));
    push(reg('0020','0','0','0','0','','','','',''));
    push(reg('0030', empresa.estado||'SP','','','','','','','', empresa.inscricao_estadual||''));
    push(reg('0990', (bc.get('0')||0)+1));

    push(reg('C001','0'));
    push(reg('C040','G', ecdAnterior?.recibo_transmissao || '', fmtData(periodo_inicio), fmtData(periodo_fim)));
    push(reg('C990', (bc.get('C')||0)+1));

    push(reg('J001','0'));
    push(reg('J050', fmtData(periodo_inicio), '01'));
    for (const c of plano.filter(p => p.tipo==='analitica' && p.codigo_referencial)) {
      push(reg('J051', c.codigo_referencial!, c.nome||c.descricao, c.codigo));
    }
    push(reg('J100','01', ano_calendario, 'N'));
    push(reg('J990', (bc.get('J')||0)+1));

    push(reg('K001','0'));
    push(reg('K030', fmtData(periodo_inicio), fmtData(periodo_fim), 'A','A'));
    for (const c of plano.filter(p => ['receita','despesa','resultado'].includes(p.natureza))) {
      const total = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo).reduce((s,p)=>s+(p.tipo==='C'?Number(p.valor):-Number(p.valor)),0);
      if (total===0) continue;
      push(reg('K355', c.codigo, c.codigo_referencial||'', fmtNum(Math.abs(total)), total>=0?'C':'D'));
    }
    push(reg('K990', (bc.get('K')||0)+1));

    push(reg('L001','0'));
    push(reg('L030', fmtData(periodo_inicio), fmtData(periodo_fim), 'A'));
    for (const c of plano.filter(p => ['ativo','passivo','patrimonio'].includes(p.natureza))) {
      const saldo = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo).reduce((s,p)=>s+(p.tipo==='D'?Number(p.valor):-Number(p.valor)),0);
      if (saldo===0) continue;
      push(reg('L100', c.codigo, c.codigo_referencial||'', c.nome||c.descricao, fmtNum(Math.abs(saldo)), saldo>=0?'D':'C'));
    }
    for (const c of plano.filter(p => ['receita','despesa'].includes(p.natureza))) {
      const total = lancamentos.flatMap(l=>l.partidas).filter(p => idToCodigo.get(p.conta_id)===c.codigo).reduce((s,p)=>s+(p.tipo==='C'?Number(p.valor):-Number(p.valor)),0);
      if (total===0) continue;
      push(reg('L210', c.codigo, c.nome||c.descricao, fmtNum(Math.abs(total))));
    }
    push(reg('L300','01','LUCRO LIQUIDO DO EXERCICIO', fmtNum(lucro_liquido)));
    push(reg('L990', (bc.get('L')||0)+1));

    push(reg('M001','0'));
    push(reg('M010','01','LUCRO REAL', fmtData(periodo_inicio), fmtData(periodo_fim)));
    push(reg('M300','01','LUCRO LIQUIDO', fmtNum(lucro_liquido), 'P'));
    push(reg('M300','04','BASE CALCULO IRPJ', fmtNum(base_irpj),'P'));
    push(reg('M350','01','BASE CALCULO CSLL', fmtNum(base_irpj),'P'));
    push(reg('M990', (bc.get('M')||0)+1));

    push(reg('N001','0'));
    push(reg('N500','01', ano_calendario, fmtNum(base_irpj)));
    push(reg('N620','01', fmtNum(irpj)));
    push(reg('N650','01', fmtNum(csll)));
    push(reg('N990', (bc.get('N')||0)+1));

    push(reg('9001','0'));
    for (const b of ['0','C','J','K','L','M','N']) { push(reg('9900',`${b}001`,'1')); push(reg('9900',`${b}990`,'1')); }
    push(reg('9900','9001','1')); push(reg('9900','9990','1')); push(reg('9900','9999','1'));
    push(reg('9990', (bc.get('9')||0)+1));
    push(reg('9999', linhas.length+1));

    const conteudo = linhas.join('\r\n') + '\r\n';
    const hash = await sha256(conteudo);
    const file_name = `ECF-${cleanCnpj(empresa.cnpj)}-${ano_calendario}.txt`;
    const storage_path = `sped-contabil/${file_name}`;

    await supabase.storage.from('relatorios-tributarios').upload(storage_path, new Blob([conteudo], { type: 'text/plain' }), { upsert: true, contentType: 'text/plain' });
    const { data: signed } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(storage_path, 60*60*24*7);

    await supabase.from('sped_contabil_arquivos').insert({
      empresa_id, tipo: 'ECF', ano_calendario, periodo_inicio, periodo_fim,
      storage_path, hash_sha256: hash, total_linhas: linhas.length,
      total_lancamentos: lancamentos.length, validacoes: { erros, avisos },
      status: erros.length>0 ? 'rejeitado' : 'gerado', gerado_por: user.id,
    });

    return new Response(JSON.stringify({
      url: signed?.signedUrl, file_name, total_linhas: linhas.length,
      total_lancamentos: lancamentos.length, hash_sha256: hash,
      validacoes: { erros, avisos },
      apuracao: { lucro_liquido, base_irpj, irpj, csll },
      observacao: 'Arquivo PRELIMINAR — validar no PVA-ECF da RFB antes da transmissão.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
