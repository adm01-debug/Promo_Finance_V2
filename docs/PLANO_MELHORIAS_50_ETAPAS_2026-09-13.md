# Plano de Melhorias e Correções — 50 Etapas

> **Data:** 2026-09-13
> **Baseline:** `56411654` (main, sincronizado com `origin/main`)
> **Natureza:** plano derivado de auditoria com evidência verificada — cada etapa cita arquivo e linha.

---

## Sumário executivo

O projeto passa em todos os gates superficiais: **2736/2736 testes**, **0 erros TypeScript**, **0 warnings ESLint**, **0 vulnerabilidades de dependência**, build em 4,46s. Essa saúde aparente esconde três classes de problema que os gates atuais são estruturalmente incapazes de detectar:

1. **Isolamento multi-empresa quebrado em pontos específicos** — inclusive uma edge function que devolve os dados financeiros de _todas_ as empresas a qualquer usuário autenticado.
2. **Escritas silenciosas** — 45 operações de escrita cujo erro nunca é inspecionado, atrás de toasts de sucesso.
3. **Gates de CI que não exercem o que afirmam exercer** — 20 de 26 specs E2E nunca executam, e o piso de cobertura está calibrado 10× abaixo da realidade.

O que **já está bom e não deve consumir esforço**: `_shared/auth-guard.ts` (valida JWT contra o Auth service, falha fechado, comparação timing-safe), o gate de contrato que obriga validação Zod, os 51 `verify_jwt=false` (todos legitimamente protegidos por segredo compartilhado), a higiene de `.env`, e a limpeza de escape hatches de tipo (apenas 4 `as any` em produção).

### Distribuição das 50 etapas

| Bloco | Tema                                       | Etapas | Prioridade |
| ----- | ------------------------------------------ | ------ | ---------- |
| A     | Segurança crítica — vazamento cross-tenant | 1–9    | **P0**     |
| B     | Prevenção sistêmica do IDOR                | 10–13  | **P0**     |
| C     | Integridade de escrita                     | 14–21  | **P1**     |
| D     | Isolamento multi-empresa no cliente        | 22–28  | **P1**     |
| E     | Gates de CI que não protegem               | 29–38  | **P1**     |
| F     | Cobertura de testes                        | 39–44  | P2         |
| G     | Higiene de repositório e documentação      | 45–50  | P3         |

---

## Bloco A — Segurança crítica (P0)

> **Causa raiz comum:** `user_roles` não possui coluna `empresa_id` (`supabase/migrations/20251214170739_*.sql:41-48`) e `has_role()` filtra apenas `user_id AND role` (`20260518164611_*.sql:10-11`). Portanto **`admin` é global, não por empresa**. Toda checagem que usa apenas `has_role()` sobre um `empresa_id` vindo do corpo da requisição é um IDOR. `user_empresas` é o único vínculo real de tenant.

### Etapa 1 — Rotacionar a `service_role` key exposta no histórico

**Severidade:** CRÍTICA · **Esforço:** 1h
Uma JWT com `"role":"service_role"` e validade até **2036-03-15** foi commitada em `compare-schemas/index.ts:20` (introduzida em `d5d1229b`, removida em `dfb8b4c5`). O arquivo está limpo hoje, mas **remoção do código não é revogação** — a chave segue válida e recuperável por qualquer pessoa com acesso ao histórico do repositório.
**Ação:** rotacionar a chave no dashboard Supabase, atualizar os secrets do GitHub Actions e do Lovable, e invalidar a antiga.
**Aceite:** a JWT antiga retorna 401 contra a API.

### Etapa 2 — Confirmar a rotação das credenciais do `migrate-helper`

**Severidade:** CRÍTICA · **Esforço:** 30min
O `migrate-helper` (removido em `5e97d6be`) expunha um endpoint `action=credentials` que devolvia `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` em texto puro, com `verify_jwt=false`, CORS `*` e um `ACCESS_KEY` hardcoded como única barreira. `docs/execucao-cline/baseline-lote-a.md:51` prescreve a rotação — **é preciso confirmar que ocorreu**, não presumir.
**Aceite:** registro datado da rotação no runbook de segurança.

### Etapa 3 — Corrigir `analise-preditiva` (vazamento cross-tenant ativo)

**Severidade:** CRÍTICA · **Esforço:** 2h
`supabase/functions/analise-preditiva/index.ts` — 268 linhas, **zero guards**. A linha 3 importa `OptionalEmpresaIdSchema` e `validatePayload` e **nunca os invoca**; o filtro de tenant foi planejado e nunca conectado. A linha 19 monta um cliente service-role (que ignora RLS) e as linhas 27–30 executam `SELECT *` em `contas_receber`, `contas_pagar`, `clientes` e `transacoes_bancarias` **sem qualquer filtro de `empresa_id`**.
Como `verify_jwt = true` (`supabase/config.toml:3-4`) apenas prova que existe _algum_ JWT válido, **qualquer usuário de qualquer empresa** obtém o contas a receber, contas a pagar, carteira de clientes e extrato bancário de **todas as empresas** — resumidos por LLM. Alcançável a partir de `src/components/dashboard/PrevisaoIA.tsx:50` sem argumentos.
**Ação:** aplicar `exigirUsuario`, resolver a empresa via `user_empresas` e aplicar `.eq('empresa_id', …)` nas quatro consultas.
**Aceite:** teste que autentica como usuário da empresa A e confirma ausência de qualquer registro da empresa B na resposta.

### Etapa 4 — Corrigir `nfe-upload-certificado` (sequestro de certificado digital)

**Severidade:** CRÍTICA · **Esforço:** 2h
`supabase/functions/nfe-upload-certificado/index.ts:79-95,160` valida apenas `has_role(user,'admin')` — que é global. O `empresa_id` vem direto do corpo (L95) para o caminho de storage (L160) e para `p_empresa_id` (L177). Permite que o admin da empresa A **substitua o certificado A1 e-CNPJ e a senha da empresa B** — a credencial que assina notas fiscais perante a SEFAZ.
**Ação:** validar o vínculo `user_empresas` antes de aceitar `empresa_id`, seguindo `convidar-contador/index.ts:92-101`.

