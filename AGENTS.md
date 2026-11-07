# AGENTS.md — Promo_Finance_V2

Regras do dono para todo agente de IA; em conflito com `docs/`/README/relatórios, vence este arquivo. Sempre PT-BR. `docs/agentes/` = referência, ler só quando indicado.

## 1. Contexto, stack, IDs

- Financeiro multi-empresa da Promo Brindes, ~80% pronto, em manutenção. Módulos, integrações e as 105 Edge Functions: `docs/agentes/sistema.md` (ler ao mexer em função ou integração).
- O dono não é dev: decide negócio, o agente executa. Princípio: qualidade + velocidade — máximo de tarefas com êxito total pelo caminho mais rápido e barato em tokens (decide ferramenta, leitura, diff e resposta).
- Vite 6, React 18, TypeScript, Tailwind, shadcn/ui, TanStack Query; Supabase Cloud (Postgres, RLS, Auth, Edge Functions Deno); Vercel (time `juca1`): merge em `main` = produção.
- Supabase OFICIAL `bwwbeyolnnzppeuhgkcd` (MCP `SUPABASE - PROMO FINANCE V2 - MCP`); fora do projeto: VPS AtomicaBR e `pgxfvjmuubtbowutlide` (só leitura).
- `bun run test:run` · `type-check` · `lint:strict` · `test:e2e`; meta 2689/2689 testes, 0 erros TS.

## 2. Como trabalhar

1. End-to-end via MCP (GitHub, Supabase, Vercel, infra): o dono manda print/descrição, o agente resolve inteiro. Nunca "copie e cole", "roda aí", "você faz X e eu Y".
2. Aja como dev sênior e decida; pergunte só com custo, mudança de arquitetura, dado destrutivo em produção, trade-off real de negócio ou item da regra 6.6. Para ler/inspecionar, nunca peça.
3. Verdade acima de validação: não sabe/falhou → diga. Afirmação sobre código cita evidência (arquivo:linha, diff, saída de comando) ou é "NÃO VERIFICADO" + motivo. Branch/commit/PR não provam nada — leia o código.
4. Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie, "melhore" ou comente o que não foi pedido, nem reescreva arquivo inteiro por 3 linhas. Dependência nova/bump major só se indispensável, avisando na PR.
5. `APROVADO` = execute o plano como descrito, sem reconfirmar.
6. Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos", não conserte. Travou (acesso, MCP, dependência) → reporte o erro exato e pare; não pivote nem contorne regra. Antes de concluir, releia o pedido.
7. Tokens: só o trecho necessário (range, grep); grafo (seção 8) antes de busca textual; exploração ampla → subagente; sem tool "por garantia", código não aplicado ou replanejar a cada turno.
8. Segredos só em env/secret — nunca em código, commit ou resposta.
9. Leia o README e o doc relevante em `docs/` antes de mudar.

## 3. Bugs e funcionalidades

- Diagnóstico antes de patch (logs e estado real → arquivo:linha → causa; sem chute; várias causas → liste todas, corrija a pedida). Antes da PR: typecheck/lint/testes do que tocou; erro herdado do `main` vai para "Próximos passos".
- "Pronto" = PR mergeada + deploy confirmado + comportamento verificado em produção com evidência; funcionalidade pronta = integrada ponta a ponta, sem mock, hardcode ou TODO. Checklist: `docs/agentes/definicao-de-pronto.md` (ler antes de entregar feature ou bug). Não cabe na sessão → entregue o integrado e liste o que falta, com arquivos.

## 4. Banco de dados

- Nunca `supabase_apply_migration`: DDL via `supabase_db_query` + arquivo em `supabase/migrations/` com comentário e timestamp `YYYYMMDDHHmmss` estritamente crescente (conferir `SELECT max(version)`).
- `CREATE INDEX` simples — `CONCURRENTLY` falha no gateway transacional.
- Views com `security_invoker = true`. RLS em toda tabela pública.
- Isolamento por `empresa_id` (policies: `empresa_acessivel(empresa_id)`); `organizacao_id` é só do subsistema de organizações — não usar em queries, policies ou migrations financeiras.
- Policy `USING (true)` exige allowlist em `scripts/security/test-canonical-db-gates.mjs`.

## 5. Front, Edge, CI, segurança

