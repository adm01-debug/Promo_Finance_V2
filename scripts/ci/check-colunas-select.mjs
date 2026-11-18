#!/usr/bin/env node
/**
 * Gate: nenhuma coluna inexistente em `.select()` / `.order()`.
 *
 * Por que existe. PostgREST recusa o SELECT INTEIRO com 42703 quando uma
 * coluna não existe. Como quase nenhum chamador checa `error`, o recurso morre
 * em silêncio: `data` vem null, o `if (data)` não entra e a tela responde "sem
 * dados". Em 17/11/2026 essa classe havia derrubado cinco funcionalidades sem
 * nenhum alarme — a DRE tributária saía com receita bruta zero, o fechamento
 * tributário reprovava todo mês, o detector de anomalias ficava sem o detector
 * de regime, o benchmark setorial sem carga própria e o health score do
 * copiloto respondia sempre "nenhum calculado". Nenhum gate acusava.
 *
 * Oráculo: `src/integrations/supabase/types.ts`, que é gerado do schema. Não
 * precisa de credencial nem de rede — roda junto com o resto do Quality Gate.
 *
 * Contrato: sai 0 quando não há par desconhecido. Qualquer achado sai 1 com
 * arquivo:linha, tabela, coluna e as colunas que existem naquela tabela.
 *
 * O que este gate NÃO cobre (apontado na review da #457; é análise por regex,
 * não por AST — cada item abaixo é falso negativo, nunca falso positivo):
 *   - `.from(variavel)` / `.from<T>(...)`: só literal `.from('tabela')` entra.
 *   - lista de colunas em constante (`.select(COLUNAS)`): só literal entra.
 *   - colunas dentro de embed (`clientes(nome, x)`): o embed é descartado.
 *   - consulta dentro de comentário: é lida como código (pode gerar achado
 *     falso se citar coluna inexistente — hoje não há caso).
 *   - tabela ausente do types.ts: ignorada, não reprovada (types.ts atrasado).
 *   - `scripts/`: fora de DIRS.
 *   - EXCECOES: não expiram sozinhas se a coluna for removida do schema.
 * Trocar por parser TypeScript resolve a maioria; fica para quando o types.ts
 * voltar a ser regerado no CI.
 *
 * Uso: node scripts/ci/check-colunas-select.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = process.cwd();
const TYPES = 'src/integrations/supabase/types.ts';
const DIRS = ['src', 'supabase/functions'];

/**
 * Colunas que EXISTEM em produção mas ainda não estão no types.ts.
 *
 * O types.ts é gerado e nesta sessão não havia como regerá-lo (sem CLI do
 * Supabase no runner). Cada entrada aqui aponta a migration que criou a
 * coluna; a lista encolhe sozinha quando o types.ts for regerado.
 */
export const EXCECOES = new Set([
  // 20261117220000_colunas_declaradas_classe_select.sql
  'empresas.inscricao_municipal',
  'profiles.telefone',
  'movimentacoes.centro_custo_id',
  'regras_conciliacao.categoria',
  'solicitacoes_lgpd.atendida_por',
  // 20261117211000_clientes_bitrix_ids.sql
  'clientes.bitrix_contact_id',
  'clientes.bitrix_company_id',
  // 20261117201000_sso_login_attempts_state.sql
  'sso_login_attempts.state',
  'sso_login_attempts.expires_at',
  // 20261117224000_vw_fluxo_caixa_por_empresa.sql — view reescrita
  'vw_fluxo_caixa.dia',
  'vw_fluxo_caixa.receitas_previstas',
  'vw_fluxo_caixa.despesas_previstas',
  // anomalia_detection_runs: producao tem 11 colunas e o types.ts so 7.
  // Conferido em information_schema.columns do projeto canonico:
  // created_at, current_step, error_message, finished_at, id, inseridas,
  // started_at, status, step_index, trigger_source, triggered_by.
  'anomalia_detection_runs.started_at',
  'anomalia_detection_runs.finished_at',
  'anomalia_detection_runs.current_step',
  'anomalia_detection_runs.step_index',
]);

/** Agregados do PostgREST: não são coluna. */
const AGREGADOS = new Set(['count', 'sum', 'avg', 'min', 'max']);