### Etapa 5 — Corrigir `executar-fechamento-tributario`

**Severidade:** CRÍTICA · **Esforço:** 2h
`index.ts:66-77` — mesma raiz: `has_role()` global para `admin`/`financeiro`, sem vincular `body.empresa_id` a `user_empresas`, seguido de leituras e upserts com service-role em L96, 111, 129, 161, 175, 203, 234, 246. Permite ler e **escrever** o fechamento tributário de outra empresa.

### Etapa 6 — Corrigir `executar-relatorios` (guard condicional)

**Severidade:** ALTA · **Esforço:** 1h
`index.ts:65` — a validação de vínculo só roda `if (relatorioId && guard.dados.origem === 'usuario')`. Um usuário autenticado que envie corpo vazio (`relatorio_id` nulo) **pula o guard inteiro** e força a execução do lote global de relatórios agendados, atravessando todos os tenants.
**Ação:** exigir origem interna quando `relatorioId` for ausente.

### Etapa 7 — Corrigir `enviar-digest-conformidade`

**Severidade:** MÉDIA · **Esforço:** 1h
`index.ts:103,127` — `has_role('admin')` global com filtro de `empresaId` opcional: o admin de um tenant recebe no digest os alertas de conformidade de todos os demais.

### Etapa 8 — Corrigir `executar-analise-preditiva`

**Severidade:** MÉDIA · **Esforço:** 1h
`index.ts:37-39` — mesma agregação sem filtro da Etapa 3, porém corretamente restrita a cron (`exigirChamadaInterna`, L16). Não é explorável externamente, mas **mistura dados de todos os tenants dentro de um resultado por-tenant**, corrompendo a análise.

### Etapa 9 — Criar o helper canônico `exigirVinculoEmpresa()`

**Severidade:** ALTA · **Esforço:** 4h
As etapas 3–8 são a mesma falha seis vezes. Extrair um helper único em `_shared/` que receba `empresa_id` do corpo e o usuário autenticado, e rejeite quando não houver vínculo em `user_empresas`. **Padrão de referência a copiar:** `decidir-regime/index.ts:150-161`, que sonda `empresas` pelo cliente RLS do usuário _antes_ de recorrer ao service-role.
**Aceite:** as seis funções passam a usar o helper; nenhuma repete a lógica.

---

## Bloco B — Prevenção sistêmica (P0)

### Etapa 10 — Teste de contrato contra IDOR de tenant

**Esforço:** 6h
O repositório já possui a máquina certa: `_shared/contract-coverage_test.ts` quebra o build se uma função que chama `req.json()` não usar `validatePayload`. Estender o mesmo mecanismo: **toda função que lê `empresa_id` do corpo deve invocar `exigirVinculoEmpresa()`**.
**Aceite:** reintroduzir a falha da Etapa 3 faz o CI falhar.

### Etapa 11 — Decidir o modelo de papéis por empresa

**Esforço:** 8h (decisão + ADR)
`user_roles` ser tenant-agnóstico é a raiz das etapas 4, 5 e 7. Duas saídas: **(a)** adicionar `empresa_id` a `user_roles` e tornar `has_role()` consciente de empresa, ou **(b)** declarar `has_role()` inadequado para escopo de tenant e proibi-lo por lint em contextos multi-empresa. Registrar em ADR — é decisão arquitetural, não correção pontual.

### Etapa 12 — Adicionar varredura de segredos ao CI e ao pre-commit

**Esforço:** 3h
Não existe gitleaks configurado — apenas uma anotação órfã `// gitleaks:allow` em `vitest.config.ts:33`. **Nada detectou as etapas 1 e 2.**
**Aceite:** gitleaks roda no CI e no hook pre-commit, com baseline dos achados históricos.

### Etapa 13 — Migrar anon keys hardcoded para o Vault

**Esforço:** 3h
Chaves anon aparecem embutidas em 4 migrations versionadas (ex.: `20260905130000_fix_notify_performance_alert_destino.sql:23`), padrão que continua em `notify_performance_alert_trigger`.

---

## Bloco C — Integridade de escrita (P1)

> **Padrão sistemático:** o primeiro passo da operação é verificado (`if (error) throw`), os passos seguintes são fire-and-forget, e o toast de sucesso dispara de qualquer forma. Resultado: **estado parcial persistido sob confirmação de êxito**. São 45 escritas nessa condição. Este é exatamente o formato do incidente "PGRST204 silencioso" já registrado no repositório.

### Etapa 14 — Criar o wrapper `mustSucceed()`

**Esforço:** 2h
Helper que recebe o retorno `{ data, error }` do Supabase, lança em caso de erro e preserva o tipo de `data`.

### Etapa 15 — Regra ESLint `no-floating-supabase-write`

**Esforço:** 4h
Proibir `await supabase…insert|update|delete|upsert|rpc` cujo resultado não seja desestruturado. Sem isso, as correções 16–20 regridem.

### Etapa 16 — Corrigir aprovação de pagamento

**Severidade:** ALTA · **Esforço:** 2h
`src/hooks/expert-actions/financial-actions.ts:81-84` — atualiza `solicitacoes_aprovacao` (verificado), depois `contas_pagar.update({aprovado_por})` **sem verificação**, e então `toast.success('Pagamento aprovado com sucesso!')`. Há um `TODO(2026-08-14)` na L82 registrando que uma coluna foi removida dessa mesma tabela — precisamente a forma do PGRST204. **Um pagamento pode ser reportado como aprovado sem que a aprovação seja gravada.**

### Etapa 17 — Corrigir conciliação bancária

**Severidade:** ALTA · **Esforço:** 2h
`src/hooks/useConciliacao.ts:62-64` (`transacoes_bancarias` → `status:'confirmado'`) e `:90-92` (`contas_receber.transacao_conciliada_id`). A conciliação pode reportar sucesso com o vínculo nunca gravado.

### Etapa 18 — Corrigir retenções na fonte / DARF

**Severidade:** ALTA · **Esforço:** 2h
`src/hooks/useRetencoesFonte.ts:220-223` (`darf_gerado: true`) e `:255` (`status:'recolhido'`). DARF gerado e retenções nunca marcadas — divergência fiscal.

