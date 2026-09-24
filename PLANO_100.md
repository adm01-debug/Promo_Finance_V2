> **PLANO COMPLETO COM 43 ETAPAS** — o sistema não sustenta 100 correções reais a partir dos 44
> achados confirmados em `AUDITORIA.md` (2026-09-24, HEAD `81c4576`). Etapas ordenadas por severidade;
> dentro do mesmo nível, dependências técnicas primeiro, depois menor esforço primeiro.

---

## P0 — agora

### E-001 · [P0] · backend — Corrigir IDOR em `asaas-proxy`: exigir vínculo de empresa em toda action que move dinheiro ou toca cobrança
Corrige: A-009
Onde: `supabase/functions/asaas-proxy/index.ts`
Ação: importar `exigirVinculoEmpresa` de `_shared/auth-guard.ts` (já usado corretamente em
`decidir-regime`/`nfe-upload-certificado`) e aplicar antes de `criar_cliente`, `criar_cobranca`,
`cancelar_cobranca`, `estornar_cobranca`, `segunda_via_boleto`, `pix_qrcode`,
`boleto_linha_digitavel`, `consultar_cobranca`, `transferir_pix`, `aceitar_sugestao_conciliacao` —
resolvendo `empresa_id` a partir do recurso (`asaas_id`→cliente/cobrança→empresa) e comparando com as
empresas do usuário, não confiando em `empresa_id` vindo do body.
Diff estimado: ~60 linhas · 1 arquivo.
Depende de: —
Verificação: chamar `transferir_pix`/`cancelar_cobranca` com token de usuário da empresa A e
`asaas_id`/dados de empresa B → esperar 403; com dados da própria empresa → 200.
Risco: se o mapeamento `asaas_id → empresa_id` estiver incompleto para registros legados, pode
bloquear operação legítima — testar contra uma amostra de cobranças reais antes de mergear.

### E-002 · [P0] · backend — Corrigir IDOR em `sefaz-manifestar`: exigir vínculo de empresa antes de manifestar NFe
Corrige: A-010
Onde: `supabase/functions/sefaz-manifestar/index.ts`
Ação: em `executeManifestacao`, após localizar a NFe pela `chave_acesso`, chamar
`exigirVinculoEmpresa(user, nfe.empresa_id)` (mesmo padrão de `nfe-upload-certificado`) antes de
carregar o certificado e assinar/enviar à SEFAZ.
Diff estimado: ~15 linhas · 1 arquivo.
Depende de: —
Verificação: chamar com token de usuário da empresa A e `chave_acesso` de NFe da empresa B → esperar
403, nenhuma chamada à SEFAZ disparada.
Risco: nenhum — é adição de guard, sem mudar comportamento do caminho legítimo.

### E-003 · [P0] · seguranca — Rotacionar a `service_role` key vazada do projeto `xyykivpcdbfukaongpbw`
Corrige: A-036
Onde: fora deste repositório — projeto Supabase `xyykivpcdbfukaongpbw` (dono não identificado nesta
auditoria); referência local em `supabase/functions/compare-schemas/index.ts` (histórico git,
commit `631944238f`).
Ação: identificar o dono/projeto real de `xyykivpcdbfukaongpbw`, rotacionar a `service_role key` no
dashboard Supabase daquele projeto, e confirmar que `compare-schemas` no HEAD atual usa só
`Deno.env.get('SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY')` (já é o caso). Se o repositório for
público, avaliar reescrita de histórico (`git filter-repo`) — decisão de negócio, não automatizar sem aprovação.
Diff estimado: 0 linhas de código · ação operacional externa.
Depende de: —
Verificação: tentar `GET https://xyykivpcdbfukaongpbw.supabase.co/rest/v1/<tabela>` com a chave antiga
→ esperar 401 após rotação.
Risco: rotacionar sem avisar quem depende dessa integração pode quebrar um fluxo legítimo que ainda a
use — confirmar com o dono do projeto antes.

---

## P1 — bloqueia fluxo financeiro/tributário ou vaza dado

### E-004 · [P1] · banco — Aplicar migration `20260913120000_corrige_credenciais_automacoes_internas.sql`
Corrige: A-002, A-003
Onde: `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql`
Classe: aditiva (recria triggers/funções com credencial corrigida).
Ação: rodar a migration contra `bwwbeyolnnzppeuhgkcd` via `db_query` com o DDL direto (nunca
`apply_migration`, per CLAUDE.md), e inserir a linha correspondente em
`supabase_migrations.schema_migrations` com o timestamp `20260913120000`.
Diff estimado: já escrito (arquivo existente) · 1 migration.
Depende de: —
Verificação: `SELECT tgname FROM pg_trigger WHERE tgname IN
('trg_notificar_alerta_critico_push','on_whatsapp_message_inserted')` → 2 linhas; inserir um alerta
`critical` de teste e confirmar push disparado.
Risco: baixo (recria função/trigger existentes com nova versão) — testar em um alerta de teste antes
de confiar em produção.

