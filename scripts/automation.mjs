#!/usr/bin/env node
import { spawn } from 'node:child_process';
import {
  constants,
  openSync,
  closeSync,
  fstatSync,
  readSync,
  writeSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const SELF = fileURLToPath(import.meta.url);
const APPROVED = join(homedir(), '.local/share/repo-maintenance');
const EVENTS = [
  'applypatch-msg',
  'pre-applypatch',
  'post-applypatch',
  'pre-commit',
  'pre-merge-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-rebase',
  'post-checkout',
  'post-merge',
  'pre-push',
  'pre-receive',
  'update',
  'proc-receive',
  'post-receive',
  'post-update',
  'reference-transaction',
  'push-to-checkout',
  'post-rewrite',
  'sendemail-validate',
  'fsmonitor-watchman',
  'p4-changelist',
  'p4-prepare-changelist',
  'p4-post-changelist',
  'p4-pre-submit',
  'post-index-change',
];
const TRIGGERS = [
  'manual',
  'precommit',
  'prepush',
  'postcommit',
  'postmerge',
  'postcheckout',
  'PR',
  'pushmain',
  'nightly',
];
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const nonempty = (dir) =>
  readdirSync(dir, { withFileTypes: true }).some(
    (e) => !e.isDirectory() || nonempty(join(dir, e.name))
  );
const fail = (message, code = 1) => Object.assign(new Error(message), { code });
// Erro de uso (argumento/flag inválido) sai com 2, distinto de falha de verificação (1).
const usage = (message) => fail(message, 2);
const within = (base, target) => target === base || target.startsWith(base + sep);
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const atomic = (path, data, mode = 0o600) => {
  mkdirSync(dirname(path), { recursive: true });
  const temp = path + '.' + randomUUID();
  writeFileSync(temp, data, { mode });
  renameSync(temp, path);
};
const pattern = (glob) =>
  new RegExp(
    '^' +
      glob
        .split('**')
        .map((p) =>
          p
            .split('*')
            .map((s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\?/g, '.'))
            .join('[^/]*')
        )
        .join('.*') +
      '$'
  );
const relativePath = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !isAbsolute(value) &&
  !value.split(/[\\/]/).includes('..') &&
  !value.includes('\0');
const pathLike = (value) => typeof value === 'string' && (relativePath(value) || isAbsolute(value));
const command = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((p) => typeof p === 'string' && p.length > 0 && !p.includes('\0'));
function onlyKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw fail(`${label}: objeto obrigatório`);
  for (const k of Object.keys(value))
    if (!keys.includes(k)) throw fail(`${label}: chave desconhecida ${k}`);
}

export const USAGE = `uso: node scripts/automation.mjs <comando> [opções]
  doctor [--static]            valida config, aliases, workflow e ponte de hooks
  test                         executa as suites registradas (node:test)
  check|heal --ref <ref>       motor de manutenção (ref explícita obrigatória)
  nightly --ref <ref>          grafo (ensure) + heal
  graph [subcomando]           grafo local (install|status|mark|ensure|query|path|explain)
  install-hooks | uninstall-hooks
  hook <evento> -- [args]      uso interno da ponte de hooks
opções: --root <dir>  --config <arquivo>  --help`;

export function parseArgs(argv) {
  let root = process.cwd(),
    config,
    staticOnly = false,
    ref,
    action,
    help = false,
    positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (['--root', '--config', '--ref'].includes(a)) {
      const v = argv[++i];
      if (!v || v.startsWith('--')) throw usage(`${a} exige valor`);
      // Uma ref iniciada em "-" seria lida como opção pelo git/motor.
      if (a === '--ref' && v.startsWith('-'))
        throw usage('--ref inválida: não pode iniciar com "-"');
      if (a === '--root') root = resolve(v);
      else if (a === '--config') config = v;
      else ref = v;
    } else if (a === '--static') staticOnly = true;
    else if ((a === '--help' || a === '-h') && action !== 'graph') help = true;
    else if (a.startsWith('--') && action !== 'graph') throw usage(`opção desconhecida ${a}`);
    else if (!action) action = a;
    else positional.push(a);
  }
  if (help || action === 'help') return { help: true };
  if (
    ![
      'doctor',
      'test',
      'check',
      'heal',
      'nightly',
      'graph',
      'hook',
      'install-hooks',
      'uninstall-hooks',
    ].includes(action)
  )
    throw usage('comando desconhecido');
  if (staticOnly && action !== 'doctor') throw usage('--static só é aceito em doctor');
  if (ref && !['check', 'heal', 'nightly'].includes(action))
    throw usage('--ref só é aceito em check/heal/nightly');
  if (['check', 'heal', 'nightly'].includes(action) && !ref)
    throw usage('--ref explícita obrigatória');
  if (!['graph', 'hook'].includes(action) && positional.length)
    throw usage('argumentos adicionais não aceitos');
  return {
    root: resolve(root),
    config: resolve(root, config || 'scripts/automation.config.json'),
    staticOnly,
    ref,
    action,
    positional,
  };
}