### Etapa 19 — Corrigir créditos tributários CBS/IBS

**Severidade:** ALTA · **Esforço:** 3h
`src/hooks/useImportacaoXMLNFe.ts:267,283` — inserts em `creditos_tributarios` sem verificação, ambos com `TODO(2026-08-14): campos removidos` imediatamente acima. **Créditos podem desaparecer enquanto os totais são incrementados.**

### Etapa 20 — Corrigir acordos, lançamentos contábeis e anexos

**Esforço:** 3h
`useAcordosParcelamento.ts:206-209` (`status:'quitado'`) e `:227-231`; `useLancamentosContabeis.ts:210` — onde o _delete compensatório_ de cabeçalho órfão é ele próprio não verificado, de modo que o rollback pode falhar em silêncio; `src/components/financeiro/AnexoList.tsx:87` — `storageError` apenas logado e a linha do banco removida, gerando objeto órfão no storage.

### Etapa 21 — Mover sequências multi-passo para RPC atômica

**Esforço:** 12h
As etapas 16–20 são multi-passo sem transação. Onde a consistência é obrigatória (aprovação, conciliação, DARF, créditos), a sequência deve virar uma função Postgres única.

---

## Bloco D — Isolamento multi-empresa no cliente (P1)

> **Já está correto e deve ser replicado:** `useCategorias.ts:98-101` e `useCentrosCusto.ts:53-56` _descartam_ o `empresa_id` enviado pelo cliente (`const { empresa_id: _ignorada, ...dados }`) e injetam `currentEmpresaId`. Esse é o padrão.

### Etapa 22 — Corrigir as duas views sem filtro de tenant

**Severidade:** ALTA · **Esforço:** 2h
`src/hooks/useViews.ts:36-49` (`useFluxoCaixaView`) e `:80-93` (`useGastosCentroCusto`) executam `supabase.from('vw_…').select('*')` **sem `.eq('empresa_id', …)` e sem escopo na queryKey** — enquanto todos os vizinhos do mesmo arquivo fazem ambos. `src/lib/queryClient.ts` espelha a falha: `views.fluxoCaixa()` e `views.gastosCentroCusto()` não recebem `empresaId`, ao contrário de `views.saldos/dre/dsoAging`. A única defesa é o RLS; para um usuário multi-empresa, o dashboard **soma todas as suas empresas em uma visão que se apresenta como de empresa única**.

### Etapa 23 — Tornar `empresaId` segmento obrigatório das queryKeys

**Esforço:** 8h
Toda chave escopada passa a ter a forma `['recurso', empresaId, …]`.

### Etapa 24 — Substituir a invalidação heurística por remoção estrutural

**Severidade:** ALTA · **Esforço:** 4h
`src/hooks/useSelectiveEmpresaInvalidation.ts:24-39` invalida uma query apenas se alguma parte da chave _contiver a string_ `"empresa"`, for igual ao UUID antigo/novo, ou for objeto com campo `empresa_id`. Após a Etapa 23, trocar por `queryClient.removeQueries` sobre o segmento de escopo.

### Etapa 25 — Corrigir os 51 pontos de query sem empresa na chave

**Severidade:** ALTA · **Esforço:** 10h
51 queries filtram por `empresa_id` no `queryFn` mas têm chave que não contém nem o UUID nem `"empresa"` — **nunca são invalidadas na troca de empresa**. Piores casos: `useCategorias.ts:108/136` (`['categorias']`), `useCentrosCusto.ts:35/65` (`['centros_custo','all']`), `useContratos.ts:60`, `useLancamentosContabeis.ts:76`, `useApuracoesTributarias.ts:166`, `useCreditosTributarios.ts:244`, `useRetencoesFonte.ts:167`, `useContasReceberLogic.ts:167`.

### Etapa 26 — Corrigir leituras não-reativas de tenant

**Esforço:** 3h
`src/pages/Orcamentos.tsx:48` chama `getCurrentEmpresaId()` (leitura crua de `localStorage`) durante o render, sem inscrição. Alimenta `useBudget.ts:42`. Na troca de empresa a invalidação dispara, mas o componente não re-renderiza — **o refetch busca de novo a empresa anterior**. Mesmo padrão em `RecentAndFavorites.tsx:26`.

### Etapa 27 — Resolver o modo consolidado

**Esforço:** 6h
`EmpresaScopeContext.tsx` expõe `ids`/`isConsolidated`/`scopedEmpresas`, mas `ids` só é consumido por dois componentes de apresentação (`EmpresaScopeBar.tsx:21`, `EmpresaActionPicker.tsx:36`). Os 5 hooks de dados usam `currentEmpresaId = ids[0]` (`:135-138`). **A interface anuncia visão consolidada de N empresas enquanto os dados mostram uma.** Pior: `toggleEmpresa` sobre empresa não-primeira não altera `currentEmpresaId`, o efeito `syncLegacyKey` (`:141-143`) não dispara e **nenhuma invalidação ocorre**.
**Ação:** ou implementar agregação real por `ids`, ou remover a promessa da UI.

### Etapa 28 — Teste de arquitetura para escopo de chave

**Esforço:** 4h
`src/lib/arquitetura/__tests__/` já possui o mecanismo. Adicionar regra que quebra o build quando uma query filtra por `empresa_id` sem incluí-lo na chave.

---

## Bloco E — Gates de CI que não protegem (P1)

### Etapa 29 — Corrigir o glob que desativa 20 specs E2E

**Severidade:** CRÍTICA (para confiança no CI) · **Esforço:** 2h
`.github/workflows/ci.yml:374` usa `git ls-files -- 'e2e/**/*.e2e.ts'`, que casa **5 de 26** specs — apenas as aninhadas em `e2e/auth/` e `e2e/system/`. **Todas as 21 specs de nível superior nunca executam**, incluindo `contas-pagar`, `conciliacao`, `nfe-fluxo`, `nfe-fluxo-falhas`, `regua-cobranca`, `split-payment`, `calculadora-tributaria`, `sped-wizard`, `importacao-xml`, `aprovacoes` e `lgpd-privacidade`.
Agrava: a guarda em `:382-385` só falha se **zero** specs forem encontradas — com 5 encontradas, o job reporta sucesso e produz confiança falsa.
**Aceite:** as 26 specs aparecem na lista montada pelo job.

