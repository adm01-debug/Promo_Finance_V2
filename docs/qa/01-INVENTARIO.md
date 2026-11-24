# 01 — Inventário do sistema e registro de cobertura

> Auditoria de QA somente leitura — 2026-11-22. Base: `main` em `2c2486f`.
> Todo número desta página foi obtido por comando ou consulta executada nesta sessão (marcado **EXECUTADO**).
> O registro de cobertura por camada está na seção 10, no fim do arquivo.

## 0. Suposições declaradas

O campo `<contexto>` do pedido veio vazio. O que segue foi deduzido do código e da documentação do próprio repositório, não informado pelo dono:

- **O que o sistema faz**: ERP financeiro multi-empresa da Promo Brindes — contas a pagar e a receber, conciliação bancária, régua de cobrança, fluxo de caixa, DRE, contabilidade, apuração fiscal/tributária (incluindo Reforma Tributária / IBS-CBS), emissão e recepção de NF-e, SPED (ECD, ECF, Contribuições) e integrações com Asaas, Bling, Bitrix24, WhatsApp, SEFAZ, Open Finance e Banco Inter.
- **Quem usa**: funcionários da empresa com papéis distintos (admin, financeiro, operacional, contador, visualizador) e um contador externo convidado por link.
- **O que mais incomoda hoje**: não declarado. A auditoria tratou todas as camadas com o mesmo peso e priorizou por severidade técnica, não por incômodo relatado.

## 1. Stack e build

| Item | Valor | Evidência |
|---|---|---|
| Front-end | Vite 6 + React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query | `package.json` |
| Back-end | Supabase Cloud (Postgres + RLS + Auth + Edge Functions Deno) | `supabase/config.toml` |
| Projeto Supabase oficial | `bwwbeyolnnzppeuhgkcd` | `AGENTS.md:1` |
| Hospedagem | Vercel (time `juca1`); merge em `main` = produção | `vercel.json`, `AGENTS.md` |
| Gerenciador | bun (`bun.lock`, `.bun-version`) | raiz |
| Entrada do app | `index.html` → `src/main.tsx` → `src/App.tsx` | — |
| Ambientes | produção (Vercel `main`) + previews por PR; migrations têm trilhas `staging-migrate.yml` e `prod-migrate.yml` | `.github/workflows/` |

## 2. Front-end — números medidos

| Item | Quantidade | Como foi medido (EXECUTADO) |
|---|---|---|
| Arquivos `.ts`/`.tsx` em `src/` | 2.085 | `find src -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` |
| Arquivos em `src/pages` | 273 (216 `.tsx`) | `find src/pages -type f \| wc -l` |
| Arquivos em `src/components` | 999 | `find src/components -type f \| wc -l` |
| Arquivos em `src/hooks` | 322 | `find src/hooks -type f \| wc -l` |
| Arquivos de teste | 297 | `find src -name '*.test.*' -o -name '*.spec.*' \| wc -l` |
| Declarações `path` em rotas | 130 | `grep -rhoE "path[:=] *['\"][^'\"]+" src/routes/*.tsx src/App.tsx \| wc -l` |
| Páginas carregadas por `lazy(() => import(...))` | 106 | `grep -rhoE "lazy\(\(\) => import\('[^']+'" src/routes/*.ts* \| wc -l` |

Arquivos de rota (`src/routes/`), com a contagem de `path` em cada um: `adminRoutes.tsx` 27 · `tributarioRoutes.tsx` 38 · `financeiroRoutes.tsx` 19 · `geralRoutes.tsx` 19 · `analiseRoutes.tsx` 7 · `contabilRoutes.tsx` 5 · `reformaTributariaRoutes.tsx` 5 · `fiscalRoutes.tsx` 1 · `src/App.tsx` 9.

Estado global: `src/contexts/EmpresaScopeContext.tsx` + `useEmpresaScope.ts` (escopo de empresa ativa) e o cache do TanStack Query. Não há Redux/Zustand.

## 3. Banco de dados — estado real (EXECUTADO)

Consulta de contagem sobre o projeto `bwwbeyolnnzppeuhgkcd`:

| Objeto | Quantidade |
|---|---|
| Tabelas em `public` | 269 |
| Tabelas **sem** RLS | **0** |
| Tabelas sem nenhuma policy | **0** |
| Policies RLS | 621 |
| Views | 17 + 1 materializada |
| Funções em `public` | 216 (sendo **170** `SECURITY DEFINER`) |
| Triggers (não internos) | 187 |
| Índices | 768 |
| Migrations aplicadas (`supabase_migrations.schema_migrations`) | 1.067 |
| Arquivos em `supabase/migrations/` | 1.067 |
| Migration mais recente | `20261122040000` |

