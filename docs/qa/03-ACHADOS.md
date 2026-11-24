# 03 — Achados

> Auditoria de QA somente leitura — 2026-11-22, `main` em `2c2486f`.
> Agrupados por causa raiz. Um problema com dez ocorrências é **um** achado com dez locais.

## Como ler

- **Severidade** — Crítica: perda ou vazamento de dado, falha de segurança, fluxo principal quebrado · Alta: função importante falha ou dá resultado errado · Média: funciona com defeito ou fragilidade · Baixa: acabamento e higiene.
- **Confiança** — `confirmado` (evidência direta, lida ou executada) · `hipótese` (não foi possível fechar; o que falta está dito).
- **Modo** — `EXECUTADO` (comando/consulta rodada, saída observada) · `RASTREADO` (caminho seguido pelo código, sem executar).
- **Calibragem de severidade**: há **1 empresa e 3 usuários** em produção hoje (medido). Furo de isolamento entre empresas é, portanto, **risco latente** — vira dano no dia em que entrar a segunda empresa. Onde isso muda a nota, está dito no achado.

---

## Grupo A — Isolamento multi-empresa: cada tabela inventou o seu próprio jeito

### ACH-DB-01 · O projeto tem uma regra de isolamento e 58 tabelas que não a seguem

- **Camada**: banco de dados · **Severidade**: Alta · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: consulta cruzando `information_schema.columns` com `pg_policies` no projeto `bwwbeyolnnzppeuhgkcd` retorna **58 tabelas que têm coluna `empresa_id` e nenhuma policy mencionando `empresa_acessivel()`**. Entre elas, tabelas de dinheiro: `movimentacoes`, `transferencias`, `notas_fiscais`, `nfe_recebidas`, `faturamento_mensal`, `folha_pagamento`, `plano_contas`, `contratos`, `acordos_parcelamento`, `anexos_financeiros`, `auditoria_financeira`, `execucoes_cobranca`, `historico_cobranca`, `divergencias_conciliacao`, `pedidos_compra`, `fornecedores`, `clientes`.
- **Regra violada**: `AGENTS.md` seção 4 — "Isolamento por `empresa_id` (policies: `empresa_acessivel(empresa_id)`)".
- **O que existe no lugar**: quatro padrões diferentes, todos escritos à mão, tabela a tabela:
  1. `empresa_membro_ativo(empresa_id)` — ex.: `clientes`, `notas_fiscais`
  2. `empresa_id IN (SELECT empresa_id FROM user_empresas WHERE user_id = uid() AND ativo)` — ex.: `movimentacoes`, `transferencias`, `plano_contas`, `contratos`, `faturamento_mensal`, `folha_pagamento`
  3. `EXISTS (SELECT 1 FROM user_empresas ue WHERE ue.user_id = uid() AND ue.empresa_id = <tabela>.empresa_id)` — ex.: `anexos_financeiros`, `nfe_recebidas`
  4. `uid() = user_id`, **ignorando `empresa_id`** — ex.: `fornecedores`
- **Causa raiz**: não há um predicado único e obrigatório de isolamento. Cada migration resolveu o problema do seu jeito, e nada no CI recusa um padrão novo. `empresa_acessivel()` existe como regra escrita, mas não como regra aplicada.
- **Impacto no negócio**: não dá para afirmar, olhando o banco, que o dado de uma empresa não aparece para outra — seria preciso reler 621 policies uma a uma. Quando a segunda empresa entrar, o risco de uma ver os números da outra é real e difícil de detectar.
- **Caminho de correção**: ver etapas 001–014 em `04-PLANO.md` (padronizar o predicado, uma tabela por etapa, começando pelas de dinheiro, e só depois plantar o gate no CI).

### ACH-DB-02 · `clientes`: onze policies somadas, e a mais frouxa manda

- **Camada**: banco de dados · **Severidade**: Alta (seria Crítica com mais de uma empresa) · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência** (`SELECT ... FROM pg_policies WHERE tablename='clientes'`, 11 policies para `{authenticated}`):
  - `clientes_tenant_select`, `clientes_tenant_insert`, `clientes_tenant_update`, `clientes_tenant_delete` → `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))`
  - `clientes_owner_select` / `_update` / `_delete` → `(uid() = user_id)`
  - `clientes_grupo_select` → exige `empresa_id IS NOT NULL` e pertencimento
  - `Operacional+ can manage clientes` → `has_any_role(...) AND empresa_membro_ativo(empresa_id)`