### Etapa 30 — Remover a referência morta na lista de exclusão

**Esforço:** 15min
`ci.yml:378` exclui `e2e/visual-theme.e2e.ts` da quarentena, mas esse arquivo é de nível superior e nunca foi casado pelo glob — exclusão sem efeito.

**Resolvida junto da Etapa 31:** a lista cravada de exclusões deixou de existir — a quarentena passou a ser derivada do `testMatch` dos configs bloqueantes, o que torna uma exclusão sem efeito impossível de escrever.

### Etapa 31 — Promover as specs financeiras ao gate bloqueante

**Severidade:** ALTA · **Esforço:** 8h
Hoje bloqueiam o merge apenas 4 specs: `login`, `admin-rbac`, `visual-theme` (`playwright.critical.config.ts:12`) e `logout-real`. **Nenhum fluxo de dinheiro tem gate.** Estabilizar e promover, em ondas: conciliação, contas a pagar, NF-e, régua de cobrança, split payment.

#### Execução — onda 1 (concluída)

**Por que não bastou promover as specs existentes.** Elas dependem de `E2E_USER_EMAIL`/`E2E_USER_PASSWORD`. Sem os segredos, `auth.setup.ts` grava um `storageState` vazio, o app redireciona para `/auth` e a spec passa sem ter exercitado nada. Um gate bloqueante que abre sozinho quando falta segredo é pior que gate nenhum — e em PR de fork, que nunca recebe segredos, ele abriria sempre.

**Solução: harness offline.** `e2e/fixtures/sessao.ts` semeia uma sessão GoTrue sintética em `localStorage` e serve o app contra um projeto Supabase igualmente sintético (`e2eoffline0000000000`), interceptando `auth/v1`, `rest/v1`, `functions/v1` e `storage/v1`. Consequências: roda sem um único secret, não escreve uma linha em banco real, e falha por regressão de UI — nunca por indisponibilidade de ambiente.

| Artefato                                          | Papel                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `playwright.financeiro.config.ts`                 | Config do gate. Fixa `America/Sao_Paulo` (Node + browser), `locale: 'pt-BR'`, `reducedMotion: 'reduce'`, `retries: 0`. |
| `e2e/fixtures/sessao.ts`                          | Sessão sintética + baseline de rede (registrada uma vez por página).                                                   |
| `e2e/fixtures/edge.ts`                            | `mockEdgeFunctions` com contador por função — permite provar que uma operação de dinheiro disparou **uma** vez.        |
| `e2e/fixtures/financeiro.ts`                      | Fixtures de contas a pagar e conciliação.                                                                              |
| `.github/workflows/ci.yml` → job `e2e-financeiro` | Gate bloqueante, sem secrets e sem preflight `require-env.sh`.                                                         |
| `scripts/ci/listar-specs-quarentena.ts`           | Deriva a quarentena do `testMatch` dos configs bloqueantes.                                                            |
| `tsconfig.e2e.json` + `bun run type-check:e2e`    | Type-check de `e2e/`, `scripts/` e configs do Playwright — território que `tsc --noEmit` nunca cobriu.                 |

**Specs promovidas (10 de 28 no total, 16 casos):** `financeiro/conciliacao-offline` (3), `financeiro/contas-pagar-offline` (6), `nfe-fluxo` (2), `nfe-fluxo-falhas` (3), `regua-cobranca` (1), `split-payment` (1).

**Três decisões de config que não são cosméticas:**

1. **`contextOptions: { reducedMotion: 'reduce' }`** — `AnimatedNumber` conta de 0 até o valor final em ~1,1s, e os matchers do Playwright passam na primeira leitura que casa. Um KPI errado de 91.500,00 satisfaz uma asserção de 1.500,00 ao cruzar esse ponto no meio da animação: o teste ficaria verde justamente no caso que deveria pegar. **Precisa estar em `contextOptions`:** no Playwright 1.62 `reducedMotion` não é opção de topo de `use`, e o loader descarta chave desconhecida sem avisar — ver o defeito #7 abaixo.
2. **`timezoneId` + `process.env.TZ` em `America/Sao_Paulo`** — `transacoes_bancarias.data` é `DATE`; o PostgREST devolve `"2026-09-13"` e o `new Date` do JS lê isso como meia-noite **UTC**. Em runner UTC (o default do GitHub Actions) o deslocamento é zero e o bug some. Sem fuso fixo, o gate ficaria cego exatamente na classe de erro que mais dói aqui.
3. **`retries: 0`** — o harness é determinístico por construção; um retry só mascararia flakiness que, aqui, seria bug do teste.

#### Seis defeitos de produção que o harness converteu em teste vermelho

Nenhum foi procurado: todos apareceram porque a spec exigiu um comportamento que o código não tinha.

| #   | Defeito                                                                                                                                                            | Correção                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `mutations.retry` global reenviava operações **não idempotentes** — uma falha de rede virava duas baixas.                                                          | `src/lib/queryClient.ts`: `mutations.retry: false` + `src/lib/queryClient.retry.test.ts`.                                                                                                                          |
| 2   | `removeQueries` na troca de empresa órfãva observers montados.                                                                                                     | `src/hooks/useSelectiveEmpresaInvalidation.ts`.                                                                                                                                                                    |
| 3   | Upload de certificado engolia a mensagem de erro da edge function.                                                                                                 | `src/hooks/useCertificadosDigitais.ts`.                                                                                                                                                                            |
| 4   | `NfeVinculoDialog` derrubava a página inteira com payload de sugestões não-array.                                                                                  | `src/hooks/useNfeVinculo.ts`.                                                                                                                                                                                      |
| 5   | **Extrato bancário inteiro exibido um dia antes** (UTC × BRT) — numa tela onde a data é o critério de casamento.                                                   | `src/lib/conciliacao-page-helpers.ts` usa `toLocalDate` na linha **e nos dois limites do filtro**: corrigir só a linha deslocaria o limite superior em 3h e passaria a excluir as transações do próprio dia final. |
| 6   | Conciliação manual empilhava **dois** toasts "Conciliação Concluída!" e confete em dobro (o diálogo celebrava por conta própria, além do `onSuccess` da mutation). | `src/components/conciliacao/ConciliacaoManualDialog.tsx` mantém só o `haptic('success')`.                                                                                                                          |

