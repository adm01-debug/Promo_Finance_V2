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
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
// Pastas que o fecho de imports segue sem gastar salto (codigo da propria pagina e infraestrutura).
const PASTAS_LIVRES = ['src/hooks', 'src/lib', 'src/contexts', 'src/integrations'];

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();

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
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
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
export function extrairChamadas(texto) {
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
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => a.nome.localeCompare(b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/** URLs do react-router em src/App.tsx. */
export function lerUrls(raiz) {
  const texto = ler(raiz, ARQUIVO_ROTAS);
  const abs = path.join(raiz, ARQUIVO_ROTAS);
  const lazy = Object.fromEntries([...texto.matchAll(/const\s+(\w+)\s*=\s*lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map((m) => [m[1], m[2]]));
  const corpo = texto.slice(texto.indexOf('<Routes>'), texto.lastIndexOf('</Routes>'));
  return corpo.split(/<Route\b/).slice(1).map((pedaco) => {
    const caminho = (pedaco.match(/path(?:=|:\s*)["']([^"']+)["']/) || [])[1];
    const redireciona = (pedaco.match(/<Navigate\s+to=["']([^"']+)["']/) || [])[1] ?? null;
    const componente = [...pedaco.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1])
      .find((n) => !['ProtectedRoute', 'Navigate', 'Route', 'Suspense', 'ErrorBoundary'].includes(n)) ?? null;
    const papeis = ((pedaco.match(/requiredRoles=\{\[([^\]]*)\]\}/) || [])[1] || '')
      .match(/['"]([^'"]+)['"]/g)?.map((s) => s.slice(1, -1)) ?? [];
    const alvo = componente && lazy[componente] ? resolverImport(raiz, abs, lazy[componente]) : null;
    return {
      caminho,
      componente,
      arquivo: alvo ? rel(raiz, alvo) : null,
      protegida: pedaco.includes('<ProtectedRoute'),
      papeis,
      redireciona,
    };
  }).filter((u) => u.caminho).sort((a, b) => a.caminho.localeCompare(b.caminho));
}

/**
 * Itens do menu lateral: href -> { rotulo, grupo, grupo_id, destaque, badge, secao, arquivo }.
 * Le os grupos declarados nos arquivos de ARQUIVOS_MENU. Para cada `href`, o rotulo e o `label`
 * mais proximo antes dele (mesmo objeto) e o grupo e o ultimo `{ id, label }` de grupo aberto antes.
 */
export function lerMenu(raiz) {
  const menu = {};
  for (const arquivoMenu of ARQUIVOS_MENU) {
    const texto = ler(raiz, arquivoMenu);
    const grupos = [...texto.matchAll(/id:\s*'([^']+)',\s*\n\s*label:\s*'([^']+)'/g)]
      .map((m) => ({ id: m[1], label: m[2], pos: m.index }));
    for (const m of texto.matchAll(/href:\s*'([^']+)'/g)) {
      const antes = texto.slice(0, m.index);
      const rotulo = [...antes.matchAll(/label:\s*'([^']+)'/g)].pop()?.[1] ?? null;
      const grupo = grupos.filter((g) => g.pos < m.index).pop() ?? null;
      // Bloco do item: do `{` que o abre ate o `}` depois do href, para ler as flags.
      const item = texto.slice(antes.lastIndexOf('{'), texto.indexOf('}', m.index) + 1);
      const href = m[1];
      if (menu[href]) continue; // primeiro item ganha; duplicata entra em `problemas`
      menu[href] = {
        rotulo,
        grupo: grupo?.label ?? null,
        grupo_id: grupo?.id ?? null,
        destaque: /highlight:\s*true/.test(item),
        badge: (item.match(/badgeKey:\s*'([^']+)'/) || [])[1] ?? null,
        secao: (item.match(/sectionHeader:\s*'([^']+)'/) || [])[1] ?? null,
        arquivo: arquivoMenu,
      };
    }
  }
  return menu;
}

/** Caminho da URL sem hash nem query (o menu usa `/rota#ancora`). */
export const semAncora = (href) => String(href).split(/[#?]/)[0] || '/';

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const urlsBase = lerUrls(raiz);
  const menu = lerMenu(raiz);
  const porCaminho = new Map(urlsBase.map((u) => [u.caminho, u]));

  const urls = urlsBase.map((u) => ({
    ...u,
    menu: Object.entries(menu)
      .filter(([href]) => semAncora(href) === u.caminho)
      .map(([href, item]) => ({ href, ...item }))
      .sort((a, b) => a.href.localeCompare(b.href)),
    ...(u.arquivo
      ? fechoDaRota(raiz, path.join(raiz, u.arquivo))
      : { arquivos_lidos: 0, hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] }),
  }));

  const hooks = {};
  for (const u of urls) for (const h of u.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(u.caminho);
  }

  const problemas = [
    ...Object.keys(menu).filter((href) => !porCaminho.has(semAncora(href))).sort()
      .map((href) => ({ tipo: 'menu_sem_rota', id: href, detalhe: `item "${menu[href].rotulo}" aponta para ${href}, sem <Route path> correspondente em ${ARQUIVO_ROTAS}` })),
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

function main(argv) {
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
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.urls} URLs (${r.urls_protegidas} protegidas), ${r.itens_de_menu} itens de menu, `
    + `${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