- **Causa raiz**: em Postgres, **policies permissivas são somadas com OR** — basta uma passar. As quatro policies `tenant_*` aceitam `empresa_id IS NULL`, então **qualquer usuário logado pode ler, alterar e apagar cliente sem empresa**, e as `owner_*` permitem alcançar o cliente só por ter sido quem o criou, mesmo depois de sair da empresa. A policy rigorosa (`clientes_grupo_select`) não protege nada, porque as frouxas já liberaram.
- **Explorável hoje?** Parcialmente: `SELECT count(*) FROM clientes WHERE empresa_id IS NULL` → **0**. Não há cliente órfão agora. Mas `clientes_tenant_insert` **permite criar um** com `empresa_id` nulo, e a partir daí ele fica visível e apagável por todos. O caminho de exploração está aberto; só não foi usado.
- **Impacto no negócio**: um cadastro de cliente criado sem empresa fica à vista de todo mundo que tem login — e pode ser apagado por qualquer um deles, sem deixar dono.
- **Caminho de correção**: etapas 003–005.

### ACH-DB-03 · `fornecedores`: colega da mesma empresa não enxerga o fornecedor do outro

- **Camada**: banco de dados / regra de negócio · **Severidade**: Alta · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: as 4 policies (`fornecedores_owner_select`/`_insert`/`_update`/`_delete`) usam **apenas** `(uid() = user_id)`. A tabela **tem** coluna `empresa_id`, e `SELECT count(*) FROM fornecedores WHERE empresa_id IS NOT NULL` → **0**: nenhum dos 5 fornecedores cadastrados tem empresa preenchida.
- **Causa raiz**: a tabela nasceu no modelo "cada usuário tem seus dados" e nunca foi migrada para o modelo multi-empresa que o resto do sistema usa. A coluna `empresa_id` foi adicionada e ficou sem uso.
- **Impacto no negócio**: **este é um defeito de hoje, não de amanhã.** Com 3 usuários na mesma empresa, o fornecedor que um cadastra é invisível para os outros dois — cada um precisa recadastrar. Duplica fornecedor, duplica pagamento e trava a conciliação.
- **Caminho de correção**: etapas 006–008 (preencher `empresa_id` dos 5 registros, trocar o predicado, manter compatibilidade de leitura durante a transição).

### ACH-DB-04 · Dois vocabulários de papel no mesmo enum, e cada tabela escolhe um

- **Camada**: banco de dados / autorização · **Severidade**: Alta · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: `app_role` tem 8 valores — `admin, manager, operator, viewer, financeiro, operacional, visualizador, contador` — onde `manager`≈`financeiro`, `operator`≈`operacional`, `viewer`≈`visualizador`. As policies não concordam sobre qual usar:
  - `query_telemetry`: `SELECT` exige `has_role(uid(), 'manager')`; `INSERT` aceita `admin`, `manager` ou `operator`
  - `clientes` e `notas_fiscais`: `has_any_role(uid(), ARRAY['admin','financeiro','operacional'])`
  - `notas_fiscais_tenant_delete`: `has_role(uid(),'admin') OR has_role(uid(),'manager')`
  - `anexos_financeiros`: `ue.role = ANY (ARRAY['admin','financeiro','operacional'])`
- **Causa raiz**: o enum foi estendido com os rótulos em português sem aposentar os em inglês, e as policies novas passaram a usar os novos sem reescrever as antigas.
- **Impacto no negócio**: a permissão de uma pessoa muda conforme a tela. Quem é `financeiro` consegue gerenciar clientes e notas, mas **não** consegue ver telemetria (que pede `manager`); quem é `manager` apaga nota fiscal mas não gerencia cliente. Ninguém consegue responder "o que o papel X pode fazer" sem abrir as 621 policies.
- **Caminho de correção**: etapas 015–024 (mapear papel a papel, consolidar em um vocabulário, migrar as policies em lotes por domínio e só então remover os rótulos mortos do enum).

---

## Grupo B — Trilhas de auditoria e registros que o próprio usuário pode forjar

### ACH-DB-05 · Qualquer usuário logado escreve na trilha de auditoria

- **Camada**: banco de dados / segurança · **Severidade**: Alta · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: policy `System can insert audit logs` em `audit_logs` — `cmd = INSERT`, `roles = {authenticated}`, `with_check = true`. A tabela tem **432 registros**.
- **Causa raiz**: a policy foi escrita para o código do servidor ("System can insert"), mas concedida ao papel `authenticated`, que é o do navegador do usuário. Sem `with_check` nenhum, não há sequer a exigência de que o `user_id` da linha seja o de quem escreve.
- **Impacto no negócio**: a trilha que deveria provar quem fez o quê pode receber linha inventada por qualquer pessoa com login — inclusive em nome de outra. Uma auditoria apoiada nessa tabela não se sustenta.
- **Caminho de correção**: etapa 025.

### ACH-DB-06 · `auditoria_financeira` aceita registro apontando para qualquer empresa