Cada correção foi validada **por inversão**: revertida uma a uma, com a spec ficando vermelha, e restaurada em seguida. Uma asserção que não fica vermelha quando o bug volta não é um teste, é decoração.

#### Sétimo defeito — no próprio harness

`reducedMotion: 'reduce'` estava solto em `use`. No Playwright 1.62 essa não é opção de topo (só `contextOptions` a aceita) e o loader **descarta chaves desconhecidas em silêncio**: a suíte passava exibindo uma proteção que nunca foi aplicada. Comprovado medindo `matchMedia('(prefers-reduced-motion: reduce)').matches` dentro da página — `false` na forma antiga, `true` sob `contextOptions`.

Quem revelou isso foi o **`tsconfig.e2e.json`**, criado no mesmo passo. `tsc --noEmit` tem `include: ["src"]` e `exclude: ["e2e", …]`: `e2e/`, `scripts/` e os configs do Playwright **nunca foram type-checked**. Como o Playwright transpila as specs com esbuild — que apaga tipos sem verificá-los — um símbolo inexistente vira `undefined` em silêncio e a asserção passa a comparar com nada; foi exatamente o que aconteceu com um `CNPJS.EMITENTE` inexistente em `e2e/fixtures/nfe.ts`. O novo `bun run type-check:e2e` roda no `quality-gate`. Um gate bloqueante cuja fixture não é verificada é um gate cuja proteção ninguém conferiu.

#### O que permanece em quarentena, e por quê

18 das 28 specs. Todas dependem de **banco real e credenciais** — login com usuário de verdade, RBAC contra `user_roles` em produção, snapshots visuais autenticados. Convertê-las exige estender o harness offline por domínio, que é o trabalho das ondas seguintes; promovê-las como estão reintroduziria exatamente o gate-que-abre-sozinho descrito acima.

**A lista de exclusão deixou de ser cravada no YAML.** Ela agora é derivada do `testMatch` dos três configs bloqueantes por `scripts/ci/listar-specs-quarentena.ts`. O motivo: duas listas descrevendo a mesma cobertura divergem, e a direção perigosa da divergência é silenciosa — bastava remover uma spec do `testMatch` de um gate e esquecer o YAML para que ela parasse de rodar em **qualquer** job, sem um único sinal vermelho. O script também falha quando um `testMatch` deixa de casar arquivo (spec renomeada ⇒ gate verde que não testa nada) e quando `git ls-files` diverge do disco.

#### Pendência que exige decisão humana

O job `e2e-financeiro` roda, mas **ainda não é um check obrigatório** na proteção de `main` — isso é alteração de branch protection, mesma classe das Etapas 34 e 35, e depende de confirmação explícita.

### Etapa 32 — Recalibrar o piso de cobertura

**Severidade:** ALTA · **Esforço:** 1h
`vitest.config.ts:58-62` fixa `lines: 6`, `statements: 6`, `functions: 18`, `branches: 50`. A cobertura **real medida** é **71,76% linhas / 70,58% statements / 63,57% funções / 64,70% branches**. O piso está ~10× abaixo do real: a cobertura poderia despencar de 71,76% para 7% sem que o CI reclamasse. **O gate não oferece proteção alguma contra regressão.**
**Ação:** elevar os pisos para ~5 pontos abaixo do medido (65/65/58/60) e subir por degraus.

### Etapa 33 — Corrigir o comentário obsoleto de cobertura

**Esforço:** 10min
`vitest.config.ts:53-55` afirma "cobertura real atual (~6,8% linhas / 19,8% funções / 55% branches)" — defasado por um fator de 10 e origem provável da calibragem errada da Etapa 32.

### Etapa 34 — Incluir o gate de RLS/GRANT nos checks obrigatórios

**Severidade:** ALTA · **Esforço:** 30min
A proteção de `main` exige 4 checks: `Quality Gate & Tests`, `E2E Critical Gate`, `Unit tests (offline)` e `Integration tests (edge functions live)`. **`Supabase DB Linter` / `Supabase Linter (RLS/GRANT gate)` não está na lista** — pode falhar sem impedir o merge, como ocorre hoje no PR #79.

### Etapa 35 — Exigir ao menos uma revisão aprovada

**Severidade:** ALTA · **Esforço:** 15min
`required_approving_review_count` está **ausente**: PRs podem ser mergeados em `main` sem qualquer revisão humana, num sistema financeiro em produção. (`enforce_admins: true` e `allow_force_pushes: false` já estão corretos.)

### Etapa 36 — Resolver o deadlock de `REQUIRED_MIGRATIONS`

**Severidade:** ALTA · **Esforço:** 4h
`scripts/security/test-canonical-db-gates.mjs:7-13` valida a lista contra o **banco canônico ao vivo**. O PR #79 adiciona `20260912100000_revoke_anon_admin_observability_rpcs.sql` _e_ inscreve a versão em `REQUIRED_MIGRATIONS` — mas a migration só chega à produção **depois** do merge. **O PR não consegue passar no próprio gate.** Qualquer PR que adicione migration obrigatória fica permanentemente bloqueado.
**Ação:** o gate deve exigir apenas migrations já presentes na base de merge (`origin/main`), tratando as introduzidas pelo próprio PR como pendentes esperadas.

### Etapa 37 — Atualizar actions com Node 20 depreciado

**Esforço:** 2h
`actions/checkout@v4` (11 usos), `actions/upload-artifact@v4` (5), `actions/cache@v4` (5) — o runner já força Node 24 e emite aviso de depreciação em toda execução.

### Etapa 38 — Adicionar hook `pre-push`

**Esforço:** 1h
`.husky/pre-commit` roda apenas `lint-staged`; não há `pre-push`. Executar `type-check` e `test:changed` antes do push encurta o ciclo de feedback.

---

## Bloco F — Cobertura de testes (P2)

> **77 de 104 edge functions (74%) não possuem teste.** As ausentes concentram-se exatamente na lógica de cálculo de dinheiro e imposto.

