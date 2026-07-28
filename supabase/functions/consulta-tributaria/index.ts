// Edge Function: consulta-tributaria
// Endpoints de consulta rápida de alíquotas e regras tributárias por UF, CNAE e NCM.
//
// Contrato (GET com query string OU POST com JSON body):
//   ?recurso=uf   &uf=SP [&uf_destino=RJ] [&categoria=GERAL] [&municipio=3550308]
//   ?recurso=cnae &codigo=6201-5/01
//   ?recurso=ncm  &codigo=22021000 [&uf=SP] [&uf_destino=RJ] [&monofasico=true] [&st=true]
//   ?recurso=ncm  &monofasico=true&st=true&limite=50        (listagem filtrada)
//
// Toda resposta inclui `match`, descrevendo se houve correspondência exata ou
// qual fallback foi aplicado (prefixo hierárquico do NCM/CNAE, categoria padrão
// da UF, etc.). Nunca retornamos 404 silencioso: devolvemos o melhor candidato
// disponível e sinalizamos a estratégia usada, para o motor tributário decidir.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { z } from '../_shared/zod.ts';
import {
  classificarCenarioST,
  escolherAliquotaInterna,
  prefixosHierarquicos,
  somenteDigitos,
  vigentes,
  type MatchInfo,
} from './helpers.ts';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

const ufSchema = z.enum(UFS);
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

const ParamsSchema = z.object({
  recurso: z.enum(['uf', 'cnae', 'ncm']),
  uf: ufSchema.optional(),
  uf_destino: ufSchema.optional(),
  codigo: z.string().trim().min(1).max(20).optional(),
  categoria: z.string().trim().min(1).max(60).optional(),
  municipio: z.coerce.number().int().positive().optional(),
  monofasico: boolish.optional(),
  st: boolish.optional(),
  limite: z.coerce.number().int().min(1).max(200).optional().default(25),
});

type Params = z.infer<typeof ParamsSchema>;


function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Funções puras de normalização/vigência/fallback vivem em `helpers.ts`
// (testadas em `index.test.ts` sem tocar no banco).


// ---------------------------------------------------------------------------
// Recurso: UF
// ---------------------------------------------------------------------------
async function consultarUF(db: SupabaseClient, p: Params) {
  if (!p.uf) return json({ error: 'Parâmetro "uf" é obrigatório para recurso=uf' }, 400);

  const [internasRes, interRes, protocolosRes, beneficiosRes, issRes] = await Promise.all([
    db.from('aliquotas_internas_uf').select('*').eq('uf', p.uf),
    p.uf_destino
      ? db
          .from('aliquotas_interestaduais')
          .select('*')
          .eq('uf_origem', p.uf)
          .eq('uf_destino', p.uf_destino)
      : Promise.resolve({ data: [], error: null }),
    db
      .from('protocolos_st_ufs')
      .select('papel, protocolo:protocolos_st(id, codigo, nome, segmento, base_legal)')
      .eq('uf', p.uf)
      .limit(p.limite),
    db.from('beneficios_fiscais').select('*').eq('uf', p.uf).limit(p.limite),
    p.municipio
      ? db.from('aliquotas_iss_municipal').select('*').eq('codigo_ibge', p.municipio).limit(p.limite)
      : db.from('aliquotas_iss_municipal').select('*').eq('uf', p.uf).limit(p.limite),
  ]);

  const erro = internasRes.error ?? interRes.error ?? protocolosRes.error ?? beneficiosRes.error ?? issRes.error;
  if (erro) return json({ error: 'Falha ao consultar catálogos', detalhe: erro.message }, 500);

  type Interna = {
    categoria_produto: string | null;
    aliquota: number;
    aliquota_fcp: number | null;
    base_legal: string | null;
  };
  const internas = vigentes<Interna>(internasRes.data);

  // Fallback da alíquota interna: categoria exata → GERAL/PADRAO → primeira disponível.
  const { escolhida, match } = escolherAliquotaInterna(internas, p.categoria, p.uf);

  return json({
    recurso: 'uf',
    uf: p.uf,
    match,
    aliquota_interna: escolhida,
    categorias_disponiveis: internas.map((i) => i.categoria_produto).filter(Boolean),
    interestadual: p.uf_destino ? (vigentes(interRes.data)[0] ?? null) : null,
    protocolos_st: protocolosRes.data ?? [],
    beneficios_fiscais: vigentes(beneficiosRes.data),
    iss_municipal: vigentes(issRes.data),
  });
}