export function validateConfig(c) {
  onlyKeys(
    c,
    [
      'version',
      'name',
      'entrypoint',
      'testSuites',
      'motor',
      'graph',
      'graphConfig',
      'aliases',
      'registrations',
      'ci',
      'nightly',
      'timeoutMs',
      'toolingPatterns',
      'sourcePatterns',
      'requirements',
      'snapshot',
      'motorConfig',
      'motorSource',
    ],
    'config'
  );
  if (c.version !== 1 || typeof c.name !== 'string' || !c.name)
    throw fail('config: version 1 e name obrigatórios');
  if (typeof c.entrypoint !== 'string' || !c.entrypoint) throw fail('entrypoint obrigatório');
  if (
    !Array.isArray(c.testSuites) ||
    !c.testSuites.length ||
    c.testSuites.some((p) => typeof p !== 'string' || !p.endsWith('.mjs'))
  )
    throw fail('testSuites: liste suites node:test .mjs');
  for (const k of ['motor', 'graph'])
    if (
      !command(c[k]) ||
      c[k].length < 2 ||
      !['node', 'sh', process.execPath].includes(c[k][0]) ||
      c[k][1].startsWith('-')
    )
      throw fail(`${k}: comando node/sh e arquivo explícito obrigatórios`);
  for (const k of ['motorConfig', 'motorSource'])
    if (c[k] !== undefined && !pathLike(c[k])) throw fail(`${k}: caminho inválido`);
  if (!pathLike(c.graphConfig)) throw fail('graphConfig obrigatório');
  onlyKeys(c.aliases, Object.keys(c.aliases || {}), 'aliases');
  if (
    !Object.keys(c.aliases).length ||
    Object.values(c.aliases).some((v) => typeof v !== 'string' || !v)
  )
    throw fail('aliases obrigatórios');
  if (!Array.isArray(c.registrations) || !c.registrations.length)
    throw fail('registrations obrigatório');
  const ids = new Set();
  for (const r of c.registrations) {
    onlyKeys(r, ['id', 'kind', 'files', 'manual', 'triggers', 'reason', 'callers'], 'registro');
    if (!r.id || ids.has(r.id)) throw fail('id de registro vazio/duplicado');
    ids.add(r.id);
    if (
      !['test', 'motor', 'graph', 'tool', 'helper', 'legacy'].includes(r.kind) ||
      !Array.isArray(r.files) ||
      !r.files.length ||
      r.files.some((p) => !relativePath(p))
    )
      throw fail(`registro ${r.id}: files/kind inválidos`);
    if (!Array.isArray(r.triggers) || r.triggers.some((t) => !TRIGGERS.includes(t)))
      throw fail(`registro ${r.id}: gatilhos inválidos`);
    if (r.kind === 'helper') {
      if (!Array.isArray(r.callers) || !r.callers.length || r.callers.some((p) => !relativePath(p)))
        throw fail(`helper ${r.id}: callers explícitos obrigatórios`);
    } else if (!command(r.manual) || !r.triggers.includes('manual'))
      throw fail(`registro ${r.id}: comando/gatilho manual obrigatório`);
    if (r.kind === 'legacy') {
      if (
        r.files.some((p) => /[*?]/.test(p)) ||
        typeof r.reason !== 'string' ||
        r.reason.length < 12
      )
        throw fail(`legado ${r.id}: arquivos exatos e justificativa obrigatórios`);
      if (r.triggers.some((t) => t !== 'manual'))
        throw fail(`legado ${r.id}: execução automática proibida`);
    } else if (r.kind !== 'helper' && !r.triggers.some((t) => t !== 'manual'))
      throw fail(`registro ${r.id}: gatilho automático obrigatório`);
  }
  if (!Array.isArray(c.ci) || !c.ci.length) throw fail('ci: vínculo de workflow obrigatório');
  for (const x of c.ci) {
    onlyKeys(x, ['file', 'events', 'command'], 'ci');
    if (
      !relativePath(x.file) ||
      !Array.isArray(x.events) ||
      !x.events.length ||
      x.events.some((e) => !['PR', 'pushmain'].includes(e)) ||
      typeof x.command !== 'string' ||
      !x.command
    )
      throw fail('ci: contrato inválido');
  }
  onlyKeys(c.nightly, ['command', 'file'], 'nightly');
  if (!command(c.nightly.command) || (c.nightly.file && !pathLike(c.nightly.file)))
    throw fail('nightly: comando obrigatório');
  for (const k of ['toolingPatterns', 'sourcePatterns', 'requirements'])
    if (c[k] && (!Array.isArray(c[k]) || c[k].some((p) => !relativePath(p))))
      throw fail(`${k}: caminhos/globs relativos obrigatórios`);
  if (
    c.timeoutMs !== undefined &&
    (!Number.isInteger(c.timeoutMs) || c.timeoutMs < 100 || c.timeoutMs > 900000)
  )
    throw fail('timeoutMs inválido');
  if (c.snapshot) {
    onlyKeys(c.snapshot, ['root', 'ref'], 'snapshot');
    if (
      typeof c.snapshot.root !== 'string' ||
      !isAbsolute(c.snapshot.root) ||
      !/^[a-f0-9]{40}$/i.test(c.snapshot.ref || '')
    )
      throw fail('snapshot: root absoluto/ref SHA obrigatórios');
  }
  return c;
}

