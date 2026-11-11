# ai-context — contexto de código para agentes de IA

**O que faz:** `gerar.mjs` lê o repositório (zero dependências, Node ≥ 18) e escreve JSONs + `INDEX.md`
com rotas, menu, módulos, componentes, hooks, edge functions, banco (migrations/types), testes, CI, scripts,
convenções e baseline. Genérico: React/Next/Vue/Svelte/Nuxt/Remix/Astro, Express/Hono/Fastify/Nest,
FastAPI/Flask/Django, Supabase/Prisma/Drizzle/TypeORM/SQL. Saída determinística (só `manifest.json` tem data).

**Como rodar:** `node scripts/ai-context/gerar.mjs [--root <dir>] [--out <dir>] [--quiet] [--help]`
(padrão de saída `inventario/ia`, ou `ai-context.config.json → out`, ou env `AI_CONTEXT_DIR`).
Códigos de saída: `0` gerado · `1` falha ao gravar · `2` argumento inválido (flag desconhecida, `--out`/`--root`
sem valor, raiz inexistente; nada é escrito). Seção que falha não muda o código de saída: fica em
`manifest.json → erros` e no topo do `INDEX.md`. A ordenação não depende do locale da máquina (`LC_ALL`).
Testes: `node --test scripts/ai-context/gerar.unit.mjs` (32 testes). Cenários: `node scripts/ai-context/cenarios.mjs` (277).
O próprio job `codigo` do workflow roda a suíte antes de gerar.

**Config opcional** (`ai-context.config.json` na raiz): `out`, `skipDirs`, `srcDirs`, `menuFiles`,
`routeFiles`, `aliases`, `typesFile`, `maxFileMB`, `publicacao` (texto do rodapé do `INDEX.md` dizendo
onde o contexto é publicado neste repo; env `AI_CONTEXT_PUBLICACAO` tem precedência).

**Neste repo:** o workflow `.github/workflows/contexto.yml` roda o gerador a cada push em `main` e a cada
10 min e publica em `docs/contexto/codigo/` na branch `contexto` (índice único em `docs/contexto/00-INDEX.md`).
O passo `graphify update .` do repo de origem **não** é executado aqui (proibido por `AGENTS.md` §8), então
`grafo-graphify.json` sai vazio; o grafo próprio do repo continua em `graphify-out/` via `graphify.yml`.

**Secrets:** nenhum (lê só arquivos do repo e `git log`).

## Alcance dos alertas

- O schema reconstruído ignora os diretórios `_foreign/` e `_superseded/`: são histórico, não migrations
  vigentes. Os demais SQLs e diretórios de migrations continuam sendo considerados.
- Alertas de tabela/RPC/edge inexistente e o mapa de chamadores da aplicação excluem testes, stories e
  raízes de ferramentas/documentação (`scripts/`, `bin/`, `tools/`, `.github/`, `docs/`, `inventario/`,
  `analise/`, `examples/`, `samples/`, inclusive sob pacotes de monorepo). Esses arquivos continuam nos
  inventários próprios. Uma raiz desse tipo que contenha aplicação pode ser declarada em `srcDirs`.
- Comentários são removidos por um leitor que reconhece string, template e regex (`'src/**/*.ts'`,
  `accept="image/*"` e `` `${a}//${b}` `` não são comentário), e `import`/`export` escritos dentro de um literal
  (fixture de teste, mensagem de lint) não viram aresta nem export. Texto JSX não é interpretado: `/*` solto em
  texto de tela ainda é lido como comentário, e uma crase solta faz o arquivo cair na remoção por regex.
- Edge function conta como chamada por `functions.invoke('x')` (com ou sem `<Tipo>`, em uma ou várias linhas),
  URL `/functions/v1/x` e wrapper cujo nome contenha `invoke`/`edge` (ex.: `invokeEdge('x')`) quando `x` é uma
  pasta de função existente. Nome montado em runtime não é visto: confira antes de tratar uma `orfa` como morta.
- `protegida` olha só a definição da rota: guarda em volta da tela (`Protected*`, `Private*`, `*Guard`,
  `Require*`, `Auth*`/`Admin*` como wrapper ou layout com filhas). Tela que se protege por dentro aparece como pública.
- Arquivo de teste: `*.test|spec|e2e|contract|unit|fixture.*`, `*_test.*` (Deno), pastas `__tests__`, `tests`,
  `e2e`, `fixtures`, `__mocks__` etc. `casos` conta `it`/`test`/`Deno.test`/`t.test` (não `regex.test()`).
- As relações são extraídas estaticamente: referência encontrada não prova execução; ausência de
  chamador no mapa não prova que uma edge não tenha consumidor externo. Marcadores `TODO` também são
  candidatos para revisão — texto em português sem pontuação pode ser ambíguo.