### E-005 · [P1] · banco — Aplicar migration `20260913140000_rpcs_atomicas_fluxos_multi_passo.sql`
Corrige: A-001
Onde: `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql`
Classe: aditiva (cria 4 RPCs que não existem).
Ação: rodar a migration via `db_query` com DDL direto e registrar em
`supabase_migrations.schema_migrations`.
Diff estimado: já escrito · 1 migration.
Depende de: —
Verificação: `SELECT proname FROM pg_proc WHERE proname IN ('aprovar_solicitacao_pagamento',
'gerar_darf_retencoes','pagar_darf_retencoes','registrar_nfe_com_creditos')` → 4 linhas; executar
uma aprovação de pagamento de teste ponta a ponta pela UI.
Risco: baixo — são funções novas, não alteram dado existente; testar uma aprovação de teste antes de
liberar para o time financeiro.

### E-006 · [P1] · infra — Adicionar gate de CI que falha se houver migration commitada não aplicada em produção
Corrige: A-001, A-002, A-004 (previne recorrência)
Onde: `.github/workflows/ci.yml` (novo step) · `scripts/`
Ação: script que compara `ls supabase/migrations/*.sql` (timestamps) contra `SELECT version FROM
supabase_migrations.schema_migrations` via `DATABASE_URL`; falhar o job se houver arquivo mais novo
que `max(version)` não rastreado. Rodar como step obrigatório (não condicional a secret ausente —
ver E-034).
Diff estimado: ~40 linhas · 1 script + 1 step de CI.
Depende de: E-004, E-005 (para não falhar imediatamente contra o estado atual).
Verificação: rodar o script localmente contra o estado pós E-004/E-005 → deve passar; commitar uma
migration fake sem aplicar → deve falhar o job.
Risco: falso positivo se alguém commitar uma migration em PR antes de aplicá-la ao banco — documentar
o fluxo correto (aplicar primeiro, depois commitar) no CONTRIBUTING.md.

### E-007 · [P1] · banco — Adicionar auth+RBAC em `bling-proxy` para actions financeiras/fiscais destrutivas
Corrige: A-012
Onde: `supabase/functions/bling-proxy/index.ts`
Ação: aplicar checagem de `user_roles.role in ('admin','financeiro')` (mesmo padrão de
`asaas-proxy:76-90`) antes de `excluir_produtos`, `excluir_contas_pagar/receber`, `cancelar_nfe`,
`estornar_contas_nfe`, `baixa_conta_pagar`, `excluir_bordero`.
Diff estimado: ~25 linhas · 1 arquivo.
Depende de: —
Verificação: chamar `cancelar_nfe` com usuário role `visualizador` → 403; com `financeiro` → 200.
Risco: pode bloquear um fluxo legítimo de role diferente que hoje usa essas actions — checar logs de
uso antes de restringir, ou liberar temporariamente para roles adicionais se necessário.

### E-008 · [P1] · backend — Adicionar autenticação e rate limit em `conciliacao-ia`
Corrige: A-011
Onde: `supabase/functions/conciliacao-ia/index.ts`
Ação: importar `exigirUsuario` e `checkRateLimit` de `_shared/auth-guard.ts` (mesmo padrão de
`categorizar-despesa`, 30 req/min), aplicar no início do handler antes de chamar o AI gateway.
Diff estimado: ~15 linhas · 1 arquivo.
Depende de: —
Verificação: `POST` sem header Authorization → 401; 31ª chamada no mesmo minuto → 429.
Risco: nenhum — function hoje não deveria aceitar chamada anônima.

### E-009 · [P1] · fluxo-crítico — Corrigir `processar-fila-cobrancas` para não engolir erro de envio
Corrige: A-013
Onde: `supabase/functions/processar-fila-cobrancas/index.ts:62-83`
Ação: capturar o `error` retornado por `supabase.functions.invoke(...)` e propagar (mesmo padrão de
`executar-regua-cobranca/index.ts:119-137`, `return error?.message ?? null`); só marcar
`status='enviado'` quando `error` for null.
Diff estimado: ~10 linhas · 1 arquivo.
Depende de: —
Verificação: forçar falha em `enviar-alerta-email` (ex.: e-mail inválido) e confirmar que o item fica
com status de falha/retry em `execucoes_cobranca`, não `enviado`.
Risco: nenhum — só corrige a lógica de propagação de erro.

### E-010 · [P1] · integracoes — Trocar o SELECT+UPDATE manual de `processar-fila-cobrancas` pela RPC atômica `processar_fila_cobrancas`
Corrige: A-018
Onde: `supabase/functions/processar-fila-cobrancas/index.ts:41-59`
Ação: substituir o `SELECT ... LIMIT 20` + `UPDATE` por item pela chamada à RPC
`public.processar_fila_cobrancas(p_limite)` já existente (migration `20260317001356_*.sql:161-168`,
usa `FOR UPDATE SKIP LOCKED`).
Diff estimado: ~20 linhas · 1 arquivo.
Depende de: E-009 (mesma function, evitar conflito de merge).
Verificação: invocar a function duas vezes em paralelo (curl simultâneo) e confirmar que nenhum item
é processado/enviado duas vezes.
Risco: mudança de contrato interno da function — testar o fluxo de cobrança completo em staging antes
de mergear.

