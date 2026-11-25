// Guard da carga inicial de `catalogo_cclasstrib` (etapa 86): o SQL versionado e
// gerado por scripts/rfb/gerar_carga_cclasstrib.py e ninguem o executa na CI
// (a suite pgTAP de catalogos depende de PROD_DB_URL). Este teste le o arquivo
// gerado e trava as invariantes que, se violadas, quebram o consumidor
// (buscarReferenciasFiscais indexa por cclasstrib e deixa a ultima vigente
// vencer), sem precisar de banco.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = new URL('../../', import.meta.url);
const CARGA = fileURLToPath(
  new URL('supabase/migrations/20261124110000_carga_catalogo_cclasstrib_rfb.sql', RAIZ)
);
const GERADOR = fileURLToPath(new URL('scripts/rfb/gerar_carga_cclasstrib.py', RAIZ));

const sql = readFileSync(CARGA, 'utf8');
const gerador = readFileSync(GERADOR, 'utf8');

// Cada linha de dado tem 11 campos: 2 textos, 3 fracoes, 2 booleanos, o
// indicador de DIR, 2 datas e a versao. O cclasstrib e sempre `'000000'`.
const LINHA =
  /^ {2}\('(\d{6})', '(\d{3})', '(.*)', ([\d.]+), ([\d.]+), ([\d.]+), (true|false), (\d), '(\d{4}-\d{2}-\d{2})', (null|'\d{4}-\d{2}-\d{2}'), '(.*)'\),?$/;

const linhas = sql
  .split('\n')
  .map((l) => l.match(LINHA))
  .filter(Boolean)
  .map((m) => ({
    cclasstrib: m[1],
    cst: m[2],
    pRedCbs: m[4],
    pRedIbsUf: m[5],
    pRedIbsMun: m[6],
    exigeGibscbs: m[7],
    indDir: Number(m[8]),
    inicio: m[9],
    fim: m[10] === 'null' ? null : m[10].slice(1, -1),
    versao: m[11],
  }));

const versaoCabecalho = sql.match(/^-- Versao da base: (\S+)/m)?.[1];
const commitCabecalho = sql.match(/^-- Commit de origem: (\S+)/m)?.[1];

test('a carga e legivel campo a campo e nao esta vazia', () => {
  assert.equal(linhas.length, 173, 'linhas de insert reconhecidas');
  assert.ok(versaoCabecalho, 'cabecalho sem versao da base');
  assert.equal(new Set(linhas.map((l) => l.versao)).size, 1);
  assert.equal(linhas[0].versao, versaoCabecalho);
});

test('o cabecalho identifica a revisao oficial da base', () => {
  // Sem SHA completo o cabecalho nao permite reproduzir a carga a partir do
  // clone oficial (era `4f0342f-base-oficial`, texto que nao resolve).
  assert.match(commitCabecalho ?? '', /^[0-9a-f]{40}$/);
});

test('(cclasstrib, inicio_vigencia) e unico', () => {
  const vistos = new Set();
  for (const l of linhas) {
    const chave = `${l.cclasstrib}|${l.inicio}`;
    assert.ok(!vistos.has(chave), `duplicado: ${chave}`);
    vistos.add(chave);
  }
});

test('nenhum cclasstrib tem duas vigencias abertas', () => {
  // O consumidor indexa por cclasstrib: duas linhas abertas para o mesmo
  // codigo deixam o resultado dependente da ordem do banco.
  const abertas = new Map();
  for (const l of linhas) {
    if (l.fim !== null) continue;
    abertas.set(l.cclasstrib, (abertas.get(l.cclasstrib) ?? 0) + 1);
  }
  const repetidos = [...abertas].filter(([, n]) => n > 1).map(([cd]) => cd);
  assert.deepEqual(repetidos, []);
});

test('as classificacoes encerradas da base estao presentes', () => {
  const encerradas = linhas.filter((l) => l.fim !== null);
  assert.deepEqual(
    encerradas.map((l) => l.cclasstrib).sort(),
    ['220001', '220002', '220003']
  );
});

test('ind_dir sai do vinculo DIR e nao do indicador de diferimento do CST', () => {
  assert.ok(!/SITR_IND_GDIF\s+as\s+ind_dir/.test(gerador));
  assert.match(gerador, /TPDF_SIGLA = 'DIR'/);
  assert.match(gerador, /base sem vinculo TIPO_DFE='DIR'/);

  for (const l of linhas) assert.ok([0, 1].includes(l.indDir), `ind_dir fora de 0/1: ${l.cclasstrib}`);

  // V0073: 11 classificacoes com vinculo ao tipo de documento DIR.
  assert.deepEqual(
    linhas.filter((l) => l.indDir === 1).map((l) => l.cclasstrib),
    ['000001', '200009', '200032', '200053', '400003', '400004', '410003', '410008', '410009', '410037', '410999']
  );
});

test('a carga e idempotente pelo par da PK corrigida', () => {
  assert.match(sql, /on conflict \(cclasstrib, inicio_vigencia\) do update set/);
  for (const coluna of ['exige_gibscbs', 'ind_dir', 'versao_it']) {
    assert.ok(
      sql.includes(`${coluna} = excluded.${coluna}`),
      `upsert nao atualiza ${coluna}: recarga de base nova nao corrige a linha antiga`
    );
  }
});

test('o gerador exige as entradas de onde a carga vem', () => {
  assert.match(gerador, /"--calc-repo",\s*required=True/);
  assert.match(gerador, /"--out",\s*required=True/);
  // `--commit` deixou de ser decorativo: divergir do HEAD do clone aborta.
  assert.match(gerador, /def resolver_commit\(/);
  assert.match(gerador, /rev-parse", "HEAD"/);
});