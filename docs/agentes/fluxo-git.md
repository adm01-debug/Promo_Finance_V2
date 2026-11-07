# Fluxo Git — referência para agentes

> Ler antes de abrir a primeira branch da sessão. Resumo em `AGENTS.md`, seção 6.

Escrita no GitHub em repos `adm01-debug`: use o MCP **`GITHUB - MCP - FOREVER`**. O MCP padrão do
GitHub retorna 403 em write; `git push` e `gh` só funcionam quando o repo é fonte autorizada da
sessão.

## Regras (texto-mestre adm01-debug, 2026-11-02)

1. Nunca commite em `main`/`master`. Toda mudança nasce em branch própria.
2. Só escreva em branch que **você** criou nesta sessão. Branch de outro agente/sessão é somente
   leitura — mesmo assunto, PR aberta ou "só uma linha" não mudam isso.
3. Antes de começar: liste as PRs abertas. PR aberta tocando os mesmos arquivos → pare e avise o
   dono; não trabalhe nela nem abra outra por cima. Jeito barato de cumprir esta regra, numa
   chamada só: `github_graphql` com
   `pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`.
   Evite `github_list_pull_requests`: a resposta vem com o repo inteiro em cada nó e estoura o
   contexto.
4. Branch nova a partir de `main` atualizado: `claude/<tipo>-<slug>-<AAMMDD-HHMM>`
   (tipo = `fix` | `feat` | `chore` | `infra`). Sem carimbo não é aceito. Uma tarefa = uma branch =
   uma PR. Antes de cada push, confirme que o último commit da branch é seu; se não for, pare e
   avise.
5. Commits curtos em PT-BR com prefixo (`fix:`, `feat:`, `chore:`, `infra:`), de preferência 1
   commit atômico (`github_push_files` aceita `files` e `delete` no mesmo commit).
6. PR sempre. Título = o que muda. Corpo = causa/por quê + o que foi verificado de verdade, com a
   evidência.
7. **Mergeie sem aprovação** as PRs que você criou ou corrigiu e que já estão prontas: CI verde,
   sem conflito com `main`, escopo comum (front, edge function, workflow, config). Squash-merge e
   apague a branch. Não espere "ok" — a única exceção é a regra 8.
8. **Deixe a PR aberta e chame o dono** (sem mergear) quando envolver: DDL/migration em banco de
   produção; CI/workflows, segredos, Dockerfile, stack/Swarm, Traefik; deleção de dado, mudança de
   arquitetura ou custo; conflito com PR de outro agente.
9. Conflito: rebase da sua branch em `main`; `--force-with-lease` só na sua branch. Nunca
   force-push em `main`. Nunca rebase/force-push/commit/merge em branch alheia — nem para "ajudar".
10. Merge aqui = **produção** (deploy automático na Vercel). Depois do merge, confira que o deploy
    subiu e reporte. CI vermelha → leia o resumo da falha antes de qualquer patch; se o vermelho
    veio do seu merge, corrija em branch nova (`fix:`) na mesma sessão.
11. Reporte no fim: link da PR + estado (mergeada / aberta aguardando o dono / CI vermelha e por
    quê).

Nunca: reaproveitar branch existente; commitar em branch que você não criou nesta sessão;
commitar em `main`; mergear o que está na regra 8.

## Worktree isolado (obrigatório em checkout local)

**Nunca usar `git checkout -b` no checkout principal.** Vários agentes/chats no mesmo repo colidem
em branches e em arquivos de trabalho.

```bash
# 1. Identificador único da sessão: entra na branch E no diretório do worktree,
#    senão dois agentes no mesmo checkout caem na mesma pasta.
ID="$(date +%y%m%d-%H%M)"
BRANCH="claude/<tipo>-<slug>-${ID}"
WORKSPACE="$HOME/claude-worktrees/$(basename "$PWD")-${ID}"   # Hermes: $HOME/hermes-workspaces/chat-${ID}

# 2. Criar worktree a partir de main atualizado
git fetch origin main
git worktree add "$WORKSPACE" -b "$BRANCH" origin/main && cd "$WORKSPACE"

# 3. Verificar isolamento
[ "$(git branch --show-current)" = "$BRANCH" ] || exit 1

# ... trabalhar, commit, push, PR, merge ...

# 4. Cleanup obrigatório
git branch -D "$BRANCH"
git worktree remove "$WORKSPACE" --force
git worktree prune
```

**Convenção nova (introduzida na PR #252, não vinha do roteiro antigo):** a pasta base
`$HOME/claude-worktrees/<repo>-<ID>`. O roteiro original usava
`HERMES_BRANCH_ID="h$(date +%s | tail -c 7)"`, branch `fix/hermes-${HERMES_BRANCH_ID}-<descricao>`
e `WORKSPACE="$HOME/hermes-workspaces/chat-${HERMES_BRANCH_ID}"` (caminho ainda citado em
`docs/runbooks/HOTFIX.md`). O que esta versão mantém do original: id único por sessão no caminho,
verificação de isolamento e cleanup. O que mudou: nome da branch segue a regra 4; `git fetch origin
main` + `worktree add … origin/main` foram acrescentados para cumprir "branch nova a partir de `main`
atualizado" (regra 4) — não constavam literalmente no roteiro antigo. O Hermes pode seguir em
`$HOME/hermes-workspaces/chat-${ID}`.

Fluxo da PR: branch → commit → push → PR via GitHub → CI → merge squash → delete branch.
Hooks husky (`.husky/pre-commit`: lint-staged + gitleaks, se instalado — sem gitleaks o hook avisa
e segue; `.husky/pre-push`: type-check + testes afetados) rodam em todo commit/push quando o husky
está instalado (`npm install` roda `prepare: husky`). `--no-verify` só em emergência documentada na
PR, nunca no fluxo normal. Workers/editores NUNCA mexem em git/branches — só o orquestrador.

Prefixos de commit (`fix:`, `feat:`, `chore:`, `infra:`) são convenção do texto-mestre: o repo
**não tem commitlint** (sem config, sem dependência, sem hook `commit-msg`, sem check no CI), logo
nenhum prefixo é validado. `infra:` não aparece nos últimos 200 commits de `main` (fix 89, feat 32,
docs 29, chore 24); se o dono quiser validação, é decisão a tomar.
