#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o codigo, nao documentacao:
 *  - URLs:  src/App.tsx (path, componente lazy, ProtectedRoute/requiredRoles, Navigate)
 *  - Menu:  src/components/layout/sidebar/SidebarNavGroups.tsx e sidebarFiscalNavGroup.ts
 *           (rotulo, grupo, destaque, badge, cabecalho de secao)
 *  - Para cada rota: segue os imports a partir do arquivo da pagina (mesma pasta, src/hooks/,
 *    src/lib/, src/contexts/, src/integrations/) e lista hooks, edge functions invocadas, RPCs,
 *    tabelas (.from e /rest/v1) e buckets de storage (storage.from).
 *  - `problemas`: item de menu sem rota, rota protegida sem item de menu, rota sem arquivo e
 *    import local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo publicado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const ARQUIVO_ROTAS = 'src/App.tsx';
const ARQUIVOS_MENU = [
  'src/components/layout/sidebar/SidebarNavGroups.tsx',
  'src/components/layout/sidebar/sidebarFiscalNavGroup.ts',
];
// .ts antes de .tsx, como o TS e o Vite resolvem (src/hooks tem usePrefetchRoutes.ts e .tsx).
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
// Pastas que o fecho de imports segue sem gastar salto (codigo da propria pagina e infraestrutura).
const PASTAS_LIVRES = ['src/hooks', 'src/lib', 'src/contexts', 'src/integrations'];

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();
// Ordem por code point, igual em qualquer maquina: localeCompare depende da versao do ICU do Node.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Texto sem comentarios (de linha e de bloco, inclusive o de bloco dentro de chaves do JSX), com o
 * mesmo comprimento e as mesmas quebras de linha. Pula string/template para nao confundir `'http://x'` com comentario;
 * aspas simples/duplas nao atravessam linha (apostrofo em texto JSX nao desalinha o resto do arquivo).
 * Sem isto, `// <Route path="/velha" ...>` ou `// import x from './sumiu'` viravam rota/import reais.
 */
export function semComentarios(texto) {
  const partes = [];
  const n = texto.length;
  let ini = 0;
  let i = 0;
  while (i < n) {
    const c = texto[i];
    if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < n && texto[i] !== c) {
        if (texto[i] === '\\') i++;
        else if (c !== '`' && texto[i] === '\n') break;
        i++;
      }
      i++;
    } else if (c === '/' && texto[i + 1] === '/') {
      const fim = texto.indexOf('\n', i);
      const f = fim === -1 ? n : fim;
      partes.push(texto.slice(ini, i), ' '.repeat(f - i));
      i = ini = f;
    } else if (c === '/' && texto[i + 1] === '*') {
      const fim = texto.indexOf('*/', i + 2);
      const f = fim === -1 ? n : fim + 2;
      partes.push(texto.slice(ini, i), texto.slice(i, f).replace(/[^\n]/g, ' '));
      i = ini = f;
    } else i++;
  }
  partes.push(texto.slice(ini));
  return partes.join('');
}

