# Suíte de verificação pós-deploy de Edge Functions

Porte da suíte `scripts/edge-deploy` do **Zapp_Web_V2**, adaptado ao
Promo_Finance_V2. O PF deploya 87 edge functions via `scripts/migrate-functions.sh`
(shell, lote) sem confirmação de que "subiu de verdade" nem redação de log. Esta
suíte adiciona essa camada — **aditiva, sem mudar a ordem de deploy nem os exit
codes 2-6 do script atual**.

## Causa / porquê

- O CLI Supabase imprime no log a URL do deploy com `access_token=` embutido
  (ver `/tmp/deploy-out-*.log`). Esse log vai para o artifact do GitHub
  (`functions-deploy.yml`) — publicar ali é publicar credencial.
- O deploy em lote termina com "0 erros" sem confirmar que cada função respondeu
  no endpoint nem que o CORS não ecoa origem não confiável.
- Sem registro, não há como dizer qual sha está no ar nem diferenciar
  "redeployou de verdade" de "no change".

## Módulos

| Módulo                    | O que faz                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Entrada principal                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `redigir-log.mjs`         | Redige secrets de um `.log`/`.jsonl` antes do upload, em três camadas: (1) valor literal via `--segredo-env=NOME` — também percent-encoded, escapado de JSON, cortado por cor ANSI ou dobrado em linhas; (2) credencial reconhecível pela forma (JWT, `sbp_`, `sb_secret_`, `gh*_`, `Bearer`, senha em URL, webhook do Slack); (3) valor de chave sensível (`access_token`, `*_token`, `*secret`, `password`, `apikey`, `*_KEY`, `authorization`) em `k=v`, `k: v`, JSON e flag de CLI. Fail-closed (exit 2, log intocado) se o arquivo não existir, estiver fora da base ou houver argumento não reconhecido; `confinar()` impede escrita fora da base autorizada | log de deploy + `REDIGIR_LOG_BASE`           |
| `unchanged-from-log.mjs`  | Extrai de um log os slugs das funções com "No change found in Function:" (strip ANSI; ignora o eco do script)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | log de deploy                                |
| `deployment-record.mjs`   | Constrói o registro de Deployment GitHub: `ref` = sha deployado (40 hex), `payload` com run e escopo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | sha deployado                                |
| `register-deployment.mjs` | Registra Deployment + status (success/error) no GitHub, best-effort, com allowlist https de destino                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `DEPLOYED_GIT_SHA` + token                   |
| `health-check.mjs`        | Consulta a Management API (analytics) do projeto e degrada para `::warning::` sem abortar; exit 1 só quando a taxa de 5xx medida supera `--threshold` (fração 0–1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `SUPABASE_ACCESS_TOKEN` + `--functions-list` |
| `smoke-functions.mjs`     | Smoke não-mutante por função: preflight CORS (origem canônica positiva + origem negada) e gateway anonymous (POST sem JWT → 401); não segue redirect; `--timeout-ms` (padrão 20000) e `--retries` por requisição                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `--functions-list` + `--base-url`            |
| `verify-remote.mjs`       | Confirma que cada função esperada existe no inventário remoto (`supabase functions list`) com status ACTIVO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `--expected` + `--remote`                    |
| `secrets-scope.mjs`       | Valida escopo de secrets: compara os nomes `required=true` do `env.manifest.json` contra o `secrets list` remoto; fail-closed se a leitura falhar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `--manifest` + `--lista`                     |
| `allowed-origins.json`    | Origens canônicas e exemplo negado para o CORS do smoke                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | —                                            |

## Uso

Rodar os testes:

```sh
node --test scripts/edge-deploy/*.unit.mjs
```

Os testes não tocam rede externa nem production: fixtures em `scripts/edge-deploy/fixtures/`
(logs reais dos runs do Zapp, inclusive o caso F-03 de byte ANSI), fakes de fetch
/ inventário remoto e, para os caminhos HTTP (timeout, 5xx, redirect, corpo
não-JSON, CORS), um servidor `node:http` efêmero em `127.0.0.1`.

## Divergências conscientes vs. Zapp

- PF não tem `deployment-manifest.json` → `health-check`/`smoke-functions` e
  `verify-remote` recebem/listam funções via JSON plano (`{ functions: [...] }`)
  em vez de manifest; `AMBIENTE_PADRAO = 'producao'` em vez de
  `producao-edge-functions`.
- `secrets-scope.mjs`: o PF **não reescreve** secrets (gate do migrate-functions.sh
  só aborta se faltar); aqui a decisão `REESCREVER` só ocorre com explicitação
  (`rotate_secrets=true`) ou divergência real de nomes, e em rollback/dry-run
  nunca reescreve.
- Fixtures do Zapp preservadas como evidência do comportamento do extrator; os
  testes que dependem de `supabase/config.toml` e `env.manifest.json` do PF rodam
  contra os arquivos reais do repo.

## Integração

> **Estado atual: não integrado.** `scripts/migrate-functions.sh` e
> `.github/workflows/functions-deploy.yml` ainda não chamam nenhum módulo desta
> pasta (`grep -rn edge-deploy scripts/*.sh .github/workflows` não retorna nada).
> O que segue é o desenho da integração, não o que roda hoje.

Desenho: bloco aditivo de **verificação pós-deploy** no `migrate-functions.sh`,
após o loop de deploy, se `POST_DEPLOY_CHECK=true` (ou `--verify`):

1. gera a lista de funções deployadas em JSON (`--functions-list` do smoke);
2. roda `smoke-functions` (CORS + 401) e `verify-remote` (presença no remoto);
3. redige `/tmp/deploy-out-*.log` com `redigir-log.mjs` **antes** do upload do
   artifact, removendo a credencial `access_token=`;
4. registra o Deployment (best-effort) para rastrear o sha no ar.

A ordem de deploy, os exit codes 2-6 e o gate de secrets não mudam.
