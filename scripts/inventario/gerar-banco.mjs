#!/usr/bin/env node
/**
 * Inventario do banco oficial -> inventario/estado/banco.json (fonte de consulta dos agentes).
 *
 * Tudo sai de comando: o SQL de leitura `scripts/inventario/banco.sql`, a lista de edge functions
 * publicadas e o uso de cada tabela no codigo (`.from('tabela')` em src/ e supabase/functions/).
 * Nada escrito a mao.
 *
 * Dois jeitos de rodar:
 *   1) Com token (CI semanal / maquina com acesso):
 *        SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs
 *      Le pela Management API: POST /database/query/read-only (transacao so leitura) e
 *      GET /functions. Projeto fixo: bwwbeyolnnzppeuhgkcd (SUPABASE_PROJECT_REF so troca para
 *      teste; qualquer outro valor exige INVENTARIO_PERMITIR_OUTRO_PROJETO=1).
 *   2) Sessao de agente sem token: rodar banco.sql no MCP oficial
 *      (`SUPABASE - PROMO FINANCE V2 - MCP`, db_query), salvar a resposta num arquivo e
 *        node scripts/inventario/gerar-banco.mjs --entrada /caminho/resposta.json
 *      Aceita a resposta crua do MCP ({"rows":[{"inventario":{...}}]}) ou o objeto direto.
 *      Sem token, as edges publicadas ficam de fora (`edge_functions.publicadas: null`).
 *
 * Antes de gravar, recusa saida com cara de credencial (Bearer, JWT, sb_secret_).
 * A gravacao e atomica (temporario + rename): banco indisponivel ou resposta invalida sai com
 * exit 2 sem tocar no banco.json anterior.
 * Exit: 0 = gravado; 2 = argumento invalido, entrada invalida, consulta falhou ou saida com credencial.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { semComentarios } from './gerar-rotas.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SQL_PATH = path.join(RAIZ, 'scripts/inventario/banco.sql');
const SAIDA = path.join(RAIZ, 'inventario/estado/banco.json');
const PASTAS_CODIGO = ['src', 'supabase/functions'];
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs)$/;
export const PROJETO_OFICIAL = 'bwwbeyolnnzppeuhgkcd';
// SUPABASE_API_URL so existe para o teste apontar um servidor local.
const API = `${(process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')}/v1/projects`;

// Limiares dos alertas: o que um agente precisa saber antes de mexer no sistema.
export const LIMIARES = {
  taxaFalhaCronPct: 5,
  historicoCronMaisDe7Dias: 50000,
};

/** Algo com cara de credencial no texto? */
export const PARECE_CREDENCIAL = /Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_/;

/** Extrai o objeto do inventario da Management API, do MCP (resposta ou envelope tools/call) ou do objeto direto. */
export function extrairInventario(bruto) {
  let dado = typeof bruto === 'string' ? JSON.parse(bruto.trim()) : bruto;
  // Envelope cru de tools/call do MCP: { result: { content: [{ type: 'text', text: '<json>' }] } }.
  const conteudo = dado?.result?.content ?? dado?.content;
  if (Array.isArray(conteudo) && typeof conteudo[0]?.text === 'string') dado = JSON.parse(conteudo[0].text);
  if (dado && Array.isArray(dado.rows)) dado = dado.rows[0];
  if (Array.isArray(dado)) dado = dado[0];
  if (dado && dado.inventario) dado = dado.inventario;
  if (typeof dado === 'string') dado = JSON.parse(dado);
  const faltando = ['format_version', 'medido_em', 'resumo', 'tabelas', 'cron', 'extensoes']
    .filter((chave) => !(dado && chave in dado));
  if (faltando.length) throw new Error(`entrada sem as chaves: ${faltando.join(', ')}`);
  if (dado.format_version !== 1) throw new Error(`format_version ${dado.format_version} desconhecido (esperado 1)`);
  if (!Array.isArray(dado.tabelas) || dado.tabelas.length === 0) throw new Error('entrada sem tabelas');
  if (dado.tabelas.some((t) => !t || typeof t.nome !== 'string')) throw new Error('entrada com tabela sem `nome`');
  const { cron } = dado;
  if (!cron || !Array.isArray(cron.jobs) || !Array.isArray(cron.horas_paradas_7d) || !cron.historico || typeof cron.historico !== 'object') {
    throw new Error('entrada com `cron` incompleto (esperado jobs[], horas_paradas_7d[] e historico{})');
  }
  if (!Array.isArray(dado.extensoes)) throw new Error('entrada com `extensoes` que nao e lista');
  return dado;
}

function listarArquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
    const p = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarArquivos(p, acc);
    else if (EXTENSOES.test(entrada.name)) acc.push(p);
  }
  return acc;
}

/**
 * Uso de cada tabela no codigo de producao (testes fora): `.from('tabela')` do cliente Supabase
 * (sem `storage.from`, que e bucket) e acesso direto ao PostgREST `/rest/v1/tabela`.
 * Limite conhecido: `.from(variavel)` nao e resolvido.
 */
export function contarUsoNoCodigo(raiz, nomes) {
  const uso = Object.fromEntries(nomes.map((n) => [n, { src: 0, edges: 0 }]));
  // Qualquer caractere no nome (tabela "Minha Tabela" existe); so conta o que for tabela conhecida.
  const reFrom = /(\bstorage\s*)?\.from\(\s*(['"`])([^'"`\n]+)\2/g;
  const reRest = /\/rest\/v1\/([A-Za-z0-9_]+)/g;
  for (const pasta of PASTAS_CODIGO) {
    const chave = pasta === 'src' ? 'src' : 'edges';
    for (const arquivo of listarArquivos(path.join(raiz, pasta))) {
      // Caminho relativo: pasta-pai com `.test.` no nome (ou /home/x.spec/) nao pode apagar o repo inteiro.
      // `_test.ts` e a convencao do Deno (supabase/functions/**/layout_test.ts).
      if (/(\.test\.|\.spec\.|_test\.|__tests__)/.test(path.relative(raiz, arquivo))) continue;
      // Sem comentarios: `// supabase.from('tabela_velha')` nao e uso.
      const texto = semComentarios(fs.readFileSync(arquivo, 'utf8'));
      for (const m of texto.matchAll(reFrom)) if (!m[1] && Object.hasOwn(uso, m[3])) uso[m[3]][chave] += 1;
      for (const m of texto.matchAll(reRest)) if (m[1] !== 'rpc' && Object.hasOwn(uso, m[1])) uso[m[1]][chave] += 1;
    }
  }
  return uso;
}

/**
 * Nomes das tabelas em `src/integrations/supabase/types.ts` (bloco `Tables:` do schema public).
 * O arquivo e gerado da producao pelo schema-drift.yml, entao serve de segunda fonte, independente
 * do arquivo de entrada, para conferir que a resposta veio do banco certo.
 */
export function tabelasDosTipos(raiz) {
  const texto = fs.readFileSync(path.join(raiz, 'src/integrations/supabase/types.ts'), 'utf8');
  const inicio = texto.indexOf('Tables: {');
  if (inicio === -1) throw new Error('types.ts sem o bloco `Tables: {`');
  const depois = texto.slice(inicio);
  const fim = depois.indexOf('\n    Views: {');
  const bloco = fim === -1 ? depois : depois.slice(0, fim);
  return [...bloco.matchAll(/^ {6}([A-Za-z0-9_]+): \{$/gm)].map((m) => m[1]);
}

/**
 * A resposta e mesmo do banco oficial? Confere contra a lista de tabelas de types.ts: pelo menos
 * 90% das tabelas dos tipos tem de estar na resposta, e vice-versa. Um banco irmao (Lovable, VPS)
 * nao passa nos dois lados ao mesmo tempo.
 * NAO confere o ledger de migrations: aqui a producao fica legitimamente adiante da main enquanto
 * ha PR de DDL aberta (regra 8 do fluxo Git), e `supabase/migrations/` tem arquivos nao rastreados.
 */
export function conferirOrigem(dado, tabelasDeReferencia) {
  const resposta = new Set(dado.tabelas.map((t) => t.nome));
  const referencia = new Set(tabelasDeReferencia);
  const comuns = [...referencia].filter((t) => resposta.has(t)).length;
  const cobreReferencia = referencia.size ? comuns / referencia.size : 0;
  const cobreResposta = resposta.size ? comuns / resposta.size : 0;
  if (cobreReferencia < 0.9 || cobreResposta < 0.9) {
    throw new Error(`a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com types.ts `
      + `(${Math.round(cobreReferencia * 100)}% dos tipos, ${Math.round(cobreResposta * 100)}% da resposta). `
      + 'Confira se o MCP usado e o SUPABASE - PROMO FINANCE V2 - MCP.');
  }
  return { tabelas_em_comum_com_types_ts: comuns, tabelas_em_types_ts: referencia.size };
}

/** Edge functions do repo (pastas com index.ts, sem _shared). */
export function edgesNoRepo(raiz) {
  const dir = path.join(raiz, 'supabase/functions');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(dir, d.name, 'index.ts')))
    .map((d) => d.name).sort();
}

// Ordem por code point: localeCompare muda com a versao do ICU do Node e geraria diff sem mudanca real.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Data invalida (ou ausente) vira null em vez de derrubar o inventario com RangeError.
const minutoUtc = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 16) + 'Z';
};

