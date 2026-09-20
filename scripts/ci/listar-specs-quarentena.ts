/**
 * Imprime, uma por linha, as specs E2E que NÃO são cobertas por nenhum gate
 * bloqueante — isto é, a quarentena.
 *
 * Por que derivar em vez de listar: até a Etapa 31 o workflow trazia a lista de
 * exclusões cravada no YAML (`login|admin-rbac|visual-theme|logout-real`). Duas
 * listas descrevendo o mesmo fato divergem, e a direção perigosa da divergência
 * é silenciosa: basta remover uma spec do `testMatch` de um config bloqueante e
 * esquecer o YAML para que ela deixe de rodar em QUALQUER job — some do gate e
 * some da quarentena ao mesmo tempo, sem um único sinal vermelho. Lendo o
 * `testMatch` dos próprios configs, a exclusão passa a ser consequência da
 * cobertura, e não uma segunda afirmação sobre ela.
 *
 * Uso: `bun run scripts/ci/listar-specs-quarentena.ts`
 *   stdout → lista da quarentena (consumida pelo CI)
 *   stderr → diagnóstico legível
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Configs que bloqueiam merge. Adicionar um aqui basta: a exclusão vem junto. */
const CONFIGS_BLOQUEANTES = [
  'playwright.critical.config.ts',
  'playwright.destructive.config.ts',
  'playwright.financeiro.config.ts',
];

interface ConfigParcial {
  testDir?: string;
  testMatch?: string | RegExp | Array<string | RegExp>;
  testIgnore?: string | RegExp | Array<string | RegExp>;
}

/**
 * Glob → RegExp ancorada. Cobre o vocabulário que os configs usam de fato
 * (`**` atravessando diretórios, `*` dentro de um segmento, `?`), e nada além
 * disso: um glob com chaves ou classes passaria a casar errado em silêncio, e
 * por isso é rejeitado em vez de aproximado.
 */
function globParaRegExp(glob: string): RegExp {
  if (/[{}[\]()!+@]/.test(glob)) {
    throw new Error(`Glob com sintaxe não suportada por este script: ${glob}`);
  }
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // `**/` consome zero ou mais diretórios; `**` solto vira "qualquer coisa".
        if (glob[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '.') {
      re += '\\.';
    } else {
      re += c.replace(/[\\^$|]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

function comoLista(v: ConfigParcial['testMatch']): Array<string | RegExp> {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function casa(caminho: string, padrao: string | RegExp): boolean {
  return padrao instanceof RegExp ? padrao.test(caminho) : globParaRegExp(padrao).test(caminho);
}

function specsEmDisco(dir: string): string[] {
  const achadas: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) achadas.push(...specsEmDisco(caminho));
    else if (entrada.endsWith('.e2e.ts')) achadas.push(caminho);
  }
  return achadas;
}

function morrer(msg: string): never {
  console.error(`::error::${msg}`);
  process.exit(1);
}

async function main() {
  // `git ls-files` é a fonte da verdade porque só o que está versionado chega
  // ao runner; o disco entra logo abaixo como conferência cruzada.
  const rastreadas = execFileSync('git', ['ls-files', '--', 'e2e/*.e2e.ts'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .sort();

  const emDisco = specsEmDisco('e2e').sort();
  if (rastreadas.length !== emDisco.length) {
    // Só checar "> 0" foi exatamente o que deixou um pathspec quebrado passar
    // despercebido antes: havia 5 specs de 26 e o job reportava sucesso.
    morrer(
      `Descoberta de specs inconsistente: git=${rastreadas.length} vs disco=${emDisco.length}. ` +
        `Specs não rastreadas ou pathspec quebrado. Diferença: ` +
        emDisco.filter((s) => !rastreadas.includes(s)).join(', ')
    );
  }

  const cobertas = new Set<string>();
  for (const caminhoConfig of CONFIGS_BLOQUEANTES) {
    // Resolvido contra a raiz do repo, não contra este arquivo: um import
    // relativo aqui procuraria os configs dentro de `scripts/ci/`.
    const mod = (await import(pathToFileURL(resolve(caminhoConfig)).href)) as {
      default: ConfigParcial;
    };
    const cfg = mod.default;
    const padroes = comoLista(cfg.testMatch);
    const ignorados = comoLista(cfg.testIgnore);
    if (padroes.length === 0) {
      morrer(`${caminhoConfig} não declara testMatch — cobertura indeterminável.`);
    }

    const doConfig: string[] = [];
    for (const padrao of padroes) {
      const casadas = rastreadas.filter(
        (s) => casa(s, padrao) && !ignorados.some((ig) => casa(s, ig))
      );
      if (casadas.length === 0) {
        // Um `testMatch` que não casa nada é um gate verde que não testa nada:
        // o modo de falha mais caro do CI inteiro. Renomear uma spec sem
        // atualizar o config cai aqui.
        morrer(
          `${caminhoConfig}: o padrão ${String(padrao)} não casa nenhuma spec versionada. ` +
            `Spec renomeada, movida ou removida sem atualizar o config?`
        );
      }
      doConfig.push(...casadas);
    }
    for (const s of doConfig) cobertas.add(s);
    console.error(`[gate] ${caminhoConfig}: ${new Set(doConfig).size} spec(s)`);
  }

  const quarentena = rastreadas.filter((s) => !cobertas.has(s));
  if (quarentena.length === 0) {
    morrer(
      'Nenhuma spec elegível para a quarentena E2E — lista vazia é sinal de erro, não de sucesso.'
    );
  }

  console.error(
    `[quarentena] ${quarentena.length} de ${rastreadas.length} spec(s) fora dos gates bloqueantes`
  );
  process.stdout.write(quarentena.join('\n') + '\n');
}

void main();