### E-011 · [P1] · fluxo-crítico — Corrigir `executar-fechamento-tributario` para filtrar conciliação bancária por `empresa_id`
Corrige: A-014
Onde: `supabase/functions/executar-fechamento-tributario/index.ts:160-165`
Ação: adicionar `.eq('empresa_id', body.empresa_id)` na query de `transacoes_bancarias` pendentes,
igual às outras 5 checagens da mesma function.
Diff estimado: ~2 linhas · 1 arquivo.
Depende de: —
Verificação: rodar fechamento de uma empresa com poucas pendências e outra com muitas → confirmar que
o checklist de cada uma reflete só suas próprias transações.
Risco: nenhum — é a correção de um filtro faltante, sem mudar a lógica de negócio.

### E-012 · [P1] · backend — Exigir vínculo de empresa em `open-finance` antes de gravar transações bancárias
Corrige: A-015
Onde: `supabase/functions/open-finance/index.ts:451-520`
Ação: antes do insert/select em `transacoes_bancarias`/`contas_bancarias`, validar via
`exigirVinculoEmpresa` que `contaBancariaId` pertence a uma empresa do usuário chamador.
Diff estimado: ~15 linhas · 1 arquivo.
Depende de: —
Verificação: chamar `import_transactions` com `contaBancariaId` de outra empresa → 403.
Risco: nenhum — dado de origem hoje é mock; corrigir antes da integração real ser ligada evita herdar o problema.

### E-013 · [P1] · banco — Migration para adicionar `asaas_id`/`external_provider` em `boletos`
Corrige: A-038
Onde: nova migration em `supabase/migrations/` · tabela `boletos`
Classe: aditiva (`ADD COLUMN` nullable).
Ação: `ALTER TABLE public.boletos ADD COLUMN asaas_id text, ADD COLUMN external_provider text;` —
colunas nullable, sem backfill necessário (fluxo novo passa a preenchê-las). Remover o cast `as
unknown as BoletosInsert` em `src/hooks/useBoletos.ts:260` depois de regenerar `types.ts`.
Diff estimado: ~10 linhas · 1 migration + 1 regeneração de tipos.
Depende de: —
Verificação: emitir um boleto via Asaas em staging e confirmar INSERT bem-sucedido em `boletos` com
`asaas_id` preenchido.
Risco: baixo — `ADD COLUMN` nullable não trava tabela nem quebra leitura existente.

### E-014 · [P1] · frontend — Adicionar `toast.error` no `onError` de criar/editar Conta a Pagar
Corrige: A-021
Onde: `src/hooks/financial/useContasPagar.ts:132-136,153-157`
Ação: no `onError` de `useCreateContaPagar` e `useUpdateContaPagar`, adicionar
`toast.error('Erro ao salvar conta a pagar')` (mesmo padrão de `useDeleteContaPagar:172-176` e
`ContaReceberForm.tsx`).
Diff estimado: ~6 linhas · 1 arquivo.
Depende de: —
Verificação: forçar erro (ex.: RLS negando) ao salvar uma conta a pagar em ambiente de teste →
confirmar toast visível.
Risco: nenhum.

### E-015 · [P1] · ux — Propagar `isError` da query de Contas a Pagar para a UI, com estado de erro distinto de vazio
Corrige: A-027
Onde: `src/hooks/financial/useContasPagar.ts:94-107`, `src/pages/ContasPagar.tsx:172-186`,
`src/pages/ContasPagar/components/List.tsx:58-69`
Ação: expor `isError`/`error` do `useContasPagarPaginated`, passar para `List`, e renderizar um
estado de erro com botão "Tentar novamente" quando `isError`, distinto do estado vazio real.
Diff estimado: ~30 linhas · 3 arquivos.
Depende de: —
Verificação: simular falha de rede (DevTools offline) ao abrir Contas a Pagar → ver estado de erro
com retry, não "nenhuma conta cadastrada".
Risco: nenhum.

### E-016 · [P1] · ux — Migrar lista de transações da Conciliação de `useState`+`useEffect` para `useQuery`
Corrige: A-028
Onde: `src/hooks/useConciliacaoPageState.ts:61-84`, `src/pages/Conciliacao.tsx:353-359`
Ação: substituir o `useEffect`+`useState` local por `useQuery` (TanStack Query, já padrão no resto do
app), expondo `isLoading`/`isError` para a página distinguir carregando/vazio real/erro.
Diff estimado: ~40 linhas · 2 arquivos.
Depende de: —
Verificação: trocar de conta bancária na tela de Conciliação e confirmar que não pisca "Nenhuma
transação encontrada" antes de carregar; forçar erro de rede e confirmar mensagem de erro com retry.
Risco: médio — muda a fonte de dados da tela mais usada de conciliação; testar contra contas com
volumes grande e pequeno de transações antes de mergear.