/** Edges publicadas (resposta de GET /functions) x repo. `publicadas` null = nao consultado. */
export function compararEdges(publicadasApi, noRepo) {
  if (!publicadasApi) return { publicadas: null, no_repo: noRepo.length, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null };
  const publicadas = publicadasApi.map((f) => ({
    slug: f.slug,
    versao: f.version,
    status: f.status,
    verify_jwt: f.verify_jwt,
    atualizada_em: minutoUtc(f.updated_at),
  })).sort((a, b) => cmp(a.slug, b.slug));
  const slugs = new Set(publicadas.map((f) => f.slug));
  return {
    publicadas,
    no_repo: noRepo.length,
    publicadas_sem_codigo_no_repo: [...slugs].filter((s) => !noRepo.includes(s)).sort(),
    no_repo_sem_deploy: noRepo.filter((s) => !slugs.has(s)),
  };
}

/** Ordena chaves recursivamente: o diff entre execucoes fica so no que mudou. */
function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, ordenar(valor[k])]));
  }
  return valor;
}

/**
 * A agenda do pg_cron roda ao menos uma vez por dia? 'N seconds', ou dia do mes, mes e dia da
 * semana cobrindo tudo: `*`, `*\/1` ou a faixa inteira (1-31, 1-12, 0-6/0-7).
 */
const CAMPO_TODO = [/^(\*|\*\/1|1-31)$/, /^(\*|\*\/1|1-12)$/, /^(\*|\*\/1|0-6|0-7|1-7)$/];
export function rodaTodoDia(agenda) {
  const a = String(agenda ?? '').trim();
  if (/^\d+\s+seconds?$/i.test(a)) return true;
  const campos = a.split(/\s+/);
  return campos.length === 5 && CAMPO_TODO.every((re, i) => re.test(campos[i + 2]));
}