- **Camada**: banco de dados / integridade · **Severidade**: Média · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: policy `auditoria_user_insert` — `cmd = INSERT`, `with_check = (uid() = user_id)`. Valida só a autoria; **não valida `empresa_id`**, embora a policy de leitura (`auditoria_financeira_empresa_select`) filtre justamente por `empresa_id`.
- **Causa raiz**: a regra de escrita e a de leitura foram escritas em momentos diferentes, com critérios diferentes.
- **Impacto no negócio**: um usuário pode gravar registro de auditoria financeira carimbado com a empresa de outro — e esse registro aparecerá no relatório da empresa errada.
- **Caminho de correção**: etapa 026.

### ACH-DB-07 · Tabela de erros de front aberta para a internet inteira

- **Camada**: banco de dados / abuso · **Severidade**: Média · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: policy `frontend_error_anon_insert` em `frontend_error_logs` — `cmd = INSERT`, `roles = {anon}`, `with_check = true`. A tabela tem 1 registro. Existe um cron `monitorar-erros-frontend` a cada 30 min lendo essa tabela.
- **Causa raiz**: para registrar erro de usuário deslogado, abriu-se `INSERT` para `anon` sem limite de volume, tamanho ou formato.
- **Impacto no negócio**: qualquer pessoa com a URL pública do projeto pode encher a tabela — custo de armazenamento, alerta afogado em ruído e erro real escondido no meio.
- **Caminho de correção**: etapa 027.

---

## Grupo C — Fornecimento de dependências e build

### ACH-INF-01 · Um quinto do build vem de um registry privado de terceiro

- **Camada**: infraestrutura / cadeia de suprimentos · **Severidade**: Alta · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: `grep -cE 'https://europe-west[0-9]+-npm\.pkg\.dev' bun.lock` → **209**, de **1.072** entradas no lock (19,5%). Os endereços apontam para `europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` e `europe-west1-npm.pkg.dev` — Artifact Registry do Lovable, não o npm público. Prova de que é o lock que fixa isso, e não a rede: `curl` ao mesmo pacote em `registry.npmjs.org` devolve **HTTP 200**, enquanto ao host do Lovable devolve **403 no CONNECT**; e a instalação **completa com 661 pacotes** quando feita sem as URLs do lock (`bun install --registry https://registry.npmjs.org`, em cópia isolada).
- **Causa raiz**: o `bun.lock` foi gerado dentro do ambiente da Lovable, que serve um cache próprio de pacotes, e esses endereços ficaram gravados no arquivo versionado.
- **Impacto no negócio**: a montagem do sistema depende de um servidor de outra empresa. Se esse cache sair do ar, mudar de permissão ou for desligado, o projeto deixa de compilar em qualquer máquina nova e em qualquer CI — e 209 pacotes passam a vir de uma fonte que o dono não controla nem audita.
- **Precisa de aprovação humana**: sim (mexe em lockfile e no build).
- **Caminho de correção**: etapas 028–030.

### ACH-INF-02 · Só o `bun` consegue instalar o projeto

- **Camada**: infraestrutura · **Severidade**: Baixa · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: `npm install` aborta com `TypeError: Cannot read properties of null (reading 'edgesOut')` — medido no contêiner da auditoria, em 2026-11-23 —; o log mostra a resolução parando em `xlsx@file:vendor/xlsx-0.20.3.tgz`. Não existe `package-lock.json`. O tarball está versionado: `vendor/xlsx-0.20.3.tgz`, 2,4 MB.
- **Causa raiz**: dependência vendorizada por caminho de arquivo (provavelmente para fugir das versões vulneráveis de `xlsx` no npm) combinada com um bug de resolução do npm.
- **Divergência na documentação**: o gerenciador está declarado em dois lugares e de dois jeitos — `docs/agentes/mapa-repo.md:40` afirma "Bun é o gerenciador (`bun.lock`; sem `package-lock.json`)", enquanto `README.md:24` ainda instrui `npm install # ou: bun install`. `package.json` não tem campo `packageManager`, então nada no repositório impõe a escolha.
- **Impacto no negócio**: qualquer ambiente, pessoa ou ferramenta que siga o `README` e use `npm` não consegue montar o projeto. Prende o time a um único gerenciador, sem isso estar escrito em um só lugar.
- **Caminho de correção**: etapa 031 — alinhar `README.md` e `docs/agentes/mapa-repo.md` na mesma instrução e travar o gerenciador com `packageManager`; **não** trocar a vendorização. A conclusão sobre `npm` vale para o ambiente testado (contêiner da auditoria), não para qualquer máquina.

---

## Grupo D — Funções e views do banco

### ACH-DB-08 · Uma função com privilégio elevado sem `search_path` fixo

