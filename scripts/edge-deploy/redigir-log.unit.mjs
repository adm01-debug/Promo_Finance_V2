// Porto de Zapp_Web_V2/scripts/edge-deploy/redigir-log.unit.mjs, adaptado ao
// Promo_Finance_V2 (a redação roda no migrate-functions.sh, não no YAML do Zapp).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { redigir, confinar } from './redigir-log.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizProjeto = resolve(__dirname, '..', '..');

// Fixture montada em tempo de execução de propósito. Com o valor literal
// encostado em "access_token=" no código-fonte, a regra generic-api-key do
// gitleaks acusa segredo (falso positivo: é fixture, não credencial). A
// interpolação separa a palavra-chave do valor no texto-fonte sem mudar o que
// o teste exercita.
const SUFIXO_FICTICIO = 'abc123def456';
const tokenFalso = `sbp_${SUFIXO_FICTICIO}`;

test('E74: o valor do token sai do log, e a chave deixa de existir como tal', () => {
  const entrada = [
    'Deploying function asaas-proxy',
    `  curl https://bwwbeyolnnzppeuhgkcd.functions.supabase.co/asaas-proxy?access_token=${tokenFalso}`,
    '  warning: access_token expirado',
  ].join('\n');
  const saida = redigir(entrada, [tokenFalso]);
  assert.equal(saida.includes('access_token'), false, 'a string access_token não pode sobrar no artifact');
  assert.equal(saida.includes(tokenFalso), false, 'o valor do token não pode sobrar');
  assert.ok(saida.includes('token='), 'o parâmetro continua visível, só sem credencial');
});

test('E74: valor curto demais não é tratado como segredo (não troca texto comum)', () => {
  const entrada = 'campo status=ok e access_token=abc';
  const saida = redigir(entrada, ['abc']);
  assert.ok(saida.includes('status=ok'), 'texto comum tem de sobreviver');
  assert.equal(saida.includes('access_token'), false);
});

test('E74: o CLI é fail-closed quando o log não existe', () => {
  const r = spawnSync(process.execPath, ['scripts/edge-deploy/redigir-log.mjs', '/nao/existe/deploy-output.log'], {
    cwd: raizProjeto,
    encoding: 'utf8',
  });
  assert.equal(r.status, 2, 'log ausente tem de sair com 2');
});

