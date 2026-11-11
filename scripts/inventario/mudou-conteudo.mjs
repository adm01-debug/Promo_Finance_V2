#!/usr/bin/env node
/**
 * O inventario mudou de verdade? Compara cada arquivo de inventario/estado/ com a versao de uma ref
 * do git depois de tirar os carimbos de data (`medido_em`, `gerado_em`) e a telemetria viva do cron.
 * Imprime `true` ou `false` (usado pelo inventario-estado.yml para decidir se publica).
 *
 * Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]   (padrao: banco, rotas e edges)
 *      INVENTARIO_REF=origin/inventario node scripts/inventario/mudou-conteudo.mjs
 * A ref padrao e HEAD; no CI a comparacao e contra a branch publicada.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PADRAO = ['inventario/estado/banco.json', 'inventario/estado/rotas.json', 'inventario/estado/edges.json'];
const CARIMBOS = new Set(['medido_em', 'gerado_em']);
// Telemetria viva do cron: muda quase todo dia so pela janela rolante de 7 dias, sem mudanca
// estrutural nenhuma. Fora desses nomes, nada e ignorado: alertas, tabelas_orfas e o resto de
// banco.json/rotas.json continuam comparados normalmente.
const TELEMETRIA = new Set([
  'execucoes_24h', 'falhas_24h', 'execucoes_7d', 'falhas_7d', 'taxa_falha_7d_pct',
  'startup_timeout_7d', 'ultima_falha', 'duracao_max_s_7d', 'horas_paradas_7d',
  'mais_antigo', 'mais_de_7_dias', 'atualizada_em',
]);
const IGNORADOS = new Set([...CARIMBOS, ...TELEMETRIA]);
// `historico.linhas`/`historico.bytes` tambem rolam todo dia com a retencao do historico, mas os
// nomes `linhas`/`bytes` sao compartilhados com cada tabela em `tabelas[]`, onde a contagem real
// importa. So ignora dentro de `cron.historico`.
function limparHistoricoCron(historico) {
  if (!historico || typeof historico !== 'object') return historico;
  const { linhas, bytes, ...resto } = historico;
  return resto;
}

// A telemetria tambem vaza para o TEXTO de alertas[].detalhe, que a lista IGNORADOS (por nome de
// campo) nao alcanca: `cron_falhando` grava "nome (9.0% em 7d)" e a porcentagem rola toda semana
// mesmo sem o job sair da lista. So normaliza o TEXTO; se um job entra ou sai da lista, ou o alerta
// aparece/desaparece, a mudanca de verdade continua sendo pega.
const PORCENTAGEM_7D = /\s*\([\d.]+%\s*em\s*7d\)\s*$/;
function normalizarAlerta(a) {
  if (!a || typeof a !== 'object' || !('tipo' in a) || !Array.isArray(a.detalhe)) return a;
  if (a.tipo === 'cron_falhando') {
    return { ...a, detalhe: a.detalhe.map((d) => (typeof d === 'string' ? d.replace(PORCENTAGEM_7D, '') : d)) };
  }
  if (a.tipo === 'cron_parado' || a.tipo === 'historico_cron_sem_limpeza') return { ...a, detalhe: [] };
  return a;
}

/** JSON canonico sem os carimbos de data e sem a telemetria viva. Texto que nao e JSON volta como esta. */
export function semCarimbos(texto) {
  if (texto === null) return null;
  let dado;
  try { dado = JSON.parse(texto); } catch { return texto; }
  const limpar = (v, chave) => {
    if (Array.isArray(v)) return v.map((x) => limpar(chave === 'alertas' ? normalizarAlerta(x) : x));
    if (v && typeof v === 'object') {
      const base = chave === 'historico' ? limparHistoricoCron(v) : v;
      return Object.fromEntries(
        Object.keys(base).filter((k) => !IGNORADOS.has(k)).sort().map((k) => [k, limpar(base[k], k)]),
      );
    }
    return v;
  };
  return JSON.stringify(limpar(dado));
}

/** true se algum arquivo mudou alem dos carimbos (arquivo novo ou apagado conta). */
export function mudou(arquivos, lerAntes, lerDepois) {
  return arquivos.some((f) => semCarimbos(lerAntes(f)) !== semCarimbos(lerDepois(f)));
}

/**
 * CLI. Saida: so `true` ou `false` em stdout (o workflow grava isso em GITHUB_OUTPUT); erro vai para
 * stderr com exit 2, nunca um `false` que esconda falha.
 */
function main(argv, env) {
  const arquivos = argv.length ? argv : PADRAO;
  const ref = env.INVENTARIO_REF || 'HEAD';
  if (ref.startsWith('-')) throw new Error(`INVENTARIO_REF invalida: ${ref}`);
  // O gerador acabou de rodar: arquivo local ausente e falha dele, nao "apagado de proposito".
  // Sem esta checagem, ausente nos dois lados dava `false` e ausente so no local dava `true`
  // (publicaria a remocao do arquivo).
  const ausentes = arquivos.filter((f) => !fs.existsSync(f));
  if (ausentes.length) throw new Error(`arquivo(s) gerado(s) ausente(s): ${ausentes.join(', ')} (rode os geradores antes)`);
  const lerAntes = (f) => {
    try { return execFileSync('git', ['show', `${ref}:${f}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }); } catch { return null; }
  };
  const lerDepois = (f) => fs.readFileSync(f, 'utf8');
  console.log(String(mudou(arquivos, lerAntes, lerDepois)));
}

// realpath: process.argv[1] pode vir por symlink; import.meta.url ja vem resolvido. Sem isto o script
// saia 0 sem imprimir nada e o workflow lia "nao mudou" para sempre.
const executadoDireto = () => {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
};
if (executadoDireto()) {
  try {
    main(process.argv.slice(2), process.env);
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