/** Junta banco + codigo + edges e calcula orfas e alertas. Funcao pura (coberta por inventario.unit.mjs). */
export function montarInventario(dado, uso, edges = compararEdges(null, [])) {
  const tabelas = dado.tabelas.map((t) => ({ ...t, uso_no_codigo: uso[t.nome] ?? { src: 0, edges: 0 } }));
  const orfas = tabelas
    .filter((t) => t.linhas === 0 && !t.citada_no_banco && t.uso_no_codigo.src + t.uso_no_codigo.edges === 0)
    .map((t) => t.nome);

  const alertas = [];
  const semRls = tabelas.filter((t) => !t.rls).map((t) => t.nome);
  if (semRls.length) alertas.push({ tipo: 'tabela_sem_rls', detalhe: semRls });
  // RLS ligado sem nenhuma policy nega tudo para authenticated/anon (service_role passa por cima,
  // rolbypassrls). Pode ser de proposito (tabela so-interna), mas hoje fica invisivel: nem
  // tabela_sem_rls (tem RLS) nem nenhum outro alerta aponta.
  const rlsSemPolicy = tabelas.filter((t) => t.rls && t.policies === 0).map((t) => t.nome);
  if (rlsSemPolicy.length) alertas.push({ tipo: 'rls_sem_policy', detalhe: rlsSemPolicy });
  const cronRuim = dado.cron.jobs
    .filter((j) => j.ativo && j.taxa_falha_7d_pct >= LIMIARES.taxaFalhaCronPct)
    .map((j) => `${j.nome} (${j.taxa_falha_7d_pct}% em 7d)`);
  if (cronRuim.length) alertas.push({ tipo: 'cron_falhando', detalhe: cronRuim });
  // Cron 100% parado nao grava linha em job_run_details: some de horas_paradas_7d e a taxa fica 0.
  // Job ativo que deveria rodar todo dia (dia/mes/semana = *) sem nenhuma execucao em 24 h.
  const mudos = dado.cron.jobs.filter((j) => j.ativo && j.execucoes_24h === 0 && rodaTodoDia(j.agenda)).map((j) => j.nome);
  if (mudos.length) alertas.push({ tipo: 'cron_sem_execucao', detalhe: mudos });
  if (dado.cron.horas_paradas_7d.length) {
    alertas.push({ tipo: 'cron_parado', detalhe: dado.cron.horas_paradas_7d.map((h) => h.hora) });
  }
  if (dado.cron.historico.mais_de_7_dias > LIMIARES.historicoCronMaisDe7Dias) {
    alertas.push({ tipo: 'historico_cron_sem_limpeza', detalhe: [`${dado.cron.historico.mais_de_7_dias} linhas com mais de 7 dias`] });
  }
  if (edges.no_repo_sem_deploy?.length) alertas.push({ tipo: 'edge_sem_deploy', detalhe: edges.no_repo_sem_deploy });
  if (edges.publicadas_sem_codigo_no_repo?.length) {
    alertas.push({ tipo: 'edge_publicada_sem_codigo', detalhe: edges.publicadas_sem_codigo_no_repo });
  }

  return ordenar({
    ...dado,
    fonte: 'scripts/inventario/banco.sql + GET /functions + .from() em src/ e supabase/functions/ (scripts/inventario/gerar-banco.mjs)',
    tabelas,
    tabelas_orfas: {
      criterio: '0 linhas + nao citada em funcao/view do banco + nenhum .from() em src/ ou supabase/functions/',
      lista: orfas,
    },
    edge_functions: edges,
    alertas,
  });
}

function projeto() {
  const ref = (process.env.SUPABASE_PROJECT_REF || PROJETO_OFICIAL).trim();
  if (ref !== PROJETO_OFICIAL && process.env.INVENTARIO_PERMITIR_OUTRO_PROJETO !== '1') {
    throw new Error(`SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}).`);
  }
  return ref;
}

const ESPERAS_MS = [500, 1500]; // entre tentativas: 5xx/429/rede caem, 4xx definitivo (token errado) nao

async function chamarApi(caminho, init = {}) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const ref = projeto();
  for (let tentativa = 0; ; tentativa++) {
    let transitorio = false;
    let falha;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(ref)}${caminho}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
        signal: AbortSignal.timeout(120_000),
      });
      // Nunca repassa o corpo do erro: pode ecoar cabecalho ou parte da consulta.
      if (res.ok) return await res.json();
      transitorio = res.status === 429 || res.status >= 500;
      falha = new Error(`Management API ${caminho} respondeu HTTP ${res.status}`);
    } catch (erro) {
      // Rede caiu / conexao cortada (erro com `cause`) ou estourou o tempo: tenta de novo. Cabecalho
      // invalido ou corpo que nao e JSON nao melhoram na segunda tentativa.
      transitorio = erro?.name === 'TimeoutError' || Boolean(erro?.cause);
      falha = new Error(`Management API ${caminho} sem resposta valida: ${erro?.name === 'TimeoutError' ? 'timeout de 120 s' : erro?.message ?? erro}`);
    }
    if (!transitorio || tentativa >= ESPERAS_MS.length) throw falha;
    await new Promise((resolver) => setTimeout(resolver, ESPERAS_MS[tentativa]));
  }
}