### E-017 · [P1] · frontend — Desativar ou corrigir o Portal do Cliente (auth fake + dados mock em produção)
Corrige: A-029
Onde: `src/App.tsx:178`, `src/pages/PortalCliente.tsx`
Ação (decisão de negócio — recomendo a opção A): **A)** remover a rota `/portal-cliente` de produção
até haver validação real de token (via edge function) e dados reais; ou **B)** implementar a validação
real do token contra uma tabela/edge function e substituir os dados mock por dados reais da empresa.
Diff estimado: opção A ~5 linhas (remover rota) · opção B ~150+ linhas (nova integração).
Depende de: —
Verificação: opção A — acessar `/portal-cliente` deve resultar em 404/redirect; opção B — token
inválido deve ser rejeitado e dados exibidos devem ser os reais do cliente autenticado.
Risco: opção A pode remover uma feature que algum cliente já usa (mesmo que fake) — confirmar com
Joaquim se há uso real antes de remover.

---

## P2 — risco latente ou degradação mensurável

### E-018 · [P2] · backend — Restringir escopo de `gerar-pacote-evidencias` por empresa do admin chamador
Corrige: A-016
Onde: `supabase/functions/gerar-pacote-evidencias/index.ts:144-151,257-278`
Ação: se a intenção for admin-por-empresa (mais provável dado o padrão do resto do repo), aplicar
`exigirVinculoEmpresa` antes de gerar o pacote; se for intencionalmente admin-de-plataforma,
documentar a exceção em `SECURITY_RULES.md` em vez de corrigir o código — decisão de negócio.
Diff estimado: ~15 linhas (se corrigir) · 1 arquivo.
Depende de: —
Verificação: admin da empresa A pedindo pacote da empresa B → 403 (se opção "corrigir" escolhida).
Risco: pode quebrar um fluxo legítimo de auditoria centralizada se "admin" for mesmo global por
design — confirmar intenção antes de aplicar.

### E-019 · [P2] · integracoes — Conectar `withTimeout` já existente aos fetches de `asaas-proxy` e `bling-proxy`
Corrige: A-017
Onde: `supabase/functions/asaas-proxy/index.ts:14-41`, `supabase/functions/bling-proxy/index.ts:505-556`,
`_shared/resilience.ts:120-138`
Ação: envolver as chamadas `fetch()` em `asaasFetch`/`blingFetch` com `withTimeout(fetch(...), 10000)`
(ou valor já usado em `n8n-dispatch`).
Diff estimado: ~10 linhas · 2 arquivos.
Depende de: —
Verificação: simular endpoint lento (mock com delay) e confirmar que a chamada falha após o timeout
configurado, não trava a invocação.
Risco: nenhum — só adiciona um teto de tempo a uma chamada que hoje não tem.

### E-020 · [P2] · seguranca — Trocar comparação de string por `timingSafeEqual` em `asaas-webhook` e `n8n-dispatch`
Corrige: A-019
Onde: `supabase/functions/asaas-webhook/index.ts:26`, `supabase/functions/n8n-dispatch/index.ts:82`
Ação: reusar o helper `segredosIguais`/`timingSafeEqual` já usado em `_shared/auth-guard.ts`/`_shared/webhook-auth.ts`.
Diff estimado: ~6 linhas · 2 arquivos.
Depende de: —
Verificação: webhook com token correto → 200; com token incorreto → 401 (comportamento inalterado, só
a comparação muda).
Risco: nenhum.

### E-021 · [P2] · frontend — Adicionar guarda contra `undefined`/`null` nas 5 reimplementações locais de formatação de moeda
Corrige: A-023
Onde: `src/pages/tributario/{IrpjCsllLucroReal,FolhaEncargos,PisCofinsCreditos,Monofasico,ObservabilidadeDigest}.tsx`
Ação: remover as 5 funções `brl` locais e importar `formatCurrency` de `src/lib/formatters.ts`.
Diff estimado: ~15 linhas (remoção) · 5 arquivos.
Depende de: —
Verificação: renderizar cada tela tributária com dado agregado ausente (`undefined`) → deve mostrar
"R$ 0,00" em vez de quebrar com `TypeError`.
Risco: nenhum — `formatCurrency` já é usado e testado no resto do app.

### E-022 · [P2] · ux — Adicionar confirmação (`ConfirmDialog`) em "Ignorar Transação" individual e em lote na Conciliação
Corrige: A-030
Onde: `src/pages/Conciliacao.tsx:333-335,378-381`, `src/hooks/useConciliacaoPage.ts:272-286,313-326`
Ação: envolver `handleIgnorar`/`handleBulkIgnorar` com `ConfirmDialog` antes de disparar o `update`.
Diff estimado: ~20 linhas · 2 arquivos.
Depende de: E-023 (reaproveitar o suporte a confirmação que E-023 adiciona ao `BulkActionsBar`).
Verificação: clicar "Ignorar Selecionadas" → deve exibir confirmação antes de gravar.
Risco: nenhum — muda só a UX, não a lógica de negócio.