### Etapa 39 — Testes dos motores de cálculo tributário

**Esforço:** 16h
`simular-simples`, `simular-presumido`, `simular-real`, `calculo-iva`, `decidir-regime`, `prever-carga-tributaria`. Erro aqui produz imposto errado — priorizar casos de fronteira de faixa e anexo.

#### Execução — o risco não era o que a etapa supunha

A etapa foi escrita como "faltam testes unitários nessas funções". O inventário
mostrou outra coisa: o motor tributário existe **duas vezes**, e nenhuma
quantidade de teste unitário de um lado pega divergência com o outro.

| Cópia           | Arquivo                                          | Forma                                                                     |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Cliente (tela)  | `src/lib/tributario/shared-logic.ts`             | modular — reexporta `anexos`, `parametros`, `encargos-folha`, `apuracao`  |
| Edge (servidor) | `supabase/functions/_shared/tributario-logic.ts` | achatada, autocontida, zero imports — Deno não resolve os `@/` do bundler |

A duplicação não é descuido: é imposta pelo runtime. O problema é o modo de
falha. Corrigir uma faixa do Anexo III num lado deixa o outro com a lei antiga,
a tela mostra um DAS, o servidor grava outro, e **nenhum dos dois erra sozinho
de forma óbvia**. Dois testes unitários verdes sobre números diferentes
continuam verdes.

#### O que foi feito

`src/lib/tributario/__tests__/paridade-motor-edge.test.ts` (86 casos) roda a
MESMA entrada nas duas cópias e exige o MESMO resultado, em
`simularSimples`, `simularPresumido`, `simularReal`, `determinarAnexoSimples` e
na tabela `ANEXOS` inteira. Cenários nas fronteiras, que é onde um `<` virando
`<=` muda o imposto: teto exato de cada faixa e um real acima, teto do Simples
(4.8M) e 4.8M+1, corte do Fator R em exatamente 28% e ±R$1, sublimite estadual
excedido, prejuízo acumulado com a trava de 30%, presumido com créditos e ISS
retido.

#### O que a paridade encontrou

39 dos 86 casos falharam na primeira execução. Nenhuma divergência numérica —
verificado filtrando o diff completo, que sobrou vazio fora das strings. A
divergência era de **texto exibido ao usuário**: a cópia da edge tinha perdido
acentos e a seta num passo de transcodificação.

| Cliente                                          | Edge (degradada)                                  |
| ------------------------------------------------ | ------------------------------------------------- |
| `Revenda/comércio preponderante (…) → Anexo I.`  | `Revenda/comercio preponderante (…) -> Anexo I.`  |
| `Industrialização preponderante (…) → Anexo II.` | `Industrializacao preponderante (…) -> Anexo II.` |
| `… Fator R = …% → Anexo …`                       | `… Fator R = …% -> Anexo …`                       |

Corrigido no lado degradado, não afrouxando a asserção: a string do cliente é a
que o usuário lê, e comparar normalizado cegaria o teste para deriva futura de
mensagem — que é justamente o que se quer detectar.

Um comparador de literais varreu os dois arquivos inteiros para garantir que
eram só essas três: 3 degradadas, 0 órfãs.

#### Já existia um guard — e ele estava verde

`src/lib/tributario/__tests__/drift-guard-motor.test.ts` compara o **texto**
normalizado das duas cópias e passava. Ele descarta o conteúdo dos literais de
propósito, para não quebrar por estilo de mensagem; foi exatamente por esse furo
que `comercio`/`->` conviveu com `comércio`/`→` sem ninguém reclamar.

Os dois testes são complementares e nenhum substitui o outro:

- o guard textual cobre **todo** o código, inclusive ramos que nenhum cenário
  alcança, mas é cego para o conteúdo das mensagens;
- a paridade cobre **comportamento observável**, mensagem incluída, mas só nos
  caminhos que os cenários exercitam.

#### A armadilha de formatação no guard textual

Ao formatar a cópia da edge, os dois guards ficaram vermelhos **sem nenhuma
deriva de lógica**. Causa: a comparação é lexical, e o prettier normaliza
`0.20` para `0.2`, remove parênteses redundantes e insere vírgula final. O guard
só estava verde porque as duas cópias estavam desformatadas do mesmo jeito.

Isso é uma mina, não um detalhe: `lint-staged` roda `prettier --write` em todo
`.ts` que entra no commit. Quem editasse **uma** das cópias e commitasse pelo
hook derrubaria o guard com um vermelho que não aponta para bug nenhum — e a
saída provável seria afrouxar ou apagar o guard.

Desarmada formatando **as duas** cópias no mesmo commit. A partir daqui as duas
estão prettier-clean, e o próprio hook mantém a propriedade: qualquer edição
futura sai formatada dos dois lados. Verificado: `drift-guard-motor` e
`drift-guard-obrigacoes` verdes, 18/18.

#### Validação por inversão

A paridade foi testada nos dois sentidos, não só observada verde:

| Divergência injetada na cópia da edge   | Resultado          |
| --------------------------------------- | ------------------ |
| `LIMITE_SIMPLES` 4.800.000 → 4.800.001  | vermelho (1 caso)  |
| Anexo III, faixa 1: `aliq` 0.06 → 0.061 | vermelho (2 casos) |
| nenhuma                                 | verde, 86/86       |

Suíte tributária completa após tudo: **1162/1162**.

#### Efeito colateral assumido: um aviso novo de `max-lines`

Formatar desdobrou linhas amontoadas (`ano: number; mes: number;` numa só) e as
duas cópias cresceram — `shared-logic.ts` de 535 para 809 linhas cruas, a da
edge de 789 para 960. Com isso `shared-logic.ts` cruzou o limite de 400 do
`max-lines` e passou a emitir aviso; antes o amontoado escondia do linter um
arquivo que já era grande.

O aviso fica. Não quebra nada (`lint` do CI não usa `--max-warnings 0`, e
`lint:strict` não é chamado por nenhum gate) e é verdadeiro. Suprimir com
`eslint-disable` esconderia o mesmo fato que o amontoado escondia. E quebrar o
arquivo em módulos menores seria o reparo errado: a cópia da edge é achatada por
imposição do Deno, e afastar as duas estruturas enfraquece justamente a
comparação textual que as prende. O reparo certo é o da recomendação de fundo
abaixo — gerar uma cópia a partir da outra.