/** Texto de erro sem token nem nada com cara de credencial (o Node ecoa trecho do corpo em erros de JSON/cabecalho). */
export function redigir(mensagem) {
  let texto = String(mensagem);
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (token) texto = texto.split(token).join('***');
  return texto.replace(new RegExp(PARECE_CREDENCIAL.source, 'g'), '***');
}

const USO = `uso: node scripts/inventario/gerar-banco.mjs [--entrada resposta.json [--functions functions.json]]
  sem --entrada: le o banco pela Management API (exige SUPABASE_ACCESS_TOKEN).
  --entrada: resposta do banco.sql salva do MCP; --functions: lista de GET /functions (opcional).
`;

/** Argumentos estritos: flag desconhecida ou sem valor e erro, nunca ignorada (um typo cairia na API viva). */
export function lerArgumentos(argv) {
  const opcoes = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opcoes.ajuda = true;
    else if (a === '--entrada' || a === '--functions') {
      const valor = argv[i + 1];
      if (!valor || valor.startsWith('--')) throw new Error(`${a} exige o caminho de um arquivo`);
      opcoes[a.slice(2)] = valor;
      i++;
    } else throw new Error(`argumento desconhecido: ${a}\n${USO}`);
  }
  if (opcoes.functions && !opcoes.entrada) throw new Error('--functions so vale junto com --entrada');
  return opcoes;
}

/** Grava por arquivo temporario + rename: queda no meio nao apaga nem trunca o banco.json anterior. */
function gravarAtomico(destino, conteudo) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, conteudo);
    fs.renameSync(tmp, destino);
  } catch (erro) {
    fs.rmSync(tmp, { force: true });
    throw erro;
  }
}

async function main(argv) {
  const opcoes = lerArgumentos(argv);
  if (opcoes.ajuda) {
    process.stdout.write(USO);
    return;
  }
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  let bruto;
  let publicadasApi = null;
  if (opcoes.entrada) {
    bruto = fs.readFileSync(opcoes.entrada, 'utf8');
    if (opcoes.functions) publicadasApi = JSON.parse(fs.readFileSync(opcoes.functions, 'utf8'));
  } else {
    if (!token) throw new Error('sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script).');
    bruto = await chamarApi('/database/query/read-only', {
      method: 'POST',
      body: JSON.stringify({ query: fs.readFileSync(SQL_PATH, 'utf8') }),
    });
  }
  if (!publicadasApi && token) publicadasApi = await chamarApi('/functions');
  if (publicadasApi && (!Array.isArray(publicadasApi) || publicadasApi.some((f) => typeof f?.slug !== 'string'))) {
    throw new Error('a lista de edge functions publicadas nao e uma lista de objetos com `slug` (GET /functions mudou de formato?)');
  }

  const dado = extrairInventario(bruto);
  const origem = conferirOrigem(dado, tabelasDosTipos(RAIZ));
  const uso = contarUsoNoCodigo(RAIZ, dado.tabelas.map((t) => t.nome));
  const inventario = montarInventario({ ...dado, origem }, uso, compararEdges(publicadasApi, edgesNoRepo(RAIZ)));
  const texto = JSON.stringify(inventario, null, 2) + '\n';
  if (PARECE_CREDENCIAL.test(texto)) {
    throw new Error('a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql.');
  }
  gravarAtomico(SAIDA, texto);
  const ed = inventario.edge_functions;
  console.log(`banco.json: ${inventario.tabelas.length} tabelas, ${inventario.cron.jobs.length} cron jobs, `
    + `${inventario.tabelas_orfas.lista.length} orfas, ${inventario.alertas.length} alertas, `
    + `edges ${ed.publicadas ? `${ed.publicadas.length} publicadas/${ed.no_repo} no repo` : `${ed.no_repo} no repo (publicadas nao consultadas)`} `
    + `(medido_em ${inventario.medido_em}).`);
}

// realpath: process.argv[1] pode vir por symlink; import.meta.url ja vem resolvido.
const executadoDireto = () => {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
};
if (executadoDireto()) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`ERRO: ${redigir(error.message)}`);
    process.exit(2);
  });
}