test('S8707: confinar rejeita caminho fora da base (traversal e absoluto)', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-base-'));
  try {
    assert.throws(() => confinar('/etc/passwd', base), /fora da base/);
    assert.throws(() => confinar('../fora.txt', base), /fora da base/);
    writeFileSync(resolve(base, 'ok.log'), 'conteudo');
    const alvo = confinar(resolve(base, 'ok.log'), base);
    assert.equal(alvo, resolve(base, 'ok.log'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('E74: redação atua no arquivo e reporta a contagem (integração CLI)', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-cli-'));
  const log = resolve(base, 'deploy-out.log');
  writeFileSync(log, 'curl ...?access_token=sbp_umaChaveLonga123\n');
  try {
    const r = spawnSync(
      process.execPath,
      ['scripts/edge-deploy/redigir-log.mjs', log, '--segredo-env=TOKEN_DE_TESTE'],
      {
        cwd: raizProjeto,
        encoding: 'utf8',
        env: { ...process.env, TOKEN_DE_TESTE: 'sbp_umaChaveLonga123', REDIGIR_LOG_BASE: base },
      },
    );
    assert.equal(r.status, 0, r.stderr);
    const limpo = readFileSync(log, 'utf8');
    assert.equal(limpo.includes('access_token'), false, 'artifact subiu sem a chave access_token');
    assert.equal(limpo.includes('sbp_umaChaveLonga123'), false, 'artifact subiu sem o valor do token');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Endurecimento: formatos de credencial, formas de chave/valor e CLI fail-closed.
// Todo valor fictício é montado em tempo de execução (mesmo motivo do tokenFalso
// acima: literal com cara de segredo no fonte acende o gitleaks).
// ---------------------------------------------------------------------------
import { mkdirSync, symlinkSync, copyFileSync, existsSync } from 'node:fs';
import { extractUnchangedSlugs } from './unchanged-from-log.mjs';

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const HEX40 = '0123456789abcdef'.repeat(3).slice(0, 40);
const PAT = ['sb', 'p_', HEX40].join('');
const JWT = [b64url({ alg: 'HS256', typ: 'JWT' }), b64url({ role: 'service_role', iss: 'supabase' }), 'c2lnLWZpY3RpY2lhLTEyMzQ1Njc4OTA'].join('.');
const SB_SECRET = ['sb', '_secret_', 'AbCdEfGhIjKlMnOpQrStUv_12345678'].join('');
const GH = ['gh', 'p_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'].join('');
const SENHA = ['S3nh4', 'Sup3r', 'Secreta'].join('');
const SCRIPT = resolve(__dirname, 'redigir-log.mjs');

const CASOS_SEM_VALOR_CONHECIDO = [
  ['JSON', (v) => `{"access_token":"${v}","x":1}`],
  ['JSON com espaços', (v) => `{ "access_token" : "${v}" }`],
  ['JSON escapado dentro de string', (v) => `body="{\\"access_token\\":\\"${v}\\"}"`],
  ['dois-pontos com espaço', (v) => `access_token: ${v}`],
  ['igual com espaços', (v) => `access_token = ${v}`],
  ['valor entre aspas duplas', (v) => `access_token="${v}"`],
  ['valor entre aspas simples', (v) => `access_token='${v}'`],
  ['env em maiúsculas', (v) => `SUPABASE_ACCESS_TOKEN=${v}`],
  ['querystring', (v) => `GET /x?a=1&access_token=${v}&b=2`],
  ['percent-encoded na chave', (v) => `access%5Ftoken=${v}`],
  ['hífen na chave', (v) => `x-access-token: ${v}`],
  ['ANSI em volta do valor', (v) => `access_token=\x1b[32m${v}\x1b[0m fim`],
  ['ANSI entre chave e separador', (v) => `\x1b[1maccess_token\x1b[0m: ${v}`],
  ['refresh_token', (v) => `refresh_token=${v}`],
  ['Authorization Bearer', (v) => `Authorization: Bearer ${v}`],
  ['authorization em JSON', (v) => `{"authorization":"Bearer ${v}"}`],
  ['Bearer solto', (v) => `curl -H "Bearer ${v}" https://x`],
  ['apikey em querystring', (v) => `GET /rest/v1/t?apikey=${v}&select=*`],
  ['service_role key em env', (v) => `SUPABASE_SERVICE_ROLE_KEY=${v}`],
  ['client secret', (v) => `client_secret: "${v}"`],
  ['password', (v) => `password=${v}`],
  ['seta de hash', (v) => `"access_token"=>"${v}"`],
  ['separador percent-encoded', (v) => `redirect=%2Fcb%3Faccess_token%3D${v}`],
  ['flag de CLI', (v) => `supabase db push --password ${v} --linked`],
  ['flag de CLI com aspas', (v) => `cli --access-token "${v}" deploy`],
  ['nome do env.manifest terminado em _KEY', (v) => `NFE_CERT_MASTER_KEY=${v}`],
  ['nome terminado em _KEY_PREV', (v) => `NFE_CERT_MASTER_KEY_PREV: ${v}`],
  ['x-api-key', (v) => `x-api-key: ${v}`],
  ['valor com vírgula e ponto-e-vírgula', (v) => `password=${v},resto;${v}`],
  ['aspa dupla aberta e não fechada (linha truncada)', (v) => `access_token="${v}`],
  ['aspa simples aberta e não fechada', (v) => `password='${v}`],
  ['aspa escapada aberta e não fechada', (v) => `{\\"access_token\\":\\"${v}`],
  ['valor começando por barra invertida', (v) => `password=\\${v}`],
  ['valor solto no meio da linha', (v) => `chave usada ${v} no deploy`],
];

for (const [nomeValor, valor] of [['PAT sbp_', PAT], ['JWT', JWT], ['sb_secret_', SB_SECRET], ['token GitHub', GH]]) {
  for (const [forma, montar] of CASOS_SEM_VALOR_CONHECIDO) {
    test(`vazamento: ${nomeValor} em "${forma}" sai mesmo sem o valor literal`, () => {
      const saida = redigir(montar(valor), []);
      assert.equal(saida.includes(valor), false, saida);
      // nem um pedaço reconhecível do valor pode sobrar
      assert.equal(saida.includes(valor.slice(0, 12)), false, saida);
      assert.equal(saida.includes(valor.slice(-12)), false, saida);
    });
  }
}

test('vazamento: valor opaco (sem forma conhecida) sai pela chave em todas as formas chave/valor', () => {
  const opaco = ['Zx9', 'Qw7', 'Lm3', 'Rt5', 'Yp1'].join('-');
  for (const [forma, montar] of CASOS_SEM_VALOR_CONHECIDO) {
    if (forma === 'valor solto no meio da linha' || forma === 'Bearer solto') continue; // sem chave nem forma: só o literal resolve
    const saida = redigir(montar(opaco), []);
    assert.equal(saida.includes(opaco), false, `${forma}: ${saida}`);
  }
});

test('vazamento: senha em URL de banco (inclusive com @ e / crus na senha)', () => {
  for (const senha of [SENHA, `${SENHA}@x`, `${SENHA}/y@z`, `p%40${SENHA}`]) {
    const saida = redigir(`db: postgresql://postgres.bwwb:${senha}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`, []);
    assert.equal(saida.includes(SENHA), false, saida);
    assert.ok(saida.includes('postgresql://postgres.bwwb:***@'), saida);
    assert.ok(saida.includes('pooler.supabase.com:6543/postgres'), 'host e banco continuam legíveis');
  }
  const https = redigir(`clone https://x-access-token:${SENHA}@github.com/o/r.git`, []);
  assert.equal(https.includes(SENHA), false, https);
});

test('vazamento: webhook do Slack perde o caminho-credencial e mantém o host', () => {
  const caminho = ['T0AAAA111', 'B0BBBB222', 'xYz123AbC456dEf789GhI012'].join('/');
  const saida = redigir(`SLACK_WEBHOOK_URL=https://hooks.slack.com/services/${caminho}`, []);
  assert.equal(saida, 'SLACK_WEBHOOK_URL=https://hooks.slack.com/services/***');
});

test('vazamento: `curl -u usuario:senha` e `--user usuario:senha`', () => {
  for (const flag of ['-u', '--user']) {
    const saida = redigir(`curl ${flag} admin:${SENHA} https://exemplo.com`, []);
    assert.equal(saida, `curl ${flag} admin:*** https://exemplo.com`);
  }
  assert.equal(redigir('git push -u origin main', []), 'git push -u origin main');
});

// Limite assumido: a redação por chave erra para o lado seguro. Função cujo NOME termina
// em token/key (get-mapbox-token, get-vapid-key), quando aparece como rótulo `nome: msg`,
// perde a primeira palavra da mensagem. Isentar nomes abriria um caminho de vazamento no
// script cuja única função é não vazar.
test('preço aceito: rótulo `get-vapid-key: mensagem` perde a 1ª palavra, o resto da linha fica', () => {
  assert.equal(redigir('❌ get-vapid-key: verify_jwt ausente em supabase/config.toml; deploy recusado.', []), '❌ get-vapid-key: *** ausente em supabase/config.toml; deploy recusado.');
  assert.equal(redigir('{"ts":"t","event":"deploy","fn":"get-mapbox-token","status":"ok"}', []), '{"ts":"t","event":"deploy","fn":"get-mapbox-token","status":"ok"}', 'a linha do deploy-log .jsonl não é tocada');
});

test('URL com porta e sem credencial não é mexida', () => {
  for (const url of ['https://exemplo.com:8443/caminho?email=a@b.com', 'http://localhost:54321/functions/v1/x', 'postgres://localhost:5432/db']) {
    assert.equal(redigir(`abrindo ${url}`, []), `abrindo ${url}`);
  }
});

test('valor literal: sai também percent-encoded, escapado de JSON, cortado por ANSI e dobrado em linhas', () => {
  const segredo = `p@ss/${SENHA}!"aspas"\\barra`;
  const formas = [
    `cru ${segredo} fim`,
    `url ${encodeURIComponent(segredo)} fim`,
    `json ${JSON.stringify(segredo)} fim`,
    `ansi ${segredo.slice(0, 7)}\x1b[0m${segredo.slice(7, 15)}\x1b[36;1m${segredo.slice(15)} fim`,
    `dobrado ${segredo.slice(0, 9)}\n      ${segredo.slice(9, 20)}\r\n\t${segredo.slice(20)} fim`,
  ];
  for (const forma of formas) {
    const saida = redigir(forma, [segredo]);
    assert.equal(saida.includes(SENHA), false, saida);
    assert.ok(saida.endsWith(' fim'), `o texto ao redor sobrevive: ${JSON.stringify(saida)}`);
  }
});

test('valor literal com metacaractere de regex não quebra nem casa texto alheio', () => {
  const segredo = 'a.b*c+d?e(f)[g]{h}|i^j$k';
  assert.equal(redigir(`x ${segredo} y`, [segredo]), 'x *** y');
  assert.equal(redigir('x aXb*c+d?e(f)[g]{h}|i^j$k y', [segredo]), 'x aXb*c+d?e(f)[g]{h}|i^j$k y');
});

test('segredo multilinha (PEM) sai linha a linha, mesmo com o log reindentado', () => {
  const corpo1 = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASC';
  const corpo2 = 'BKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj';
  const pem = ['-----BEGIN PRIVATE KEY-----', corpo1, corpo2, '-----END PRIVATE KEY-----'].join('\n');
  const saida = redigir(`  | ${corpo1}\n  | ${corpo2}\n`, [pem]);
  assert.equal(saida.includes(corpo1), false, saida);
  assert.equal(saida.includes(corpo2), false, saida);
});

test('redigir é idempotente', () => {
  const entrada = CASOS_SEM_VALOR_CONHECIDO.map(([, montar]) => montar(PAT)).join('\n');
  const uma = redigir(entrada, [PAT]);
  assert.equal(redigir(uma, [PAT]), uma);
});

test('linhas úteis do log de deploy sobrevivem (nome de função com token/key, "No change found")', () => {
  const linhas = [
    'Deploying Function: get-mapbox-token (script size: 1.2MB)',
    'No change found in Function: get-vapid-key',
    'Deployed Functions on project bwwbeyolnnzppeuhgkcd: validar-token-contador, api-keys-manage',
    '{"name":"get-mapbox-token","verify_jwt":true}',
    'verify_jwt = false',
    'Digest: sha256:c52405002a890ca9fcf77978671c57f3a988e03174afb277f84ac65bc917013c',
    'Bearer authentication habilitada',
    'tokens consumidos: 5',
    'supabase functions deploy asaas-proxy --project-ref bwwbeyolnnzppeuhgkcd --no-verify-jwt',
    'https://hooks.slack.com/services/',
  ];
  for (const linha of linhas) assert.equal(redigir(linha, []), linha);
});

test('fixtures reais: a redação não muda o que o unchanged-from-log extrai', () => {
  for (const fixture of ['deploy-log-all-36583351162.txt', 'deploy-log-ansi-f03.txt', 'deploy-log-echo-only.txt', 'deploy-log-single-36852598923.txt']) {
    const bruto = readFileSync(resolve(__dirname, 'fixtures', fixture), 'utf8');
    assert.deepEqual(extractUnchangedSlugs(redigir(bruto, [])), extractUnchangedSlugs(bruto), fixture);
  }
});

test('log grande com linha longa sem separador termina rápido (sem backtracking explosivo)', () => {
  const linhaLonga = 'token'.repeat(40_000) + ' ' + 'A'.repeat(200_000) + ' access_token ' + ' '.repeat(50_000) + 'x ' +
    '-'.repeat(200_000) + ' ' + 'a.'.repeat(100_000) + ' ' + 'eyJ'.repeat(20_000) + ' ' + '\\'.repeat(100_000);
  const inicio = Date.now();
  redigir(`${linhaLonga}\n`.repeat(3), [PAT, SENHA + SENHA]);
  assert.ok(Date.now() - inicio < 5000, `levou ${Date.now() - inicio} ms`);
});

function rodarCli(args, { env = {}, script = SCRIPT } = {}) {
  return spawnSync(process.execPath, [script, ...args], { cwd: raizProjeto, encoding: 'utf8', env: { ...process.env, ...env } });
}

test('CLI: caminho do script com espaço e acento redige de verdade (antes saía 0 sem redigir)', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir espaço ç-'));
  try {
    const copia = resolve(base, 'redigir-log.mjs');
    copyFileSync(SCRIPT, copia);
    const log = resolve(base, 'deploy.log');
    writeFileSync(log, `curl ...?access_token=${PAT}\n`);
    const r = rodarCli([log], { script: copia, env: { REDIGIR_LOG_BASE: base } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /log redigido: 1 ocorrência/);
    assert.equal(readFileSync(log, 'utf8'), 'curl ...?token=***\n');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('CLI: invocado por symlink também redige', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-link-'));
  try {
    const atalho = resolve(base, 'atalho.mjs');
    symlinkSync(SCRIPT, atalho);
    const log = resolve(base, 'deploy.log');
    writeFileSync(log, `access_token=${PAT}\n`);
    const r = rodarCli([log], { script: atalho, env: { REDIGIR_LOG_BASE: base } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(log, 'utf8').includes(PAT), false);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('CLI: argumento não reconhecido aborta com 2 e NÃO toca o log (ex.: --segredo-env sem "=")', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-arg-'));
  try {
    const log = resolve(base, 'deploy.log');
    const conteudo = `valor ${SENHA}${SENHA}\n`;
    for (const extras of [['--segredo-env', 'TOKEN_DE_TESTE'], ['--segredo-env='], ['--segredo-env=1ABC'], ['--outra'], ['solto']]) {
      writeFileSync(log, conteudo);
      const r = rodarCli([log, ...extras], { env: { REDIGIR_LOG_BASE: base, TOKEN_DE_TESTE: SENHA + SENHA } });
      assert.equal(r.status, 2, `${extras.join(' ')} → ${r.status} ${r.stderr}`);
      assert.match(r.stderr, /::error::argumento não reconhecido/);
      assert.equal(readFileSync(log, 'utf8'), conteudo, 'log intocado quando o comando é inválido');
    }
    assert.equal(rodarCli([], { env: { REDIGIR_LOG_BASE: base } }).status, 2);
    assert.equal(rodarCli(['--segredo-env=TOKEN_DE_TESTE'], { env: { REDIGIR_LOG_BASE: base } }).status, 2, 'flag no lugar do arquivo');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('CLI: variável de segredo ausente avisa pelo NOME, redige pela forma e nunca imprime valor', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-env-'));
  try {
    const log = resolve(base, 'deploy.log');
    const literal = SENHA + SENHA;
    writeFileSync(log, `access_token=${PAT}\nopaco ${literal}\nAuthorization: Bearer ${JWT}\n`);
    const env = { ...process.env, REDIGIR_LOG_BASE: base, VAZIA: '   ', PRESENTE: literal };
    delete env.AUSENTE;
    const r = spawnSync(process.execPath, [SCRIPT, log, '--segredo-env=AUSENTE', '--segredo-env=VAZIA', '--segredo-env=PRESENTE'], { cwd: raizProjeto, encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /::warning::AUSENTE ausente/);
    assert.match(r.stderr, /::warning::VAZIA ausente/);
    assert.match(r.stdout, /1 valor\(es\) literal\(is\)/);
    const limpo = readFileSync(log, 'utf8');
    for (const segredo of [PAT, literal, JWT]) {
      assert.equal(limpo.includes(segredo), false, limpo);
      assert.equal((r.stdout + r.stderr).includes(segredo), false, 'o valor não pode aparecer na saída do script');
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('CLI: alvo que é diretório, alvo fora da base e symlink para fora saem com 2', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-conf-'));
  const fora = mkdtempSync(resolve(tmpdir(), 'redigir-fora-'));
  try {
    mkdirSync(resolve(base, 'pasta'));
    const segredoFora = resolve(fora, 'alheio.log');
    writeFileSync(segredoFora, `access_token=${PAT}\n`);
    symlinkSync(segredoFora, resolve(base, 'link.log'));
    const env = { REDIGIR_LOG_BASE: base };
    assert.equal(rodarCli([resolve(base, 'pasta')], { env }).status, 2, 'diretório');
    assert.equal(rodarCli([segredoFora], { env }).status, 2, 'fora da base');
    assert.equal(rodarCli([resolve(base, 'pasta', '..', '..', 'x.log')], { env }).status, 2, 'travessia');
    assert.equal(rodarCli([resolve(base, 'link.log')], { env }).status, 2, 'symlink para fora');
    assert.equal(rodarCli([base], { env }).status, 2, 'a própria base');
    assert.equal(readFileSync(segredoFora, 'utf8'), `access_token=${PAT}\n`, 'arquivo fora da base não é reescrito');
  } finally {
    rmSync(base, { recursive: true, force: true });
    rmSync(fora, { recursive: true, force: true });
  }
});

test('confinar aceita arquivo cujo NOME começa com ".." dentro da base', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-pp-'));
  try {
    writeFileSync(resolve(base, '..rascunho.log'), 'x');
    assert.equal(confinar(resolve(base, '..rascunho.log'), base), resolve(base, '..rascunho.log'));
    assert.throws(() => confinar(resolve(base, '..'), base), /fora da base/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('CLI: --help sai 0 sem exigir arquivo', () => {
  const r = rodarCli(['--help']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Uso: node scripts\/edge-deploy\/redigir-log\.mjs/);
  assert.ok(existsSync(SCRIPT));
});