// SIGHUP: terminal fechado não pode deixar o grupo filho (detached) órfão e rodando.
const SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];
export async function execute(
  argv,
  { cwd, timeout = 300000, capture = false, env = process.env } = {}
) {
  return new Promise((done) => {
    const args = argv[0] === 'node' ? [process.execPath, ...argv.slice(1)] : argv;
    const child = spawn(args[0], args.slice(1), {
      cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    const chunks = [],
      errors = [],
      LIMIT = 4 * 1024 * 1024;
    let finished = false,
      timedOut = false,
      interrupted = false,
      truncated = false,
      size = 0,
      errSize = 0,
      forced;
    const kill = (signal) => {
      try {
        process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal);
      } catch {
        /* O processo já pode ter encerrado. */
      }
    };
    const finish = (code, message) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(forced);
      for (const sig of SIGNALS) process.removeListener(sig, terminate);
      done({
        code,
        timedOut,
        ...(truncated ? { truncated } : {}),
        ...(capture
          ? {
              stdout: Buffer.concat(chunks).toString('utf8'),
              stderr: Buffer.concat(errors).toString('utf8'),
            }
          : {}),
        ...(message ? { error: message } : {}),
      });
    };
    const terminate = () => {
      interrupted = true;
      kill('SIGTERM');
      clearTimeout(forced);
      forced = setTimeout(() => {
        kill('SIGKILL');
        finish(130, 'interrompido');
      }, 500);
    };
    for (const sig of SIGNALS) process.once(sig, terminate);
    const timer = setTimeout(() => {
      timedOut = true;
      kill('SIGTERM');
      clearTimeout(forced);
      forced = setTimeout(() => {
        kill('SIGKILL');
        finish(124, 'timeout');
      }, 500);
    }, timeout);
    child.stdout?.on('data', (x) => {
      if (size < LIMIT) {
        chunks.push(x);
        size += x.length;
      } else truncated = true;
    });
    child.stderr?.on('data', (x) => {
      if (errSize < LIMIT) {
        errors.push(x);
        errSize += x.length;
      } else truncated = true;
    });
    child.once('error', (e) => finish(127, e.code || 'spawn_failed'));
    child.once('close', (code, signal) => {
      if (timedOut || interrupted) kill('SIGKILL');
      finish(timedOut ? 124 : interrupted ? 130 : (code ?? 1), signal);
    });
  });
}