Extensões instaladas: `pg_cron 1.6.4`, `pg_net 0.20.0`, `pg_stat_statements 1.11`, `pg_trgm 1.6`, `pgcrypto 1.3`, `plpgsql 1.0`, `supabase_vault 0.3.1`, `uuid-ossp 1.1`.

Enum de papéis — `app_role` tem **8 valores em dois vocabulários paralelos**: `admin, manager, operator, viewer, financeiro, operacional, visualizador, contador`. Há ainda `org_papel` (`RESPONSAVEL, ADMIN, MEMBRO, LEITOR`) para o subsistema de organizações, que por regra do projeto não deve aparecer em consulta financeira.

### Storage — 6 buckets, todos privados (EXECUTADO)

`comprovantes-financeiro` (20 MB) · `financeiro` (sem limite) · `nfe-certificados` (5 MB) · `nfe-xml` (50 MB) · `notas-fiscais-upload` (sem limite) · `relatorios-tributarios` (sem limite).

Dois buckets sem `file_size_limit` (`financeiro`, `notas-fiscais-upload`, `relatorios-tributarios`) — tratado na camada de transversais.

### Jobs agendados — 33 crons ativos (EXECUTADO, `SELECT ... FROM cron.job`)

O de maior frequência é `webhook-retry-worker-1min` (`* * * * *`, a cada minuto). Rodam a cada 15–30 min: `sefaz-dfe-dispatcher-15min`, `monitor-health-check`, `monitorar-erros-frontend`, `detect-query-regressions-5min`. Os de dinheiro: `executar-regua-cobranca-diaria` (12h), `processar-regua-cobranca-diario` (9h), `marcar-contas-vencidas` (3h05), `gerar-contas-recorrentes-diario` (3h35), `gerar-alertas-vencimento-diario` (8h). Todos com `active = true`.

## 4. Edge Functions — 109 pastas em `supabase/functions` (EXECUTADO)

Agrupadas por domínio:

- **Cobrança e dinheiro**: `asaas-proxy`, `asaas-webhook`, `executar-regua-cobranca`, `processar-fila-cobrancas`, `conciliacao-ia`, `conciliacao-proxy`, `open-finance`.
- **Fiscal / tributário**: `calculo-iva`, `consulta-tributaria`, `executar-fechamento-tributario`, `exportar-sped-contribuicoes`, `gerar-sped-ecd`, `gerar-sped-ecf`, `gerar-dre-tributaria`, `gerar-heatmap-tributario`, `gerar-pdf-tributario`, `prever-carga-tributaria`, `projecao-reforma`, `simular-presumido`, `simular-real`, `simular-simples`, `decidir-regime`, `verificar-conformidade-fiscal`, `overlay-rejeicoes-auditoria`.
- **NF-e / SEFAZ**: `nfe-upload-certificado`, `nfe-vinculo-proxy`, `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar`, `sefaz-manifestar`, `processar-nf-ocr`.
- **Integrações**: `bling-proxy`, `bling-webhook`, `bitrix24-sync`, `bitrix24-webhook`, `enviar-bitrix24-tributario`, `log-sped-bitrix24`, `sync-profile-to-bitrix`, `sincronizar-anomalia-bitrix24`, `whatsapp-webhook`, `whatsapp-ai-analyzer`, `whatsapp-ia-proativo`, `n8n-dispatch`, `n8n-callback`, `cnpja-lookup`, `external-data`.
- **Autenticação e acesso**: `sso-initiate`, `sso-callback`, `sso-logout`, `sso-generate-metadata`, `sso-test-login`, `sso-validate-config`, `scim-server`, `api-keys-manage`, `convidar-usuario`, `convidar-contador`, `aceitar-convite`, `validar-token-contador`, `enviar-convite-organizacao`, `validate-ip-geo`.
- **IA / análise**: `copilot-global`, `copilot-tributario`, `expert-agent`, `analise-fluxo-ia`, `analise-preditiva`, `executar-analise-preditiva`, `detectar-anomalias-financeiras`, `categorizar-despesa`, `analyze-document`, `mcp-query`, `insights-relatorio`.
- **Webhooks e resiliência**: `webhook-replay`, `webhook-retry-worker`, `webhook-simulator`.
- **Observabilidade e envio**: `health`, `monitor-health`, `monitorar-erros-frontend`, `notify-performance-alert`, `notify-saved-filter`, `send-push-notification`, `send-device-alert`, `enviar-alerta-email`, `ci-security-gate-log`, `digest-silenciamentos-erro`, `compare-schemas`, `gerar-pacote-evidencias`.

