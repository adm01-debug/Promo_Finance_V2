# Vercel e deploy — referência para agentes

> Ler ao confirmar um deploy, mexer em env vars do Vercel, domínio ou deploy de edge functions.

| O que | Valor |
|---|---|
| Projeto | `promo-finance-v2` (ID `prj_gUNGhJYrVY2mfQb6hWDffow04v2p` — `mcp__Vercel__get_project`) |
| Team | `juca1` (ID `team_QyN41X0q8hrqhW80AwokbFLv` — `mcp__Vercel__list_teams`) |
| Framework / Node | Vite · Node `24.x` |
| Build/install (vercel.json) | `npm run build` → `dist/`; `installCommand: bun install --frozen-lockfile` |
| Região | `gru1` |
| Domínio verificado no projeto | **só** `promo-finance-v2.vercel.app` (`mcp__Vercel__list_project_domains`, `verified: true`) |
| Alias adicionais (não custom domain) | `promo-finance-v2-juca1.vercel.app`, `promo-finance-v2-git-main-juca1.vercel.app` |
| Preview URL pattern | `https://promo-finance-v2-{hash}-juca1.vercel.app` |
| SSO Protection | `enabled: true` (`deploymentType: all_except_custom_domains`) |
| MCP Vercel | ferramentas `mcp__Vercel__*` — escrita = ação de produção |

## ⚠ Divergência encontrada — `app.promo-finance.com`

`CLAUDE.md` e `docs/agentes/sistema.md` citam `https://app.promo-finance.com` como "URL prod", mas
**esse domínio não aparece em `mcp__Vercel__list_project_domains` do projeto `promo-finance-v2`** —
só o alias `.vercel.app` está verificado como domínio do projeto. Não verificado nesta sessão:
painel do Vercel (pode haver domínio customizado cadastrado por outra conta/token, ou o domínio
pode estar com DNS externo sem completar a verificação). **NÃO VERIFICADO — motivo: a API usada
nesta sessão só lista 1 domínio para o projeto.** Não corrigido aqui (fora do escopo desta tarefa);
ver "Próximos passos".

## Deploy, env vars e pendências

### Deploy do front

- **Automático na `main`:** merge em `main` = deploy em produção (confirmado pela Vercel Git
  integration do projeto; `vercel.json` tem `rewrites`/`headers`/CSP próprios, sem `ignoreCommand`
  customizado além do que já está no arquivo).
- A branch gerada `contexto` (ver `docs/agentes/mapa-repo.md`) **não** é buildada pela Vercel —
  `contexto.yml` usa `vercel.json` próprio com `ignoreCommand` para essa branch.

### Deploy de Edge Functions — **manual, não automático**

Diferente do padrão do Zapp (deploy automático no push da `main`): aqui o deploy de Edge Function é
só por `.github/workflows/functions-deploy.yml` (`workflow_dispatch`), a partir de uma lista de
funções pré-aprovadas (`type: choice`) — uma por dispatch, ou um lote separado por vírgula no
input opcional `functions_batch`, que sobrepõe `function_name` (ex.:
`sync-catalogo-ncm-nbs,sync-fundamentacao-legal`). Não existe push-to-deploy de
`supabase/functions/` neste repo. Depois de mergear uma mudança em Edge Function, é preciso
disparar esse workflow manualmente para ela ir ao ar.

### Env vars — fonte de verdade

- `env.manifest.json` (raiz) é o **inventário gerado e autoritativo** de variáveis — `scope`,
  `required`, `dest` (`vercel` ou outro) e `consumers` por variável. Gerado por
  `scripts/generate-env-manifest.mjs`; **não editar manualmente**.
- Regras gerais (mesmas do Zapp): nunca chave de servidor (`OPENAI_*`, `ANTHROPIC_*`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `PROD_DB_URL`) no Vercel; `VITE_*` vai pro
  bundle e é público — nunca segredo com prefixo `VITE_`.

### Pendências (dependem de ação no dashboard, não verificadas nesta sessão)

1. Confirmar no painel do Vercel se `app.promo-finance.com` está de fato associado ao projeto
   `promo-finance-v2` (ver divergência acima) — a API usada aqui não o lista.