async function git(root, args, allowed = [0]) {
  const r = await execute(['git', '-C', root, ...args], {
    cwd: root,
    capture: true,
    timeout: 15000,
  });
  if (!allowed.includes(r.code)) throw fail(`git ${args[0]} falhou (${r.code})`);
  // Saída cortada em silêncio poderia esconder arquivos (ex.: diff --cached) e aprovar por omissão.
  if (r.truncated) throw fail(`git ${args[0]}: saída excede o limite de captura`);
  return r;
}
function approved(path, configPath) {
  if (
    !existsSync(APPROVED) ||
    lstatSync(APPROVED).isSymbolicLink() ||
    !existsSync(configPath) ||
    !within(realpathSync(APPROVED), realpathSync(configPath)) ||
    !within(realpathSync(APPROVED), realpathSync(path))
  )
    throw fail('caminho externo fora do runtime instalado aprovado');
  return realpathSync(path);
}
function locate(root, c, configPath, path) {
  if (isAbsolute(path)) return approved(path, configPath);
  if (!relativePath(path)) throw fail(`caminho inválido ${path}`);
  const target = resolve(root, path);
  if (c.snapshot) {
    const snapshotRoot = approved(c.snapshot.root, configPath);
    const candidate = resolve(snapshotRoot, path);
    if (existsSync(candidate)) return approved(candidate, configPath);
  }
  if (existsSync(target)) {
    if (!within(realpathSync(root), realpathSync(target)))
      throw fail(`symlink fora do repositório: ${path}`);
    return target;
  }
  if (c.snapshot) {
    const snapshotRoot = approved(c.snapshot.root, configPath);
    const targetSnapshot = resolve(snapshotRoot, path);
    if (existsSync(targetSnapshot)) return approved(targetSnapshot, configPath);
  }
  throw fail(`arquivo ausente: ${path}`);
}
function scan(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (
      ['node_modules', '__pycache__', '.venv', '.venv-graphify'].includes(e.name) ||
      e.isSymbolicLink()
    )
      continue;
    const p = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...scan(join(dir, e.name), p));
    else if (/\.(mjs|cjs|js|ts|tsx|sh|py)$/.test(e.name)) out.push(p);
  }
  return out;
}
const lineOf = (text) => text.split(/\r?\n/);
const unquote = (v) => v.trim().replace(/^(['"])(.*)\1$/, '$2');
const noComment = (v) => v.replace(/\s+#.*$/, '').trim();
// Entradas do nível mais raso de um bloco YAML (chave: valor, ou item "- x"), sem dependência de parser.
function entries(lines) {
  const out = [];
  let base = -1;
  for (const l of lines) {
    if (!l.trim() || /^\s*#/.test(l)) continue;
    const indent = l.search(/\S/);
    if (base < 0) base = indent;
    const text = l.trim();
    const item = /^-\s+(.*)$/.exec(text);
    const prev = out.at(-1);
    // Lista no mesmo recuo da chave ("branches:\n- main") pertence à chave anterior.
    if (indent > base || (item && indent === base && prev && !prev.item && !prev.value)) {
      prev?.rest.push(l);
      continue;
    }
    if (indent < base) break;
    const kv = /^(['"]?)([\w.-]+)\1\s*:\s*(.*)$/.exec(text);
    if (item) out.push({ key: unquote(noComment(item[1])), value: '', item: true, rest: [] });
    else out.push({ key: kv ? kv[2] : '', value: kv ? noComment(kv[3]) : '', rest: [] });
  }
  return out;
}
const listOf = (v) =>
  v.startsWith('[')
    ? v
        .slice(1, v.indexOf(']') < 0 ? undefined : v.indexOf(']'))
        .split(',')
        .map(unquote)
        .filter(Boolean)
    : v
      ? [unquote(v)]
      : [];
const valuesOf = (e) =>
  e.value
    ? listOf(e.value)
    : entries(e.rest)
        .filter((x) => x.item)
        .map((x) => x.key);
// O gatilho precisa alcançar a branch main: branches/branches-ignore/tags são respeitados.
function reachesMain(section, want) {
  const f = {};
  if (section.value.startsWith('{'))
    for (const m of section.value.matchAll(
      /(branches-ignore|branches|tags-ignore|tags)\s*:\s*(\[[^\]]*\]|[^,}\s]+)/g
    ))
      f[m[1]] = listOf(m[2]);
  else
    for (const e of entries(section.rest))
      if (['branches', 'branches-ignore', 'tags', 'tags-ignore'].includes(e.key))
        f[e.key] = valuesOf(e);
  const hit = (g) => pattern(g).test('main');
  if (f.branches) {
    const positive = f.branches.filter((g) => !g.startsWith('!'));
    const negative = f.branches.filter((g) => g.startsWith('!'));
    return positive.some(hit) && !negative.some((g) => hit(g.slice(1)));
  }
  if (f['branches-ignore']) return !f['branches-ignore'].some(hit);
  // Só tags/tags-ignore: push em branch não dispara o workflow.
  return !(want === 'push' && (f.tags || f['tags-ignore']));
}
function workflowEvent(text, event) {
  const lines = lineOf(text).filter((l) => !/^\s*#/.test(l));
  const at = lines.findIndex((l) => /^(?:on|'on'|"on"):/.test(l));
  if (at < 0) return false;
  const head = noComment(lines[at].replace(/^(?:on|'on'|"on"):/, ''));
  const want = event === 'PR' ? 'pull_request' : 'push';
  if (head.startsWith('{'))
    return event === 'PR' ? /\bpull_request\b/.test(head) : /\bpush\b/.test(head);
  let sections;
  if (head)
    sections = listOf(head.startsWith('[') ? head : '[' + head + ']').map((key) => ({
      key,
      value: '',
      rest: [],
    }));
  else {
    const body = [];
    for (const l of lines.slice(at + 1)) {
      if (l.trim() && !/^\s/.test(l) && !/^-\s/.test(l)) break;
      body.push(l);
    }
    sections = entries(body);
  }
  const section = sections.find((x) => x.key === want);
  return Boolean(section) && reachesMain(section, want);
}
// Um passo desligado (continue-on-error/if: false) não conta como gate real.
function stepDisabled(lines, at) {
  let start = at,
    stepIndent;
  const own = /^(\s*)-\s/.exec(lines[at]);
  if (own) stepIndent = own[1].length;
  else {
    const runIndent = lines[at].search(/\S/);
    for (start = at - 1; start >= 0; start--) {
      const m = /^(\s*)-\s/.exec(lines[start]);
      if (m && m[1].length < runIndent) {
        stepIndent = m[1].length;
        break;
      }
    }
    if (stepIndent === undefined) return false;
  }
  let end = at + 1;
  while (end < lines.length && (!lines[end].trim() || lines[end].search(/\S/) > stepIndent)) end++;
  return lines
    .slice(start, end)
    .some((l) =>
      /^\s*(?:-\s+)?(?:continue-on-error\s*:\s*['"]?true['"]?|if\s*:\s*['"]?(?:false|0)['"]?)\s*(?:#.*)?$/.test(
        l
      )
    );
}
const SWALLOWED = /\|\|\s*(?:true|:|exit\s+0)(?=\s|;|&|$)|;\s*(?:true|exit\s+0)\s*$/;
function workflowRuns(text, commandText) {
  const lines = lineOf(text);
  const calls = (v) => (v === commandText || v.startsWith(commandText + ' ')) && !SWALLOWED.test(v);
  let indent = -1,
    runAt = -1;
  for (const [i, line] of lines.entries()) {
    if (/^\s*#/.test(line)) continue;
    const run = /^(\s*)(?:-\s*)?run:\s*(.*)$/.exec(line);
    if (run) {
      indent = run[1].length;
      runAt = i;
      const value = run[2].trim().replace(/^(['"])(.*)\1$/, '$2');
      if (calls(value) && !stepDisabled(lines, i)) return true;
      continue;
    }
    if (indent >= 0 && line.trim()) {
      if (line.search(/\S/) <= indent) indent = -1;
      else if (calls(line.trim()) && !stepDisabled(lines, runAt)) return true;
    }
  }
  return false;
}
async function statePath(root) {
  if (process.env.REPO_AUTOMATION_STATE_FILE) return process.env.REPO_AUTOMATION_STATE_FILE;
  const value = (await git(root, ['config', '--get', 'core.hooksPath'], [0, 1])).stdout.trim();
  const hooks = value ? resolve(root, value) : '';
  return hooks.endsWith('/.tools/repo-automation/hooks')
    ? join(dirname(hooks), 'state.json')
    : join(root, '.tools/repo-automation/state.json');
}
async function doctor(ctx, staticOnly) {
  const { root, c, config } = ctx;
  const issues = [],
    check = (fn) => {
      try {
        return fn();
      } catch (e) {
        issues.push(e.message);
      }
    };
  const paths = [
    c.entrypoint,
    ...c.testSuites,
    c.motor[1],
    c.graph[1],
    c.graphConfig,
    ...(c.motorConfig ? [c.motorConfig] : []),
  ];
  for (const path of paths) check(() => locate(root, c, config, path));
  const packageFile = check(() => locate(root, c, config, 'package.json'));
  const pkg = packageFile ? check(() => json(packageFile)) : null;
  for (const [name, value] of Object.entries(c.aliases))
    if (pkg?.scripts?.[name] !== value) issues.push(`alias não encadeado: ${name}`);
  const roots = [
    root,
    ...(c.snapshot ? [check(() => approved(c.snapshot.root, config))].filter(Boolean) : []),
  ];
  const scripts = [...new Set(roots.flatMap((r) => scan(join(r, 'scripts'), 'scripts')))].sort();
  const matches = (p, glob) => pattern(glob).test(p);
  for (const path of scripts)
    if (!c.registrations.some((r) => r.files.some((g) => matches(path, g))))
      issues.push(`script sem registro/gatilho: ${path}`);
  for (const r of c.registrations) {
    for (const file of r.files)
      if (
        /[*?]/.test(file)
          ? !scripts.some((p) => matches(p, file))
          : !check(() => locate(root, c, config, file))
      )
        issues.push(`registro sem arquivo: ${r.id}/${file}`);
    if (r.manual)
      for (const arg of r.manual)
        if (/^scripts\/.+\.(?:mjs|cjs|js|ts|tsx|sh|py)$/.test(arg))
          check(() => locate(root, c, config, arg));
    if (r.kind === 'test' && !c.testSuites.some((p) => r.files.some((g) => matches(p, g))))
      issues.push(`suite sem ligação ao runner: ${r.id}`);
    if (r.kind === 'motor' && !r.files.some((g) => matches(c.motorSource || c.motor[1], g)))
      issues.push(`motor não encadeado: ${r.id}`);
    if (r.kind === 'graph' && !r.files.some((g) => matches(c.graph[1], g)))
      issues.push(`grafo não encadeado: ${r.id}`);
    if (r.kind === 'helper')
      for (const caller of r.callers) {
        const path = check(() => locate(root, c, config, caller));
        if (
          !c.registrations.some((x) => x.id !== r.id && x.files.some((g) => matches(caller, g))) ||
          !path ||
          !r.files.some((g) => readFileSync(path, 'utf8').includes(g.split('/').at(-1)))
        )
          issues.push(`helper sem caller encadeado: ${r.id}/${caller}`);
      }
    if (r.kind === 'tool' && !r.files.some((g) => matches(c.entrypoint, g)))
      issues.push(
        `tool sem dispatcher implementado: ${r.id}; use helper com callers ou legacy manual`
      );
  }
  const ci = [];
  const testCommand = (value) =>
    value.includes(basename(c.entrypoint) + ' test') ||
    Object.entries(c.aliases).some(
      ([name, cmd]) =>
        cmd.includes(basename(c.entrypoint) + ' test') &&
        new RegExp(
          '(?:npm|bun) run ' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|$)'
        ).test(value)
    );
  for (const event of ['PR', 'pushmain'])
    if (!c.ci.some((x) => x.events.includes(event))) issues.push(`testes sem gatilho CI ${event}`);
  for (const item of c.ci) {
    const path = check(() => locate(root, c, config, item.file));
    const text = path ? readFileSync(path, 'utf8') : '';
    for (const event of item.events)
      if (!workflowEvent(text, event)) issues.push(`workflow sem evento ${event}: ${item.file}`);
    if (!testCommand(item.command)) issues.push(`CI não chama runner de testes: ${item.file}`);
    if (!workflowRuns(text, item.command)) issues.push(`workflow sem run encadeado: ${item.file}`);
    ci.push({
      file: item.file,
      declaredEvents: item.events,
      sourceIntegrated: existsSync(join(root, item.file)),
    });
  }
  if (c.nightly.file) {
    const path = check(() => locate(root, c, config, c.nightly.file));
    if (path && !readFileSync(path, 'utf8').includes(c.nightly.command.join(' ')))
      issues.push('nightly não encadeado');
  }
  const stateFile = await statePath(root);
  let hooks = 'not_installed';
  if (existsSync(stateFile)) {
    let state = check(() => json(stateFile));
    if (state && (typeof state !== 'object' || typeof state.hooks !== 'string')) {
      issues.push('estado da ponte inválido: ' + stateFile);
      state = null;
    }
    const effective = (
      await git(root, ['config', '--get', 'core.hooksPath'], [0, 1])
    ).stdout.trim();
    if (state && effective === state.hooks) hooks = 'installed';
    else if (state) issues.push('ponte instalada não é o hooksPath efetivo');
    if (state)
      for (const event of EVENTS)
        if (!existsSync(join(state.hooks, event))) issues.push(`ponte ausente: ${event}`);
    if (state)
      for (const [path, hash] of Object.entries(state.files || {}))
        check(() => {
          const target = resolve(dirname(state.hooks), path);
          if (
            !within(dirname(state.hooks), target) ||
            !existsSync(target) ||
            lstatSync(target).isSymbolicLink() ||
            digest(target) !== hash
          )
            throw fail(`ponte divergente: ${path}`);
        });
  } else if (!staticOnly)
    issues.push('hooks não instalados; use install-hooks após validar o snapshot');
  if (!staticOnly)
    for (const path of c.requirements || [])
      check(() => locate(root, { ...c, snapshot: undefined }, config, path));
  const sourcePackage = existsSync(join(root, 'package.json'))
    ? check(() => json(join(root, 'package.json')))
    : null;
  const sourceIntegrated =
    Object.entries(c.aliases).every(([k, v]) => sourcePackage?.scripts?.[k] === v) &&
    paths.every(
      (p) =>
        !isAbsolute(p) &&
        existsSync(join(root, p)) &&
        (!c.snapshot ||
          readFileSync(join(root, p)).equals(readFileSync(locate(root, c, config, p))))
    );
  return {
    ok: issues.length === 0,
    status: issues.length ? 'failed' : 'healthy',
    mode: staticOnly ? 'static' : 'local',
    source: sourceIntegrated ? 'source_integrated' : 'installed_snapshot',
    ciActive: false,
    ciVerification: 'remote_merge_and_run_not_verified',
    hooks,
    ci,
    issues,
  };
}
async function runTests(ctx) {
  const files = ctx.c.testSuites.map((p) => locate(ctx.root, ctx.c, ctx.config, p));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_REPORTER;
  // Fixtures Git não podem herdar o índice/working tree do hook chamador.
  for (const key of (await git(ctx.root, ['rev-parse', '--local-env-vars'])).stdout
    .trim()
    .split(/\r?\n/))
    delete env[key];
  return execute([process.execPath, '--test', '--test-concurrency=1', ...files], {
    cwd: ctx.root,
    timeout: ctx.c.timeoutMs || 300000,
    env,
  });
}
function adapter(ctx, key) {
  const result = [...ctx.c[key]];
  result[1] = locate(ctx.root, ctx.c, ctx.config, result[1]);
  return result;
}
async function graph(ctx, args) {
  const action = args[0] || 'status';
  const mapped = { doctor: 'status', build: 'ensure', update: 'ensure' }[action] || action;
  if (!['install', 'status', 'mark', 'ensure', 'query', 'path', 'explain'].includes(mapped))
    throw usage('subcomando graph desconhecido');
  return execute(
    [
      ...adapter(ctx, 'graph'),
      mapped,
      ...args.slice(1),
      '--root',
      ctx.root,
      '--config',
      locate(ctx.root, ctx.c, ctx.config, ctx.c.graphConfig),
    ],
    { cwd: ctx.root, timeout: ctx.c.timeoutMs || 300000 }
  );
}
async function motor(ctx, mode, ref) {
  return execute(
    [
      ...adapter(ctx, 'motor'),
      mode,
      '--root',
      ctx.root,
      '--ref',
      ref,
      ...(ctx.c.motorConfig
        ? ['--config', locate(ctx.root, ctx.c, ctx.config, ctx.c.motorConfig)]
        : []),
    ],
    { cwd: ctx.root, timeout: ctx.c.timeoutMs || 300000 }
  );
}

function excludeIdentity(path, fd) {
  const opened = fstatSync(fd),
    current = lstatSync(path);
  if (
    !opened.isFile() ||
    opened.nlink !== 1 ||
    current.isSymbolicLink() ||
    current.dev !== opened.dev ||
    current.ino !== opened.ino
  )
    throw fail('info/exclude mudou de identidade; alteração recusada');
}
function excludeFlags(append) {
  if (typeof constants.O_NOFOLLOW !== 'number')
    throw fail('O_NOFOLLOW indisponível; alteração de info/exclude bloqueada');
  return (
    constants.O_RDWR |
    constants.O_NOFOLLOW |
    constants.O_NONBLOCK |
    (append ? constants.O_APPEND | constants.O_CREAT : 0)
  );
}
export function appendExclude(path, beforeAppend = () => {}) {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, excludeFlags(true), 0o600);
  try {
    excludeIdentity(path, fd);
    const contents = readFileSync(fd, 'utf8');
    const addition = contents.includes('/.tools/repo-automation/')
      ? ''
      : `${contents.endsWith('\n') || !contents ? '' : '\n'}# repo-automation local bridge\n/.tools/repo-automation/\n`;
    beforeAppend(addition);
    excludeIdentity(path, fd);
    if (addition) {
      const data = Buffer.from(addition);
      if (writeSync(fd, data, 0, data.length, null) !== data.length)
        throw fail('append incompleto em info/exclude');
      excludeIdentity(path, fd);
    }
    return addition;
  } finally {
    closeSync(fd);
  }
}
export function removeExclude(path, addition) {
  if (!addition) return false;
  let fd;
  try {
    fd = openSync(path, excludeFlags(false));
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  try {
    excludeIdentity(path, fd);
    const contents = readFileSync(fd),
      block = Buffer.from(addition),
      offset = contents.indexOf(block);
    if (offset < 0) return false;
    excludeIdentity(path, fd);
    const current = Buffer.alloc(block.length);
    if (readSync(fd, current, 0, current.length, offset) !== block.length || !current.equals(block))
      throw fail('bloco próprio de info/exclude mudou; remoção recusada');
    // Não trunque: um append concorrente deve sobreviver à reversão.
    const blank = Buffer.from(block.map((byte) => (byte === 10 || byte === 13 ? byte : 32)));
    if (writeSync(fd, blank, 0, blank.length, offset) !== blank.length)
      throw fail('remoção incompleta de bloco próprio');
    excludeIdentity(path, fd);
    return true;
  } finally {
    closeSync(fd);
  }
}

// install/uninstall alteram state.json, info/exclude e core.hooksPath: duas execuções
// simultâneas perdiam o bloco de exclude do estado. Trava por worktree, falha rápida.
async function withLock(ctx, fn) {
  const gitDir = resolve(ctx.root, (await git(ctx.root, ['rev-parse', '--git-dir'])).stdout.trim());
  const lock = join(gitDir, 'repo-automation.lock');
  for (let attempt = 0; ; attempt++) {
    // link() é atômico: o lock nunca aparece sem o pid dentro.
    const temp = lock + '.' + randomUUID();
    writeFileSync(temp, String(process.pid), { mode: 0o600 });
    try {
      linkSync(temp, lock);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    } finally {
      rmSync(temp, { force: true });
    }
    let alive = true;
    try {
      process.kill(Number(readFileSync(lock, 'utf8')), 0);
    } catch (e) {
      alive = e.code === 'EPERM';
    }
    if (alive || attempt > 0)
      throw fail('install/uninstall-hooks já em andamento neste repositório; aguarde e repita');
    rmSync(lock, { force: true }); // dono morreu: lock obsoleto
  }
  try {
    return await fn();
  } finally {
    rmSync(lock, { force: true });
  }
}

async function install(ctx) {
  const { root, c, config } = ctx;
  const base = join(root, '.tools/repo-automation'),
    hooks = join(base, 'hooks'),
    stateFile = join(base, 'state.json');
  for (const path of [base, hooks, join(base, 'runtime')])
    if (existsSync(path) && lstatSync(path).isSymbolicLink())
      throw fail('diretório da ponte não pode ser symlink');
  const tracked = (await git(root, ['ls-files', '-z', '--', '.tools/repo-automation'])).stdout;
  if (tracked) throw fail('diretório da ponte contém arquivos rastreados');
  const effective = (await git(root, ['config', '--get', 'core.hooksPath'], [0, 1])).stdout.trim();
  let state;
  if (existsSync(stateFile)) {
    state = json(stateFile);
    if (
      state.root !== root ||
      state.hooks !== hooks ||
      ![hooks, state.previousEffective || ''].includes(effective)
    )
      throw fail('estado/ configuração de hooks mudou; instalação recusada');
    for (const [path, hash] of Object.entries(state.files || {})) {
      const target = resolve(base, path);
      if (
        !within(base, target) ||
        (existsSync(target) && (lstatSync(target).isSymbolicLink() || digest(target) !== hash))
      )
        throw fail('ponte alterada por terceiro; reinstalação recusada');
    }
  } else {
    if (existsSync(base) && nonempty(base))
      throw fail('diretório da ponte contém arquivos sem estado de propriedade');
    if (effective === hooks) throw fail('hooksPath aponta à ponte sem estado de restauração');
    const previousLocal = (
      await git(root, ['config', '--local', '--get-all', 'core.hooksPath'], [0, 1])
    ).stdout
      .split('\n')
      .filter(Boolean);
    const effectivePath = (
      await git(root, ['config', '--path', '--get', 'core.hooksPath'], [0, 1])
    ).stdout.trim();
    const defaultHooks = (await git(root, ['rev-parse', '--git-path', 'hooks'])).stdout.trim();
    const exclude = resolve(
      root,
      (await git(root, ['rev-parse', '--git-path', 'info/exclude'])).stdout.trim()
    );
    state = {
      version: 1,
      id: randomUUID(),
      root,
      hooks,
      previousLocal,
      previousEffective: effective,
      previousPath: effectivePath || resolve(root, defaultHooks),
      common: realpathSync(
        resolve(root, (await git(root, ['rev-parse', '--git-common-dir'])).stdout.trim())
      ),
      exclude,
      addition: '',
    };
    mkdirSync(base, { recursive: true, mode: 0o700 });
    chmodSync(base, 0o700);
    appendExclude(exclude, (addition) => {
      state.addition = addition;
      atomic(stateFile, JSON.stringify(state, null, 2));
    });
  }
  mkdirSync(hooks, { recursive: true });
  const script = locate(root, c, config, c.entrypoint);
  const quote = (s) => "'" + s.replace(/'/g, "'\\''") + "'";
  atomic(join(base, 'runtime/automation.mjs'), readFileSync(script));
  atomic(join(base, 'runtime/automation.config.json'), JSON.stringify(c));
  for (const event of EVENTS) {
    const configArg = within(root, config)
      ? '"$repo_root"/' + quote(relative(root, config))
      : quote(config);
    const scriptArg = within(root, script)
      ? '"$repo_root"/' + quote(relative(root, script))
      : quote(script);
    const body = `#!/bin/sh\nrepo_root=$(git rev-parse --show-toplevel) || exit 1\nscript=${scriptArg}\nconfig=${configArg}\n[ -f "$script" ] || script=${quote(join(base, 'runtime/automation.mjs'))}\n[ -f "$config" ] || config=${quote(join(base, 'runtime/automation.config.json'))}\nexec ${quote(process.execPath)} "$script" --root "$repo_root" --config "$config" hook ${quote(event)} -- "$@"\n`;
    atomic(join(hooks, event), body, 0o700);
  }
  state.files = Object.fromEntries(
    [
      ...EVENTS.map((e) => 'hooks/' + e),
      'runtime/automation.mjs',
      'runtime/automation.config.json',
    ].map((p) => [p, digest(join(base, p))])
  );
  atomic(stateFile, JSON.stringify(state, null, 2));
  await git(root, ['config', '--local', 'core.hooksPath', hooks]);
  return {
    ok: true,
    status: 'installed',
    hooks,
    previousHooksPath: state.previousEffective || '(Git default)',
  };
}
async function uninstall(ctx) {
  const stateFile = join(ctx.root, '.tools/repo-automation/state.json');
  if (!existsSync(stateFile)) return { ok: true, status: 'not_installed' };
  const state = json(stateFile),
    expected = join(ctx.root, '.tools/repo-automation/hooks');
  if (state.root !== ctx.root || state.hooks !== expected || !Array.isArray(state.previousLocal))
    throw fail('estado de hooks inválido');
  for (const path of [dirname(expected), expected, join(dirname(expected), 'runtime')])
    if (existsSync(path) && lstatSync(path).isSymbolicLink())
      throw fail('diretório da ponte alterado para symlink; restauração recusada');
  const effective = (
    await git(ctx.root, ['config', '--get', 'core.hooksPath'], [0, 1])
  ).stdout.trim();
  if (effective !== expected)
    throw fail('hooksPath foi alterado por terceiro; restauração recusada');
  for (const [path, hash] of Object.entries(state.files || {})) {
    const target = resolve(dirname(expected), path);
    if (
      !within(dirname(expected), target) ||
      (existsSync(target) && (lstatSync(target).isSymbolicLink() || digest(target) !== hash))
    )
      throw fail('arquivo da ponte alterado por terceiro; desinstalação recusada');
  }
  removeExclude(state.exclude, state.addition);
  await git(ctx.root, ['config', '--local', '--unset-all', 'core.hooksPath'], [0, 5]);
  for (const value of state.previousLocal)
    await git(ctx.root, ['config', '--local', '--add', 'core.hooksPath', value]);
  // Remove somente os arquivos conhecidos criados por esta instalação.
  for (const event of EVENTS) rmSync(join(expected, event), { force: true });
  for (const file of ['runtime/automation.mjs', 'runtime/automation.config.json'])
    rmSync(join(dirname(expected), file), { force: true });
  rmSync(stateFile);
  return { ok: true, status: 'uninstalled' };
}
async function hook(ctx, args) {
  const event = args[0];
  if (!EVENTS.includes(event)) throw usage('evento Git desconhecido');
  const savedPath = await statePath(ctx.root);
  if (!existsSync(savedPath)) throw fail('ponte sem estado instalado');
  const state = json(savedPath);
  const common = realpathSync(
    resolve(ctx.root, (await git(ctx.root, ['rev-parse', '--git-common-dir'])).stdout.trim())
  );
  if (state.common !== common) throw fail('estado pertence a outro repositório');
  if (process.env.REPO_AUTOMATION_CHAINING === state.id + ':' + event)
    throw fail('recursão de hook recusada');
  let original = isAbsolute(state.previousPath)
      ? join(state.previousPath, event)
      : resolve(ctx.root, state.previousPath, event),
    viaSh = false;
  if (
    /(?:^|[\\/])\.husky[\\/]_$/.test(state.previousPath) &&
    (!existsSync(original) || !existsSync(join(dirname(original), 'h')))
  ) {
    original = join(ctx.root, '.husky', event);
    viaSh = true;
  }
  if (existsSync(original) && (viaSh || statSync(original).mode & 0o111)) {
    if (within(realpathSync(state.hooks), realpathSync(original)))
      throw fail('hook original recursivo');
    const r = await execute([...(viaSh ? ['sh', '-e'] : []), original, ...args.slice(1)], {
      cwd: ctx.root,
      timeout: ctx.c.timeoutMs || 300000,
      env: { ...process.env, REPO_AUTOMATION_CHAINING: state.id + ':' + event },
    });
    if (r.code !== 0) return { ...r, status: 'original_hook_failed' };
  }
  if (event === 'pre-push') {
    const health = await doctor(ctx, false);
    if (!health.ok) {
      console.error(JSON.stringify(health));
      return { code: 1, status: 'doctor_failed' };
    }
    return runTests(ctx);
  }
  if (event === 'pre-commit') {
    const files = (
      await git(ctx.root, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRD'])
    ).stdout
      .split('\0')
      .filter(Boolean);
    const tooling = ctx.c.toolingPatterns || [
      'scripts/**',
      '.github/**',
      '.husky/**',
      'package.json',
      '*lock*',
      'graphify.local.json',
    ];
    if (files.some((f) => tooling.some((g) => pattern(g).test(f)))) {
      const r = await runTests(ctx);
      if (r.code !== 0) return r;
    }
    const sources = ctx.c.sourcePatterns || ['src/**'];
    if (files.some((f) => sources.some((g) => pattern(g).test(f)))) return graph(ctx, ['mark']);
  }
  if (['post-commit', 'post-merge', 'post-checkout'].includes(event)) return graph(ctx, ['mark']);
  return { code: 0, status: 'hook_chained' };
}

function loadConfig(path) {
  try {
    return json(path);
  } catch (e) {
    throw fail(
      e.code === 'ENOENT' ? `config ausente: ${path}` : `config ilegível (${path}): ${e.message}`
    );
  }
}

export async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }
  const c = opts.action === 'uninstall-hooks' ? null : validateConfig(loadConfig(opts.config));
  const root = (await git(opts.root, ['rev-parse', '--show-toplevel'])).stdout.trim();
    const normalize = (p) => realpathSync.native(p).toLowerCase().replace(/[\\/]+$/, '');
    if (normalize(root) !== normalize(opts.root))
      throw fail('--root deve ser a raiz do repositório');
  const ctx = { root: opts.root, config: opts.config, c };
  if (opts.action === 'doctor') {
    const r = await doctor(ctx, opts.staticOnly);
    console.log(JSON.stringify(r));
    return r.ok ? 0 : 1;
  }
  if (opts.action === 'test') return (await runTests(ctx)).code;
  if (opts.action === 'graph') return (await graph(ctx, opts.positional)).code;
  if (['check', 'heal'].includes(opts.action))
    return (await motor(ctx, opts.action, opts.ref)).code;
  if (opts.action === 'hook') return (await hook(ctx, opts.positional)).code;
  if (opts.action === 'nightly') {
    const results = {};
    for (const [name, action] of [
      ['graph', () => graph(ctx, ['ensure'])],
      ['heal', () => motor(ctx, 'heal', opts.ref)],
    ]) {
      try {
        results[name] = await action();
      } catch (e) {
        results[name] = { code: 1, error: e.message };
      }
    }
    console.log(
      JSON.stringify({
        status: Object.values(results).every((r) => r.code === 0) ? 'completed' : 'failed',
        results,
      })
    );
    return Object.values(results).every((r) => r.code === 0) ? 0 : 1;
  }
  if (opts.action === 'install-hooks') {
    const health = await doctor(ctx, true);
    if (!health.ok) throw fail('instalação bloqueada: ' + health.issues.join('; '));
  }
  const r = await withLock(ctx, () =>
    opts.action === 'install-hooks' ? install(ctx) : uninstall(ctx)
  );
  console.log(JSON.stringify(r));
  return 0;
}

// import.meta.url já vem com symlinks resolvidos; argv[1] não. Sem realpath, execução via
// symlink ou diretório linkado saía 0 sem fazer nada (hooks e CI passavam em silêncio).
const invoked = (() => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(SELF);
  } catch {
    return resolve(process.argv[1]) === SELF;
  }
})();
if (invoked) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'failed', error: error.message }));
    process.exitCode = Number.isInteger(error.code) ? error.code : 1;
  }
}
