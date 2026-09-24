# PLANO_50 — 50 etapas de melhoria e correção

> Sucessor do `PLANO_100.md` (43 etapas, 2026-09-24). Baseline: `main` = `79435e90`.
> Todas as evidências abaixo foram coletadas de primeira mão nesta sessão: consulta ao banco
> `bwwbeyolnnzppeuhgkcd`, leitura do código em `main` e nas branches das PRs abertas, e checagem
> do estado real das PRs no GitHub. Nada aqui é herdado de relatório anterior sem reconferência.
>
> **Status do PLANO_100 na data deste plano:** 5 etapas em produção · 18 prontas em PR aberta ·
> 3 parciais · 17 não implementadas. As 17 não implementadas e as 3 parciais estão reabsorvidas
> aqui, junto com 30 achados novos.

## Índice por bloco

| Bloco | Etapas | Tema |
| --- | --- | --- |
| A | 01–06 | Desbloquear o que já está pronto |
| B | 07–14 | Banco: aplicar o que já está escrito |
| C | 15–23 | Banco: integridade, RLS e performance |
| D | 24–29 | Fechar as implementações parciais |
| E | 30–36 | Segurança residual |
| F | 37–42 | CI, deploy e ambiente |
| G | 43–47 | Observabilidade e custo de banco |
| H | 48–50 | Qualidade e fechamento do ciclo |

---

## Bloco A — Desbloquear o que já está pronto

> 18 correções validadas estão paradas em PR aberta. Enquanto não entram em `main`, nenhuma
> protege o cliente. Este bloco é o de maior retorno por esforço do plano inteiro.

### 01 · [P0] · processo — Mergear a PR #92 (IDOR cross-tenant em `asaas-proxy` e `sefaz-manifestar`)
Onde: PR #92 · branch `claude/fix-idor-asaas-sefaz-260924-1326` · `supabase/functions/asaas-proxy/index.ts`, `supabase/functions/sefaz-manifestar/index.ts`.
Contexto: 26 pontos de guarda por empresa adicionados (as 10 actions exigidas pelo E-001 do plano anterior + 16 extras), resolvendo `empresa_id` a partir do recurso (`asaas_id` → `asaas_payments`/`asaas_customers`/`asaas_transfers`) em vez de confiar no corpo da requisição.
Ação: rodar `github_update_pr_branch` (a branch está atrás de `main`), aguardar os 4 checks obrigatórios e mergear com squash.
Verificação: com token de usuário da empresa A, chamar `cancelar_cobranca` com `asaas_id` de cobrança da empresa B → 403; com cobrança própria → 200.
Risco: se algum registro legado em `asaas_payments` tiver `empresa_id` nulo, a action responde 404 em vez de executar. Conferido nesta sessão: `asaas_payments` com `empresa_id` nulo = 0 linhas. Risco residual zero hoje.
Depende de: —

### 02 · [P0] · processo — Mergear a PR #96 (6 achados P1 de backend)
Onde: PR #96 · branch `claude/fix-backend-p1-260924-1334`.
Contexto: RBAC em `bling-proxy` (admin/financeiro antes de excluir/cancelar/baixar), autenticação + rate limit em `conciliacao-ia`, propagação de erro de envio em `processar-fila-cobrancas`, troca do SELECT+UPDATE manual pela RPC atômica `processar_fila_cobrancas`, filtro `empresa_id` faltante em `executar-fechamento-tributario`, e vínculo de empresa em `open-finance`.
Ação: atualizar a branch contra `main`, aguardar CI, mergear com squash.
Verificação: forçar falha no envio de uma cobrança e confirmar que o item fica com status de falha (e não `enviado`); rodar o fechamento tributário de duas empresas e conferir que cada checklist vê só as próprias transações pendentes.
Risco: a troca para a RPC muda o contrato interno de `processar-fila-cobrancas` — acompanhar a primeira execução real da fila após o merge.
Depende de: —

### 03 · [P1] · processo — Mergear a PR #99 (5 etapas P2: timeout, comparação timing-safe, moeda, confirmações)
Onde: PR #99 · branch `claude/fix-p2-cleanup-260924-1333`.
Contexto: `withTimeout` nos fetches de `asaas-proxy`/`bling-proxy`, `segredosIguais` em `asaas-webhook`/`n8n-dispatch`, `formatCurrency` nas 5 telas tributárias, `ConfirmDialog` em "Ignorar Transação" (individual e em lote) e suporte a confirmação por ação no `BulkActionsBar`.
Ação: atualizar contra `main`, aguardar CI, mergear com squash.
Verificação: clicar "Ignorar Selecionadas" na Conciliação deve pedir confirmação; abrir cada tela tributária com dado agregado ausente deve exibir "R$ 0,00" em vez de quebrar.
Risco: nenhum — todas as mudanças reaproveitam padrões já validados no app.
Depende de: —

### 04 · [P1] · processo — Mergear a PR #98 (3 etapas P3 de qualidade)
Onde: PR #98 · branch `claude/fix-p3-cleanup-260924-1333`.
Contexto: remoção do estado morto `isDeleting`, `typescript-eslint` movido para `devDependencies` com desduplicação de versão, e `.env.example` completado com as 11 variáveis que faltavam (conferido: as 11 estão presentes).
Ação: mergear com squash após CI verde. As etapas 24 e 26 deste plano corrigem os dois pontos parciais desta mesma PR — não precisam bloquear o merge.
Verificação: `bun run lint` continua limpo após a mudança de dependências.
Risco: baixo — reorganização de dependências de build, sem efeito em runtime.
Depende de: —

