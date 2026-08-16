# ESTADO ATUAL DO SISTEMA — Promo Finance v2

> **Auditoria de estado** — levantamento do que o sistema **deveria** fazer versus o que **de fato**
> está implementado e funcionando.
> **Data:** 2026-08-16 · **Branch:** `claude/system-status-roadmap-f36r0o` · **Commit base:** `4aa2f10`
> **Método:** medição direta (repositório + catálogo do banco em runtime). Nenhuma afirmação herdada de documento.
> **Revisão 2 (2026-08-16):** este documento passou por uma rodada de validação adversarial contra si
> mesmo. **Um achado estava exagerado a ponto de inverter o diagnóstico**, dois números estavam errados
> e uma dimensão inteira faltava. Tudo corrigido em [§10](#10-correções-aplicadas-durante-esta-própria-auditoria),
> com o texto original preservado. Se você leu a revisão 1, comece por lá.

---

## ⚠️ Leia isto primeiro

Este documento **contradiz** vários documentos existentes em `docs/` e `.lovable/`. Isso é intencional:
todos foram tratados como **hipótese a testar**, não como fonte. Onde a documentação anterior estava
errada, a divergência está registrada na seção [§9](#9-documentação-existente--realidade).

**Toda linha de classificação cita evidência verificável** (`arquivo:linha`, nome de objeto de banco,
ou consulta ao catálogo). Onde não houve evidência, a linha foi rebaixada — nunca promovida.

---

## 1. Veredito em uma tela

O sistema tem **muito código de qualidade e arquitetura madura**, mas **o ambiente que roda hoje não
suporta a maior parte dele**. O problema não é o código: é o **fio partido entre repositório e banco**.

| | |
|---|---|
| **Código escrito** | 278.451 linhas em `src/` (1.739 arquivos) + 32.910 em Edge Functions + 38.280 em migrations |
| **Superfície funcional** | 129 rotas · 174 arquivos de página · 242 hooks · 102 Edge Functions · 523 migrations |
| **Banco vivo** | 242 tabelas · 18 views · 1 matview · 141 funções · 455 policies · 80 triggers |
| **🔴 Tabelas que o código usa e que NÃO existem no banco** | **46** (33 com consumidor ativo, em **121 pontos de chamada**) |
| **🔴 RPCs que o código chama e que NÃO existem no banco** | **15** |
| **🔴 Views `vw_*` que o código usa e que NÃO existem no banco** | **3** de 14 |
| **🔴 Jobs agendados (cron) ativos** | **0** — de 16 declarados nas migrations |
| **🔴 Buckets de storage necessários e ausentes** | **4 de 5** |
| **🔴 Extensão `pg_net` (necessária p/ cron chamar Edge Function)** | **não instalada** |
| **Uso real** | 3 usuários · último login **2026-07-30** (17 dias atrás) · tabelas de negócio com 0–31 linhas |

### O que isso significa na prática

O repositório descreve um ERP financeiro/tributário completo. O ambiente acessível é, na prática, um
**ambiente de demonstração parcialmente construído**: o esquema core existe e funciona, mas ~46 tabelas
de features avançadas nunca foram criadas nele, e **nenhuma automação agendada está ligada**.

Aplicando a regra `pronto = em produção com uso real`, **nada neste sistema qualifica como ✅ pleno**
no ambiente auditado — não por falta de código, mas por falta de uso. Por isso o eixo de classificação
abaixo separa **maturidade de código** de **prontidão de runtime**, e a contagem principal usa o critério
do runtime, que é o que o dono precisa para decidir.

---

## 2. Contagem honesta

Universo classificado: **128 funcionalidades** (derivadas de 129 rotas + automações de backend +
integrações + UX transversal; rotas de debug e sub-rotas paramétricas foram consolidadas).

| Classificação | Qtd | % | Significado |
|---|---:|---:|---|
| ✅ **IMPLEMENTADO_TOTAL** | **0** | **0,0%** | Nenhuma feature tem evidência de uso real em produção neste ambiente |
| 🟨 **IMPLEMENTADO_PARCIAL** | **80** | **62,5%** | Fio completo em código, mas falta uso real, ou falta camada (tabela/cron/bucket) |
| 🟦 **SUGERIDO_OU_INICIADO** | **44** | **34,4%** | Tela existe mas a persistência não; ou é simulação; ou nunca foi ligado |
| ⬛ **MORTO_OU_ABANDONADO** | **4** | **3,1%** | Código sem nenhum caminho de execução que o alcance |

> **Revisão 2:** o universo era **118** na revisão 1. Subiu para 128 porque a recontagem de cobertura
> revelou uma dimensão inteira não classificada — UX transversal, PWA e offline ([§5.12](#512-ux-transversal-pwa-e-offline)),
> que acrescentou 9 🟨 e 1 🟦. Nenhuma reclassificação foi feita para melhorar o número: os
> percentuais mudaram só por aumento do denominador.

**Sub-recorte — apenas maturidade de código (ignorando runtime):** 80 funcionalidades (62,5%) têm
UI + lógica + persistência declarada e coerente. É um número bom. O problema está inteiramente na
camada de **provisionamento do ambiente**.

> **Por que zero ✅:** o critério exige *uso real*. Com 3 usuários (um deles `teste@lovable.com`),
> último acesso há 17 dias e tabelas de negócio com dezenas de linhas de seed, não há evidência de
> uso produtivo de nenhum módulo. Isso é um fato sobre o **ambiente**, não um julgamento sobre o código.

---

## 3. Riscos estruturais, por gravidade

### 🔴 R1 — O ambiente não nasce do repositório (CRÍTICO)

`supabase_migrations.schema_migrations` registra **9 migrations**, todas com prefixo `financeiro_00X_`
e timestamps de `2026-05-21`. O repositório tem **523 migrations** com nomenclatura completamente
diferente. Nenhuma das 523 está registrada como aplicada.

Consequência: **não existe caminho reprodutível do repositório para o ambiente**. Um `supabase db reset`
ou a criação de um ambiente novo produziria um banco diferente do atual — em ambas as direções.

**Evidência:** `mcp supabase_db_migrations` → 9 registros · `ls supabase/migrations | wc -l` → 523
· `supabase/config.toml:1` declara `project_id = "bwwbeyolnnzppeuhgkcd"`.

### 🔴 R2 — 46 tabelas que o código usa não existem no banco (CRÍTICO)

`src/integrations/supabase/types.ts` (21.357 linhas, 279 tabelas tipadas) declara 46 tabelas que
**não existem em nenhuma forma** no banco (verificado via `to_regclass` em consulta direta ao catálogo —
não por inferência). **33 delas têm consumidor ativo** em hooks, páginas ou Edge Functions.

Lista completa e mapeamento tabela → consumidor: [`docs/ESTADO_ATUAL_EVIDENCIAS.md §1`](docs/ESTADO_ATUAL_EVIDENCIAS.md).

#### O modo de falha não é uniforme — e é isso que decide a prioridade

Os 33 consumidores ativos somam **121 pontos de chamada**. Foram classificados um a um pelo tratamento
de erro (detalhe em [`§2 do anexo`](docs/ESTADO_ATUAL_EVIDENCIAS.md)):

| Modo | Pontos | O que o usuário vê | Gravidade |
|---|---:|---|---|
| **Quebra explícita** (`if (error) throw error`) | 32 | Tela de erro / toast de falha | Alta, mas **visível** |
| **Degrada com log** (`if (error) { log; return }`) | 31 | Lista vazia, sem aviso | Média |
| **Degrada em try/catch** | 13 | Nada — segue o fluxo | Baixa (é o comportamento desejado) |
| **Erro descartado** (`const { data } = await …`) | 45 | **Nada. E o resultado pode estar errado.** | **A pior** |

O balde perigoso é o último, não o primeiro. Uma tela que quebra é um chamado aberto no mesmo dia.
Um erro descartado vira decisão errada em silêncio. Dois exemplos verificados linha a linha:

- **`supabase/functions/contabilizar-evento/index.ts:58`** — a checagem de idempotência lê
  `eventos_contabilizacao_log` descartando o erro. Com a tabela ausente, `existente` é sempre `null`,
  o guard de duplicidade **sempre passa**, e o mesmo evento pode ser contabilizado repetidamente.
  Não é uma tela quebrada: é risco de **lançamento contábil duplicado**.
- **`supabase/functions/decidir-regime/index.ts:218` e `:272`** — `await sb.from('tax_audit_trail').insert(…)`
  sem capturar retorno. A trilha de auditoria da decisão de regime tributário **não grava, e ninguém
  fica sabendo**. A função responde 200 normalmente.

#### ⚠️ Correção — `integration_secrets` NÃO é falha de segurança

> **A revisão 1 deste documento afirmava:** *"Caso mais grave: `integration_secrets` é consumida por
> `_shared/auth-guard.ts` e `_shared/webhook-auth.ts` […]. Se o guard depende de uma tabela inexistente,
> todo webhook que passa por ele está com o caminho de validação quebrado."*
>
> **Isso estava errado, e errado na direção perigosa.** Agir sobre essa frase levaria a mexer em código
> de autenticação que está correto. A leitura do código desmente a afirmação:
>
> - `_shared/auth-guard.ts:172-178` — o **fallback por variável de ambiente vem ANTES** da leitura do
>   banco, com comentário explícito: *"permite operar mesmo se a tabela estiver indisponível"*.
> - `_shared/webhook-auth.ts:95-110` — a leitura do banco está dentro de `try/catch` cujo comentário é
>   *"Tabela indisponível não pode virar bypass — cai para o env abaixo"*, seguido de fallback por env.
> - `_shared/webhook-auth.ts:126-140` — sem nenhum segredo, retorna **503 e rejeita a requisição**
>   (`fail-closed`), registrando no log.
>
> **Efeito real da ausência:** perde-se a rotação de segredo sem redeploy. Os webhooks continuam
> autenticando por variável de ambiente e, sem segredo algum, **recusam tráfego** em vez de aceitá-lo.
> É exatamente o comportamento defensivo correto — este código está entre os melhores do repositório.
>
> O erro foi meu: classifiquei por `grep` do nome da tabela, sem ler o tratamento de erro. Foi essa
> lição que originou a tabela de modos de falha acima.

### 🔴 R3 — Zero automação agendada rodando (CRÍTICO)

`select count(*) from cron.job` → **0**. As migrations declaram **16 jobs** (`capture-slow-queries`,
`digest-silenciamentos-erro`, `integrity-invariants-hourly`, `maintain-monthly-partitions`,
`sefaz-observability-hourly`, `refresh-benchmark-setorial-weekly`, entre outros).

Agravante: **`pg_net` não está instalada** (`pg_extension` lista apenas `pg_cron`, `pg_stat_statements`,
`pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`). Seis migrations usam `net.http_post`
para invocar Edge Functions a partir do cron — esse caminho **não funcionaria nem se os jobs fossem
reagendados**.

Este é exatamente o padrão de falha que **não gera chamado**: nada quebra visivelmente, os dados
simplesmente nunca chegam. Explica diretamente por que `acoes_recomendadas`, `resumos_executivos_semanais`,
`anomalias_detectadas` e `fila_cobrancas` estão todas em **0 linhas**.

### 🔴 R4 — Módulo NFe/SEFAZ de emissão é um simulador (CRÍTICO se exposto como real)

`src/lib/sefaz-simulator/handlers.ts` é a implementação real por trás de emissão, cancelamento,
inutilização e contingência de NF-e. Ela **sorteia resultados**:

- `handlers.ts:29` — `if (Math.random() < 0.05)` gera rejeição aleatória
- `NovaNFeForm.tsx:72` — `numero: Math.floor(1000 + Math.random() * 9000)` gera o número da nota
- `ContingenciaNFe.tsx:101` — `const success = Math.random() > 0.1` decide se a transmissão "deu certo"

`docs/FUNCIONALIDADES_SISTEMA.md` classifica "Emissão NFe" como **✅ Produção**. Não é.

**Ressalva importante e favorável:** o caminho de **recepção** de NF-e é real —
`supabase/functions/sefaz-dfe-puxar/index.ts` (519 linhas) faz SOAP autêntico contra a SEFAZ
(`index.ts:175-181`, com `SOAPAction` e certificado de `empresas_certificados`). O simulador afeta
**emissão**, não recepção.

### 🟠 R5 — Storage: 4 dos 5 buckets necessários não existem (ALTO)

Vivo: apenas `comprovantes-financeiro`. Ausentes: `relatorios-tributarios`, `nfe-certificados`,
`notas-fiscais-upload`, `uploads`.

Consequência direta: geração de PDF tributário, upload de certificado digital A1 e upload de XML/NF
não têm onde gravar. Como `empresas_certificados` está em **0 linhas**, o módulo SEFAZ real (R4) também
não tem certificado para operar — ou seja, a única parte genuína do NFe está inerte por falta de insumo.

### 🟠 R6 — 15 RPCs chamadas pelo frontend não existem no banco (ALTO)

`claim_frontend_error_alerts`, `get_frontend_error_groups`, `get_frontend_error_occurrences`,
`silenciar_alerta_erro_frontend`, `get_silenciamentos_expirando`, `claim_silenciamentos_digest`,
`toggle_cron_job`, `delete_cron_job`, `resolve_integrity_alert`, `duplicate_saved_filter`,
`detectar_duplicidades_financeiras`, `gerar_alertas_vencimento`, `gerar_contas_recorrentes`,
`fn_balancete`, `fn_indices_contabeis`.

Concentram-se em **telemetria de erros de frontend** e **gestão de cron pela UI** — precisamente as
ferramentas que o operador usaria para *descobrir* os problemas R1–R3. A instrumentação de
diagnóstico está cega.

Reverificado na revisão 2: as 15 foram consultadas contra `pg_proc` em **todos os schemas**, não só
`public`. Todas ausentes. Nenhum falso positivo sobrou.

### 🟠 R9 — 3 das 14 views `vw_*` usadas pelo código não existem (ALTO)

Dimensão que a revisão 1 **não checou** — só tabelas e funções foram comparadas. Fechada agora:

| View ausente | Consumidor |
|---|---|
| `vw_edge_health` | painel `/admin/edge-health` (junto com a tabela `edge_function_logs`, também ausente) |
| `vw_auditoria_tributaria_recente` | módulo de auditoria tributária |
| `vw_transferencias_painel` | painel de transferências entre contas |

As outras 11 (`vw_contas_pagar_painel`, `vw_contas_receber_painel`, `vw_dre_mensal`, `vw_dso_aging`,
`vw_fluxo_caixa`, `vw_fluxo_caixa_diario`, `vw_gastos_centro_custo`, `vw_metricas_cobranca`,
`vw_saldos_contas`, `vw_tributario_dashboard`, `vw_webhooks_recentes`) **existem** — o núcleo
financeiro está coberto.

### 🟡 R7 — Toolchain não verificável nesta auditoria (MÉDIO)

`node_modules` ausente no ambiente da auditoria. **Não executei build, lint, type-check nem testes.**
Toda análise de código é **estática**.

Contagem estática: 202 arquivos de teste em `src/`, **2.252 casos** `it()/test()`, 574 `describe()`,
**0 ocorrências de `.skip`/`.only`** (bom sinal — nenhuma suíte silenciosamente desligada), 26 specs E2E.
`supabase/tests/` está **vazio** (0 arquivos `.ts`), embora `.github/workflows/deno-tests.yml` exista.

Não afirmo que os testes passam. Afirmo que existem, que nenhum está desligado, e que o número real
(2.252) é **maior** que o "1.012" alegado em `.lovable/memory/quality/auditoria-testes-p15.md`.

### 🔴 R8 — O CI nunca ficou verde: 30 de 30 execuções em `main` falharam (CRÍTICO)

> **Revisão 2 — achado reclassificado de 🟡 MÉDIO para 🔴 CRÍTICO.** A revisão 1 dizia apenas que
> alguns passos eram condicionados a secrets e marcava a conclusão real como `NAO_VERIFICADO`. O
> histórico do Actions foi consultado e o quadro é bem pior do que "gate que aparenta verde".

Consulta ao histórico do workflow `ci.yml` no branch `main`:

| | |
|---|---|
| Execuções analisadas | **30** (as mais recentes disponíveis) |
| Janela | 2026-07-28 → 2026-08-15 (19 dias) |
| Conclusão `success` | **0** |
| Conclusão `failure` | **30** |
| Merges para `main` nessa janela | **19 pull requests** |

**Não existe uma única execução verde na janela observável.** E 19 PRs foram integrados a `main`
mesmo assim — inclusive todos os `fix:` de auditoria dos últimos dias (`#10` a `#19`). O gate existe,
roda, falha, e **não bloqueia merge**.

Isso reenquadra tudo o que este documento diz sobre qualidade: a rede de segurança do projeto está
desligada há pelo menos 19 dias, e ninguém foi avisado — mesmo padrão de falha silenciosa do R3.

**Duas causas confirmadas nesta auditoria** (pode haver mais):

1. **`zod-coverage`** — `scripts/security/zod-coverage.baseline` contém `0`, mas 10 Edge Functions
   consomem `req.json()` sem `validatePayload`. O gate falha em toda execução.
2. **Suíte E2E não conseguia nem coletar** — desde `694e400` (2026-08-14), `e2e/auth/admin-rbac.e2e.ts`
   usava `test.beforeEach((_fixtures, …))`, padrão que o Playwright rejeita na coleta, matando os 3
   shards inteiros. Corrigido nesta branch (`50c28ef`).

**E uma terceira causa, identificada mas não corrigida:** com a coleta destravada, os testes rodam e
**37 falham** por erro de boot da aplicação. `src/integrations/supabase/client.ts:19-34` exige
**três** variáveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
e lança erro explícito se qualquer uma faltar. O job `e2e` do `ci.yml` (linhas 199-207) injeta
**apenas as duas primeiras** — `VITE_SUPABASE_PROJECT_ID` não é passada. A aplicação não sobe, e todo
teste que depende de UI falha.

Correção necessária no `ci.yml`, dentro do `env:` do passo de E2E:

```yaml
VITE_SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

**Depende de um secret do repositório que não consigo ver nem criar** — por isso está aqui como
recomendação, não como commit. Ver [§8, item `G`](#-exige-decisão-sua--toca-provisionamentoprodução).

**Ainda em pé da revisão 1:** 6 passos do job `quality-gate` são guardados por
`if: ${{ env.DATABASE_URL != '' }}` ou equivalente (linhas 50, 65, 84, 102, 120, 127). Sem os secrets,
**passam sem executar**. Não é a causa do vermelho atual, mas é cobertura que não existe.

---

## 4. O que está bom (não distorcendo o quadro)

Vale registrar com a mesma honestidade:

- **Higiene de schema no banco vivo é excelente.** 455 policies RLS para 242 tabelas; das tabelas
  vivas, apenas 5 estão sem RLS e 3 delas são scratch (`_dbg`, `_t`, `_v4`).
- **Motores tributários são reais e bem estruturados.** `_shared/tributario-logic.ts` concentra a
  lógica; as Edge Functions `simular-simples/presumido/real` são wrappers finos (19–28 linhas) com
  validação Zod — separação correta, não stub.
- **Recepção SEFAZ é implementação genuína**, com SOAP real e tratamento de certificado.
- **Nenhum teste unitário desligado.** Zero `.skip`/`.only` em 2.252 casos.
  > **⚠️ Correção (revisão 2).** A revisão 1 dizia apenas *"Nenhum teste desligado"*, o que induzia ao
  > erro. Vale para os 2.252 testes unitários. **Não valia para os 26 specs E2E**: desde
  > `694e400` (2026-08-14 18:59), `e2e/auth/admin-rbac.e2e.ts` tinha
  > `test.beforeEach((_fixtures, testInfo) => …)`, e o Playwright **aborta na coleta** com esse padrão.
  > Como a falha é na coleta, os 3 shards morriam inteiros — **a suíte E2E estava efetivamente
  > desligada há 2 dias**, e nenhum dos 26 specs rodava.
  > Meu grep procurava `.skip`/`.only` e não pegava erro de sintaxe. Corrigido em `50c28ef`
  > (restaura a forma `({}, testInfo)`, que era a original antes do sweep de lint).
- **Client Supabase falha cedo e explicitamente** quando falta configuração
  (`src/integrations/supabase/client.ts:19-34`) — em vez de apontar silenciosamente para o projeto errado.
  É exatamente a decisão certa.
- **Histórico recente de commits mostra rigor.** Os últimos ~10 commits são correções de bugs reais
  encontrados por auditoria (`6dcc95d fix: perda silenciosa de dados`, `00ea11e fix: divergencias edge
  functions x frontend`). O time está caçando esta classe de problema ativamente.
  > **⚠️ Ressalva (revisão 2).** O esforço é real, mas **os 19 PRs dessa janela foram integrados a
  > `main` com o CI vermelho** — nenhuma das 30 execuções passou ([§3 R8](#-r8--o-ci-nunca-ficou-verde-30-de-30-execuções-em-main-falharam-crítico)).
  > Ou seja: as correções foram feitas sem verificação automatizada confirmando que não quebraram
  > outra coisa. Isso não anula o mérito — reposiciona o risco.
- **Os 47 `TODO(2026-08-14)`** em `src/` não são dívida esquecida: são marcações honestas de colunas
  removidas de INSERTs por não existirem no schema canônico. Documentam a divergência em vez de escondê-la.

---

## 5. Classificação por dimensão

Legenda: ✅ total · 🟨 parcial · 🟦 sugerido/iniciado · ⬛ morto
`AUSENTE` = objeto verificado como inexistente no banco vivo.

### 5.1 Financeiro core

| Funcionalidade | Rota / evidência | Persistência | Cls | O que falta |
|---|---|---|---|---|
| Contas a pagar | `/contas-pagar` · `pages/ContasPagar.tsx` | `contas_pagar` (20 linhas) | 🟨 | Uso real; volume é seed |
| Contas a receber | `/contas-receber` | `contas_receber` (20) | 🟨 | Uso real |
| Bloqueios de duplicidade | `/contas-pagar/bloqueios` | `bloqueios_duplicidade` (6) | 🟨 | RPC `detectar_duplicidades_financeiras` **AUSENTE** |
| Boletos | `/boletos` | `boletos` (6) | 🟨 | Uso real |
| Pix Hub | `/pix-hub` | `pix_templates` (0) | 🟦 | Tabela vazia; nenhum template criado |
| Tesouraria | `/tesouraria` | `contas_bancarias` (0) | 🟦 | Sem conta bancária cadastrada |
| Movimentações | `/movimentacoes` | `movimentacoes` (30) | 🟨 | Uso real |
| Transferências | `/contas-bancarias` | `transferencias` (0) | 🟦 | Tabela vazia |
| Categorias | `/categorias` | `categorias` (0) | 🟦 | Tabela vazia |
| Plano de contas | `/contabilidade` | `plano_contas` (0) | 🟦 | Tabela vazia |
| Centros de custo | `/centro-custos` | `centros_custo` (0) | 🟦 | Tabela vazia |
| Pagamentos recorrentes | `/pagamentos-recorrentes` | `pagamentos_recorrentes` | 🟦 | RPC `gerar_contas_recorrentes` **AUSENTE** |
| Orçamentos | `/orcamentos` · `pages/Orcamentos.tsx:44` | `budgets` (0) | 🟨 | Implementado (contradiz doc — ver §9); tabela vazia |
| Metas financeiras | `/metas` | `metas_financeiras` (0) | 🟦 | Tabela vazia |
| Compras / pedidos | `/compras` | `pedidos_compra` (0) | 🟦 | Tabela vazia; TODO de colunas inexistentes |
| Contratos | `/contratos` | `contratos` (0) | 🟦 | Tabela vazia |
| Anexos financeiros | — | `anexos_financeiros` (0) | 🟦 | Bucket `uploads` **AUSENTE** |
| Fornecedores | `/fornecedores` | `fornecedores` (5) | 🟨 | Uso real |
| Clientes | `/clientes` | `clientes` (12) | 🟨 | Uso real |
| Empresas | `/empresas` | `empresas` (1) | 🟨 | Uso real |
| Vendedores | `/vendedores` | `vendedores` (0) | 🟦 | Tabela vazia |
| Orçamento de evento | `/orcamento-evento` | — | 🟨 | Uso real |
| Simulador antecipação | `/simulador-antecipacao` | cálculo local | 🟨 | Uso real |

### 5.2 Cobranças e inadimplência

| Funcionalidade | Rota / evidência | Persistência | Cls | O que falta |
|---|---|---|---|---|
| Régua de cobrança (config) | `/cobrancas` | `regua_cobranca` (0) | 🟦 | Nenhuma régua configurada |
| Régua — execução | `functions/executar-regua-cobranca` | `execucoes_regua_cobranca` **AUSENTE** | 🟦 | Tabela inexistente + sem cron + sem invoker |
| Fila de cobranças | `functions/processar-fila-cobrancas` | `fila_cobrancas` (0) | 🟦 | Cron ausente |
| Execuções de cobrança | — | `execucoes_cobranca` (10) | 🟨 | Uso real |
| Acordos de parcelamento | `/cobrancas` | `acordos_parcelamento` (0) | 🟦 | Tabela vazia |
| Protestos / negativações | `/cobrancas` | `protestos`(0)/`negativacoes`(0) | 🟦 | Tabelas vazias |
| WhatsApp IA | `functions/whatsapp-ai-analyzer` | `whatsapp_conversas` (0) | 🟦 | Zero tráfego |
| Scoring de clientes | `/clientes/scoring` | `clientes.score` | 🟨 | Uso real |
| Portal do cliente | `/portal-cliente`, `/clientes/portal-tokens` | `portal_cliente_tokens` (0) | 🟦 | Nenhum token emitido |

### 5.3 Conciliação bancária

| Funcionalidade | Rota / evidência | Persistência | Cls | O que falta |
|---|---|---|---|---|
| Conciliação (tela) | `/conciliacao` | `conciliacoes` (10) | 🟨 | Uso real |
| Divergências | — | `divergencias_conciliacao` (10) | 🟨 | Uso real |
| Import OFX/CSV | `lib/ofx-parser` | `transacoes_bancarias` (16) | 🟨 | Uso real |
| Extratos importados | — | view `extratos_bancarios_importados` | 🟨 | É **view**, não tabela — colunas do INSERT divergem (TODO em hooks) |
| Regras automáticas | — | `regras_conciliacao` (0) | 🟦 | Nenhuma regra cadastrada |
| Conciliação IA | `functions/conciliacao-ia` | `historico_conciliacao_ia` (0) | 🟦 | Zero execuções |
| Conciliação retroativa | — | `logs_conciliacao_retroativa` (0) | 🟦 | Zero execuções |
| Open Finance | `functions/open-finance` | `open_finance_consents` (0) | 🟦 | `index.ts:148` retorna lista **simulada** de bancos; base default é sandbox |

### 5.4 Tributário e Reforma 2026

O maior módulo do sistema: **41 rotas** sob `/tributario/*` + `/reforma-tributaria`.

| Funcionalidade | Rota | Persistência | Cls | O que falta |
|---|---|---|---|---|
| Motores Simples/Presumido/Real | `functions/simular-*` + `_shared/tributario-logic.ts` | cálculo puro | 🟨 | Lógica real e testada; falta uso |
| Calculadora tributária | `/tributario/calculadora` | cálculo local | 🟨 | Uso real |
| Cálculo IVA / transição | `functions/calculo-iva` | cronograma hardcoded 2026-2033 | 🟨 | Sem invoker no repo |
| Decidir regime | `functions/decidir-regime` | `regime_decision_cache` **AUSENTE**, `tax_audit_trail` **AUSENTE** | 🟦 | Cache e trilha não existem |
| Apurações tributárias | `/tributario` | `apuracoes_tributarias` (3) | 🟨 | Uso real |
| IRPJ/CSLL | `/tributario/irpj-csll` | `apuracoes_irpj_csll` (0) | 🟦 | Tabela vazia |
| PIS/COFINS, IPI/ISS, ICMS-ST, Monofásico | 4 rotas | `operacoes_tributaveis` (0) | 🟦 | Tabelas vazias |
| Retenções de fonte | `/tributario/retencoes` | `retencoes_fonte` (0) | 🟦 | Tabela vazia |
| Créditos tributários | — | `creditos_tributarios` (0) | 🟦 | Tabela vazia |
| PER/DCOMP | `/tributario/per-dcomp` | `per_dcomp` (0) | 🟦 | Tabela vazia |
| DARFs | `/tributario/darf` | `darfs` (0) | 🟦 | Tabela vazia |
| Split payment | `/tributario/split-payment` | `split_payment_transacoes` (0) | 🟦 | Tabela vazia |
| Incentivos fiscais | `/tributario/incentivos` | `incentivos_fiscais` · `beneficios_fiscais` **AUSENTE** | 🟦 | Tabela de benefícios não existe |
| Oportunidades de elisão | `/tributario/oportunidades-elisao` | `estrategias_elisao` **AUSENTE**, `elisao_simulacoes_regime` **AUSENTE** | 🟦 | 2 tabelas centrais ausentes (`ElisaoFiscalTab.tsx`) |
| Projeção da reforma | `/tributario/projecao-reforma` | `projecoes_reforma` **AUSENTE** | 🟦 | Tabela ausente |
| Simulação de regimes | `/tributario/simulacao-regimes` | `regimes_simulados` (0) · `simulacoes` **AUSENTE** | 🟦 | Tabela ausente |
| Glossário tributário | `/tributario/glossario` | `glossario_tributario` **AUSENTE** | 🟦 | `GlossarioTributario.tsx:19` consulta tabela inexistente |
| Obrigações acessórias | `/tributario/obrigacoes` | `obrigacoes_acessorias` **AUSENTE** | 🟦 | Tabela ausente |
| Catálogos fiscais | `/tributario/catalogos-fiscais` | `catalogos_fiscais_cargas` **AUSENTE** | 🟨 | Dados de referência vivos (NCM, CNAE, alíquotas, ISS) mas tabela de cargas ausente |
| Auditoria tributária | `/tributario/auditoria` | `auditoria_tributaria` **AUSENTE** | 🟦 | Tabela ausente |
| Overlay de rejeições | `/tributario/auditoria-overlay` | `overlay_rejeicoes_auditoria` **AUSENTE** | 🟦 | Tabela ausente (hook + edge) |
| Fechamento mensal | `/tributario/fechamento-mensal` | `fechamentos_tributarios` | 🟦 | Sem cron; sem invoker |
| Conformidade fiscal | `/tributario/comparativo-conformidade` | `conformidade_snapshots` (12) | 🟨 | Uso real; cron de snapshot ausente |
| Digest de conformidade | `/tributario/preferencias-digest`, `/observabilidade-digest` | `digest_envios_log` · `integration_secrets` **AUSENTE** | 🟦 | Auth do digest depende de tabela ausente |
| SPED ECD/ECF | `/tributario/sped` | `sped_contabil_arquivos` | 🟨 | Wizard implementado; bucket ausente |
| Exportação SPED Contribuições | `functions/exportar-sped-contribuicoes` | — | 🟨 | Sem uso registrado |
| Relatórios contábeis | `/tributario/relatorios-contabeis` | RPCs `fn_balancete`, `fn_indices_contabeis` **AUSENTES** | 🟦 | 2 RPCs inexistentes |
| PDF tributário | `functions/gerar-pdf-tributario` | bucket `relatorios-tributarios` **AUSENTE** | 🟦 | Sem onde gravar |
| Certificados digitais | `/tributario/certificados-digitais` | `empresas_certificados` (0) · bucket `nfe-certificados` **AUSENTE** | 🟦 | Bucket ausente + zero certificados |
| Onboarding tributário | `/tributario/onboarding` | `cnpja_cache` **AUSENTE** | 🟨 | Cache CNPJá ausente (degrada, não quebra) |
| Benchmark setorial | `/benchmarking` | `benchmarks_setoriais` **AUSENTE** | 🟦 | Tabela ausente + cron ausente |
| Folha/encargos, histórico financeiro, PF vinculada, recomendação, cashback, comparativo, importação XML, dashboard | 8 rotas | `faturamento_mensal`(0), `folha_pagamento`(0) | 🟦 | Tabelas vazias |
| Alertas tributários | `functions/gerar-alertas-tributarios` | `alertas_tributarios` (0) | 🟦 | Depende de `benchmarks_setoriais` e `edge_function_logs` — ambas **AUSENTES** |

### 5.5 NFe e SEFAZ

| Funcionalidade | Evidência | Cls | O que falta |
|---|---|---|---|
| Emissão NF-e | `lib/sefaz-simulator/handlers.ts:29` · `NovaNFeForm.tsx:72` | 🟦 | **É simulação** — `Math.random()` gera número e resultado |
| Cancelamento NF-e | `CancelamentoNFe.tsx:96` → `processarSefaz` | 🟦 | Mesma simulação |
| Inutilização NF-e | `InutilizacaoNFe.tsx:112` | 🟦 | Mesma simulação |
| Contingência | `ContingenciaNFe.tsx:101` | 🟦 | `Math.random() > 0.1` decide sucesso |
| **Recepção DF-e (SEFAZ real)** | `functions/sefaz-dfe-puxar/index.ts:175-181` | 🟨 | **SOAP genuíno**; falta certificado (`empresas_certificados` = 0) e cron |
| Manifestação NF-e | `functions/sefaz-manifestar` · RPC `nfe_apply_manifestacao` (viva) | 🟨 | RPC existe no banco; sem invoker no repo |
| Vínculo NF-e → conta a pagar | RPCs `nfe_link_conta_pagar`, `nfe_suggest_contas_pagar` (vivas) | 🟨 | Backend real; `nfe_recebidas` tem 31 linhas |
| NF-e recebidas | `/tributario/nfe-recebidas` | 🟨 | Uso real (31 linhas) |
| Observabilidade SEFAZ | `/tributario/sefaz-observabilidade` · `sefaz_dfe_cursor` (2) | 🟨 | Cron `sefaz-observability-hourly` **não agendado** |
| OCR de NF | `functions/processar-nf-ocr` · `notas_fiscais_ocr` (3) | 🟨 | Uso real mínimo |
| Comprovante OCR | `/comprovante-ocr` | 🟨 | Uso real |

### 5.6 Integrações

| Integração | Evidência | Tráfego real | Cls | O que falta |
|---|---|---|---|---|
| **Asaas** (boletos/pagamentos) | `functions/asaas-proxy` (879 linhas), `asaas-webhook` | `asaas_payments` 0, `asaas_config` 0 | 🟦 | Nunca configurada; `asaas_credit_risk_analysis` **AUSENTE** |
| **Bling ERP** | `functions/bling-proxy` (563 l.), `bling-webhook` | — | 🟦 | `bling_tokens`, `bling_sync_logs`, `bling_webhook_events` **TODAS AUSENTES** (`hooks/bling/useSyncLogs.ts:9,24`) |
| **Bitrix24 CRM** | `functions/bitrix24-sync` (754 l.), `bitrix24-webhook` | `bitrix_sync_logs` 0, `bitrix24_tokens` 0 | 🟦 | `bitrix_oauth_tokens` **AUSENTE**; zero sincronização |
| **CNPJá** | `functions/cnpja-lookup` | — | 🟨 | `cnpja_cache` **AUSENTE** (degrada p/ chamada direta) |
| **SEFAZ (recepção)** | `functions/sefaz-dfe-puxar` | `sefaz_dfe_cursor` 2 | 🟨 | Sem certificado, sem cron |
| **Open Finance** | `functions/open-finance:148` | `open_finance_consents` 0 | 🟦 | Lista de bancos é **simulada**; base = sandbox |
| **WhatsApp (Evolution)** | `functions/whatsapp-webhook`, `whatsapp-ai-analyzer` | `whatsapp_conversas` 0 | 🟦 | Zero tráfego; webhook sem invoker |
| **n8n** | `functions/n8n-dispatch`, `n8n-callback` | `n8n_dispatch_logs` 0, `n8n_workflow_configs` 0 | 🟦 | Nenhum workflow configurado |
| **SSO / SAML** | `functions/sso-callback` (925 l.), `sso-initiate`, `sso-logout` | `sso_providers` 4 | 🟨 | `sso_role_mappings`, `sso_user_groups`, `sso_sandbox_runs` **AUSENTES** (`hooks/useSSO.ts:100`) |
| **SCIM** | `functions/scim-server` (819 l.) | `scim_tokens` 0 | 🟦 | `scim_operations_log` **AUSENTE**; nenhum token |
| **Mapbox** | `functions/get-mapbox-token` (17 l.) | — | 🟨 | Proxy de token apenas |
| **Web Push (VAPID)** | `functions/get-vapid-key`, `send-push-notification` | — | 🟦 | `push_subscriptions` **AUSENTE** (`useWebPushSubscription.ts:75`) |
| **Resend (e-mail)** | `functions/enviar-alerta-email` | — | 🟦 | Sem invoker algum no repo |
| **Lalamove / logística** | `/logistica` · `drivers`, `lalamove_orders`, `tracking_events` vivas | 0 linhas | ⬛ | Tabelas vivas **não declaradas em nenhuma migration do repo** — herança de outro projeto |

### 5.7 IA e assistentes

| Funcionalidade | Rota / evidência | Persistência | Cls |
|---|---|---|---|
| Expert Agent | `/expert` · `functions/expert-agent` | `expert_conversations` 0, `expert_messages` 0 | 🟦 |
| Copilot global | `functions/copilot-global` | — | 🟦 (sem invoker) |
| Copilot tributário | `functions/copilot-tributario` | — | 🟦 (sem invoker) |
| Análise preditiva | `functions/analise-preditiva`, `executar-analise-preditiva` | `historico_analises_preditivas` 0 | 🟦 |
| Alertas preditivos | — | `alertas_preditivos` (6) | 🟨 |
| Detector de anomalias | `functions/detectar-anomalias-financeiras` (374 l.) | `anomalias_detectadas` 0 | 🟦 (cron ausente) |
| Health score operacional | `functions/calcular-health-score-operacional` | `health_scores_operacionais` (4) | 🟨 |
| Centro de ações IA | `/inteligencia` · `functions/gerar-acoes-recomendadas` | `acoes_recomendadas` 0 | 🟦 |
| Resumo executivo semanal | `functions/gerar-resumo-executivo-semanal` | `resumos_executivos_semanais` 0 | 🟦 (cron ausente) |
| Resumo financeiro diário | `functions/gerar-resumo-financeiro-diario` | — | 🟦 |
| Insights de relatório | `functions/insights-relatorio` | — | 🟦 |
| Análise de fluxo IA | `functions/analise-fluxo-ia` | — | 🟦 |
| Categorização de despesa | `functions/categorizar-despesa` | — | 🟦 |
| Recomendação de metas IA | — | `recomendacoes_metas_ia` 0 | 🟦 |
| Auditoria de IA | `/admin/auditoria-ia` | — | 🟨 |

### 5.8 Aprovações, compliance e LGPD

| Funcionalidade | Rota | Persistência | Cls |
|---|---|---|---|
| Fluxo de aprovações | `/aprovacoes` | `solicitacoes_aprovacao` 0, `configuracoes_aprovacao` 0 | 🟦 |
| Comentários de aprovação | — | `aprovacao_comentarios` 0 · TODO de colunas divergentes | 🟦 |
| Centro de privacidade LGPD | `/configuracoes/privacidade` | `solicitacoes_lgpd` 0 | 🟦 |
| Compliance admin | `/admin/compliance` | `verificacoes_conformidade` 0 | 🟦 |
| Pacote de evidências | `functions/gerar-pacote-evidencias` | `evidencias_pacotes` 0 | 🟦 |
| Retenção de dados | — | `retencao_politicas` **AUSENTE** | 🟦 |
| Assinatura digital | `/assinatura-digital` | — | 🟨 |
| Audit logs | `/audit-logs` | `audit_logs` (423, particionada) | 🟨 |

### 5.9 Observabilidade e administração

| Funcionalidade | Rota | Evidência | Cls |
|---|---|---|---|
| Telemetria de queries | `/admin/telemetria` | `query_telemetry` 3.309, `slow_query_alerts` 2.457 | 🟨 |
| Alertas de performance | — | `performance_alerts` 807 | 🟨 |
| Monitor de bloat | `/admin/bloat-monitor` | `bloat_snapshots` 2.340 | 🟨 |
| Edge health | `/admin/edge-health` | `edge_function_logs` **AUSENTE** (`AdminEdgeHealth.tsx:76`) | 🟦 |
| System health / SLO | `/admin/system-health` | `slo_metrics_diarias` **AUSENTE** | 🟦 |
| SRE Command Center | `/admin/sre` | RPCs `toggle_cron_job`, `delete_cron_job` **AUSENTES** | 🟦 |
| Telemetria de erros de frontend | — | `frontend_error_alert_state` **AUSENTE** + 5 RPCs **AUSENTES** | 🟦 |
| Integrity alerts | — | `integrity_alerts` 0 · RPC `resolve_integrity_alert` **AUSENTE** | 🟦 |
| Webhook DLQ / replay | `functions/webhook-replay`, `webhook-retry-worker` | `webhook_dlq` (4) | 🟨 |
| API keys | `/admin/api` | `api_keys` 0 · edge `api-keys-manage` **NÃO EXISTE** | 🟦 |
| Campos customizados | `/admin/campos-customizados` | `custom_field_definitions` 0 | 🟦 |
| Filtros salvos / compartilhados | `/configuracoes/filtros-salvos`, `/admin/filtros-compartilhados` | `saved_filters` 0 · `saved_filter_subscriptions` **AUSENTE** | 🟦 |
| Histórico de notificações | `/configuracoes/notificacoes/historico` | `notification_history` **AUSENTE** (`HistoricoNotificacoes.tsx:86`) | 🟦 |
| Sino de notificações | `/configuracoes/notificacoes/sino` | `alertas` (10) | 🟨 |
| Status page | `/status` · `functions/health` | — | 🟨 |
| Relatórios agendados | `/relatorios` | `relatorios_agendados` + `historico_relatorios` **AUSENTES** (`useRelatoriosAgendados.ts:53,67`) | 🟦 |
| Organizações / convites | `/organizacoes`, `/convite/:token` | `organizacao_membros` + `convites` **AUSENTES** (`useOrganizacoes.ts:84,124`) | 🟦 |
| Convite de contador | `/contador/:token` | `convites_contador` **AUSENTE** | 🟦 |
| Alertas de segurança | `/seguranca` | `security_alerts` **AUSENTE** (`useSecurityAlerts.ts:66`) | 🟦 |
| Contabilização automática | `/contabilidade` | `regras_contabilizacao_automatica` + `eventos_contabilizacao_log` **AUSENTES** | 🟦 |

### 5.10 Segurança e autenticação

| Funcionalidade | Evidência | Cls |
|---|---|---|
| Login / signup / reset | `/auth`, `/reset-password` · `auth.users` (3) | 🟨 |
| RBAC 4 papéis | `has_role`, `has_any_role`, `get_user_roles` (vivas) · `user_roles` (3) | 🟨 |
| RLS | 455 policies em 242 tabelas | 🟨 |
| Lockout de login | `check_login_lockout_v2`, `record_failed_login_v2` (vivas) · `account_lockouts` **AUSENTE** | 🟨 |
| Restrição IP/Geo | `is_ip_allowed_for_login`, `is_country_blocked` (vivas) · `allowed_ips` 0 | 🟦 |
| Dispositivos conhecidos | `is_known_device` (viva) · `dispositivos_conhecidos` 0 | 🟦 |
| WebAuthn / passkeys | `webauthn_credentials` 0 · edges `webauthn-register`/`verify` **NÃO EXISTEM** | 🟦 |
| MFA | `mfa_sessions` 0 | 🟦 |
| Sessões ativas | `user_sessions` (4) | 🟨 |
| Auditoria de acessos suspeitos | `acessos_suspeitos` **AUSENTE** · RPC `get_acessos_suspeitos` **AUSENTE** | 🟦 |

### 5.11 Código morto ou abandonado (⬛)

| Item | Evidência de ausência de chamador |
|---|---|
| Módulo logística/entregas | `/logistica` + tabelas `drivers`, `driver_*`, `lalamove_*`, `tracking_events`, `active_tracking` vivas no banco e **sem nenhuma migration no repo que as declare**. Domínio alheio ao produto (entregas), herdado do projeto de origem. |
| `functions/evaluate-delivery-alerts` (403 linhas) | Sem `invoke()`, sem menção em `src/`, sem cron. Pertence ao domínio de entregas. |
| Tabelas scratch `_dbg`, `_t`, `_v4` | Vivas no banco, sem RLS, sem declaração no repo, sem consumidor. |
| 17 Edge Functions sem chamador algum | `calcular-slo-metrics-diario`, `calculo-iva`, `ci-security-gate-log`, `compare-schemas`, `enviar-alerta-email`, `enviar-relatorios-tributarios-agendados`, `executar-analise-preditiva`, `executar-regua-cobranca`, `gerar-alertas-dispatcher`, `n8n-callback`, `n8n-dispatch`, `relatorio-diario-anomalias`, `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar`, `sync-profile-to-bitrix`, `webhook-replay`, `whatsapp-webhook` — verificado: zero `invoke()`, zero menção em `src/`, zero menção em migrations. *Ressalva:* webhooks são chamados externamente e não teriam invoker; classifico como 🟦 e não ⬛ os que são webhook por natureza. Os cron-only (`executar-regua-cobranca`, `sefaz-dfe-*`) estão inertes porque o cron não existe. |

---

### 5.12 UX transversal, PWA e offline

> **Dimensão acrescentada na revisão 2.** A recontagem de cobertura mostrou que **22 dos 72
> diretórios de `src/components/` nunca foram citados** na revisão 1. A maioria correspondia a
> features já classificadas por rota (`/fluxo-caixa`, `/demonstrativos`, `/usuarios`…), mas **estas 10
> eram lacuna real**: nenhuma tinha classificação. Todas foram verificadas como **efetivamente
> ligadas** (têm consumidores fora do próprio diretório).

| Funcionalidade | Evidência | Consumidores externos | Cls |
|---|---|---:|---|
| Layout / shell da aplicação | `src/components/layout/` (24 arq., 2.214 linhas) | 91 | 🟨 |
| Navegação, `BackButton`, atalhos | `src/components/navigation/` (396 linhas) | 2 | 🟨 |
| Command palette (Ctrl+K) | `src/components/command-palette/` (366 linhas) | 1 | 🟨 |
| Quick create | `src/components/quick-create/` (308 linhas) | 1 | 🟨 |
| Componentes de analytics | `src/components/analytics/` (5 arq., 871 linhas) | 3 | 🟨 |
| Modo offline | `src/components/offline/` + `src/lib/offline/` (IndexedDB, `indexedDB.open`) | 1 | 🟨 |
| PWA / install prompt | `src/components/pwa/` (68 linhas) | 1 | 🟨 |
| Tema claro/escuro | `src/components/theme/` (76 linhas) | 3 | 🟨 |
| Acessibilidade | `src/components/accessibility/` (18 linhas) | 3 | 🟨 |
| **Web Push** | `src/components/settings/PushNotificationsBanner.tsx` + `useWebPushSubscription.ts:75` | 1 | 🟦 |

Web Push é o único 🟦 do grupo: depende de `push_subscriptions`, **ausente no banco**. O hook faz
`if (error) throw error` dentro de try/catch e exibe toast de erro — falha visível ao usuário ao
tentar ativar notificações.

## 6. Fase E — Runtime: o que foi VERIFICADO e o que não foi

| Verificação | Status | Resultado |
|---|---|---|
| Objetos declarados × vivos (tabelas) | ✅ VERIFICADO | 46 ausentes; 35 vivas não declaradas |
| Objetos declarados × vivos (funções/RPC) | ✅ VERIFICADO | 15 RPCs chamadas e ausentes |
| Tabelas que deveriam ter dado e estão vazias | ✅ VERIFICADO | Maioria das tabelas de feature em 0 linhas |
| Jobs agendados | ✅ VERIFICADO | `cron.job` = 0 de 16 declarados |
| Extensões do banco | ✅ VERIFICADO | `pg_net` ausente → cron→edge inviável |
| Storage buckets | ✅ VERIFICADO | 1 de 5 existe |
| Migrations aplicadas × versionadas | ✅ VERIFICADO | 9 aplicadas × 523 versionadas — sem correspondência |
| Usuários e último acesso | ✅ VERIFICADO | 3 usuários; último login 2026-07-30 |
| **Histórico de execução dos jobs** | ⛔ NAO_VERIFICADO | `cron.job_run_details` não consultado — sem jobs, sem histórico |
| **Logs das Edge Functions** | ⛔ NAO_VERIFICADO | Sem acesso à Management API deste projeto |
| **Quais Edge Functions estão de fato implantadas** | ⛔ NAO_VERIFICADO | `functions_list` requer token de Management API |
| **Conclusão real dos checks de CI** | ✅ VERIFICADO (rev. 2) | **30 de 30 execuções em `main` falharam** (2026-07-28 → 2026-08-15). Zero verdes |
| **Suíte E2E executa?** | ✅ VERIFICADO (rev. 2) | Não coletava desde 2026-08-14; destravada em `50c28ef`, agora **37 falham** por erro de boot (falta `VITE_SUPABASE_PROJECT_ID` no job) |
| **Build / lint / type-check / testes** | ⛔ NAO_VERIFICADO | `node_modules` ausente — análise 100% estática |
| **Secrets configurados no vault** | ⛔ NAO_VERIFICADO | Não inspecionados (decisão deliberada) |

### Ressalva de escopo do banco — importante

O banco auditado foi acessado via o MCP **`SUPABASE - PROMO FINANCE V2`**. Confirmei que é um ambiente
**do dono** (`auth.users` contém `ti@promobrindes.com.br` e `adm01@promobrindes.com.br`) e que o schema
é do domínio correto (financeiro/tributário brasileiro).

**Não consegui confirmar programaticamente que o `project_ref` deste banco é `bwwbeyolnnzppeuhgkcd`**,
o valor declarado em `supabase/config.toml:1`. Se existir **outro** projeto Supabase servindo a produção
real, toda a seção de runtime (§3 R1–R3, R5, R6 e §6) precisa ser reexecutada contra ele — e os achados
podem mudar substancialmente.

**Este é o item nº 1 a confirmar antes de agir sobre qualquer conclusão deste documento.**

---

## 7. O que esta auditoria NÃO cobriu

Declarado explicitamente, não escondido:

1. **Leitura linha a linha do código.** 278.451 linhas em `src/` excedem em muito o que é auditável
   com fidelidade nesta sessão. A auditoria operou em **altitude de módulo/funcionalidade**, com
   mergulhos dirigidos onde a evidência de runtime apontou problema. Não afirmo ter lido 100% dos arquivos.
2. **Corretude da lógica de negócio tributária.** Não validei se o cálculo do Simples Nacional, do
   Lucro Presumido/Real ou do cronograma da reforma está **fiscalmente correto**. Verifiquei que o
   código existe, é estruturado e tem testes — não que os números batem com a legislação.
3. **Qualidade real dos 2.252 testes.** Não executei nenhum. Não verifiquei se algum é *teste-espelho*
   (que reimplementa a lógica em vez de importar o alvo) nem se há asserção vacuamente verdadeira.
   Verifiquei apenas que nenhum está desligado por `.skip`/`.only`.
4. **Segurança das 455 policies RLS.** Contei-as; não auditei se alguma é permissiva demais.
5. **Acessibilidade, performance de front, bundle size.**
6. **As 523 migrations individualmente.** Foram inventariadas por objeto declarado (tabela/função/view),
   não lidas uma a uma.
7. **Conteúdo de secrets e vault.**

---

## 8. Próximos passos, por valor

### 🟢 Barato e seguro — posso fazer sozinho, sem tocar produção

| # | Ação | Valor |
|---|---|---|
| 1 | Gerar o **diff SQL completo** repo → banco: script que lista, para cada uma das 46 tabelas e 15 RPCs ausentes, a migration exata que a declara | Transforma o achado em plano de correção executável |
| 2 | **Corrigir os documentos errados** em `docs/` e `.lovable/memory/` (§9), com bloco de errata preservando o original | Para o próximo agente/dev não herdar premissa falsa |
| 3 | Mapear as **16 declarações de cron** → arquivo, schedule e comando, em uma tabela única | Base para reagendar de uma vez |
| 4 | Auditar os 2.252 testes procurando **teste-espelho** e asserção vacuamente verdadeira (estático) | Descobre se a rede de segurança protege de fato |
| 5 | Marcar explicitamente o módulo NFe de emissão como **simulação** na própria UI | Elimina o risco de alguém confiar num número de nota sorteado |

### 🟠 Exige decisão sua — toca provisionamento/produção

| # | Ação | Por que é sua decisão |
|---|---|---|
| A | **Confirmar qual é o projeto Supabase de produção** (`project_ref`) | Pré-requisito de tudo. Se for outro, esta auditoria precisa rodar de novo lá |
| B | Aplicar as migrations faltantes para criar as **46 tabelas** e **15 RPCs** | DDL em ambiente real — jamais faço sem sua ordem explícita |
| C | Criar os **4 buckets** de storage ausentes | Idem |
| D | Instalar **`pg_net`** e reagendar os **16 cron jobs** | Liga automações que passarão a enviar e-mail/webhook de verdade |
| E | Decidir o destino do **módulo de logística** (`drivers`, `lalamove_*`, `/logistica`) | É domínio alheio herdado. Remover é limpeza; manter é dívida |
| F | Decidir se a **emissão de NF-e** vira integração real ou é removida da UI | Feature de risco fiscal alto rodando em simulação |
| G | **Destravar o CI** — criar/confirmar o secret `SUPABASE_PROJECT_ID` e adicionar `VITE_SUPABASE_PROJECT_ID` ao job `e2e`; decidir o que fazer com o gate `zod-coverage` (10 funções sem Zod × baseline 0) | **Subiu para prioridade alta na revisão 2.** 30 de 30 execuções vermelhas e 19 merges por cima. Só você pode criar secrets |

### Sequência recomendada

`A` → `1` → `B`+`C`+`D` (juntos, num único ciclo de provisionamento) → revalidar com esta auditoria →
`2` → depois `E`, `F`, `G`.

Fazer `B` sem `A` é o erro mais caro possível: aplicaria DDL no ambiente errado.

---

## 9. Documentação existente × realidade

Todo documento foi testado. Resultado: **a documentação canônica do projeto está sistematicamente
desatualizada** — o padrão previsto, e confirmado aqui com evidência.

| Documento | Afirma | Realidade medida |
|---|---|---|
| `docs/FUNCIONALIDADES_SISTEMA.md:12` | 54 páginas (rotas) | **129 rotas** em `src/App.tsx` |
| `docs/FUNCIONALIDADES_SISTEMA.md:13` | 51 Edge Functions | **102** em `supabase/functions/` |
| `docs/FUNCIONALIDADES_SISTEMA.md:15` | 130+ tabelas | **242** vivas / **279** tipadas |
| `docs/FUNCIONALIDADES_SISTEMA.md:17` | 102 migrações SQL | **523** |
| `docs/FUNCIONALIDADES_SISTEMA.md:18` | 1.012 testes (100%) | **2.252** casos `it()/test()` — não executados |
| `docs/FUNCIONALIDADES_SISTEMA.md` §7 | edges `orquestrador-elisao`, `importar-xml-nfe`, `exportar-sped`, `previsao-tributaria-ia` | **Nenhuma das 4 existe** no repositório |
| `docs/FUNCIONALIDADES_SISTEMA.md` §8 | "Emissão NFe · ✅ Produção" | **É `lib/sefaz-simulator/`** — `Math.random()` |
| `docs/FUNCIONALIDADES_SISTEMA.md` §2 | tabela `account_lockouts` | **Não existe** no banco vivo |
| `docs/FUNCIONALIDADES_SISTEMA.md` §3/§5/§7 | `transferencias_bancarias`, `conciliacao_itens`, `dre_tributaria` | **Nenhuma declarada** em migration alguma |
| `docs/FUNCIONALIDADES_SEM_UI.md` | `useBudget` é hook órfão, sugere criar `/orcamentos` no lote P16 | **Já implementado** — `src/pages/Orcamentos.tsx:44` consome o hook; rota `/orcamentos` ativa. Documento defasado ao contrário |
| `docs/FUNCIONALIDADES_SEM_UI.md` | cobertura de UI 94,6% | Número não reproduzível: parte de 54 páginas/51 edges, denominadores errados |
| `.lovable/roadmap-final.md:3` | "16/16 lotes · Sistema 10/10 ✅" | 46 tabelas necessárias ausentes; 0 crons; 4 buckets ausentes |
| `.lovable/roadmap-final.md` | tabelas `tributario_faturamento_mensal`, `tributario_folha_mensal` | Vivas são `faturamento_mensal` e `folha_pagamento` — **nomes citados não existem** |
| `.lovable/roadmap-final.md` | bucket `relatorios-tributarios` criado | **Não existe** no storage |
| `.lovable/memory/index.md` | `edge_function_logs`, `cnpja_cache`, `saved_filter_subscriptions`, `retencao_politicas`, `acoes_recomendadas` como entregues | 4 das 5 **não existem** no banco; a 5ª está vazia |
| `docs/EDGE_FUNCTIONS_CATALOG.md` | catálogo de edges | Não reconciliado com as 102 atuais |

**Não editei nenhum desses arquivos.** Divergência encontrada virou linha de relatório, conforme o
protocolo. A correção deles é o item 🟢 2 da §8, e depende do seu aval.

---

## 10. Correções aplicadas durante esta própria auditoria

Registrado em voz alta, porque erro descoberto e corrigido custa barato:

1. **Falso positivo evitado — `extratos_bancarios_importados`.** A comparação inicial por regex sobre
   as migrations classificou esta tabela como ausente. A verificação direta no catálogo mostrou que
   ela **existe, como VIEW** (`relkind = 'v'`). Foi removida da lista de ausentes. Foi por isso que
   toda a lista de 46 foi reverificada uma a uma via `to_regclass`, e não aceita da extração textual.

2. **Falso positivo evitado — `pg_try_advisory_lock`.** Apareceu na lista de RPCs inexistentes por não
   estar no schema `public`. É função nativa do PostgreSQL (`pg_catalog`). Removida — a lista final é
   de **15**, não 16.

3. **Contagem de linhas de tabela corrigida.** A primeira medição usou `est_rows` de `pg_class`
   (`reltuples`), que retornava `0` ou `-1` para tabelas nunca analisadas — sugerindo um banco totalmente
   vazio. `count(*)` real revelou volumes pequenos porém não-nulos (10–31 linhas nas tabelas de negócio).
   **Todos os números de linha neste documento vêm de `count(*)`, não de estimativa.**

### Revisão 2 — validação adversarial do próprio documento

A revisão 1 foi submetida a uma rodada explícita de tentativa de refutação. Resultado: **1 achado
invertido, 2 números errados, 1 dimensão faltando, 1 lacuna de cobertura**. Todos corrigidos acima.

4. **🔴 `integration_secrets` — achado invertido (o erro mais grave desta auditoria).** Eu havia
   classificado como "caso mais grave: autenticação de webhooks quebrada". **É o contrário**: os dois
   módulos têm fallback por variável de ambiente e falham fechados (503). O código está correto e é
   defensivo. Corrigido em [§3 R2](#-r2--46-tabelas-que-o-código-usa-não-existem-no-banco-crítico),
   com o texto original preservado.
   **Causa-raiz do erro:** classifiquei por `grep` do nome da tabela, sem ler o tratamento de erro.
   Exatamente a armadilha que o próprio método manda evitar — inferência plausível tratada como evidência.

5. **Modo de falha dos 46 fantasmas era genérico demais.** Eu dizia que as telas "falham em runtime,
   ou pior, falham silenciosamente" — verdadeiro, mas inútil para priorizar. Os 121 pontos de chamada
   foram classificados um a um. O balde que importa (**45 pontos com erro descartado**) contém dois
   riscos de correção de dados que a revisão 1 não tinha visto: lançamento contábil duplicado
   (`contabilizar-evento:58`) e trilha de auditoria tributária que não grava (`decidir-regime:218,272`).

6. **Contagem de páginas errada: 86 → 174.** Eu havia rodado `ls src/pages | wc -l`, que conta
   entradas do primeiro nível (arquivos **e** diretórios). O real é 179 arquivos `.tsx` sob `src/pages/`
   — 69 no topo, 110 em 12 subdiretórios — menos 5 de teste = **174**.

7. **Contagem de hooks errada: 214 → 242.** Mesmo erro de método: `ls src/hooks/*.ts` ignora
   subdiretórios. São 267 arquivos no total, **242** excluindo testes.

8. **Views nunca foram checadas (dimensão faltando).** A revisão 1 comparou tabelas e funções, não
   views. Fechado: **3 das 14 views `vw_*` usadas pelo código não existem** ([§3 R9](#-r9--3-das-14-views-vw_-usadas-pelo-código-não-existem-alto)).

9. **Lacuna de cobertura declarada: 22 de 72 diretórios de `src/components/` não eram citados.**
   A maioria correspondia a features já classificadas por rota, mas 10 eram lacuna real — viraram a
   nova dimensão [§5.12](#512-ux-transversal-pwa-e-offline). Universo: 118 → 128.

10. **"Nenhum teste desligado" era enganoso.** Correto para os 2.252 unitários; falso para os 26 E2E,
    que estavam quebrados na coleta desde 2026-08-14. Corrigido em [§4](#4-o-que-está-bom-não-distorcendo-o-quadro)
    e no código (`50c28ef`).

11. **R8 subestimado: reclassificado de 🟡 MÉDIO para 🔴 CRÍTICO.** A revisão 1 marcou a conclusão dos
    checks como `NAO_VERIFICADO` e tratou o risco como "gate que aparenta verde". O histórico do
    Actions foi consultado: **30 de 30 execuções em `main` falharam**, em 19 dias, com **19 PRs
    integrados por cima**. Não é gate frouxo — é gate desligado. Três causas confirmadas, uma delas
    corrigida nesta branch. Detalhe em [§3 R8](#-r8--o-ci-nunca-ficou-verde-30-de-30-execuções-em-main-falharam-crítico).
    Consequência secundária: a frase de elogio em §4 sobre o rigor dos commits recentes ganhou ressalva.

**Achados que sobreviveram à refutação, sem alteração:** R1 (ambiente não reconstruível), R3 (0 crons +
`pg_net` ausente), R4 (emissão de NF-e é simulação — confirmado que **não existe** nenhuma Edge Function
de emissão/autorização; só recepção, manifestação e certificado), R5 (4 de 5 buckets ausentes),
R6 (15 RPCs, reverificadas em todos os schemas), R7 e R8. As 46 tabelas foram reconsultadas em
**todos os 7 schemas** do banco, não só `public` — todas seguem ausentes.

---

## 11. Critério de pronto — autoavaliação honesta

| Critério | Status |
|---|---|
| 100% dos arquivos de código inventariados por recontagem | 🟨 **Parcial.** Recontagem executada na revisão 2 contra os 72 diretórios de `src/components/`: 22 não eram citados, 10 viraram dimensão nova (§5.12). Ainda **não** é inventário arquivo a arquivo — declarado em §7.1 |
| Toda funcionalidade com uma das 4 classificações + evidência | ✅ 128 funcionalidades classificadas com `arquivo:linha` ou objeto de banco |
| Todo achado grave verificado independentemente | ✅ R1–R9 reverificados por consulta direta ao catálogo em **todos os schemas**; 3 falsos positivos derrubados e **1 achado invertido corrigido** (§10) |
| Runtime marcado `VERIFICADO` ou `NAO_VERIFICADO`, sem meio-termo | ✅ §6 |
| Documento executivo legível em 10 minutos | ✅ §1–§4 |
| Lacunas declaradas no próprio documento | ✅ §6 e §7 |
| Nada alterado em produção | ✅ **Zero DDL, zero DML.** Todas as consultas com `read_only: true` |

**Esta auditoria não está 100% pronta pelo critério mais rigoroso** — falta a recontagem arquivo a
arquivo. Está pronta o suficiente para decidir, e os limites estão declarados. É preferível assim.

**Nota sobre a revisão 2.** A rodada de validação encontrou um achado invertido, dois números errados
e uma dimensão faltando. Isso não é sinal de que a revisão 1 fosse inútil — é sinal de que **um
documento deste tipo só é confiável depois de alguém tentar derrubá-lo**. Se você for agir sobre
qualquer conclusão daqui, o passo `A` da §8 (confirmar qual é o projeto Supabase de produção) continua
sendo o que mais pode invalidar o resto, e nenhuma validação de código o substitui.

---

## Anexo

Listas brutas de evidência (46 tabelas ausentes com consumidores, 15 RPCs, 16 crons, diff completo
repo × banco): [`docs/ESTADO_ATUAL_EVIDENCIAS.md`](docs/ESTADO_ATUAL_EVIDENCIAS.md).