// ---------------------------------------------------------------------------
// Recurso: CNAE
// ---------------------------------------------------------------------------
async function consultarCNAE(db: SupabaseClient, p: Params) {
  if (!p.codigo) return json({ error: 'Parâmetro "codigo" é obrigatório para recurso=cnae' }, 400);

  const digitos = somenteDigitos(p.codigo);
  if (digitos.length < 2) return json({ error: 'Código CNAE inválido' }, 400);

  const select = 'codigo, descricao, atividade, anexo_simples, sujeito_fator_r, vedado_simples, presuncao_irpj, presuncao_csll, rat_padrao, terceiros_padrao';

  // 1) Match exato considerando a formatação armazenada (com ou sem pontuação).
  const exato = await db
    .from('cnaes')
    .select(select)
    .or(`codigo.eq.${p.codigo.trim()},codigo.eq.${digitos}`)
    .limit(1)
    .maybeSingle();
  if (exato.error) return json({ error: 'Falha ao consultar CNAE', detalhe: exato.error.message }, 500);
  if (exato.data) {
    return json({ recurso: 'cnae', match: { estrategia: 'exato', exato: true }, cnae: exato.data, alternativas: [] });
  }

  // 2) Fallback hierárquico: subclasse → classe → grupo → divisão → seção.
  for (const tamanho of [5, 4, 3, 2]) {
    if (digitos.length < tamanho) continue;
    const prefixo = digitos.slice(0, tamanho);
    const { data, error } = await db
      .from('cnaes')
      .select(select)
      .ilike('codigo', `${prefixo}%`)
      .limit(p.limite);
    if (error) return json({ error: 'Falha ao consultar CNAE', detalhe: error.message }, 500);
    const candidatos = data ?? [];
    if (candidatos.length > 0) {
      return json({
        recurso: 'cnae',
        match: {
          estrategia: `fallback_prefixo_${tamanho}`,
          exato: false,
          detalhe: `Sem CNAE exato para ${p.codigo}; usando o prefixo ${prefixo}`,
        },
        cnae: candidatos[0],
        alternativas: candidatos.slice(1),
      });
    }
  }

  return json({
    recurso: 'cnae',
    match: { estrategia: 'sem_correspondencia', exato: false, detalhe: `Nenhum CNAE encontrado para ${p.codigo}` },
    cnae: null,
    alternativas: [],
  });
}

// ---------------------------------------------------------------------------
// Recurso: NCM (+ cenário de ST e filtro monofásico)
// ---------------------------------------------------------------------------
type NcmRow = {
  codigo: string;
  descricao: string | null;
  aliquota_ipi: number | null;
  cest: string | null;
  monofasico_pis_cofins: boolean | null;
  sujeito_st: boolean | null;
  mva_padrao: number | null;
  vigente_de: string | null;
  vigente_ate: string | null;
};

const NCM_SELECT =
  'codigo, descricao, aliquota_ipi, cest, monofasico_pis_cofins, sujeito_st, mva_padrao, observacoes, vigente_de, vigente_ate';

/** Cenário de ST: protocolos que alcançam o NCM na UF informada (e no destino). */
async function montarCenarioST(db: SupabaseClient, ncmCodigo: string, p: Params) {
  const digitos = somenteDigitos(ncmCodigo);
  const prefixos = prefixosHierarquicos(digitos, [8, 6, 4, 2]);

  const { data, error } = await db
    .from('protocolos_st_ncms')
    .select(
      'ncm_codigo, mva_original, cest, vigente_de, vigente_ate, protocolo:protocolos_st(id, codigo, nome, segmento, base_legal, ufs:protocolos_st_ufs(uf, papel))',
    )
    .in('ncm_codigo', prefixos)
    .limit(p.limite);
  if (error) return { erro: error.message };

  type Vinculo = {
    ncm_codigo: string;
    mva_original: number | null;
    protocolo: { ufs?: { uf: string; papel: string }[] } | null;
  };
  const brutos = vigentes<Vinculo>(data);

  // Filtra por aderência às UFs de origem/destino quando informadas.
  const ufsAlvo = [p.uf, p.uf_destino].filter(Boolean) as string[];
  const { vinculos, estrategia } = classificarCenarioST(
    brutos,
    ufsAlvo,
    prefixos[0] === digitos ? 'exato' : 'fallback_prefixo',
  );

  return {
    aplicavel: vinculos.length > 0,
    estrategia,
    protocolos: vinculos,
    mva_sugerida: vinculos.find((v) => v.mva_original != null)?.mva_original ?? null,
  };
}