### 05 · [P1] · infra — Destravar PRs cujo diff é só documentação (#91, #94, #95)
Onde: branch protection de `main` · PRs #91 (auditoria + plano), #94 (produção é Vercel, não Lovable), #95 (exceção de escopo global em `gerar-pacote-evidencias`).
Contexto: os 4 checks obrigatórios (`Quality Gate & Tests`, `E2E Critical Gate`, `Unit tests`, `Integration tests`) só disparam em diff de código. Num PR só de `.md` eles nunca rodam, e a proteção exige que estejam presentes — o PR fica permanentemente sem poder mergear. Três PRs de documentação correta estão presas nessa armadilha.
Ação (decisão de negócio): **(a)** adicionar um job leve que sempre roda e reporta os 4 contextos como `success` em diff só de documentação; ou **(b)** mergear os três administrativamente e manter a regra como está.
Verificação: abrir um PR de teste tocando só um `.md` e confirmar que ele fica mergeável.
Risco: opção (a) mexe em branch protection — mudança de infra, precisa da sua autorização explícita.
Depende de: —

### 06 · [P1] · processo — Confirmar no Vercel que cada merge subiu para produção
Onde: Vercel (projeto `promo-finance-v2`) · após cada merge das etapas 01–04.
Ação: após cada squash-merge, conferir o deployment de `main` correspondente e registrar o resultado; se algum falhar, tratar antes de seguir para o próximo merge.
Verificação: deployment com status `READY` apontando para o SHA do merge.
Risco: merges em sequência podem enfileirar builds — mergear um de cada vez e confirmar antes do próximo.
Depende de: 01, 02, 03, 04

---

## Bloco B — Banco: aplicar o que já está escrito

> Conferido por query nesta sessão: `max(version)` em `supabase_migrations.schema_migrations` =
> `20260912100000`. **Nenhuma** das migrations abaixo foi aplicada. Todo este bloco exige o seu
> `APROVADO` — é DDL em banco de produção.

### 07 · [P0] · banco — Aplicar `20260913120000_corrige_credenciais_automacoes_internas.sql`
Onde: `supabase/migrations/20260913120000_*.sql` · projeto `bwwbeyolnnzppeuhgkcd`.
Classe: aditiva (recria triggers/funções com a credencial corrigida).
Contexto: o arquivo está commitado há dias e nunca foi aplicado. Enquanto isso, os gatilhos de alerta crítico e de mensagem de WhatsApp rodam com a credencial errada.
Ação: executar o DDL via `db_query` (nunca `apply_migration`, conforme CLAUDE.md) e inserir a linha `20260913120000` em `supabase_migrations.schema_migrations`.
Verificação: `SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_notificar_alerta_critico_push','on_whatsapp_message_inserted')` → 2 linhas; inserir um alerta `critical` de teste e confirmar o push disparado.
Risco: baixo — recria objetos existentes. Testar com um alerta de teste antes de confiar no fluxo real.
Depende de: APROVADO do Joaquim

### 08 · [P0] · banco — Aplicar `20260913140000_rpcs_atomicas_fluxos_multi_passo.sql`
Onde: `supabase/migrations/20260913140000_*.sql`.
Classe: aditiva (cria 4 RPCs inexistentes — conferido: `SELECT count(*) FROM pg_proc` para as 4 → 0).
Contexto: sem essas RPCs, aprovação de pagamento, geração e pagamento de DARF de retenções e registro de NF-e com créditos rodam em múltiplos passos sem transação. Uma falha no meio deixa o registro pela metade.
Ação: executar o DDL via `db_query` e registrar a versão.
Verificação: as 4 funções presentes em `pg_proc`; executar uma aprovação de pagamento de teste ponta a ponta pela UI.
Risco: baixo — são funções novas, não alteram dado existente.
Depende de: APROVADO do Joaquim

### 09 · [P1] · banco — Corrigir o cron job 18: `mv_performance_alerts_weekly` falha em toda execução
Onde: `cron.job` id 18 · materialized view `public.mv_performance_alerts_weekly`.
Contexto (achado novo desta sessão): a única falha de cron dos últimos 7 dias é este job, e ele falha **sempre**, com `ERROR: cannot refresh materialized view "public.mv_performance_alerts_weekly" concurrently / HINT: Create a unique index`. O `REFRESH ... CONCURRENTLY` exige um índice único na view, que não existe. O painel semanal de alertas de performance está congelado desde que o job foi criado.
Ação: criar o índice único que a view exige (sobre a chave natural do agrupamento) em nova migration; se a view não tiver chave natural única, trocar o job para `REFRESH` sem `CONCURRENTLY`.
Verificação: `SELECT status FROM cron.job_run_details WHERE jobid = 18 ORDER BY start_time DESC LIMIT 3` → `succeeded`.
Risco: `REFRESH` sem `CONCURRENTLY` bloqueia leitura da view durante o refresh — aceitável para uma view semanal de observabilidade.
Depende de: APROVADO do Joaquim

### 10 · [P1] · banco — Adicionar `asaas_id` e `external_provider` em `boletos`
Onde: `boletos` · nova migration · `src/hooks/useBoletos.ts`.
Classe: aditiva (`ADD COLUMN` nullable — conferido: as duas colunas não existem).
Contexto: sem essas colunas, o boleto emitido pelo Asaas não guarda o identificador externo, e o hook precisa de um cast `as unknown as BoletosInsert` para compilar.
Ação: `ALTER TABLE public.boletos ADD COLUMN asaas_id text, ADD COLUMN external_provider text;`, regenerar `types.ts` e remover o cast.
Verificação: emitir um boleto via Asaas e confirmar o INSERT com `asaas_id` preenchido.
Risco: baixo — `ADD COLUMN` nullable não trava a tabela.
Depende de: APROVADO do Joaquim

