#!/usr/bin/env node
/**
 * Gera `docs/ci/README.md` a partir dos blocos `# docs:` e `# nao-e-bug:` de cada workflow.
 *
 * Por que existe: um workflow de centenas de linhas só conta o que faz e a quem avisa se
 * alguém escrever isso. Comentário solto no meio do arquivo não é lido, e um README escrito
 * à mão desatualiza no primeiro PR que mexe num gatilho. Aqui o README é PROJEÇÃO do YAML:
 * a fonte da verdade é o próprio workflow.
 *
 * Contrato: cada YAML carrega, no topo, um bloco
 *
 *   # docs:
 *   #   gatilho: <quando roda>
 *   #   prova:   <o que ele prova>
 *   #   falha:   <o que acontece quando falha>
 *   #   avisa:   <quem é avisado>
 *
 * e opcionalmente:
 *
 *   # nao-e-bug:
 *   #   - <chave>: <descricao>
 *
 * Workflow AINDA sem bloco não reprova: entra na seção "Workflows sem bloco `# docs:`",
 * que é a lista de pendências. Bloco presente mas incompleto reprova — contrato pela metade
 * é pior que contrato ausente, porque parece documentado.
 *
 * KPI opcional: se `docs/ci/kpi.json` existir (gerado por `scripts/ci/actions-kpi.mjs`), as
 * colunas "custo/sem (min)" e "falha (7 d)" vêm de lá, indexadas pelo nome do arquivo YAML.
 *
 * Uso:
 *   node scripts/ci/render-workflow-docs.mjs           # escreve o README
 *   node scripts/ci/render-workflow-docs.mjs --check    # falha se divergir
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const DIR_WF = join(RAIZ, '.github', 'workflows');
const README = join(RAIZ, 'docs', 'ci', 'README.md');
const KPI_PATH = join(RAIZ, 'docs', 'ci', 'kpi.json');

export const CAMPOS = ['gatilho', 'prova', 'falha', 'avisa'];

/** Extrai o bloco `# docs:` do topo do arquivo. Devolve null se não houver. */
export function extrairDocs(texto) {
  const saida = {};
  let dentro = false;

  for (const linha of texto.split('\n')) {
    if (/^#\s*docs:\s*$/.test(linha)) {
      dentro = true;
      continue;
    }
    if (!dentro) continue;

    // Linha de comentário indentada continua o bloco; qualquer outra coisa o encerra.
    const m = /^#\s+([a-z_]+):\s*(.+?)\s*$/.exec(linha);
    if (m) {
      saida[m[1]] = m[2];
      continue;
    }
    if (/^#\s*$/.test(linha) || linha.trim() === '') continue;
    break;
  }

  return Object.keys(saida).length ? saida : null;
}

/**
 * Itens do bloco `# nao-e-bug:` (linhas `#   - <chave>: <descricao>`).
 * Devolve [] quando o bloco não existe.
 */
export function extrairNaoEBug(texto) {
  const itens = [];
  let dentro = false;

  for (const linha of texto.split('\n')) {
    if (/^#\s*nao-e-bug:\s*$/.test(linha)) {
      dentro = true;
      continue;
    }
    if (!dentro) continue;

    const m = /^#\s+-\s+(.+?):\s*(.+?)\s*$/.exec(linha);
    if (m) {
      itens.push({ chave: m[1], descricao: m[2] });
      continue;
    }
    if (/^#\s*$/.test(linha)) continue;
    break;
  }

  return itens;
}

/** Nome amigável: `name:` do workflow, senão o nome do arquivo. */
export function nomeDe(texto, arquivo) {
  const m = /^name:\s*(.+?)\s*$/m.exec(texto);
  return m ? m[1].replace(/^["']|["']$/g, '') : arquivo.replace(/\.ya?ml$/, '');
}

/** Escapa `\` e `|` para não quebrar a célula da tabela markdown. */
const celula = (v) => String(v).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/**
 * Monta o markdown. `arquivos` é [{ arquivo, texto }]; `kpi` é o conteúdo de kpi.json.
 * Lança Error quando um bloco `# docs:` existe mas está incompleto.
 */
export function renderizar(arquivos, kpi = {}) {
  const docs = [];
  const semBloco = [];
  const naoEBugGlobal = [];
  const incompletos = [];

  for (const { arquivo, texto } of arquivos) {
    const bloco = extrairDocs(texto);
    const nome = nomeDe(texto, arquivo);
    if (!bloco) {
      semBloco.push({ arquivo, nome });
      continue;
    }
    const faltando = CAMPOS.filter((c) => !bloco[c]);
    if (faltando.length) {
      incompletos.push(`${arquivo}: bloco '# docs:' sem ${faltando.join(', ')}`);
      continue;
    }
    for (const item of extrairNaoEBug(texto)) naoEBugGlobal.push({ workflow: nome, arquivo, ...item });
    docs.push({ arquivo, nome, ...bloco });
  }

  if (incompletos.length) {
    throw new Error(`bloco '# docs:' incompleto:\n  - ${incompletos.join('\n  - ')}`);
  }

  const total = docs.length + semBloco.length;
  const linhas = [
    '# Workflows de CI — o que cada um faz',
    '',
    '> **Gerado por `scripts/ci/render-workflow-docs.mjs`.** Não edite à mão: o workflow',
    '> `estado-real.yml` roda `--check` e abre PR quando este arquivo divergir do bloco',
    '> `# docs:` de cada workflow. Para mudar o que está aqui, mude o bloco no YAML.',
    '',
    `**${total} workflows — ${docs.length} com bloco \`# docs:\`, ${semBloco.length} sem.**`,
    '',
    '| Workflow | Arquivo | Gatilho | O que prova | Quando falha | Quem é avisado | Custo/sem (min) | Falha (7 d) |',
    '|---|---|---|---|---|---|---|---|',
    ...docs.map((d) => {
      const custo = kpi[d.arquivo]?.custo_semana_min ?? '—';
      const falha7d = kpi[d.arquivo]?.taxa_falha_7d ?? '—';
      return `| ${celula(d.nome)} | [\`${d.arquivo}\`](../../.github/workflows/${d.arquivo}) | ${celula(d.gatilho)} | ${celula(d.prova)} | ${celula(d.falha)} | ${celula(d.avisa)} | ${custo} | ${falha7d} |`;
    }),
    '',
    '## Detalhe',
    '',
    ...docs.flatMap((d) => [
      `### ${d.nome} (\`${d.arquivo}\`)`,
      '',
      `- **Gatilho:** ${d.gatilho}`,
      `- **O que prova:** ${d.prova}`,
      `- **Quando falha:** ${d.falha}`,
      `- **Quem é avisado:** ${d.avisa}`,
      '',
    ]),
  ];

  if (naoEBugGlobal.length > 0) {
    linhas.push(
      '## O que NÃO é bug',
      '',
      '> Comportamentos que parecem erro mas são design intencional.',
      '> Cada item vem do bloco `# nao-e-bug:` do YAML do workflow.',
      '',
      '| Workflow | Situação | Por quê não é bug |',
      '|---|---|---|',
      ...naoEBugGlobal.map(
        (i) => `| [\`${i.arquivo}\`](../../.github/workflows/${i.arquivo}) | **${celula(i.chave)}** | ${celula(i.descricao)} |`,
      ),
      '',
    );
  }

  if (semBloco.length > 0) {
    linhas.push(
      '## Workflows sem bloco `# docs:`',
      '',
      '> Pendência, não erro: o gerador não reprova por isso. Enquanto o bloco não existir,',
      '> ninguém sabe por este arquivo o que o workflow prova nem a quem ele avisa.',
      '',
      '| Arquivo | Workflow |',
      '|---|---|',
      ...semBloco.map((s) => `| [\`${s.arquivo}\`](../../.github/workflows/${s.arquivo}) | ${celula(s.nome)} |`),
      '',
    );
  }

  return linhas.join('\n');
}

async function lerWorkflows() {
  const nomes = (await readdir(DIR_WF)).filter((f) => /\.ya?ml$/.test(f)).sort();
  return Promise.all(nomes.map(async (arquivo) => ({ arquivo, texto: await readFile(join(DIR_WF, arquivo), 'utf8') })));
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log('Uso: node scripts/ci/render-workflow-docs.mjs [--check]');
    console.log('  (sem argumento)  escreve docs/ci/README.md');
    console.log('  --check          sai 1 se docs/ci/README.md divergir dos workflows, sem escrever');
    return 0;
  }
  // `--chek` (erro de digitação) caía no modo de ESCRITA e sobrescrevia o README.
  const desconhecido = argv.find((a) => a !== '--check');
  if (desconhecido !== undefined) {
    console.error(`ERRO: argumento desconhecido: ${desconhecido} (use --check ou --help)`);
    return 2;
  }

  let kpi = {};
  try {
    kpi = JSON.parse(await readFile(KPI_PATH, 'utf8'));
  } catch (erro) {
    // sem KPI → colunas ficam "—". Arquivo presente e corrompido é outra coisa: seguir
    // adiante apagaria as colunas de custo/falha do README sem dizer por quê.
    if (erro.code !== 'ENOENT') {
      console.error(`ERRO: docs/ci/kpi.json ilegível (${erro.message}). Regere com scripts/ci/actions-kpi.mjs ou apague o arquivo.`);
      return 1;
    }
  }
  if (kpi === null || typeof kpi !== 'object' || Array.isArray(kpi)) {
    console.error('ERRO: docs/ci/kpi.json precisa ser um objeto { "<arquivo>.yml": { ... } }.');
    return 1;
  }

  let conteudo;
  try {
    conteudo = renderizar(await lerWorkflows(), kpi);
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    return 1;
  }

  if (argv.includes('--check')) {
    let atual = null;
    try {
      atual = await readFile(README, 'utf8');
    } catch {
      console.error('ERRO: docs/ci/README.md não existe. Rode sem --check para gerar.');
      return 1;
    }
    if (atual !== conteudo) {
      console.error('ERRO: docs/ci/README.md divergiu dos blocos `# docs:` dos workflows.');
      console.error('Rode `node scripts/ci/render-workflow-docs.mjs` e commite o resultado.');
      return 1;
    }
    console.log('OK: docs/ci/README.md bate com os workflows.');
    return 0;
  }

  await mkdir(dirname(README), { recursive: true });
  await writeFile(README, conteudo, 'utf8');
  console.log('docs/ci/README.md gerado.');
  return 0;
}

// realpath: com o repo atrás de um symlink (ou /tmp no macOS) `argv[1]` não bate com
// `import.meta.url` e o `--check` saía 0 sem conferir nada.
function invocadoDireto() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (invocadoDireto()) {
  process.exitCode = await main();
}