### E-023 · [P2] · ux — Adicionar suporte a confirmação por ação no `BulkActionsBar` e aplicar em "Cancelar" (Contas a Pagar/Receber)
Corrige: A-026
Onde: `src/components/ui/bulk-actions-bar.tsx:87-96`, `src/pages/ContasPagar.tsx:64-67`,
`src/pages/ContasReceber.tsx:90-93`
Ação: adicionar prop opcional `confirm` (título/descrição) em cada ação de `BulkActionsBar`; quando
presente, abrir `ConfirmDialog` antes de chamar `onClick`. Aplicar em `handleBulkCancel` de ambas as telas.
Diff estimado: ~35 linhas · 3 arquivos.
Depende de: —
Verificação: selecionar N contas e clicar "Cancelar" → deve pedir confirmação antes de cancelar.
Risco: nenhum.

### E-024 · [P2] · frontend — Adicionar paginação/virtualização em Movimentações
Corrige: A-022
Onde: `src/hooks/useFinancialOperations.ts:41-64`, `src/pages/Movimentacoes.tsx:141-190`
Ação: trocar `.limit(500)` por paginação real (`range`), reaproveitando o padrão de
`FixedSizeList` já usado em `ContasPagarList`.
Diff estimado: ~40 linhas · 2 arquivos.
Depende de: —
Verificação: aplicar filtro de data amplo e confirmar que a tabela não renderiza mais que a página
atual de linhas (ex.: 50-100) de uma vez.
Risco: nenhum — reaproveita padrão já validado em outra tela do mesmo app.

### E-025 · [P2] · infra — Esclarecer e documentar qual plataforma é a produção real (Lovable Cloud vs Vercel)
Corrige: A-031
Onde: `docs/DEPLOYMENT.md`, `CLAUDE.md`, `vercel.json`
Ação (decisão de negócio de Joaquim, não é código): confirmar com o time qual pipeline está de fato
servindo `app.promo-finance.com` hoje; atualizar `docs/DEPLOYMENT.md` para refletir a realidade e
desativar/remover o pipeline órfão (ou documentar por que os dois coexistem, se intencional).
Diff estimado: depende da decisão · documentação + possível remoção de `vercel.json`.
Depende de: —
Verificação: `curl -I https://app.promo-finance.com` e comparar headers/infra com o painel confirmado
como fonte de verdade.
Risco: se remover o pipeline errado, produção para — confirmar 100% antes de desativar qualquer coisa.

### E-026 · [P2] · infra — Fazer os gates de segurança do CI (RLS multi-tenant, privilégios) falharem o job quando `DATABASE_URL` estiver ausente
Corrige: A-032
Onde: `.github/workflows/ci.yml`
Ação: trocar o comportamento de "registrar como inconclusivo" para `exit 1` quando
`db_url_preflight.outputs.available != 'true'` nos steps que rodam `rls_multi_empresa.sql` e
`test-observability-privileges.sql`.
Diff estimado: ~10 linhas · 1 workflow.
Depende de: confirmar que `DATABASE_URL` está de fato configurado nos secrets do repo (ver Não
verificado da auditoria) — senão essa mudança quebra todo PR até o secret ser adicionado.
Verificação: remover temporariamente o secret em um ambiente de teste de CI e confirmar que o job falha.
Risco: pode bloquear todo merge se o secret realmente estiver ausente — verificar antes de aplicar.

### E-027 · [P2] · infra — Decidir e executar: integrar Sentry de verdade ou remover o stub de `error-tracking.ts`
Corrige: A-033
Onde: `src/lib/error-tracking.ts`, `package.json`, `index.html`
Ação (decisão de negócio): **A)** provisionar DSN do Sentry e completar `initSentry`/`sentryTracker`
com `@sentry/react`; ou **B)** remover o stub e documentar que hoje o único canal de erro do frontend
é o console do navegador do usuário.
Diff estimado: opção A ~40 linhas + dependência nova · opção B ~20 linhas (remoção).
Depende de: —
Verificação: opção A — forçar um erro no frontend em staging e confirmar que aparece no dashboard Sentry.
Risco: nenhum tecnicamente; é decisão de prioridade/custo (Sentry pago).