/** Resolve um especificador de import para um arquivo do repo (null = externo, undefined = local inexistente). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined;
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos e import() dinamico). */
export function extrairImports(bruto) {
  const texto = semComentarios(bruto);
  const out = [];
  // `[^'";]*?`: a lista de nomes nao atravessa o fim de outro import (`import './a.css';` seguido de
  // `import type { T } from 'x'` fazia o de tipo passar por import de valor).
  for (const m of texto.matchAll(/\bimport\s+(type\s+)?([^'";]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` de nivel de modulo. So resolve o caso mais comum:
 * identificador passado direto para `.from`/`storage.from`/`rpc`/`invoke` que e, no mesmo arquivo,
 * uma constante de string. Nao resolve parametro de funcao nem ternario. Conta profundidade de
 * chaves linha a linha e so aceita o `const` em profundidade zero (nivel de modulo de verdade).
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade++;
      else if (ch === '}') profundidade--;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from` do cliente e `/rest/v1/<tabela>`), buckets
 * (`storage.from`), RPCs (`.rpc`) e edges (`functions.invoke`, `invokeEdge`, `/functions/v1/<edge>`).
 */
export function extrairChamadas(bruto) {
  const texto = semComentarios(bruto);
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    // `functions.invoke` (inclusive quebrado em linha), o atalho `invokeEdge<T>(...)` e a chamada
    // direta pela URL dentro de string/template.
    edges: [
      ...pegar(/(?:functions\s*\.\s*invoke|\binvokeEdge)(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.)/.test(p);

/**
 * Fecho de imports a partir do arquivo da pagina. Segue sem limite a pasta da propria pagina e as
 * pastas de PASTAS_LIVRES; componentes em src/components/ (fora do kit src/components/ui/) entram
 * ate MAX_SALTOS saltos. Teste fica de fora. Import local que nao resolve vira problema.
 */
export const MAX_SALTOS = 2;
export function fechoDaRota(raiz, arquivoPaginaAbs) {
  const pastaPagina = path.dirname(arquivoPaginaAbs);
  const dentro = (abs, rel_) => abs.startsWith(path.join(raiz, rel_) + path.sep);
  const livre = (abs) => abs.startsWith(pastaPagina + path.sep) || PASTAS_LIVRES.some((d) => dentro(abs, d));
  const componente = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map();
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoPaginaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (componente(alvo) && saltos < MAX_SALTOS) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => cmp(a.nome, b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/** Fim da tag de abertura que comeca em `ini` (logo apos `<Route`): posicao do `>` e se fecha em `/>`. */
function fimDaTag(texto, ini) {
  let prof = 0;
  for (let i = ini; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < texto.length && texto[i] !== c; i++) {
        if (texto[i] === '\\') i++;
        else if (c !== '`' && texto[i] === '\n') break;
      }
    } else if (c === '{') prof++;
    else if (c === '}') prof--;
    else if (c === '>' && prof <= 0) return { fim: i, autoFecha: /\/\s*$/.test(texto.slice(ini, i)) };
  }
  return { fim: texto.length, autoFecha: true };
}

/** Atributos de nivel zero de uma tag: nome -> texto cru do valor (`"/x"`, `{...}`) ou `true`. */
function atributosDaTag(props) {
  const attrs = new Map();
  const n = props.length;
  let i = 0;
  const pular = (abre, fecha) => { // balanceia {..}; strings dentro das chaves nao contam chaves
    let prof = 0;
    const ini = i;
    for (; i < n; i++) {
      const c = props[i];
      if (c === '"' || c === "'" || c === '`') {
        for (i++; i < n && props[i] !== c; i++) if (props[i] === '\\') i++;
      } else if (c === abre) prof++;
      else if (c === fecha && --prof === 0) { i++; break; }
    }
    return props.slice(ini, i);
  };
  while (i < n) {
    if (props[i] === '{') { pular('{', '}'); continue; } // {...spread}
    const nome = /^[A-Za-z_][\w:.-]*/.exec(props.slice(i));
    if (!nome) { i++; continue; }
    i += nome[0].length;
    const resto = /^\s*=\s*/.exec(props.slice(i));
    if (!resto) { attrs.set(nome[0], true); continue; }
    i += resto[0].length;
    const c = props[i];
    if (c === '"' || c === "'") {
      const fim = props.indexOf(c, i + 1);
      const f = fim === -1 ? n : fim + 1;
      attrs.set(nome[0], props.slice(i, f));
      i = f;
    } else if (c === '{') attrs.set(nome[0], pular('{', '}'));
    else attrs.set(nome[0], '');
  }
  return attrs;
}

/** Literal de string de um valor de atributo (`"/x"`, `{'/x'}`, `{"/x"}`); null se for expressao. */
function literalDoAtributo(valor) {
  if (typeof valor !== 'string') return null;
  const cru = valor.trim().replace(/^\{\s*([\s\S]*?)\s*\}$/, '$1');
  const m = /^(["'`])([^"'`\\]*)\1$/.exec(cru);
  return m && !cru.includes('${') ? m[2] : null;
}

/** `/a` + `b` -> `/a/b`; caminho absoluto ou sem pai fica como esta. */
function juntarCaminho(pai, filho) {
  if (filho.startsWith('/') || !pai) return filho;
  const junto = `${pai.replace(/\/+$/, '')}/${filho}`.replace(/\/{2,}/g, '/');
  return junto.length > 1 ? junto.replace(/\/+$/, '') : junto;
}

/**
 * Cada `<Route>` do trecho JSX (ja sem comentarios), com aninhamento: caminho relativo de rota filha
 * e rota `index` herdam o caminho do pai; rota de layout sem `path` so repassa o do pai.
 */
export function lerRoutesDoJsx(corpo) {
  const eventos = [];
  const re = /<Route(?![\w.-])|<\/Route\s*>/g;
  let m;
  while ((m = re.exec(corpo))) {
    if (m[0][1] === '/') eventos.push({ ini: m.index, fecha: true });
    else {
      const { fim, autoFecha } = fimDaTag(corpo, m.index + m[0].length);
      eventos.push({ ini: m.index, props: corpo.slice(m.index + m[0].length, fim), autoFecha });
      re.lastIndex = fim;
    }
  }
  const pilha = [];
  const rotas = [];
  eventos.forEach((ev, k) => {
    if (ev.fecha) { pilha.pop(); return; }
    const pedaco = corpo.slice(ev.ini, k + 1 < eventos.length ? eventos[k + 1].ini : corpo.length);
    const attrs = atributosDaTag(ev.props);
    const pai = pilha.at(-1) ?? '';
    const proprio = attrs.has('path') ? literalDoAtributo(attrs.get('path')) : null;
    const indice = attrs.has('index');
    let caminho;
    if (proprio !== null) caminho = juntarCaminho(pai, proprio);
    else if (indice) caminho = pai || '/';
    if (!ev.autoFecha) pilha.push(caminho ?? pai);
    rotas.push({ caminho, indice, pedaco });
  });
  return rotas;
}

/** URLs do react-router em src/App.tsx. */
export function lerUrls(raiz) {
  const texto = semComentarios(ler(raiz, ARQUIVO_ROTAS));
  const abs = path.join(raiz, ARQUIVO_ROTAS);
  // import de pagina: `lazy(() => import(..))` (tambem `React.lazy`, `lazyWithRetry`, `async () =>`)
  // e import estatico (`import Pagina from './pages/Pagina'`).
  const lazy = {};
  for (const m of texto.matchAll(/const\s+(\w+)\s*=\s*(?:React\s*\.\s*)?lazy\w*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*(?:\{\s*return\s+)?import\(\s*['"]([^'"]+)['"]\s*\)/g)) lazy[m[1]] = m[2];
  for (const imp of extrairImports(texto)) for (const nome of imp.nomes) lazy[nome] ??= imp.especificador;
  const ini = texto.search(/<Routes(?![\w.-])/);
  const fim = texto.lastIndexOf('</Routes>');
  if (ini === -1 || fim < ini) throw new Error(`${ARQUIVO_ROTAS} sem bloco <Routes>...</Routes>: o roteador mudou de lugar e o inventario nao tem o que ler.`);
  const urls = lerRoutesDoJsx(texto.slice(ini, fim)).map(({ caminho, indice, pedaco }) => {
    const redireciona = (pedaco.match(/<Navigate\s+to=\{?\s*["'`]([^"'`]+)["'`]/) || [])[1] ?? null;
    const componente = [...pedaco.matchAll(/<([A-Z]\w*)/g)].map((x) => x[1])
      .filter((n) => !['ProtectedRoute', 'Navigate', 'Route', 'Suspense', 'ErrorBoundary', 'MainLayout'].includes(n))
      .pop() ?? null;
    const papeis = ((pedaco.match(/requiredRoles=\{\[([^\]]*)\]\}/) || [])[1] || '')
      .match(/['"]([^'"]+)['"]/g)?.map((x) => x.slice(1, -1)) ?? [];
    const alvo = componente && lazy[componente] ? resolverImport(raiz, abs, lazy[componente]) : null;
    return {
      caminho,
      componente,
      arquivo: alvo ? rel(raiz, alvo) : null,
      protegida: pedaco.includes('<ProtectedRoute'),
      papeis,
      redireciona,
      ...(indice ? { indice: true } : {}),
    };
  }).filter((u) => u.caminho).sort((a, b) => cmp(a.caminho, b.caminho));
  if (urls.length === 0) throw new Error(`${ARQUIVO_ROTAS} tem <Routes> mas nenhuma <Route path>: inventario vazio recusado.`);
  return urls;
}

/**
 * Itens do menu lateral na ordem do codigo: { href, rotulo, grupo, grupo_id, destaque, badge, secao, arquivo }.
 * Para cada `href`, o rotulo e o `label` mais proximo antes dele (mesmo objeto) e o grupo e o ultimo
 * `{ id, label }` de grupo aberto antes. Aceita aspas simples e duplas (Prettier troca para duplas
 * quando o texto tem apostrofo).
 */
const STR = String.raw`(?:'([^']*)'|"([^"]*)")`;
const textoDe = (m) => (m ? (m[1] ?? m[2]) : null);
export function lerItensMenu(raiz) {
  const itens = [];
  for (const arquivoMenu of ARQUIVOS_MENU) {
    const texto = semComentarios(ler(raiz, arquivoMenu));
    const grupos = [...texto.matchAll(new RegExp(String.raw`\bid:\s*${STR}\s*,\s*label:\s*${STR}`, 'g'))]
      .map((m) => ({ id: m[1] ?? m[2], label: m[3] ?? m[4], pos: m.index }));
    const reLabel = new RegExp(String.raw`\blabel:\s*${STR}`, 'g');
    for (const m of texto.matchAll(new RegExp(String.raw`\bhref:\s*${STR}`, 'g'))) {
      const antes = texto.slice(0, m.index);
      const rotulo = textoDe([...antes.matchAll(reLabel)].pop());
      const grupo = grupos.filter((g) => g.pos < m.index).pop() ?? null;
      // Bloco do item: do `{` que o abre ate o `}` depois do href, para ler as flags.
      const item = texto.slice(antes.lastIndexOf('{'), texto.indexOf('}', m.index) + 1);
      itens.push({
        href: m[1] ?? m[2],
        rotulo,
        grupo: grupo?.label ?? null,
        grupo_id: grupo?.id ?? null,
        destaque: /\bhighlight:\s*true/.test(item),
        badge: textoDe(item.match(new RegExp(String.raw`\bbadgeKey:\s*${STR}`))),
        secao: textoDe(item.match(new RegExp(String.raw`\bsectionHeader:\s*${STR}`))),
        arquivo: arquivoMenu,
      });
    }
  }
  return itens;
}

/** href -> item do menu (o primeiro item ganha; as duplicatas saem em `problemas`). */
export function lerMenu(raiz) {
  const menu = {};
  for (const { href, ...item } of lerItensMenu(raiz)) menu[href] ??= item;
  return menu;
}

/** O caminho de uma rota (com `:param` e `*` final) casa com este caminho concreto? Devolve o numero de curingas ou null. */
export function casaRota(padrao, concreto) {
  if (padrao === '*' || padrao === '/*') return null; // 404 nao e destino de item de menu
  const p = padrao.split('/');
  const c = concreto.split('/');
  let curingas = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '*' && i === p.length - 1) return c.length >= i ? curingas + 1 : null;
    if (i >= c.length) return null;
    if (p[i].startsWith(':')) { if (!c[i]) return null; curingas++; } else if (p[i] !== c[i]) return null;
  }
  return p.length === c.length ? curingas : null;
}

/** Caminho da URL sem hash nem query (o menu usa `/rota#ancora`). */
export const semAncora = (href) => String(href).split(/[#?]/)[0] || '/';

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const urlsBase = lerUrls(raiz);
  const itensMenu = lerItensMenu(raiz);
  if (itensMenu.length === 0) throw new Error(`menu lateral sem nenhum href (${ARQUIVOS_MENU.join(', ')}): o formato mudou e o inventario do menu sairia vazio.`);
  const menu = lerMenu(raiz);
  const porCaminho = new Map();
  for (const u of urlsBase) if (!porCaminho.has(u.caminho)) porCaminho.set(u.caminho, u); // vale a primeira, como no react-router

  // Rota que atende o href do menu: a de caminho igual; senao a de `:param`/`*` com menos curingas.
  const rotaDoMenu = (href) => {
    const caminho = semAncora(href);
    if (porCaminho.has(caminho)) return caminho;
    let melhor = null;
    for (const c of porCaminho.keys()) {
      const curingas = casaRota(c, caminho);
      if (curingas !== null && (melhor === null || curingas < melhor.curingas)) melhor = { c, curingas };
    }
    return melhor?.c ?? null;
  };
  const destino = Object.fromEntries(Object.keys(menu).map((href) => [href, rotaDoMenu(href)]));

  const urls = urlsBase.map((u) => ({
    ...u,
    menu: Object.entries(menu)
      .filter(([href]) => destino[href] === u.caminho && porCaminho.get(u.caminho) === u)
      .map(([href, item]) => ({ href, ...item }))
      .sort((a, b) => cmp(a.href, b.href)),
    ...(u.arquivo
      ? fechoDaRota(raiz, path.join(raiz, u.arquivo))
      : { arquivos_lidos: 0, hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] }),
  }));

  const hooks = {};
  for (const u of urls) for (const h of u.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(u.caminho);
  }

  const repetidos = (lista) => [...new Set(lista.filter((x, i) => lista.indexOf(x) !== i))];
  const duplicadas = repetidos(urlsBase.filter((u) => !u.indice).map((u) => u.caminho)); // index + pai no mesmo caminho e normal
  const menuDuplicado = repetidos(itensMenu.map((i) => i.href));

  const problemas = [
    ...Object.keys(menu).filter((href) => destino[href] === null).sort(cmp)
      .map((href) => ({ tipo: 'menu_sem_rota', id: href, detalhe: `item "${menu[href].rotulo}" aponta para ${href}, sem <Route path> correspondente em ${ARQUIVO_ROTAS}` })),
    ...menuDuplicado.sort(cmp)
      .map((href) => ({ tipo: 'menu_duplicado', id: href, detalhe: `${href} aparece em mais de um item do menu; so o primeiro entra em "menu"` })),
    ...duplicadas.sort(cmp)
      .map((caminho) => ({ tipo: 'rota_duplicada', id: caminho, detalhe: `${caminho} declarado em mais de um <Route> em ${ARQUIVO_ROTAS}; vale o primeiro` })),
    ...urls.filter((u) => u.protegida && u.menu.length === 0 && !u.redireciona && !u.caminho.includes(':')).map((u) => ({
      tipo: 'rota_sem_menu', id: u.caminho, detalhe: 'rota protegida sem item no menu lateral: so acessivel por URL direta',
    })),
    ...urls.filter((u) => u.componente && !u.arquivo && !u.redireciona).map((u) => ({
      tipo: 'url_sem_arquivo', id: u.caminho, detalhe: `${u.componente} nao resolve em ${ARQUIVO_ROTAS}`,
    })),
    ...urls.flatMap((u) => u.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: u.caminho, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-rotas.mjs (le ${ARQUIVO_ROTAS}, ${ARQUIVOS_MENU.join(', ')} e os imports de cada pagina)`,
    resumo: {
      urls: urls.length,
      urls_protegidas: urls.filter((u) => u.protegida).length,
      itens_de_menu: Object.keys(menu).length,
      hooks_distintos: Object.keys(hooks).length,
      problemas: problemas.length,
    },
    urls,
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, rotas: unico(hooks[k].rotas) }])),
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

const USO = 'uso: node scripts/inventario/gerar-rotas.mjs [--check]\n'
  + '  sem flag: grava inventario/estado/rotas.json; --check: exit 1 se o arquivo gravado difere do codigo atual.\n';

/** Grava por arquivo temporario + rename: queda no meio nao deixa rotas.json truncado. */
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

function main(argv) {
  const invalidas = argv.filter((a) => a !== '--check' && a !== '--help' && a !== '-h');
  if (invalidas.length) {
    console.error(`ERRO: argumento desconhecido: ${invalidas.join(' ')}\n${USO}`);
    process.exit(2);
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USO);
    return;
  }
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e publique o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  gravarAtomico(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.urls} URLs (${r.urls_protegidas} protegidas), ${r.itens_de_menu} itens de menu, `
    + `${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

// realpath: process.argv[1] pode vir por symlink/caminho relativo; import.meta.url ja vem resolvido.
const executadoDireto = () => {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
};
if (executadoDireto()) {
  try {
    main(process.argv.slice(2));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