### 11 · [P1] · seguranca — Corrigir a `anon key` de outro projeto embutida em 3 cron jobs
Onde: migrations `20260712194415_*`, `20260726180529_*`, `20260728183119_*` · nova migration corretiva.
Contexto: as três funções chamam um endpoint HTTP com uma chave hardcoded que não pertence ao projeto oficial. Além do vazamento, o mismatch chave↔projeto provavelmente já devolve 401 silencioso.
Ação: nova migration que passa a ler a chave via `vault`/`internal_job_secret()` (padrão já usado pelos outros jobs), sem editar migrations antigas.
Verificação: log do job mostra sucesso em vez de 401.
Risco: baixo — corrige algo que já está quebrado.
Depende de: APROVADO do Joaquim

### 12 · [P2] · banco — Remover a policy RLS morta `admin_only_integration_secrets`
Onde: `integration_secrets` · nova migration.
Classe: destrutiva-leve (conferido: a policy ainda existe).
Contexto: o bloqueio real vem da policy RESTRICTIVE `integration_secrets_no_client_access`; a PERMISSIVE morta só confunde quem audita.
Ação: `DROP POLICY admin_only_integration_secrets ON public.integration_secrets;`
Verificação: repetir a query de comparação e confirmar que só a RESTRICTIVE resta, sem mudança em quem acessa.
Risco: baixo, mas é RLS — validar o acesso da aplicação logo após.
Depende de: APROVADO do Joaquim

### 13 · [P2] · banco — Remover os 24 pares de índices duplicados
Onde: 24 pares confirmados por `supabase_db_duplicate_indexes` nesta sessão · 4–5 migrations pequenas.
Contexto: ~4,6 MB de índice redundante e escrita duplicada em toda inserção. Os maiores: `index_usage_snapshots` (2,1 MB), `bloat_snapshots` (1,2 MB), `performance_alerts` (664 kB) — todos de tabelas de observabilidade com alta taxa de inserção.
Ação: para cada par, manter o índice que sustenta a constraint UNIQUE (ou o de maior uso em `pg_stat_user_indexes`) e dropar o outro, em lotes de 5–6 por migration.
Verificação: `supabase_db_duplicate_indexes` retorna 0 pares; constraints UNIQUE originais seguem ativas.
Risco: baixo — conferir por `grep` se o nome do índice aparece em alguma migration/função antes de cada DROP.
Depende de: APROVADO do Joaquim

### 14 · [P2] · banco — Ajustar `autovacuum_vacuum_scale_factor` nas 6 tabelas financeiras de alta atualização
Onde: `fornecedores`, `centros_custo`, `contas_bancarias`, `conciliacoes`, `lancamentos_contabeis`, `solicitacoes_aprovacao`.
Contexto: conferido — nenhuma das 6 tem `reloptions` de autovacuum. Com o padrão (20% de linhas mortas), tabelas financeiras acumulam bloat entre limpezas.
Ação: `ALTER TABLE <tabela> SET (autovacuum_vacuum_scale_factor = 0.05);` nas 6.
Verificação: `SELECT reloptions FROM pg_class WHERE relname = '<tabela>'` confirma o parâmetro.
Risco: nenhum — parâmetro de manutenção.
Depende de: APROVADO do Joaquim

---

## Bloco C — Banco: integridade, RLS e performance

### 15 · [P1] · banco — Criar os índices faltantes nas chaves estrangeiras de Contas a Pagar e Contas a Receber
Onde: `contas_pagar.centro_custo_id`, `contas_pagar.conta_bancaria_id`, `contas_receber.centro_custo_id`, `contas_receber.conta_bancaria_id`.
Contexto (achado novo): as quatro FKs das duas tabelas mais usadas do sistema não têm índice. Todo filtro por centro de custo ou por conta bancária faz varredura sequencial, e todo DELETE/UPDATE no pai precisa varrer a tabela filha inteira para validar a FK. É o achado de performance de maior impacto direto no usuário.
Ação: nova migration com 4 `CREATE INDEX` simples (`CONCURRENTLY` falha no gateway transacional, conforme CLAUDE.md).
Verificação: `EXPLAIN` de um filtro por centro de custo passa de `Seq Scan` para `Index Scan`.
Risco: baixo — `CREATE INDEX` simples bloqueia escrita na tabela durante a criação; rodar fora do horário comercial.
Depende de: APROVADO do Joaquim

### 16 · [P2] · banco — Criar os 16 índices de FK restantes
Onde: `elisao_creditos_auditoria` (2), `eventos_contabilizacao_log`, `fechamentos_tributarios.fechado_por`, `oportunidades_elisao.estrategia_id`, `partidas_contabeis.conta_contabil_id`, `projecoes_reforma.empresa_id`, `sso_sandbox_runs`, `sso_user_groups`, `bloqueios_duplicidade` (2), `sped_contabil_arquivos.empresa_id`, `kpis_operacionais.empresa_id`, `per_dcomp.created_by`, `entregas_obrigacoes.registrado_por`, `saved_filters.created_by`.
Contexto: mesmas consequências da etapa 15, em tabelas de menor volume. `partidas_contabeis.conta_contabil_id` é a mais sensível (contabilidade).
Ação: 1 migration com os 16 `CREATE INDEX`, agrupados por domínio.
Verificação: a query de auditoria de FK sem índice retorna 0.
Risco: baixo.
Depende de: 15, APROVADO do Joaquim

### 17 · [P2] · banco — Auditar e remover os 397 índices nunca usados
Onde: `pg_stat_user_indexes` do schema `public`.
Contexto (achado novo): 397 índices não-únicos com `idx_scan = 0`. Cada um custa escrita em todo INSERT/UPDATE e espaço em disco, sem devolver nada em leitura. Em 271 tabelas, isso é o maior desperdício de escrita do banco.
Ação: confirmar primeiro há quanto tempo as estatísticas estão acumulando (`pg_stat_reset` recente invalida a leitura); excluir da lista os índices de tabelas novas/vazias e os que sustentam constraints; dropar o restante em lotes de ~20 por migration, do menos arriscado ao mais.
Verificação: após cada lote, confirmar que nenhuma query da aplicação regrediu (comparar `mean_exec_time` no `pg_stat_statements` antes/depois).
Risco: médio — um índice pode existir para uma rotina mensal/anual que ainda não rodou na janela de estatísticas. Por isso: lotes pequenos, e nunca dropar índice de tabela com menos de 30 dias de estatística.
Depende de: APROVADO do Joaquim