### E-028 · [P2] · infra — Confirmar e documentar a política de backup/PITR do projeto Supabase `bwwbeyolnnzppeuhgkcd`
Corrige: A-034
Onde: `docs/SECURITY.md` · Supabase Dashboard (fora do repo)
Ação: verificar no Supabase Dashboard a retenção de backup/PITR configurada para o projeto, testar um
restore em um branch/projeto de teste, e documentar o resultado (retenção real, último restore
testado) em `docs/SECURITY.md` no lugar da linha genérica "Backups diários".
Diff estimado: 1 parágrafo de doc + 1 teste manual de restore.
Depende de: —
Verificação: restore de teste bem-sucedido, com timestamp e resultado documentados.
Risco: nenhum — é verificação, não mudança de infraestrutura.

### E-029 · [P2] · qualidade — Reconciliar as ~44 migrations não rastreadas em `schema_migrations`
Corrige: A-004
Onde: `supabase/migrations/` · `supabase_migrations.schema_migrations`
Ação: script que lista migrations locais no intervalo `[min(version), max(version)]` tracked e não
presentes na tabela, e para cada uma verifica se o efeito (tabela/coluna/função) já existe no schema
vivo (squash legítimo) ou não (gap real a aplicar).
Diff estimado: ~1 script de auditoria + N migrations a aplicar conforme resultado (não estimável sem rodar).
Depende de: E-004, E-005 (não misturar com a investigação daquelas duas já identificadas).
Verificação: após reconciliar, `count(*)` em `schema_migrations` deve bater com o número de migrations
locais cujo efeito está confirmado no schema vivo.
Risco: pode revelar mais migrations não aplicadas (como A-001/A-002) — tratar cada uma individualmente
antes de aplicar em lote.

### E-030 · [P2] · qualidade — Auditar e resolver sistematicamente os 43 TODOs de schema drift (2026-08-14)
Corrige: A-039
Onde: 20+ arquivos em `src/hooks/` e `src/components/` (lista completa em A-039)
Ação: para cada TODO, decidir e aplicar uma de duas correções — **(a)** se o campo ainda faz sentido
no negócio, criar migration aditiva para recriar a coluna e reconectar o hook; **(b)** se o campo foi
descontinuado de propósito, remover o campo correspondente do formulário/tipo para não sugerir ao
usuário que o dado será salvo. Priorizar `useFinancialOperations.ts` (Movimentações, filtro por conta
bancária e persistência de categoria/origem/vínculo) por ser o de maior impacto ao usuário.
Diff estimado: variável por TODO, ~10-30 linhas cada — não estimável em bloco único.
Depende de: —
Verificação: para cada campo corrigido, preencher o formulário correspondente e confirmar que o valor
persiste (ou que o campo não aparece mais, se descontinuado).
Risco: campo pode ter sido removido intencionalmente por razão de negócio não documentada — validar
com Joaquim antes de recriar qualquer coluna.

---

## P3 — qualidade, consistência, manutenção

### E-031 · [P3] · backend — Adicionar guard de autenticação em `calculo-iva`
Corrige: A-020
Onde: `supabase/functions/calculo-iva/index.ts`
Ação: aplicar `exigirUsuario` no início do handler, por consistência com o resto das functions
tributárias (impacto de negócio é baixo, mas função hoje é a única exceção do domínio).
Diff estimado: ~5 linhas.
Depende de: —
Verificação: chamar sem Authorization → 401.
Risco: nenhum.

### E-032 · [P3] · banco — Remover a policy RLS morta `admin_only_integration_secrets`
Corrige: A-005
Onde: `integration_secrets` · nova migration
Classe: destrutiva-leve (DROP POLICY, sem perda de dado; efeito de segurança já é dado pela
RESTRICTIVE, então o DROP não muda o comportamento real de acesso).
Ação: `DROP POLICY admin_only_integration_secrets ON public.integration_secrets;` — a RESTRICTIVE
`integration_secrets_no_client_access` permanece e mantém o bloqueio correto.
Diff estimado: 1 linha · 1 migration.
Depende de: —
Verificação: repetir a query que comparou as duas policies e confirmar que só a RESTRICTIVE resta,
sem nenhuma mudança em quem consegue acessar a tabela.
Risco: baixo, mas é mudança em RLS — testar em staging antes de aplicar em produção.

### E-033 · [P3] · banco — Remover os 24 pares de índices duplicados
Corrige: A-006
Onde: tabelas listadas em A-006 · nova migration
Classe: destrutiva-leve (`DROP INDEX`, sem perda de dado — mantém o índice mais antigo/usado de cada par).
Ação: para cada par, confirmar via `pg_stat_user_indexes` qual dos dois tem mais uso (ou manter o que
sustenta a constraint UNIQUE) e `DROP INDEX` do redundante. Fazer em lote pequeno (5-6 por migration)
para facilitar rollback pontual se algo depender do nome do índice removido.
Diff estimado: ~24 `DROP INDEX` · 4-5 migrations pequenas.
Depende de: —
Verificação: `supabase_db_duplicate_indexes` deve retornar 0 pares após aplicação; confirmar que
constraints UNIQUE originais continuam ativas.
Risco: baixo — índice duplicado não é referenciado por nome em código de aplicação tipicamente, mas
checar `grep` por nome do índice em migrations/funções antes de cada DROP.