async function consultarNCM(db: SupabaseClient, p: Params) {
  // Modo listagem: sem código, apenas filtros (monofásico / ST).
  if (!p.codigo) {
    let query = db.from('ncms').select(NCM_SELECT).order('codigo').limit(p.limite);
    if (p.monofasico !== undefined) query = query.eq('monofasico_pis_cofins', p.monofasico);
    if (p.st !== undefined) query = query.eq('sujeito_st', p.st);
    const { data, error } = await query;
    if (error) return json({ error: 'Falha ao listar NCMs', detalhe: error.message }, 500);
    return json({
      recurso: 'ncm',
      modo: 'listagem',
      filtros: { monofasico: p.monofasico ?? null, st: p.st ?? null },
      total: (data ?? []).length,
      ncms: vigentes<NcmRow>(data),
    });
  }

  const digitos = somenteDigitos(p.codigo);
  if (digitos.length < 2) return json({ error: 'Código NCM inválido' }, 400);

  // Fallback hierárquico do NCM: 8 → 6 → 4 → 2 dígitos (item → subposição → posição → capítulo).
  let escolhido: NcmRow | null = null;
  let alternativas: NcmRow[] = [];
  let match: MatchInfo = { estrategia: 'sem_correspondencia', exato: false };

  for (const tamanho of [8, 6, 4, 2]) {
    if (digitos.length < tamanho) continue;
    const prefixo = digitos.slice(0, tamanho);
    let query = db.from('ncms').select(NCM_SELECT).ilike('codigo', `${prefixo}%`).limit(p.limite);
    if (p.monofasico !== undefined) query = query.eq('monofasico_pis_cofins', p.monofasico);
    if (p.st !== undefined) query = query.eq('sujeito_st', p.st);
    const { data, error } = await query;
    if (error) return json({ error: 'Falha ao consultar NCM', detalhe: error.message }, 500);

    const candidatos = vigentes<NcmRow>(data);
    if (candidatos.length === 0) continue;

    escolhido = candidatos.find((c) => somenteDigitos(c.codigo) === digitos) ?? candidatos[0];
    alternativas = candidatos.filter((c) => c.codigo !== escolhido!.codigo);
    const exatoMatch = somenteDigitos(escolhido.codigo) === digitos;
    match = exatoMatch
      ? { estrategia: 'exato', exato: true }
      : {
          estrategia: `fallback_prefixo_${tamanho}`,
          exato: false,
          detalhe: `NCM ${p.codigo} não cadastrado; regra herdada de ${escolhido.codigo}`,
        };
    break;
  }

  // Enriquecimento com o cenário de ICMS-ST e a alíquota interna do destino.
  const cenarioST = escolhido ? await montarCenarioST(db, escolhido.codigo, p) : null;

  let aliquotaDestino: unknown = null;
  const ufDestino = p.uf_destino ?? p.uf;
  if (ufDestino) {
    const { data } = await db.from('aliquotas_internas_uf').select('*').eq('uf', ufDestino);
    const internas = vigentes<{ categoria_produto: string | null }>(data);
    aliquotaDestino =
      internas.find((i) => ['GERAL', 'PADRAO', 'PADRÃO'].includes((i.categoria_produto ?? '').toUpperCase())) ??
      internas[0] ??
      null;
  }

  return json({
    recurso: 'ncm',
    modo: 'detalhe',
    match,
    ncm: escolhido,
    alternativas,
    monofasico: escolhido?.monofasico_pis_cofins ?? null,
    cenario_st: cenarioST,
    aliquota_interna_destino: aliquotaDestino,
    uf_referencia: ufDestino ?? null,
  });
}

// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    // Aceita GET (query string) e POST (JSON), normalizando para o mesmo schema.
    const url = new URL(req.url);
    const raw: Record<string, unknown> = Object.fromEntries(url.searchParams.entries());
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      Object.assign(raw, body ?? {});
    }

    const parsed = ParamsSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: 'Parâmetros inválidos', detalhes: parsed.error.flatten().fieldErrors }, 400);
    }
    const p = parsed.data;

    if (p.recurso === 'uf') return await consultarUF(db, p);
    if (p.recurso === 'cnae') return await consultarCNAE(db, p);
    return await consultarNCM(db, p);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    console.error('[consulta-tributaria]', msg);
    return json({ error: 'Erro interno na consulta tributária' }, 500);
  }
});