#### Pendente nesta etapa

`calculo-iva`, `decidir-regime` e `prever-carga-tributaria` ainda não têm
paridade nem cobertura de fronteira — `calculo-iva` carrega um `CRONOGRAMA`
2026-2033 inline na própria função, que é a mesma classe de dado que a tabela de
anexos e merece o mesmo tratamento.

#### Recomendação de fundo

A paridade é costura, não cura: ela prende as cópias enquanto a duplicação
existir. A cura é gerar a cópia da edge a partir da do cliente num passo de
build (bundle/flatten), transformando "duas implementações que precisam
concordar" em "um arquivo e um artefato". Fica registrado como candidato ao
Bloco G — exige decidir onde o passo roda (CI, pre-commit) e como o CI prova que
o artefato commitado está atualizado.

### Etapa 40 — Testes de geração de SPED

**Esforço:** 12h
`gerar-sped-ecd`, `gerar-sped-ecf`, `exportar-sped-contribuicoes`, `gerar-dre-tributaria`. Arquivos rejeitados pelo fisco são retrabalho caro; validar layout por golden files.

### Etapa 41 — Testes de cobrança

**Esforço:** 10h
`processar-fila-cobrancas`, `executar-regua-cobranca` (idempotência já foi incidente conhecido), `enviar-relatorios-tributarios-agendados`.

### Etapa 42 — Testes de conciliação e categorização

**Esforço:** 8h
`conciliacao-ia`, `categorizar-despesa`, `detectar-anomalias-financeiras`.

### Etapa 43 — Testes de integração externa

**Esforço:** 12h
`bling-proxy`, `asaas-proxy`, `open-finance`, `sefaz-dfe-puxar`, `sefaz-manifestar`, `nfe-upload-certificado`. Contratos com terceiros mudam sem aviso — testar com fixtures gravadas.

### Etapa 44 — Piso de cobertura para edge functions ✅ (antecipada)

**Esforço:** 4h · **Status:** o pré-requisito foi feito; o piso percentual continua aberto.

Esta etapa foi trazida à frente da Etapa 40 por um motivo prático: escrever
testes de SPED para um pipeline que roda 61% da suíte é encher balde furado.
E ao medir o balde, o furo era maior do que o previsto.

#### O que a medição mostrou

`.github/workflows/deno-tests.yml` enumerava os arquivos de teste à mão:
**24 dos 48 arquivos do disco, 185 dos 305 testes. 120 testes — 39% — nunca
rodaram no CI**, e nada avisava quando um arquivo novo nascia fora da lista.

Não é dano hipotético. Dois casos concretos estavam na metade invisível:

| Teste inerte                      | O que ele cobria                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `nfe-vinculo-proxy/index_test.ts` | Exigia 422 de uma função que devolvia 400. O teste estava certo, a função errada, e o gate passava. |
| `executar-regua-cobranca`         | Idempotência — que o próprio plano registra como incidente já ocorrido.                             |

#### Três portas que não trancavam

O padrão se repetiu em camadas, e vale nomear a classe: _gate verde que não
guarda nada_.

1. **A lista cravada** (acima).
2. **A convenção de validação.** 38 funções devolvem 422 com
   `{code, message, fields}`; `nfe-vinculo-proxy` e `conciliacao-proxy`
   devolviam 400 com `{error, details}`. As duas foram alinhadas mantendo o
   `json()` local — `createValidationErrorResponse` monta a própria `Response`
   e descartaria o header de correlação e o `finalizeAudit`.
3. **O guard que deveria ter pego o item 2.** Já existia um teste chamado
   _"nenhum endpoint devolve 400 para falha de schema"_, e ele passava verde.
   O regex exigia a forma literal `new Response(JSON.stringify({ error: ...
status: 400`; quase ninguém escreve assim. Os dois violadores passavam por
   um helper local que o regex não enxergava.

#### O guard reescrito — e o que ele revelou

A detecção passou a ser pelo **ramo**, não pela forma da resposta: acha
`if (!<validador>.success)` e inspeciona o statement executado. Qualquer jeito
de montar a resposta fica coberto, inclusive os que ainda não existem.

Duas armadilhas no caminho, ambas encontradas antes de virarem commit:

- **Janela fixa de caracteres acusa inocente.** Metade das funções escreve
  `if (!_v.success) return _v.response;` e logo abaixo faz uma checagem manual
  de campo que devolve 400 legitimamente. Uma janela de 400 chars engolia esse
  400 e apontava 7 funções corretas. Corrigido com recorte por chaves
  balanceadas / `;` de nível zero.
- **`createErrorResponse(x.error, 400, ...)` não é violação.** O helper
  intercepta mensagens com `Contract Violation` — exatamente o que
  `validatePayload` emite — e delega para `createValidationErrorResponse`,
  devolvendo 422 e **ignorando o argumento de status**. Em 25 chamadas o `400`
  é literal morto: enganoso de ler, correto no fio.

Descontadas as duas, sobraram **19 violações reais**. A saída honesta não era
apagar o teste nem afrouxar o regex: o guard virou **catraca**, com a dívida
declarada em `DIVIDA_400_CONHECIDA` e comparação nos dois sentidos — fica
vermelho tanto quando alguém _adiciona_ uma violação quanto quando alguém
_corrige_ uma sem tirar da lista, que é o que impede a lista de virar folclore.

Validado por inversão dupla: reverter `conciliacao-proxy` para 400 →
`Novos em 400: conciliacao-proxy`; listar um endpoint já migrado →
`Já migrados para 422 — remova de DIVIDA_400_CONHECIDA`. Árvore restaurada nos
dois casos.

#### Um risco que a descoberta automática criou — e que foi fechado

Rodar o diretório inteiro passou a incluir `sso-test-login/index.test.ts`, que
é **integração viva contra a função publicada** e não tem guarda de skip. Ele
aponta para `bwwbeyolnnzppeuhgkcd.supabase.co`: no CI sem secrets reprovaria
por 401, e localmente a primeira execução bateu em produção de verdade.