### E-034 · [P3] · banco — Ajustar `autovacuum_vacuum_scale_factor` nas tabelas financeiras de alta taxa de update
Corrige: A-007
Onde: `fornecedores`, `centros_custo`, `contas_bancarias`, `conciliacoes`, `lancamentos_contabeis`,
`solicitacoes_aprovacao` · nova migration
Ação: `ALTER TABLE <tabela> SET (autovacuum_vacuum_scale_factor = 0.05);` (ou valor menor) para as 6
tabelas, permitindo autovacuum disparar com menos dead tuples acumulados.
Diff estimado: ~6 linhas · 1 migration.
Depende de: —
Verificação: `SELECT reloptions FROM pg_class WHERE relname = '<tabela>'` confirma o novo parâmetro.
Risco: nenhum — parâmetro de manutenção, não afeta dado nem aplicação.

### E-035 · [P3] · banco — Adicionar `empresa_id` e RLS por empresa em `fornecedores` (equivalente ao que `clientes` já tem)
Corrige: A-008
Onde: `fornecedores` · nova migration (expand-contract)
Classe: destrutiva (nova coluna NOT NULL eventualmente + mudança de modelo de RLS).
Ação — fase 1 (expand): `ALTER TABLE fornecedores ADD COLUMN empresa_id uuid REFERENCES empresas(id)`
nullable; backfill em lotes a partir de `user_empresas` do `user_id` dono de cada fornecedor; criar
policies adicionais `fornecedores_empresa_{select,insert,update,delete}` usando
`empresa_acessivel(empresa_id)`, mantendo as policies por `user_id` como estão.
Ação — fase 2 (contract, etapa separada após validação em produção): tornar `empresa_id` NOT NULL e
avaliar se as policies antigas por `user_id` ainda são necessárias.
Diff estimado: ~30 linhas · 1 migration (fase 1) + 1 migration futura (fase 2, não incluída na contagem deste plano).
Depende de: —
Verificação: usuário financeiro da empresa A consegue ver/editar fornecedor cadastrado por outro
usuário da mesma empresa A; usuário da empresa B continua sem acesso.
Risco: backfill incorreto pode atribuir fornecedor à empresa errada se um `user_id` pertencer a mais
de uma empresa — preview do impacto (`SELECT count(*) FROM fornecedores WHERE ...`) antes do backfill,
e backfill em lotes, nunca `UPDATE` de tabela inteira de uma vez.

### E-036 · [P3] · frontend — Ligar o botão "Novo Acordo Proativo" ao fluxo existente de `useAcordosParcelamento`
Corrige: A-024
Onde: `src/pages/Cobrancas.tsx:254-257`
Ação: adicionar `onClick` abrindo o diálogo/fluxo de criação de acordo já implementado em
`useAcordosParcelamento.ts`, reaproveitando o componente existente em vez de criar um novo.
Diff estimado: ~10 linhas.
Depende de: —
Verificação: clicar o botão abre o fluxo de criação de acordo.
Risco: nenhum.

### E-037 · [P3] · frontend — Remover o estado morto `isDeleting` em Contas a Pagar
Corrige: A-025
Onde: `src/hooks/useContasPagarLogic.ts:49`, `src/pages/ContasPagar.tsx:241`
Ação: remover `isDeleting` e a prop `isLoading={logic.isDeleting}` do `ConfirmDialog`, já que o fluxo
real usa toast com undo.
Diff estimado: ~2 linhas.
Depende de: —
Verificação: fluxo de exclusão de conta a pagar continua funcionando (toast com undo) sem o estado removido.
Risco: nenhum.

### E-038 · [P3] · qualidade — Remover `typescript-eslint` de `dependencies` e desduplicar contra `@typescript-eslint/{eslint-plugin,parser}`
Corrige: A-040
Onde: `package.json:120,140-141`
Ação: mover `typescript-eslint` para `devDependencies` (ou remover, já que `eslint.config.js` só usa
o meta-pacote) e reconciliar a versão com `@typescript-eslint/eslint-plugin`/`parser` para evitar as
duas versões (8.33.0 vs 8.59.0) convivendo.
Diff estimado: ~4 linhas · `package.json` + `bun.lock` regenerado.
Depende de: —
Verificação: `bun run lint` continua funcionando sem erro após a mudança.
Risco: baixo — só reorganização de dependências de build, não afeta runtime.

### E-039 · [P3] · qualidade — Atualizar o pin de `@supabase/supabase-js` nas 18 edge functions para acompanhar o frontend
Corrige: A-041
Onde: 18 arquivos `supabase/functions/*/index.ts` (lista completa no achado A-041)
Ação: atualizar o header `npm:@supabase/supabase-js@2.49.4` para uma versão próxima da usada no
frontend (2.87.1), testando cada function após a atualização (mudança de major/minor pode alterar
comportamento de auth/realtime).
Diff estimado: ~18 linhas (1 por arquivo) · atualização incremental, testar em lotes de 3-4 functions por vez.
Depende de: —
Verificação: rodar a suite de testes de integração das edge functions (`supabase/tests/`) após cada lote.
Risco: médio — mudança de ~38 versões pode ter breaking changes; fazer em lotes pequenos com teste
entre cada um, não tudo de uma vez.