const RE_FROM = /\.from\(\s*['"]([a-z0-9_]+)['"]/g;
const RE_SELECT = /\.select\(\s*(['"`])([\s\S]*?)\1/;
const RE_SELECT_G = new RegExp(RE_SELECT.source, 'g');
const RE_ORDER = /\.order\(\s*['"]([a-z0-9_.]+)['"]/g;

/**
 * Remove embeds do PostgREST (`alias:tabela(col, outra:tab2(x))`) de dentro de
 * uma lista de colunas. Itera até não haver mais parênteses balanceados, senão
 * embed aninhado escapa — foi assim que `protocolos_st(id, codigo, …)` virou
 * cinco falsos positivos numa varredura anterior.
 */
export function tiraEmbeds(lista) {
  let anterior;
  let atual = lista;
  do {
    anterior = atual;
    atual = atual.replace(/[a-z0-9_]+\s*(?::\s*[a-z0-9_]+)?\s*\([^()]*\)/gi, ' ');
  } while (atual !== anterior);
  return atual;
}

/** Normaliza um item da lista de select em nome de coluna, ou null. */
export function normalizaColuna(item) {
  let c = item.trim();
  if (!c || c === '*') return null;
  c = c.split('::')[0].trim(); // cast do PostgREST: coluna::text -> coluna
  if (c.includes(':')) c = c.split(':').pop().trim(); // alias:coluna
  c = c.split('->')[0].trim(); // caminho jsonb: decisao->recomendado
  c = c.split('.')[0].split('(')[0].trim(); // coluna.sub, função
  if (!/^[a-z0-9_]+$/.test(c)) return null;
  if (AGREGADOS.has(c)) return null;
  return c;
}

/** Tabela -> Set(colunas) a partir do bloco `Row:` de cada tabela no types.ts. */
export function catalogoDoTypes(texto) {
  const catalogo = new Map();
  const re = /\n {6}([a-z0-9_]+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const tabela = m[1];
    const cols = new Set();
    for (const linha of m[2].split('\n')) {
      const cm = linha.match(/^ {10}([a-z0-9_]+)\??:/);
      if (cm) cols.add(cm[1]);
    }
    if (cols.size > 0) catalogo.set(tabela, cols);
  }
  return catalogo;
}

/** Pares (tabela, coluna, arquivo, linha) usados em select/order de um arquivo. */
export function paresDoArquivo(src, rel) {
  const pares = [];
  const linhaDe = (pos) => src.slice(0, pos).split('\n').length;
  const froms = [...src.matchAll(RE_FROM)];
  froms.forEach((m, i) => {
    const tabela = m[1];
    const fim = i + 1 < froms.length ? froms[i + 1].index : src.length;
    const trecho = src.slice(m.index + m[0].length, Math.min(fim, m.index + 1600));
    // Todos os .select() do trecho: um mesmo builder pode terminar em um
    // select() por braço de ternário (ex.: src/hooks/useAprovacoes.ts:219-225).
    for (const sm of trecho.matchAll(RE_SELECT_G)) {
      for (const item of tiraEmbeds(sm[2]).split(',')) {
        const col = normalizaColuna(item);
        if (col) pares.push({ tabela, col, rel, linha: linhaDe(m.index) });
      }
    }
    for (const om of trecho.matchAll(RE_ORDER)) {
      const col = normalizaColuna(om[1]);
      if (col) {
        pares.push({ tabela, col, rel, linha: linhaDe(m.index + m[0].length + om.index) });
      }
    }
  });
  return pares;
}

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '__fixtures__') continue;
    const p = join(dir, nome);
    const st = statSync(p);
    if (st.isDirectory()) arquivos(p, acc);
    else if (/\.(ts|tsx)$/.test(nome) && !/\.(test|spec)\.tsx?$/.test(nome)) acc.push(p);
  }
  return acc;
}

function main() {
  let texto;
  try {
    texto = readFileSync(join(RAIZ, TYPES), 'utf8');
  } catch {
    console.error(`::error::${TYPES} não encontrado — este gate depende dele como oráculo.`);
    process.exit(1);
  }
  const catalogo = catalogoDoTypes(texto);
  if (catalogo.size === 0) {
    console.error(`::error::não consegui extrair nenhuma tabela de ${TYPES}.`);
    process.exit(1);
  }

  const achados = [];
  const tabelasDesconhecidas = new Set();
  let total = 0;
  for (const dir of DIRS) {
    for (const p of arquivos(join(RAIZ, dir))) {
      const rel = relative(RAIZ, p);
      for (const par of paresDoArquivo(readFileSync(p, 'utf8'), rel)) {
        total += 1;
        const cols = catalogo.get(par.tabela);
        if (!cols) {
          tabelasDesconhecidas.add(par.tabela);
          continue;
        }
        if (cols.has(par.col)) continue;
        if (EXCECOES.has(`${par.tabela}.${par.col}`)) continue;
        achados.push(par);
      }
    }
  }

  console.log(
    `▶ ${total} pares (tabela, coluna) conferidos contra ${catalogo.size} tabelas do types.ts`
  );
  if (tabelasDesconhecidas.size > 0) {
    console.log(`ℹ️  fora do types.ts, ignoradas: ${[...tabelasDesconhecidas].sort().join(', ')}`);
  }
  if (achados.length === 0) {
    console.log('✅ Nenhuma coluna inexistente em select/order.');
    return;
  }
  for (const a of achados) {
    const cols = [...catalogo.get(a.tabela)].sort().join(', ');
    console.error(
      `::error file=${a.rel},line=${a.linha}::${a.tabela}.${a.col} não existe. ` +
        `Colunas de ${a.tabela}: ${cols}`
    );
  }
  console.error(
    `::error::${achados.length} coluna(s) inexistente(s) em select/order. ` +
      'PostgREST recusa o select inteiro com 42703 e o recurso morre em silêncio.'
  );
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