### 18 · [P1] · seguranca — Colocar `security_invoker` nas 14 views expostas
Onde: `vw_fluxo_caixa`, `vw_fluxo_caixa_diario`, `vw_dre_mensal`, `vw_dso_aging`, `vw_gastos_centro_custo`, `vw_metricas_cobranca`, `vw_saldos_contas`, `vw_tributario_dashboard`, `vw_webhooks_recentes`, `vw_rpc_hotspots`, `vw_rpc_slow_calls`, `v_sefaz_observability`, `v_table_bloat`, `extratos_bancarios_importados`.
Contexto (achado novo): 14 views sem `security_invoker`. Uma view sem essa opção roda com os privilégios de quem a criou, não de quem consulta — ou seja, **a RLS das tabelas de base não é aplicada ao consultar a view**. Entre elas estão fluxo de caixa, DRE, saldos de conta e aging — exatamente os dados que a RLS multi-empresa deveria isolar. O padrão `security_invoker` é obrigatório no repo desde o hardening P15+; estas 14 ficaram para trás.
Ação: nova migration com `ALTER VIEW <nome> SET (security_invoker = true);` para as 14; para cada uma, confirmar antes que as tabelas de base têm policy adequada (senão a view deixa de retornar linhas para usuário comum).
Verificação: com um usuário não-admin da empresa A, consultar `vw_fluxo_caixa` e confirmar que só retornam linhas da empresa A.
Risco: **médio-alto** — se alguma tela depende hoje do bypass de RLS da view, ela passa a vir vazia. Testar as 14 uma a uma em staging/preview antes de aplicar em produção.
Depende de: APROVADO do Joaquim

### 19 · [P2] · banco — Resolver `estrategias_elisao_catalogo`: RLS ligada e nenhuma policy
Onde: tabela `public.estrategias_elisao_catalogo`.
Contexto (achado novo): a única tabela do schema nessa condição. Com RLS ligada e zero policies, ninguém que não seja `service_role` consegue ler nada — a tabela está efetivamente invisível para a aplicação.
Ação: decidir se é catálogo público de leitura (criar policy `SELECT` para `authenticated`) ou dado por empresa (policy com `empresa_acessivel`), e criar a policy correspondente.
Verificação: usuário comum autenticado consegue listar o catálogo pela UI.
Risco: baixo — hoje a tabela não responde a ninguém; qualquer policy correta é ganho.
Depende de: APROVADO do Joaquim

### 20 · [P0] · arquitetura — Decidir o modelo de admin: global ou por empresa (19 tabelas com bypass `_admin_all`)
Onde: 19 tabelas do schema `public` com policy `<tabela>_admin_all` · função `public.has_role`.
Contexto: `has_role(_user_id, _role)` lê `public.user_roles`, que **não tem `empresa_id`**. Ou seja, quem é `admin` é admin de tudo: as policies `_admin_all` dão acesso irrestrito a 19 tabelas com dado de várias empresas, independentemente de `user_empresas`. Nenhuma correção de código nas edge functions alcança isso — a decisão é de arquitetura.
Ação (decisão de negócio — recomendo a opção A): **A)** tornar o papel por empresa (`user_roles.empresa_id` + `has_role(_user_id,_role,_empresa_id)`), migrando as 19 policies para cruzar papel **e** vínculo; **B)** manter admin global e documentar formalmente em `SECURITY_RULES.md` que admin é papel de plataforma, não de empresa.
Verificação: opção A — admin da empresa A consulta uma tabela do bloco e não vê linha da empresa B.
Risco: opção A é migração de modelo de acesso: precisa de plano expand-contract, janela de validação e rollback pronto. Não executar sem sua decisão explícita.
Depende de: decisão do Joaquim

### 21 · [P2] · banco — Tornar `empresa_id` obrigatório em `asaas_payments` e `asaas_customers`
Onde: `asaas_payments`, `asaas_customers` · nova migration.
Contexto: as duas colunas são nullable. As guardas de empresa da PR #92 resolvem o dono do recurso justamente por esse campo — se um registro entrar sem `empresa_id`, a action responde 404 em vez de autorizar. Hoje há 0 linhas nulas (conferido), então a hora de travar é agora, antes de existir volume.
Ação: `ALTER TABLE ... ALTER COLUMN empresa_id SET NOT NULL;` nas duas, precedido da contagem de nulos.
Verificação: contagem de nulos = 0 antes do ALTER; INSERT sem `empresa_id` passa a ser rejeitado.
Risco: baixo hoje, cresce com o tempo — quanto mais tarde, maior o backfill.
Depende de: 01 (as guardas já mergeadas), APROVADO do Joaquim

### 22 · [P2] · qualidade — Reconciliar as ~44 migrations locais não rastreadas em `schema_migrations`
Onde: `supabase/migrations/` · `supabase_migrations.schema_migrations`.
Contexto: existem arquivos de migration no repositório sem linha correspondente na tabela de controle. Cada um é uma de duas coisas: efeito já presente no schema (squash legítimo, só falta registrar) ou gap real não aplicado — como as etapas 07 e 08 provaram ser o caso.
Ação: script que, para cada migration não rastreada, verifica no schema vivo se o objeto que ela cria já existe; produzir uma lista classificada (`registrar` vs `aplicar`) e tratar cada caso individualmente.
Verificação: após a reconciliação, toda migration local está registrada ou tem justificativa documentada.
Risco: pode revelar mais gaps como os das etapas 07/08 — tratar um a um, nunca em lote cego.
Depende de: 07, 08