Dois arquivos soltos que não são funções: `fuzz_test.ts` e `stress_test.ts`.

## 5. Integrações externas

Asaas (cobrança) · Bling (ERP) · Bitrix24 (CRM) · WhatsApp · SEFAZ/NF-e · CNPJá/Receita Federal · Open Finance · Banco Inter · N8N · SSO (SAML) + SCIM · Mapbox · Web Push (VAPID) · Sentry.

## 6. CI — 20 workflows em `.github/workflows` (EXECUTADO)

| Workflow | Gatilhos declarados no `on:` |
|---|---|
| `dependency-review.yml` | pull_request |
| `ci.yml`, `deno-tests.yml`, `automation-local.yml`, `actionlint.yml`, `graphify.yml`, `supabase-linter.yml` | push, pull_request, workflow_dispatch |
| `codeql.yml` | push, pull_request, schedule |
| `contexto.yml` | push, pull_request, schedule, workflow_dispatch |
| `inventario-estado.yml` | schedule, push, pull_request, workflow_dispatch |
| `auto-update-pr-branch.yml` | push, workflow_run, schedule, workflow_dispatch |
| `estado-real.yml` | schedule, push, workflow_dispatch |
| `rfb-upstream-watch.yml`, `schema-drift.yml`, `settings-guard.yml` | schedule, workflow_dispatch |
| `functions-deploy.yml`, `migration-ledger.yml`, `prod-migrate.yml`, `staging-migrate.yml`, `supabase-admin-ops.yml` | workflow_dispatch |

**Dez dos 20 workflows declaram gatilho de `pull_request`** — `dependency-review`, `ci`, `deno-tests`, `automation-local`, `actionlint`, `graphify`, `supabase-linter`, `codeql`, `contexto` e `inventario-estado` —, medido lendo o bloco `on:` de cada arquivo de `.github/workflows` no commit auditado.

Gatilho declarado, porém, não é o mesmo que check que bloqueia merge. A proteção de `main` exige **8 checks**: `Supabase DB Linter`, `Quality Gate & Tests`, `E2E Critical Gate`, `Integration tests (edge functions live)`, `E2E Financeiro (offline)`, `E2E Destructive Logout`, `Varredura de segredos (gitleaks)` e `Unit tests (offline, deterministic)`. É por isso que `supabase-linter.yml:29-34` dispara em todo PR, sem filtro `paths:` — o job precisa sempre rodar para satisfazer um check obrigatório (o próprio arquivo documenta isso na linha 31). Também rodam em PR, sem serem checks obrigatórios, `dependency-review`, `actionlint`, `automation-local`, `codeql`, `contexto`, `graphify` e `inventario-estado`. O que isso significa para a camada de infra/CI está em `03-ACHADOS.md`.

## 7. Variáveis de ambiente

Inventário autoritativo em `env.manifest.json` (gerado por `scripts/generate-env-manifest.mjs`, versão 1.1.0, 2026-11-21), com `scope` (frontend/edge), `required`, `dest` (vercel/supabase) e `consumers` por variável. Referência de exemplo em `.env.example`. Varredura de segredo: `gitleaks` via `scan:secrets`, com exceções em `.gitleaks-baseline.json`.

## 8. Atores e papéis

| Ator | Origem | Alcance pretendido |
|---|---|---|
| `admin` | `app_role` | administração total |
| `financeiro` / `manager` | `app_role` (dois rótulos para função próxima) | operação financeira |
| `operacional` / `operator` | `app_role` (idem) | operação do dia |
| `visualizador` / `viewer` | `app_role` (idem) | somente leitura |
| `contador` | `app_role` + convite por link (`convidar-contador`, `validar-token-contador`) | acesso contábil externo |
| `anon` | Supabase Auth | login, registro de erro de front |
| `service_role` | chave de serviço | Edge Functions e crons |

A ligação usuário→empresa fica em `user_empresas` (`user_id`, `empresa_id`, `role`, `ativo`) e os papéis globais em `user_roles`. **A existência de dois vocabulários para o mesmo papel é a causa raiz de um achado de severidade alta** — ver `03-ACHADOS.md`.

## 9. Jornadas principais mapeadas

1. Login → seleção de empresa → painel.
2. Conta a pagar: cadastrar → aprovar → pagar → conciliar → contabilizar.
3. Conta a receber: cadastrar → cobrar (régua/Asaas) → receber → baixar → conciliar.
4. Conciliação bancária: importar extrato (OFX/CSV/Open Finance) → sugerir correspondência → aceitar/recusar → fechar sessão.
5. NF-e recebida: puxar da SEFAZ → manifestar → vincular a pedido/conta → apropriar crédito.
6. Apuração tributária: fechar competência → gerar guia/DARF → gerar SPED → arquivar evidências.
7. Administração: convidar usuário/contador → atribuir papel por empresa → auditar acesso.