Duas medidas:

- `--ignore` nesse arquivo, que já roda no job `integration-tests` com secrets.
- **`--allow-net` escopado ao loopback** (`0.0.0.0:8000,127.0.0.1,localhost`).
  Os testes só precisam da permissão porque vários módulos têm `Deno.serve()`
  no topo, que faz bind na importação — nenhum deveria falar com a internet.
  Com o escopo, "offline" deixa de ser convenção e passa a ser garantido pelo
  runtime: quem vazar para a rede reprova com `NotCapable`.

O env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
`DENO_TESTING`) foi declarado no step em vez de depender do vazamento de
`Deno.env.set` de um módulo anterior na ordem alfabética — dependência que um
arquivo novo com nome "errado" quebraria.

#### Resultado

|                           | Antes     | Depois                      |
| ------------------------- | --------- | --------------------------- |
| Arquivos de teste no gate | 24 de 48  | 48 de 48                    |
| Testes executados         | 185       | 301 offline + 4 no job live |
| Tempo                     | 6s        | 8s                          |
| Saída para a internet     | permitida | bloqueada pelo runtime      |

`nfe-vinculo-proxy` também entrou no `deno lint` e no
`scripts/ci/deno-check-functions.sh`, onde faltava por omissão — mesma classe
de porta destrancada.

#### Pendente nesta etapa

- **O piso percentual em si** (o objetivo original): `deno coverage` travando o
  número atual e subindo por degraus. Só agora faz sentido medir, porque só
  agora a medida cobre a suíte inteira.
- **As 19 violações de 400.** Migrar cada uma para o envelope 422 e removê-la
  de `DIVIDA_400_CONHECIDA`. É mudança de contrato de erro em 19 endpoints e
  merece commit próprio, não carona neste.
- **`sso-test-login/index.test.ts` sem guarda de skip.** Hoje depende do
  `--ignore` no workflow. Uma guarda `ignore: !ANON_KEY` no próprio arquivo
  seria mais robusta que o acordo à distância.

---

## Bloco G — Higiene (P3)

### Etapa 45 — Reconstruir o grafo e corrigir o gatilho

**Esforço:** 2h
`graphify-out/GRAPH_REPORT.md` foi construído de `4a081b85` (2026-08-28); `main` está **36 commits à frente**. A causa: `.github/workflows/graphify.yml:3-12` dispara apenas em `pull_request` e `workflow_dispatch` — **não há `schedule` nem `push` para `main`**, e o job tem `permissions: contents: read`, não podendo sequer commitar o resultado. A afirmação de `CLAUDE.md:90` ("auto-sync N8N corrige em até 15 min") **não é sustentada por nenhum gatilho existente**.
**Ação:** rodar `graphify update . --force` e adicionar gatilho `push` em `main` com permissão de escrita — ou corrigir/remover a alegação do N8N.

### Etapa 46 — Limpar branches e worktrees obsoletos

**Esforço:** 2h
33 branches locais e **18 worktrees**. Seguras para remover (PRs já mergeados): `feat/codex-graphify-20260911` (#70), `feat/codex-graphify-expansao-20260911` (#71), `fix/codex-financial-hardening-20260910` (#67). Há ainda um worktree em **detached HEAD** (`codex-auditoria-plano-20260830`).

### Etapa 47 — Decidir sobre os 5 commits órfãos

**Esforço:** 3h
Commits que não existem em nenhuma ref remota. Dois têm conteúdo **ausente** do `main`: `8b62718f` (docs + scripts de auditoria financeira) e `7c684900` (`docs/REMOTE_ONLY_MIGRATIONS_STRATEGY.md`). Os outros três (`29eb6719`, `fb9e6442`, `80aa2880`, de agosto) tocam arquivos que o `main` já possui com conteúdo divergente — provavelmente superados, mas `29eb6719` altera `auth-guard.ts` e **exige revisão dirigida antes de descarte**.

### Etapa 48 — Resolver os PRs abertos

**Esforço:** 4h
**#69** (`CONFLICTING/DIRTY`): título quase idêntico ao do **#78, já mergeado** — provavelmente obsoleto; fechar em vez de rebasear. **#79**: desbloqueado pela Etapa 36. **#73** (dependabot graphifyy): `validacoes=FAILURE`.

### Etapa 49 — Normalizar migrations e auditar views

**Esforço:** 6h
Três migrations violam a convenção de timestamp de 14 dígitos exigida por `CLAUDE.md:15`: `001_create_tables.sql`, `002_rls_policies.sql`, `003_seed_data.sql`. Além disso, há **106 ocorrências de `CREATE VIEW`** contra apenas **30 arquivos com `security_invoker`** — auditar quais views ainda rodam como _definer_, contrariando o hardening P15+ (`CLAUDE.md:22`).
_(Nota positiva: nenhuma violação de `CREATE INDEX CONCURRENTLY`, nenhum timestamp duplicado e ordem lexicográfica = cronológica.)_

### Etapa 50 — Corrigir a deriva do `CLAUDE.md`

**Esforço:** 1h

| Afirmação          | Documento           | Real                   |
| ------------------ | ------------------- | ---------------------- |
| Migrations         | 571+                | **596**                |
| Edge functions     | 105                 | **104**                |
| Meta de testes     | 2689/2689           | **2736/2736**          |
| Auto-sync do grafo | "N8N em até 15 min" | **não existe gatilho** |

---

## Ordem de execução recomendada

1. **Imediato (24h):** Etapas 1, 2, 3 — credenciais vivas e vazamento cross-tenant ativo.
2. **Semana 1:** Etapas 4–13 — fechar a classe IDOR e impedir reincidência.
3. **Semana 2:** Etapas 29, 32, 34, 35, 36 — restaurar a capacidade do CI de detectar as demais.
4. **Semanas 3–4:** Bloco C (14–21) e Bloco D (22–28).
5. **Contínuo:** Blocos F e G.

> **Observação de sequenciamento:** as etapas 29 e 32 vêm antes do grosso das correções de propósito. Enquanto 20 specs E2E não rodarem e o piso de cobertura estiver 10× abaixo do real, **não há como comprovar que as correções dos blocos C e D funcionam nem que permanecem funcionando**.