### 23 · [P2] · banco — Corrigir a ordem de replay das migrations que quebra o Supabase Preview
Onde: `20260421144212_*.sql` (referencia `contas_pagar.centro_custo_id`) e `20260518164611_*.sql` (cria a coluna).
Contexto: o Preview do Supabase reexecuta todas as migrations do zero e falha com `column cp.centro_custo_id does not exist` — a migration que usa a coluna roda antes da que a cria. Em produção não aparece (a coluna já existe), mas **todo PR que toca migration tem o check de Preview vermelho**, o que treina o time a ignorar CI vermelha.
Ação: adicionar uma guarda idempotente na migration antiga (`ADD COLUMN IF NOT EXISTS` antecipado, ou bloco `DO $$ ... IF NOT EXISTS ... $$`), sem alterar o efeito em produção.
Verificação: abrir um PR de teste tocando migrations e confirmar o Preview verde.
Risco: baixo — a guarda é no-op em produção, onde a coluna já existe.
Depende de: —

---

## Bloco D — Fechar as implementações parciais

### 24 · [P1] · frontend — Totais corretos em Movimentações acima de 5.000 lançamentos
Onde: `src/hooks/useFinancialOperations.ts`, `src/pages/Movimentacoes.tsx` · nova RPC de agregação.
Contexto: a paginação e a virtualização foram implementadas (PR #99), com teto de segurança de 5.000 linhas e aviso na tela. Mas os cartões de Entradas, Saídas e Saldo continuam somando só o que foi carregado — acima do teto, **os três números ficam errados**, mesmo com o aviso.
Ação: criar RPC `totais_movimentacoes(p_empresa, p_inicio, p_fim, p_tipo)` que devolve os agregados no banco, e alimentar os três cartões com ela, independentemente da paginação da lista.
Verificação: num período com mais de 5.000 lançamentos, conferir que o saldo exibido bate com `SELECT sum(...)` direto no banco.
Risco: nenhum — a agregação no banco é mais barata e mais correta que somar no navegador.
Depende de: 03

### 25 · [P1] · frontend — Ligar o acordo de parcelamento às contas a receber reais
Onde: `src/pages/Cobrancas.tsx`, `src/components/cobranca/AcordoParcelamentoDialog.tsx`, `src/hooks/useAcordosParcelamento.ts:158`.
Contexto: o botão "Novo Acordo Proativo" passou a abrir o diálogo (PR #98), mas a página não passa `contasReceberId`. O diálogo envia `contas_receber_ids: []`, e o hook pula o UPDATE que marcaria as contas como "em acordo" quando a lista está vazia. Resultado prático: **o acordo é criado, mas as contas originais continuam sendo cobradas pela régua** — o cliente negocia e segue recebendo cobrança.
Ação: buscar as contas a receber em aberto do devedor selecionado e passá-las ao diálogo; quando o acordo abrir sem devedor selecionado, exigir a seleção do cliente antes de habilitar a confirmação.
Verificação: criar um acordo para um devedor com 3 contas em aberto e confirmar que as 3 mudam de status e saem da régua.
Risco: nenhum — completa um fluxo que hoje não tem efeito.
Depende de: 04

### 26 · [P2] · backend — Confirmar as variáveis de URL base no ambiente e remover o retorno vazio
Onde: `supabase/functions/_shared/app-url.ts` · secrets do projeto Supabase.
Contexto: `getAppBaseUrl()` centralizou as três variáveis (`APP_BASE_URL` → `APP_PUBLIC_URL` → `PUBLIC_APP_URL`), mas mudou a precedência em 4 dos 5 pontos de uso e devolve string vazia se nenhuma estiver configurada — o que gera link de convite quebrado em silêncio.
Ação: conferir no painel do Supabase quais das três estão de fato configuradas e com que valor; padronizar em `APP_BASE_URL`; trocar o retorno `''` por erro explícito e logado quando nenhuma existir.
Verificação: disparar um convite de usuário e um login SSO e conferir a URL gerada.
Risco: baixo — a checagem vem antes da mudança.
Depende de: 04

### 27 · [P2] · qualidade — Resolver os 18 arquivos com TODO de schema drift
Onde: 18 arquivos em `src/hooks/` e `src/components/` com `TODO(2026-08-14)`.
Contexto: cada TODO marca um campo que o formulário coleta mas o INSERT descarta, porque a coluna não existe mais no schema. O usuário preenche e o dado se perde sem aviso. O caso mais grave é `useFinancialOperations.ts`: categoria, origem, observações e vínculo com conta a pagar/receber são descartados em toda movimentação manual.
Ação: para cada TODO, decidir entre recriar a coluna (migration aditiva) ou remover o campo do formulário — nunca deixar o campo visível sem persistência. Priorizar `useFinancialOperations.ts`, depois transferências.
Verificação: para cada campo mantido, preencher e reabrir o registro conferindo que o valor persistiu.
Risco: um campo pode ter sido removido por decisão de negócio não documentada — confirmar com você antes de recriar qualquer coluna.
Depende de: 22

### 28 · [P2] · frontend — Reduzir os 203 casts `as any` / `as unknown as`
Onde: `src`, 203 ocorrências.
Contexto: cada cast desses desliga a checagem de tipo exatamente no ponto de contato com o banco — é o mecanismo pelo qual o schema drift da etapa 27 passou despercebido por semanas. Não é estética: é o detector de erro desligado.
Ação: atacar primeiro os casts em hooks financeiros (contas, movimentações, boletos, conciliação); regenerar `types.ts` após as migrations dos blocos B e C e remover os casts que ficarem desnecessários; para os que sobrarem, trocar por tipo explícito com comentário do porquê.
Verificação: `bun run type-check` limpo e contagem de casts caindo a cada lote.
Risco: nenhum quando feito em lotes pequenos com type-check entre eles.
Depende de: 10, 22

### 29 · [P3] · backend — Alinhar `@supabase/supabase-js` nas edge functions com o frontend
Onde: edge functions fixadas em `npm:@supabase/supabase-js@2.49.4` vs `2.87.1` no frontend.
Contexto: ~38 versões de diferença. Correções de auth e de tratamento de erro do cliente novo não chegam às functions.
Ação: atualizar em lotes de 3–4 functions, rodando os testes de integração entre cada lote, começando pelas de menor risco (leitura) e terminando nas financeiras.
Verificação: suíte de integração das edge functions verde após cada lote.
Risco: médio — mudança de versão pode alterar comportamento de auth; nunca fazer tudo de uma vez.
Depende de: 01, 02

---

## Bloco E — Segurança residual

### 30 · [P1] · seguranca — Escopo de empresa em `criar_link_pagamento` e `consultar_saldo` do `asaas-proxy`
Onde: `supabase/functions/asaas-proxy/index.ts`.
Contexto (achado novo, fora do escopo do PLANO_100): a PR #92 fechou 26 actions, mas estas duas seguem sem escopo. `criar_link_pagamento` cria link de cobrança sem amarrar a nenhuma empresa; `consultar_saldo` devolve o saldo da conta Asaas inteira para qualquer usuário autenticado.
Ação: exigir `empresa_id` em `criar_link_pagamento` (com `exigirEmpresaDoRecurso`) e gravar o vínculo no registro local; restringir `consultar_saldo` ao papel admin/financeiro e registrar no audit trail.
Verificação: usuário comum chamando `consultar_saldo` → 403; link criado sem `empresa_id` → 400.
Risco: se alguma tela hoje cria link sem informar empresa, ela passa a exigir — conferir os pontos de chamada no frontend antes.
Depende de: 01

### 31 · [P1] · seguranca — Auditar as ~20 edge functions com `verify_jwt = false` e sem guarda própria
Onde: `supabase/config.toml` cruzado com o código das functions.
Contexto (achado novo): 52 functions estão com `verify_jwt = false` no `config.toml` — ou seja, o gateway **não** valida o token; a função precisa se defender sozinha. Cruzando com o código, ~20 delas não têm nenhuma checagem reconhecível de autenticação, papel, segredo de cron ou HMAC. Algumas são públicas por desenho (`health`, `get-vapid-key`), outras não deveriam ser.
Ação: classificar as ~20 em três baldes — pública por desenho (documentar), job interno (exigir segredo de cron), exige usuário (aplicar `exigirUsuario`/`exigirPapel`) — e corrigir o terceiro balde. Priorizar `mcp-query`, `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar`, `gerar-pdf-tributario` e `prever-carga-tributaria`.
Verificação: para cada function do terceiro balde, chamada sem `Authorization` → 401.
Risco: baixo por função, mas são muitas — fazer em lotes com teste entre eles.
Depende de: 02

### 32 · [P2] · backend — Guarda de autenticação em `calculo-iva`
Onde: `supabase/functions/calculo-iva/index.ts`.
Contexto: é a única function tributária sem `exigirUsuario`. O gateway ainda valida o JWT (ela não está na lista `verify_jwt = false`), então a exposição real é baixa — mas ela quebra o padrão do domínio e some do audit trail.
Ação: aplicar `exigirUsuario` no início do handler.
Verificação: chamada sem `Authorization` → 401.
Risco: nenhum.
Depende de: —

### 33 · [P2] · backend — Assinatura HMAC no corpo do `n8n-callback`
Onde: `supabase/functions/n8n-callback/index.ts`.
Contexto: hoje autentica por um segredo estático no header (`N8N_CALLBACK_SECRET`), enquanto `bitrix24-webhook`, `bling-webhook` e `whatsapp-webhook` já validam HMAC do corpo. Um segredo estático vazado permite forjar qualquer payload.
Ação: adotar o helper `authenticateWebhook` e atualizar o nó correspondente no N8N para assinar o payload.
Verificação: callback com HMAC válido → 200; sem HMAC ou inválido → 401.
Risco: exige mudança coordenada do lado N8N — subir o código aceitando as duas formas por uma janela, depois desligar a antiga.
Depende de: —

### 34 · [P1] · seguranca — Rotacionar a `service_role` key vazada do projeto `xyykivpcdbfukaongpbw`
Onde: fora deste repositório — projeto Supabase `xyykivpcdbfukaongpbw`; referência no histórico git (commit `631944238f`).
Contexto: a chave está no histórico de um repositório **público**. `service_role` ignora RLS: quem tiver a chave lê e escreve tudo naquele projeto. O HEAD atual já lê da env var — o problema é a chave antiga continuar válida.
Ação: identificar o dono do projeto, rotacionar a chave no dashboard e avisar quem consome a integração; avaliar reescrita de histórico como decisão separada.
Verificação: requisição REST com a chave antiga → 401.
Risco: rotacionar sem avisar quebra qualquer integração legítima que ainda use a chave.
Depende de: você identificar o dono do projeto

### 35 · [P2] · seguranca — Varredura de segredos no histórico do repositório
Onde: repositório inteiro (público) · GitHub secret scanning.
Contexto: a chave da etapa 34 chegou ao histórico e ficou. Sem varredura sistemática, não há como afirmar que é a única — e o repositório é público.
Ação: rodar varredura de segredos no histórico completo, classificar os achados (ativo vs já rotacionado vs falso positivo), rotacionar os ativos e habilitar push protection para impedir a próxima.
Verificação: relatório com zero segredo ativo pendente.
Risco: nenhum — é leitura; a rotação de cada achado é que exige coordenação.
Depende de: 34

### 36 · [P2] · seguranca — Rate limit uniforme nas edge functions financeiras
Onde: functions de cobrança, conciliação e tributário.
Contexto: `categorizar-despesa` e (com a PR #96) `conciliacao-ia` usam `checkRateLimit` a 30 req/min; as demais não têm teto. Uma function de IA sem teto é conta aberta no provedor.
Ação: aplicar `checkRateLimit` no mesmo padrão nas functions que chamam IA ou API externa paga, com o limite calibrado por função.
Verificação: exceder o limite devolve 429 e registra o evento.
Risco: limite baixo demais bloqueia uso legítimo em pico — começar folgado e apertar com base no uso real.
Depende de: 02

---

## Bloco F — CI, deploy e ambiente

### 37 · [P1] · infra — Gate de CI que barra migration commitada e não aplicada
Onde: `.github/workflows/ci.yml` · `scripts/`.
Contexto: as etapas 07 e 08 existem porque duas migrations ficaram commitadas e nunca aplicadas, sem nada avisar. É a falha que mais se repete neste sistema.
Ação: script que compara os arquivos de `supabase/migrations/` com `SELECT version FROM supabase_migrations.schema_migrations` via `DATABASE_URL` e falha o job quando houver arquivo não aplicado; documentar o fluxo correto (aplicar, depois commitar) no CONTRIBUTING.
Verificação: rodar contra o estado pós-etapas 07/08 → passa; commitar uma migration falsa → falha.
Risco: bloqueia PR de quem commitar migration antes de aplicar — que é exatamente a intenção.
Depende de: 07, 08, 22

### 38 · [P1] · infra — Fazer os gates de segurança falharem quando `DATABASE_URL` estiver ausente
Onde: `.github/workflows/ci.yml` (steps de `rls_multi_empresa.sql` e `test-observability-privileges.sql`).
Contexto: conferido — os dois steps ainda são condicionais a `db_url_preflight.outputs.available == 'true'`. Sem o secret, eles simplesmente não rodam e o PR fica verde. Ou seja: **os testes de isolamento multi-empresa podem estar sem rodar há meses e ninguém saberia.**
Ação: confirmar primeiro se o secret existe no repositório; existindo, trocar a condição por falha explícita quando indisponível.
Verificação: remover o secret num teste controlado e confirmar que o job falha.
Risco: se o secret realmente não existir, todo PR passa a falhar até ele ser configurado — por isso a confirmação vem antes.
Depende de: —

### 39 · [P2] · infra — Documentar e testar a política de backup/PITR
Onde: `docs/SECURITY.md` (hoje só "Backups diários") · painel do Supabase.
Contexto: sistema financeiro multi-empresa cuja documentação de backup é uma linha genérica, sem retenção declarada e sem nenhum restore testado. Backup não testado não é backup.
Ação: conferir a retenção/PITR real do projeto, executar um restore de teste em projeto/branch separado, e documentar retenção, data do teste e tempo de recuperação.
Verificação: restore de teste concluído, com evidência registrada.
Risco: nenhum — é verificação, não mudança.
Depende de: —

### 40 · [P2] · infra — Resolver a duplicidade Vercel × Lovable Cloud
Onde: `CLAUDE.md`, `docs/DEPLOYMENT.md`, `vercel.json` · PR #94.
Contexto: o `CLAUDE.md` diz que o deploy é Lovable Cloud, mas quem responde nos checks e publica cada merge é o Vercel. Documentação errada sobre onde é produção é como se cria incidente.
Ação: confirmar definitivamente qual pipeline serve o domínio de produção, mergear a correção do PR #94 e desativar/remover o pipeline órfão (ou documentar por que os dois coexistem).
Verificação: `curl -I` no domínio de produção batendo com o painel declarado como fonte de verdade.
Risco: desativar o pipeline errado derruba a produção — confirmar 100% antes.
Depende de: 05

### 41 · [P2] · infra — Cobrir com teste automatizado as guardas de empresa das PRs #92 e #96
Onde: `supabase/tests/`.
Contexto: 30+ guardas novas entram em produção sem um teste que impeça alguém de removê-las depois. Correção de segurança sem teste de regressão volta.
Ação: teste de integração por action crítica, exercitando os dois caminhos (empresa própria → 200; empresa alheia → 403), incluído nos gates obrigatórios do CI.
Verificação: remover uma guarda propositalmente num branch de teste deve quebrar o CI.
Risco: nenhum.
Depende de: 01, 02

### 42 · [P3] · qualidade — Teste ponta a ponta do fluxo de cobrança
Onde: `tests/e2e/`.
Contexto: a fila de cobrança acabou de mudar de contrato (RPC atômica, propagação de erro) e o acordo de parcelamento vai ganhar vínculo real com as contas. É o fluxo que toca dinheiro do cliente e o que tem menos cobertura ponta a ponta.
Ação: cenário E2E cobrindo régua → fila → envio → registro de execução → acordo de parcelamento, com o envio externo mockado.
Verificação: cenário verde no `E2E Critical Gate`.
Risco: nenhum.
Depende de: 02, 25

---

## Bloco G — Observabilidade e custo de banco

### 43 · [P2] · observabilidade — Revisar a frequência dos 31 cron jobs de auto-monitoramento
Onde: `cron.job` (31 jobs) · `detect_query_regressions`, `capture_slow_queries`, `watch_cron_failures`.
Contexto (achado novo, medido no `pg_stat_statements`): `detect_query_regressions` acumula 8.650 chamadas a ~111 ms, `capture_slow_queries` 2.884 a ~130 ms e `watch_cron_failures` 714 a ~160 ms. São ~20 minutos de CPU de banco gastos observando o próprio banco, além de 21.699 chamadas `net.http_post` disparadas por gatilho. A observabilidade está consumindo mais do que o fluxo que ela observa.
Ação: revisar a periodicidade de cada um dos 31 jobs, espaçar os de diagnóstico (de minutos para horas) e desligar os redundantes.
Verificação: comparar o custo acumulado no `pg_stat_statements` antes/depois de uma semana.
Risco: espaçar demais atrasa a detecção de um problema real — manter em minutos só o que dispara alerta acionável.
Depende de: 09

### 44 · [P2] · observabilidade — Publicar source maps e versão no Sentry
Onde: `vite.config.ts`, pipeline de build · Sentry (integrado pela PR #97).
Contexto: o Sentry já recebe erro de produção, mas sem source map o stack trace chega minificado — e sem release não dá para saber qual deploy quebrou.
Ação: gerar e enviar source maps no build e marcar cada release com o SHA do commit.
Verificação: forçar um erro em produção e conferir o stack legível, apontando para arquivo e linha do fonte.
Risco: nenhum — os source maps vão para o Sentry, não para o bundle público.
Depende de: —

### 45 · [P2] · observabilidade — Levar erro de edge function para o Sentry
Onde: `supabase/functions/_shared/` · Sentry.
Contexto: o Sentry cobre só o frontend. Erro de edge function — cobrança que não sai, fechamento tributário que falha — vive apenas no log do Supabase, que ninguém lê por hábito.
Ação: helper compartilhado de captura de exceção nas functions, começando pelas financeiras, com o mesmo cuidado de não enviar corpo de requisição/resposta.
Verificação: forçar uma falha numa function financeira e confirmar o evento no Sentry, sem dado sensível no payload.
Risco: baixo — replicar o scrub já aplicado no frontend.
Depende de: 02

### 46 · [P2] · observabilidade — Alerta ativo para falha de cron e de webhook
Onde: `cron.job_run_details`, `webhooks_log` · canal de alerta.
Contexto: o job da etapa 09 falhava em toda execução e nada avisou. Falha silenciosa em job que move dinheiro é o pior modo de falha possível.
Ação: alerta que dispara quando um job falha duas execuções seguidas ou quando o `webhooks_log` acumula erro acima do normal, entregue num canal que você acompanha.
Verificação: forçar a falha de um job de teste e confirmar o alerta recebido.
Risco: alerta ruidoso demais é ignorado — calibrar o limiar sobre o histórico real.
Depende de: 09

### 47 · [P3] · observabilidade — Painel de saúde do banco com as métricas desta auditoria
Onde: painel interno de observabilidade.
Contexto: os números que sustentam este plano (índices de FK faltando, índices sem uso, views sem `security_invoker`, tabelas com RLS sem policy, migrations não rastreadas, pares de índice duplicado) foram levantados manualmente. Sem painel, daqui a três meses a auditoria terá que ser refeita do zero.
Ação: consolidar as consultas desta sessão num painel/consulta única versionada no repositório, com o valor esperado de cada métrica.
Verificação: painel reproduz os números deste plano e vai a zero conforme os blocos B e C avançam.
Risco: nenhum — é leitura.
Depende de: 15, 17, 18

---

## Bloco H — Qualidade e fechamento do ciclo

### 48 · [P3] · documentacao — Consolidar as regras de segurança num documento único e atual
Onde: `SECURITY_RULES.md`, `docs/SECURITY.md`, `CLAUDE.md`.
Contexto: as regras estão espalhadas, e três decisões relevantes ficaram sem registro: a exceção de escopo global em `gerar-pacote-evidencias` (PR #95), o modelo de admin da etapa 20 e o padrão obrigatório de `security_invoker` nas views (etapa 18).
Ação: documento único com o modelo de tenancy, o que cada papel pode fazer, o padrão obrigatório para view e edge function nova, e as exceções aprovadas com sua justificativa.
Verificação: cada exceção do sistema aparece no documento com data e motivo.
Risco: nenhum.
Depende de: 18, 20

### 49 · [P3] · qualidade — Reconstruir o grafo do projeto após os merges
Onde: `graphify-out/`.
Contexto: depois dos blocos A–D, o grafo do código fica defasado — e ele é a primeira parada de toda investigação futura, inclusive minha.
Ação: `graphify update . --force` e confirmar que o commit de origem no relatório bate com o `HEAD`.
Verificação: `git rev-parse --short HEAD` igual ao "Built from commit" do `GRAPH_REPORT.md`.
Risco: nenhum — sem custo de API.
Depende de: 01, 02, 03, 04

### 50 · [P2] · processo — Re-auditar e medir o resultado
Onde: banco, edge functions, CI.
Contexto: o PLANO_100 chegou a 5 de 43 etapas em produção porque nunca houve um ponto formal de medição. Este plano fecha com um.
Ação: repetir as consultas de evidência deste plano (FK sem índice, índices sem uso, views sem `security_invoker`, RLS sem policy, migrations não rastreadas, cron com falha, guardas por action) e produzir a tabela "antes × depois", listando explicitamente o que ficou fora e por quê.
Verificação: relatório com número medido para cada métrica, não estimativa.
Risco: nenhum.
Depende de: todas as anteriores

---

## Resumo executivo

| Bloco | Etapas | O que muda para o negócio |
| --- | --- | --- |
| A (01–06) | 6 | Coloca em produção 18 correções já prontas e paradas |
| B (07–14) | 8 | Aplica o que já está escrito: RPCs atômicas, alertas críticos, cron quebrado |
| C (15–23) | 9 | Isolamento entre empresas nas views e performance das telas financeiras |
| D (24–29) | 6 | Saldo correto, acordo de parcelamento com efeito real, campos que param de sumir |
| E (30–36) | 7 | Fecha o que sobrou de exposição: links, saldo, functions sem guarda, chave vazada |
| F (37–42) | 6 | Impede a recorrência: CI que barra migration esquecida e teste de regressão |
| G (43–47) | 5 | Passa a avisar quando algo quebra, em vez de falhar em silêncio |
| H (48–50) | 3 | Documenta as decisões e mede o resultado |

**Exigem `APROVADO` seu (DDL em banco de produção):** 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21.
**Exigem decisão de negócio:** 05 (branch protection), 20 (modelo de admin), 34 (rotação de chave de terceiro), 40 (Vercel × Lovable).
**Executáveis por mim sem nova autorização:** todas as demais.