- Componentes em `src/components/`, preferindo shadcn/ui existentes; queries via TanStack Query (não fetch direto); `src/integrations/supabase/types.ts` é gerado, não editar; sem `any` implícito nem `// @ts-ignore` sem justificativa documentada.
- Edge Function nova: `validatePayload` com Zod (gate no CI); `verify_jwt` ligado (desligar só com justificativa em comentário); imports `npm:`/`jsr:`, sem CDN externo.
- CI: actions pinadas por SHA (não tag); secrets de produção só no environment `Production`.
- Sem credencial em código, nem em teste; `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` só na função `external-data`; nunca imprimir/commitar `.git-credentials`, `.env.local`, tokens, chaves de API, service_role keys.

## 6. Git (vários agentes em paralelo)

Escrita no GitHub (`adm01-debug`): MCP `GITHUB - MCP - FOREVER` (o padrão dá 403; `git push`/`gh` só em repo fonte autorizada da sessão). Fluxo completo e worktree: `docs/agentes/fluxo-git.md` (ler antes da primeira branch).

1. Nunca commite em `main`; nunca reaproveite branch nem escreva em branch alheia (só leitura, sem exceção). Branch própria em worktree isolado, de `main` atualizado: `claude/<tipo>-<slug>-<AAMMDD-HHMM>` (`fix`|`feat`|`chore`|`infra`); sem carimbo não é aceito. Uma tarefa = uma branch = uma PR.
2. Antes de começar, liste PRs abertas (`github_graphql`, não `github_list_pull_requests`); PR aberta nos mesmos arquivos → pare e avise. Antes de push, confirme que o último commit é seu.
3. Commits curtos em PT-BR com prefixo `fix:`/`feat:`/`chore:`/`infra:`, 1 atômico se possível. Hooks husky rodam em commit/push; `--no-verify` só em emergência documentada na PR. Só o orquestrador mexe em git.
4. PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência. Reporte no fim: link + estado (mergeada / aguardando o dono / CI vermelha e por quê).
5. Mergeie sem aprovação PR sua pronta (CI verde, sem conflito, escopo comum: front, edge function, workflow, config): squash e apague a branch. Merge = produção: confira o deploy; CI vermelha → leia a falha antes de patch, corrija em branch nova.
6. Deixe aberta e chame o dono: DDL/migration em produção; CI/workflows, segredos, Dockerfile, stack/Swarm, Traefik; deleção de dado, arquitetura ou custo; conflito com PR alheia.
7. Conflito: rebase em `main`, `--force-with-lease` só na sua branch; nunca force-push em `main` nem toque em branch alheia.

## 7. Comunicação

- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, resumo, "vou fazer X", narração, hedging, disclaimer, desculpa, lição de moral, cortesia de fechamento. O que mudou e o efeito no negócio; técnica só se perguntarem.
- Proporcional: fix de 3 linhas = 5 linhas de resposta; não despeje log/arquivo/tool, cite a linha que importa; caminhos, comandos e links completos. Destrutivo: uma linha ("isso apaga X, sem volta — confirma?").
- Não pergunte "quer que eu faça?" após pedido; sem plano de 12 fases para fix de 20 linhas; sem passo manual quando há MCP (nem pedir ao dono revisar diff, rodar comando ou testar).
- Feche toda execução com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [onde]`), por impacto, do que viu nesta sessão, executáveis via MCP, em linguagem de negócio; é um menu (`1`, `1 e 3`, `APROVADO 2`, "todos" = executar na ordem sem reconfirmar). Regras: `docs/agentes/proximos-passos.md` (ler antes da primeira entrega).

## 8. Graphify

- Com `graphify-out/graph.json`: `graphify query "<pergunta>"` para o código, `path`/`explain` para relações; `GRAPH_REPORT.md` só para revisão ampla. Após mudar código, `graphify update .` (AST, sem custo); grafo atrás do HEAD → auto-sync N8N em 15 min.
- Piloto privado (`npm run graphify:pilot`): saída em `graphify-out/piloto-*/`, só grafo com `evidencia.json` validado, sem contornar o wrapper (`update`/`extract`, hooks, LLM, MCP público, banco). Preservar `src/lib/arquitetura/`; nó isolado ≠ lixo, AST não prova RLS. Mais: `docs/agentes/graphify.md`.
