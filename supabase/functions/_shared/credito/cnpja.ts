/**
 * Consulta de CNPJ para a análise de crédito (chamada interna, sem usuário).
 *
 * `cnpja-lookup` exige JWT de usuário e rate limit por usuário; a fila de
 * crédito roda a partir de um webhook do Champions, então a consulta é feita
 * aqui com o service role: lê o cache persistente `cnpja_cache` (alimentado pelo
 * cnpja-lookup) e, na falta, consulta a API CNPJá.
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.4';

export interface DadosCnpja {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string | null;
  dataAbertura: string | null;
  capitalSocial: number | null;
  naturezaJuridica: string | null;
  porte: string | null;
  regimeAtual: 'simples' | 'mei' | 'presumido_real';
  simplesOptante: boolean;
  meiOptante: boolean;
  cnaePrincipal: { codigo: string; descricao: string } | null;
  endereco: { cidade: string; uf: string };
}

type Json = Record<string, unknown>;

function obj(v: unknown): Json {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {};
}

export function normalizarRetornoCnpja(cnpj: string, raw: unknown): DadosCnpja {
  const r = obj(raw);
  const company = obj(r.company);
  const address = obj(r.address);
  const mainActivity = obj(r.mainActivity);
  const simples = obj(company.simples);
  const simei = obj(company.simei);
  const status = obj(r.status);

  let regimeAtual: DadosCnpja['regimeAtual'] = 'presumido_real';
  if (simei.optant) regimeAtual = 'mei';
  else if (simples.optant) regimeAtual = 'simples';

  return {
    cnpj,
    razaoSocial: String(company.name ?? r.alias ?? ''),
    nomeFantasia: String(r.alias ?? ''),
    situacaoCadastral: typeof status.text === 'string' ? status.text : null,
    dataAbertura: typeof r.founded === 'string' ? r.founded : null,
    capitalSocial: typeof company.equity === 'number' ? company.equity : null,
    naturezaJuridica:
      typeof obj(company.nature).text === 'string' ? String(obj(company.nature).text) : null,
    porte: typeof obj(company.size).text === 'string' ? String(obj(company.size).text) : null,
    regimeAtual,
    simplesOptante: !!simples.optant,
    meiOptante: !!simei.optant,
    cnaePrincipal: mainActivity.id
      ? { codigo: String(mainActivity.id), descricao: String(mainActivity.text ?? '') }
      : null,
    endereco: { cidade: String(address.city ?? ''), uf: String(address.state ?? '') },
  };
}

export type ResultadoCnpja =
  { ok: true; dados: DadosCnpja; origem: 'cache' | 'api' } | { ok: false; erro: string };

export async function consultarCnpjInterno(
  admin: SupabaseClient,
  cnpj: string
): Promise<ResultadoCnpja> {
  const { data: cached } = await admin
    .from('cnpja_cache')
    .select('data, expires_at')
    .eq('cnpj', cnpj)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached?.data) {
    const d = obj(cached.data);
    // O cache guarda o objeto já normalizado pelo cnpja-lookup (com `raw` dentro).
    const dados = d.raw ? normalizarRetornoCnpja(cnpj, d.raw) : (d as unknown as DadosCnpja);
    return { ok: true, dados, origem: 'cache' };
  }

  const apiKey = Deno.env.get('CNPJA_API_KEY');
  if (!apiKey) return { ok: false, erro: 'CNPJA_API_KEY não configurada' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(`https://api.cnpja.com/office/${cnpj}`, {
      headers: { Authorization: apiKey.trim(), Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, erro: err instanceof Error ? err.message : 'falha de rede CNPJá' };
  }
  clearTimeout(timeout);

  const text = await res.text();
  if (!res.ok) return { ok: false, erro: `CNPJá retornou ${res.status}: ${text.slice(0, 200)}` };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, erro: 'Resposta CNPJá inválida' };
  }

  // Não grava em cnpja_cache: o formato gravado lá é o do cnpja-lookup (com
  // endereço completo e CNAEs secundários) e o front depende dele.
  return { ok: true, dados: normalizarRetornoCnpja(cnpj, raw), origem: 'api' };
}