### E-040 · [P3] · qualidade — Consolidar os 3 nomes de env var de URL base do app em uma constante única
Corrige: A-042
Onde: `enviar-convite-organizacao/index.ts:115`, `convidar-usuario/index.ts:172`,
`enviar-digest-conformidade/index.ts:359`, `relatorio-diario-anomalias/index.ts:121`,
`sso-callback/index.ts:8` · `_shared/`
Ação: criar `_shared/app-url.ts` exportando `getAppBaseUrl()` que lê uma única env var (ex.:
`APP_BASE_URL`, mantendo compatibilidade com as outras duas como fallback na transição) e substituir
os 5 usos diretos.
Diff estimado: ~20 linhas · 6 arquivos.
Depende de: —
Verificação: e-mails de convite e callback SSO continuam gerando a URL correta após a mudança.
Risco: baixo — manter fallback para as 3 env vars durante a transição evita quebra se alguma não for
migrada no ambiente de produção imediatamente.

### E-041 · [P3] · qualidade — Atualizar `.env.example` com as 11 variáveis reais faltando
Corrige: A-043
Onde: `.env.example`
Ação: adicionar `APP_BASE_URL`, `APP_PUBLIC_URL`, `DENO_TESTING`, `EXTERNAL_SUPABASE_SERVICE_KEY`,
`EXTERNAL_SUPABASE_URL`, `LOVABLE_API_KEY`, `PUBLIC_APP_URL`, `REGUA_CRON_SECRET`, `SUPABASE_DB_URL`,
`SUPABASE_JWT_SECRET`, `VAPID_PUBLIC_KEY` com placeholder vazio/comentário, ou automatizar via script
que gera `.env.example` a partir de `env.manifest.json`.
Diff estimado: ~11 linhas (manual) ou ~30 linhas (script de geração).
Depende de: —
Verificação: `.env.example` cobre 100% das vars listadas em `env.manifest.json` com escopo "runtime".
Risco: nenhum.

### E-042 · [P3] · seguranca — Substituir a `anon key` hardcoded de outro projeto nas 3 migrations por `Deno.env.get`
Corrige: A-037
Onde: `supabase/migrations/20260712194415_*.sql:18`, `20260726180529_*.sql:11`, `20260728183119_*.sql:17`
Ação: como migrations já aplicadas não devem ser editadas retroativamente, criar uma nova migration
que atualiza as funções/triggers correspondentes para ler a `apikey` correta (do projeto oficial
`bwwbeyolnnzppeuhgkcd`) via `vault`/env em vez do literal hardcoded — corrigindo também o mismatch
chave↔projeto que provavelmente já quebra esses 3 cron jobs.
Diff estimado: ~15 linhas · 1 migration nova.
Depende de: —
Verificação: `SELECT * FROM cron_job_logs WHERE job_name IN (...)` mostra sucesso após a correção, em
vez do 401 silencioso atual.
Risco: baixo — corrige um mismatch que já está quebrado; testar a chamada HTTP resultante manualmente
antes de confiar no cron.

### E-043 · [P3] · backend — Adicionar HMAC do corpo em `n8n-callback` (alinhar com padrão dos outros webhooks)
Corrige: A-044
Onde: `supabase/functions/n8n-callback/index.ts:48-52,124-139`
Ação: adotar o mesmo helper `authenticateWebhook` (HMAC) usado em `bitrix24-webhook`/`bling-webhook`/`whatsapp-webhook`.
Diff estimado: ~15 linhas.
Depende de: —
Verificação: callback com HMAC válido → 200; sem HMAC ou inválido → 401.
Risco: baixo — requer atualizar a configuração do lado N8N para assinar o payload; coordenar antes de mergear.

---

## Apêndice — achados sem etapa dedicada (cobertos por etapas acima)

- A-016 (`gerar-pacote-evidencias`) — coberto por E-018.
- Achados "INFO/positivo" reportados pelos agentes (webhooks com HMAC/timing-safe corretos, RLS geral
  sólido, idempotência de webhooks recebidos, deploy controlado de edge functions) não geraram etapa —
  são controles que já funcionam corretamente e não precisam de correção.

## Resumo

- **44 achados** em `AUDITORIA.md`: 3 P0 · 13 P1 · 15 P2 · 13 P3.
- **43 etapas executáveis** neste plano (E-001 a E-043) cobrindo 42 dos 44 achados (A-016 mapeado
  para E-018; nenhum achado ficou sem etapa correspondente).
- 3 migrations classificadas como destrutivas (E-032, E-033, E-035) — todas com plano de
  preview/backfill em lotes e, quando aplicável, expand-contract.