- **Camada**: banco de dados / segurança · **Severidade**: Média · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Evidência**: entre as **170** funções `SECURITY DEFINER` de `public`, exatamente uma tem `proconfig IS NULL`: `gerar_lancamento_contabil_automatico()`. As outras 169 fixam `search_path`.
- **Divergência com a cadeia de migrations (registrada)**: a função **não existe** numa base recriada do zero a partir de `supabase/migrations`. `20261027120000_transferencias_movimentacao_bilateral.sql:375` ainda a recria, mas `20261112023354_contabilizacao_automatica_movimentacoes.sql:148-149` dropa o gatilho `trigger_gerar_contabilidade` e depois a própria função (`DROP FUNCTION IF EXISTS public.gerar_lancamento_contabil_automatico()`). Ou seja: produção tem um objeto que a cadeia versionada remove — é drift, não uma função esquecida no lote de `search_path`.
- **Causa raiz**: as duas coisas somadas — a função ficou fora do lote em que o `search_path` foi padronizado e o `DROP` da migração de contabilização não foi aplicado em produção.
- **Impacto no negócio**: função que roda com privilégio de dono e resolve nomes de tabela pelo caminho de busca de quem chama — abre espaço para desviar a contabilização automática para outro objeto. Se o gatilho antigo ainda existir em produção, ele continua disparando esse código.
- **Precisa de aprovação humana**: sim (DDL em produção).
- **Caminho de correção**: etapa 032 — antes de qualquer `DROP` em produção, conferir `pg_trigger` (se `trigger_gerar_contabilidade` ainda existe e aponta para a função) e só então decidir entre dropar os dois ou fixar `search_path` na função enquanto ela existir.

### ACH-DB-09 · View materializada fora do controle de acesso

- **Camada**: banco de dados / segurança · **Severidade**: Média · **Confiança**: hipótese (o `GRANT` efetivo em produção não foi medido) · **Modo**: EXECUTADO
- **Evidência**: `mv_performance_alerts_weekly` é a única relação de `public` do tipo view sem `security_invoker` ("NÃO DEFINIDO"); as outras 17 views têm `security_invoker` `on`/`true`. É atualizada pelo cron `refresh-performance-alerts-weekly` (domingos, 1h).
- **O que já está versionado**: o acesso direto foi revogado duas vezes — na criação (`20260712194623_...:48-49`) e no hardening (`20260827101000_hardening_views_pii_rpcs.sql:51-58`), que faz `REVOKE ALL ... FROM PUBLIC, anon, authenticated` e `GRANT SELECT ... TO service_role`. Nenhuma migration posterior devolve `SELECT` para `anon`/`authenticated` (conferido varrendo as migrations que citam a view).
- **Causa raiz**: view materializada não aceita `security_invoker` no Postgres — por isso consulta a tabela base com o privilégio do dono, **ignorando a RLS**. A proteção, aqui, só pode vir do `GRANT`.
- **O que falta medir**: os privilégios **efetivos** em produção (`information_schema.role_table_grants` para `anon`/`authenticated`, e `pg_class.relacl`). O inventário leu o catálogo de produção para views e colunas, mas não mediu o `relacl` desta relação; por isso o achado fica como "a confirmar" em vez de "confirmado".
- **Impacto no negócio**: se o papel do navegador tiver permissão de leitura nessa view, ela entrega dados agregados sem passar pelo filtro de empresa.
- **Caminho de correção**: etapa 033 — rodar a consulta de `relacl`/`role_table_grants` em produção; se o `GRANT` já estiver restrito a `service_role`, fechar o achado como "mitigado por privilégio", sem DDL.

### ACH-DB-10 · Cinco chaves estrangeiras sem índice

- **Camada**: banco de dados / performance · **Severidade**: Baixa · **Confiança**: confirmado · **Modo**: EXECUTADO
- **Locais**: `execucoes_cobranca.cliente_id` · `asaas_audit_trail.user_id` · `asaas_transfers.user_id` · `sso_login_attempts.empresa_id` · `aprovacao_assinaturas.user_id`
- **Evidência**: consulta cruzando `pg_constraint` (contype='f') com `pg_index`; nenhuma dessas colunas aparece como primeira coluna de índice algum.
- **Causa raiz**: índice de FK não é criado automaticamente pelo Postgres.
- **Impacto no negócio**: hoje, nada — as tabelas têm 10 linhas ou menos. Vira lentidão em exclusão e junção quando a base crescer.
- **Precisa de aprovação humana**: sim (DDL em produção).
- **Caminho de correção**: etapas 034–035 (`CREATE INDEX` **sem** `CONCURRENTLY`, que o gateway do Supabase recusa).

---