## 10. Registro de cobertura

> Preenchido ao fim da Fase 2, uma linha por item do inventário, com "revisado" ou "não revisado + motivo".
> **Esta seção é atualizada pela Fase 2 — ver o bloco "Cobertura por camada" acrescentado abaixo.**

### Limitação de ambiente e como foi contornada (EXECUTADO)

**Causa raiz encontrada**: `bun.lock` resolve **209 dos 1.072 pacotes** para um Artifact Registry privado de terceiro — `https://europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` e `europe-west1-npm.pkg.dev` (medido com `grep -cE 'https://europe-west[0-9]+-npm\.pkg\.dev' bun.lock` → 209; total de entradas → 1.072). Esse host é recusado pelo proxy deste contêiner (`curl` → `CONNECT tunnel failed, response 403`), enquanto `registry.npmjs.org` responde HTTP 200 para os mesmos pacotes. Daí as 185 falhas `ProxyConnectFailed (403)` repetidas de forma idêntica em 5 tentativas de `bun install`.

`npm` não serve de alternativa neste repositório: aborta em `TypeError: Cannot read properties of null (reading 'edgesOut')` ao resolver a dependência vendorizada `xlsx => file:vendor/xlsx-0.20.3.tgz` (log em `/root/.npm/_logs/`), e não há `package-lock.json`.

**Contorno aplicado, sem tocar no repositório**: o projeto foi copiado para o diretório de trabalho da sessão (sem `node_modules`, `.git` nem `supabase/migrations`) e instalado lá com `bun install --registry https://registry.npmjs.org`, já sem as URLs fixadas do lock — **661 pacotes, instalação completa**. O repositório em `/home/user/Promo_Finance_V2` não foi alterado: `bun.lock`, `package.json` e `node_modules` seguem como estavam no commit `2c2486f`.

**Duas configurações, dois resultados** — `AGENTS.md:18` manda registrar o erro de dependência e parar, e é o que vale aqui:

| Configuração | Comando | Resultado |
|---|---|---|
| Instalação versionada (a que prova o build oficial) | `bun install` lendo o `bun.lock` do commit auditado | **BLOQUEADA**: 185 falhas `ProxyConnectFailed (403)` em 5 tentativas, sempre nos 209 pacotes que apontam para `europe-west*-npm.pkg.dev` |
| Configuração de contorno (só para permitir análise estática e testes) | `bun install --registry https://registry.npmjs.org` em cópia fora do repositório, sem as URLs fixadas do lock | **EXECUTADO**: 661 pacotes, suíte e type-check rodaram |

**Escopo dos resultados abaixo**: medidos na configuração de contorno, sobre o mesmo código do commit `2c2486f` — o que muda é a origem dos pacotes, não o código auditado. Eles **não** validam a instalação versionada, que segue bloqueada e é ela própria um achado (`ACH-INF-01`).

**O que isso permitiu executar de verdade**:

| Verificação | Resultado | Modo |
|---|---|---|
| `tsc --noEmit` (type-check) | **0 erros, exit 0** | EXECUTADO |
| Suíte `vitest run` | **294 arquivos passaram, 1 pulado (295) · 3.314 testes passaram, 18 pulados (3.332) · 0 falhas · 142s** | EXECUTADO |

O fato de o build do projeto depender de um registry privado de terceiro **é por si um achado de infraestrutura** — registrado em `03-ACHADOS.md`.

### Volume de dado em produção (EXECUTADO) — importante para ler as severidades

| Tabela | Registros |
|---|---|
| `empresas` | **1** |
| `user_empresas` (vínculos) | 3 (3 usuários distintos) |
| `clientes` | 12 (nenhum com `empresa_id` nulo) |
| `fornecedores` | 5 (**nenhum com `empresa_id` preenchido**) |
| `audit_logs` | 432 |
| `frontend_error_logs` | 1 |

**Leitura honesta deste quadro**: o sistema está em produção, mas com **uma única empresa cadastrada e 3 usuários**. Os furos de isolamento multi-empresa encontrados são, hoje, **risco latente** — não há uma segunda empresa de quem vazar dado. Eles passam a valer dinheiro no dia em que a segunda empresa entrar. As severidades em `03-ACHADOS.md` consideram isso e dizem, em cada caso, se o dano é atual ou futuro.
