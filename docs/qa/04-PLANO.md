# 04 — Plano de correção e melhoria

> Produzido pela auditoria de QA somente leitura de 2026-11-22, sobre `main` em `2c2486f`.
> Achados e evidências: `03-ACHADOS.md`. Cobertura: `01-INVENTARIO.md`. Cenários: `02-CENARIOS.md`. Progresso: `05-PROGRESSO.md`.

## Instruções para o agente executor

Você vai executar este plano sozinho, etapa por etapa, sem acesso a quem o escreveu. Tudo o que você precisa está aqui e nos arquivos irmãos em `docs/qa/`. Leia estas regras antes da primeira etapa e volte a elas sempre que algo divergir.

1. **Uma etapa por vez, na ordem, respeitando as dependências.** Cada etapa tem `Depende de:`. Não comece uma etapa cujas dependências não estejam marcadas como concluídas em `05-PROGRESSO.md`. Cada etapa é uma branch própria e uma PR própria — nunca junte duas etapas na mesma PR, mesmo que pareçam gêmeas.
2. **Antes de mudar qualquer coisa, releia a evidência da etapa no código atual.** Abra o `arquivo:linha` citado e confirme que o trecho descrito está lá. O repositório tem muitos agentes trabalhando ao mesmo tempo; o código pode já ter mudado. **Se o código não corresponde ao descrito, pare essa etapa**, escreva em `05-PROGRESSO.md` o que encontrou no lugar, marque a etapa como `[~] divergente` e siga para a próxima etapa independente. Não adivinhe o que o autor queria dizer.
3. **Corrija a causa raiz com a menor mudança possível.** Não refatore, não renomeie, não reorganize imports, não "melhore" o que a etapa não pede, não reescreva o arquivo inteiro para mudar três linhas. O campo `Arquivos e objetos a tocar:` é o limite da sua mudança; `Não tocar / armadilhas:` diz o que parece relacionado e deve ficar como está.
4. **Problema novo encontrado no caminho não é corrigido na hora.** Anote em `05-PROGRESSO.md`, na seção "Achados novos", com `arquivo:linha` e uma linha de descrição. Continue a etapa em que estava.
5. **Etapa marcada `Precisa de aprovação humana: sim` fica com a PR aberta, aguardando.** Não faça merge. Avise o dono com o link da PR e passe para a etapa seguinte que não dependa dela. Isso vale para migration/DDL em produção, CI/workflows, segredos, infraestrutura, deleção de dado, mudança de arquitetura ou de custo.
6. **Uma etapa só termina com a verificação executada e a evidência anotada.** O campo `Como verificar:` traz um comando, consulta ou request concreto e o resultado esperado. Rode, cole a saída real em `05-PROGRESSO.md` e só então marque `[x]`. "Deveria funcionar" não conclui etapa. Se a verificação falhar, a etapa continua aberta.
7. **Convenções do repositório que valem para toda etapa** (de `AGENTS.md`, que vence qualquer outro documento em conflito):
   - Branch nova a partir de `main` atualizado, nome `claude/<tipo>-<slug>-<AAMMDD-HHMM>` com `tipo` em `fix`|`feat`|`chore`|`infra`. Nunca commitar em `main`, nunca reaproveitar branch, nunca escrever em branch de outro agente.
   - Antes de começar, liste as PRs abertas (`github_graphql`). Se houver PR aberta tocando os mesmos arquivos, pare e avise o dono.
   - Escrita no GitHub pelo MCP `GITHUB - MCP - FOREVER` (o MCP padrão devolve 403 em escrita).
   - Commits em português, prefixo `fix:`/`feat:`/`chore:`/`infra:`, de preferência um commit atômico.
   - **DDL nunca por `supabase_apply_migration`**: execute via `supabase_db_query` e grave o arquivo correspondente em `supabase/migrations/` com timestamp `YYYYMMDDHHmmss` estritamente crescente — confira antes com `SELECT max(version) FROM supabase_migrations.schema_migrations`.
   - `CREATE INDEX` sem `CONCURRENTLY` (o gateway transacional do Supabase recusa `CONCURRENTLY`).
   - Views com `security_invoker = true`. RLS em toda tabela pública. Isolamento por `empresa_id`; `organizacao_id` não entra em consulta, policy ou migration financeira.
   - Edge Function nova: `validatePayload` com Zod e `verify_jwt` ligado (desligar só com justificativa em comentário no `supabase/config.toml`).
   - Nada de `any` implícito nem `@ts-ignore` sem justificativa escrita; `src/integrations/supabase/types.ts` é gerado e não se edita à mão.
   - Segredo só em variável de ambiente ou secret do serviço — nunca em código, commit ou resposta.
8. **Antes de abrir a PR**, rode o que o repositório tem para os arquivos que você tocou: `bun run type-check`, `bun run lint`, `bun run test:run` (ou o teste do arquivo). Erro herdado de `main`, que você não introduziu, não é seu: anote em `05-PROGRESSO.md` e siga.
   - **Atenção de ambiente**: em contêiner com rede restrita, `bun install` pode não completar (o proxy recusa parte dos tarballs com 403). Se as dependências não instalarem, diga isso na PR em vez de afirmar que os testes passaram.
9. **Depois do merge, confirme o deploy.** Merge em `main` é produção (Vercel). Verifique que o deploy subiu e que o comportamento mudou de verdade (log, consulta ou request real). CI vermelha: leia o resumo da falha antes de qualquer correção; se o vermelho veio do seu merge, corrija em branch nova `fix:`.
10. **Relate ao fim de cada etapa**: link da PR e estado (mergeada / aberta aguardando o dono / CI vermelha e por quê).

### Como ler cada etapa

`Onda` dá a prioridade (1 = primeiro). `Severidade` vem do achado. `Achados resolvidos` liga a etapa ao `03-ACHADOS.md` — toda etapa tem pelo menos um. `Caminho recomendado` é o campo mais importante: diz por onde começar, que padrão já existente no repositório seguir (com o arquivo de referência) e qual atalho tentador evitar. Siga-o em vez de inventar um caminho próprio: quem escreveu leu o código ao redor, você está vendo só este trecho.

### Ordem das ondas

1. Segurança e risco de perda de dado
2. Fluxos principais quebrados
3. Integridade de dados e regras de negócio
4. Funcionalidades incompletas
5. Robustez: erros, estados, concorrência
6. Performance
7. Experiência de uso e consistência
8. Higiene: código morto, CI, observabilidade

### Relação com os outros planos abertos no repositório

Em 2026-11-22 já existiam dois planos de etapas no repositório, somando 390 etapas, gerados no mesmo dia: `docs/PLANO_FRONTEND_190_ETAPAS_2026-11-22.md` (190 etapas, prefixo `E-`) e `docs/PLANO_UX_NAVEGACAO_200_ETAPAS_2026-11-22.md` (200 etapas, prefixo `N-`). Eles cobrem **front-end e navegação/UX**. Este plano foi deduplicado contra os títulos daqueles dois: onde um item de interface já estava previsto lá, ele **não** foi repetido aqui, e a etapa correspondente deste plano registra a referência (`E-0xx` / `N-0xx`) no campo "Não tocar / armadilhas". O foco deste plano é o que aqueles dois não alcançam: banco de dados e RLS, Edge Functions, integrações e webhooks, regras de negócio e cálculo financeiro, infraestrutura e CI, e riscos transversais de isolamento multi-empresa.

## Etapas

> **Quantidade**: 35 etapas (`001`–`035`). A numeração não é decorativa: é a mesma que o `03-ACHADOS.md` cita no campo "Caminho de correção" de cada achado. Estas etapas cobrem banco/RLS, Edge Functions, integrações e CI — os planos `E-` e `N-` citados acima continuam sendo a referência para front-end e UX, e nenhuma etapa daqui os repete. Fechar cota numérica inventando etapas sem achado que as sustente produziria plano falso: cada etapa abaixo nasceu de um achado com evidência em `03-ACHADOS.md`.
>
> **Ondas**: 1 = segurança e perda de dado (001–008, 025–027, 032–033) · 2 = fluxos quebrados (009–013) · 3 = integridade e regra de negócio (015–023) · 6 = performance (034) · 8 = higiene, CI e cadeia de suprimentos (014, 024, 028–031, 035).

---

### 001 · Inventário executável das tabelas com `empresa_id` fora do predicado único

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: —
- **Arquivos e objetos a tocar**: `scripts/integrity/16_isolamento_empresa.sql` (novo) e a tabela de checagens em `scripts/integrity/README.md`.
- **Não tocar / armadilhas**: nenhuma policy e nenhuma migration nesta etapa — é só medição. Não altere `scripts/integrity/15_views_pii_rpcs.sql`, que é o modelo de formato. Não conte como "fora do predicado" a tabela que tem `empresa_acessivel(` dentro de `EXISTS (...)` — o casamento é textual em `pg_policies.qual` e `with_check`.
- **Caminho recomendado**: copie o formato de saída de `scripts/integrity/15_views_pii_rpcs.sql:80-97` (`check`, `actual`, `expected`, veredito `pass`/`fail`). A consulta cruza `information_schema.columns` (`column_name = 'empresa_id'`, `table_schema = 'public'`) com `pg_policies`, e devolve as tabelas cujas policies **não** mencionam `empresa_acessivel(`. Ordenar por nome da tabela para o resultado ser comparável entre execuções.
- **Como verificar**: `psql "$PROD_DB_URL" -f scripts/integrity/16_isolamento_empresa.sql` deve devolver **58** tabelas — o número medido em 2026-11-22. Cole a lista real em `05-PROGRESSO.md`. Se vier diferente, a diferença é o primeiro dado novo: anote quais tabelas entraram ou saíram e siga. **Atenção à métrica**: o 58 é binário — "tabela com `empresa_id` e **nenhuma** policy citando `empresa_acessivel(`" —, que é exatamente o critério do achado. Ele **não** mede se as policies de uma tabela estão todas no padrão: uma tabela com uma policy canônica e quatro legadas sai da lista sem estar resolvida. Por isso a verificação de cada etapa de lote é dupla: a tabela sai da lista **e** a contagem de policies com o predicado antigo naquela tabela vai a zero (modelo na etapa 004).
- **Precisa de aprovação humana**: não (somente leitura).

---

### 002 · Piloto do predicado único em `movimentacoes`

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 001
- **Arquivos e objetos a tocar**: `supabase/migrations/<YYYYMMDDHHmmss>_isolamento_piloto_movimentacoes.sql` (novo).
- **Não tocar / armadilhas**: `empresa_membro_ativo()`, `user_empresas`, e qualquer tabela diferente de `movimentacoes`. Não remova a exigência de papel (`has_any_role`) que a policy atual carrega — o predicado de isolamento **soma** a checagem de papel, não substitui. Não use `CONCURRENTLY`: nada aqui é índice, e o gateway transacional recusa.
- **Caminho recomendado**: antes de escrever a migration, rode `SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movimentacoes'` e guarde a saída no `05-PROGRESSO.md`; é o contrato que a nova policy precisa preservar. Confirme também o corpo de `empresa_acessivel(uuid)` (`SELECT prosrc FROM pg_proc WHERE proname = 'empresa_acessivel'`): se ela devolver `true` para `NULL`, a policy precisa de `empresa_id IS NOT NULL AND empresa_acessivel(empresa_id)`. Uma policy por comando (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), mantendo os nomes existentes para a auditoria continuar rastreável.
- **Como verificar**: a consulta da etapa 001 deixa de listar `movimentacoes`, e `psql "$PROD_DB_URL" -f supabase/tests/sql/rls_multi_empresa.sql` continua passando (é o teste que o CI roda contra produção). Cole as duas saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 003 · `clientes`: fechar a criação de cliente sem empresa

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-02 · **Depende de**: 002
- **Arquivos e objetos a tocar**: migration nova com a policy de `INSERT` de `clientes`.
- **Não tocar / armadilhas**: as policies `SELECT`/`UPDATE`/`DELETE` de `clientes` são as etapas 004 e 005 — aqui só entra o caminho de escrita que hoje aceita `empresa_id IS NULL`. São **dois** caminhos, e os dois precisam do teste: `clientes_tenant_insert` (aceita nulo de forma explícita) e as `clientes_owner_*` (`uid() = user_id`), que alcançam o cliente só por autoria e continuam valendo até a etapa 005. Não acrescente `CHECK` na coluna: linha existente com nulo faria a migration falhar em produção; hoje são 0, mas o `CHECK` é decisão da etapa 005, junto com a limpeza.
- **Caminho recomendado**: o buraco é `clientes_tenant_insert`, cujo `with_check` é `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))`. Reduza a `empresa_acessivel(empresa_id)` (com `empresa_id IS NOT NULL AND` na frente se a função aceitar nulo). `clientes_owner_insert` e `Operacional+ can manage clientes` continuam válidas — elas não abrem o caminho para empresa nula.
- **Como verificar**: com um usuário autenticado de teste, `INSERT INTO clientes (nome, empresa_id) VALUES ('teste', NULL)` deve ser **recusado** por RLS — e o mesmo tem de valer para a **inserção com autoria** (`user_id` = sessão), que é o segundo caminho e não é coberto por um teste que só exercita o insert genérico; o insert com o `empresa_id` da empresa do usuário deve passar. Cole os três resultados em `05-PROGRESSO.md` e apague a linha de teste na mesma transação (`BEGIN; ... ROLLBACK;`).
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 004 · `clientes`: trocar as quatro `tenant_*` pelo predicado único

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-02 · **Depende de**: 003
- **Arquivos e objetos a tocar**: migration nova com `clientes_tenant_select`, `_update`, `_delete`.
- **Não tocar / armadilhas**: `clientes_grupo_select` e `Operacional+ can manage clientes` ficam como estão — são as policies rigorosas e viram redundantes, não erradas. Não mexa em `clientes_owner_*` (etapa 005).
- **Caminho recomendado**: reescreva cada uma com `empresa_acessivel(empresa_id)`, sem `empresa_id IS NULL`, preservando o `cmd` e os `roles` atuais. Como policies permissivas se somam com `OR`, o resultado combinado passa a ser "membro da empresa ou (regra de papel já existente)" — que é o desejado.
- **Como verificar**: a consulta da etapa 001 continua listando `clientes` (por causa das `owner_*`, que só caem na 005) — isso é esperado; o que se mede aqui é `SELECT count(*) FROM pg_policies WHERE tablename = 'clientes' AND (qual LIKE '%empresa_id IS NULL%' OR with_check LIKE '%empresa_id IS NULL%')` = **0**. Cole a saída.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 005 · `clientes`: aposentar as `owner_*` e travar `empresa_id` como obrigatório

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-02 · **Depende de**: 004
- **Arquivos e objetos a tocar**: migration nova: `DROP POLICY` das três `clientes_owner_*` e `ALTER TABLE clientes ... SET NOT NULL` (ou `CHECK`) em `empresa_id`.
- **Não tocar / armadilhas**: não drope `clientes_owner_*` antes de provar que nenhum cliente depende delas — quem criou o cliente e depois saiu da empresa continua alcançando o registro só por essas policies. Se a consulta abaixo devolver linha, **pare** e registre em `05-PROGRESSO.md` como divergente; a etapa deixa de ser mecânica.
- **Caminho recomendado**: rode antes `SELECT c.id, c.empresa_id FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM user_empresas ue WHERE ue.user_id = c.user_id AND ue.empresa_id = c.empresa_id)` — se voltar vazio, o `DROP` é seguro. O `SET NOT NULL` só depois do `DROP`, na mesma migration, para o intervalo entre os dois não reabrir o caminho.
- **Como verificar**: `SELECT count(*) FROM clientes WHERE empresa_id IS NULL` = 0 e `\d clientes` mostrando `NOT NULL` em `empresa_id`; e `rg "clientes_owner_" --glob '!supabase/migrations/**'` na raiz sem resultado (nenhum código cita o nome das policies removidas).
- **Precisa de aprovação humana**: sim (DDL e remoção de policy em produção).

---

### 006 · `fornecedores`: preencher `empresa_id` dos registros existentes

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-03 · **Depende de**: —
- **Arquivos e objetos a tocar**: migration nova de `UPDATE` em `fornecedores` (dado em produção).
- **Não tocar / armadilhas**: as policies `fornecedores_owner_*` ficam intactas nesta etapa — trocá-las antes do backfill esconderia os fornecedores de todo mundo. Não derive `empresa_id` "pelo primeiro `user_empresas`" sem conferir: se o usuário tiver mais de uma empresa, a escolha é ambígua e precisa de decisão do dono.
- **Caminho recomendado**: a evidência do achado é `SELECT count(*) FROM fornecedores WHERE empresa_id IS NOT NULL` = **0** com 5 registros. Liste primeiro `SELECT f.id, f.user_id, ue.empresa_id FROM fornecedores f JOIN user_empresas ue ON ue.user_id = f.user_id AND ue.ativo` e verifique se cada fornecedor tem exatamente uma empresa candidata; só então escreva o `UPDATE` (por `id`, nunca por `nome`).
- **Como verificar**: `SELECT count(*) FROM fornecedores WHERE empresa_id IS NULL` = 0, e a contagem de linhas da tabela inalterada (5 antes, 5 depois). Cole as duas saídas.
- **Precisa de aprovação humana**: sim (altera dado em produção).

---

### 007 · `fornecedores`: trocar o predicado `uid() = user_id` pelo isolamento por empresa

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-03 · **Depende de**: 006
- **Arquivos e objetos a tocar**: migration nova com as quatro policies de `fornecedores`.
- **Não tocar / armadilhas**: mantenha a autoria (`user_id`) no `INSERT` como registro de quem cadastrou; o que muda é o critério de visibilidade, não a auditoria. Não remova o índice/policy de `DELETE` antes de confirmar que a etapa 006 fechou sem nulo.
- **Caminho recomendado**: `SELECT`/`UPDATE`/`DELETE` passam a `empresa_acessivel(empresa_id)`; o `INSERT` fica `empresa_acessivel(empresa_id) AND uid() = user_id`. Esse é o padrão das tabelas já corretas (`clientes` após a etapa 004).
- **Como verificar**: com dois usuários da **mesma** empresa, o fornecedor criado pelo usuário A aparece na consulta do usuário B (`SET ROLE authenticated` + `set request.jwt.claims` no psql, ou teste em `supabase/tests/sql/rls_multi_empresa.sql`); com usuário de outra empresa, não aparece. Cole os dois resultados.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 008 · `fornecedores`: travar a regressão no teste de RLS versionado

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-03 · **Depende de**: 007
- **Arquivos e objetos a tocar**: `supabase/tests/sql/rls_multi_empresa.sql` (novo caso).
- **Não tocar / armadilhas**: não afrouxe o teste existente para "passar" — ele roda contra produção (`ci.yml:298-323`) e é o gate de RLS do repositório. Um caso novo que falhe significa policy errada, não teste errado.
- **Caminho recomendado**: o teste já tem o formato de "tabelas escrevíveis sem policy correspondente" (o trecho que falha hoje em `rls_multi_empresa.sql:379` no PR #546). Acrescente o caso positivo "colega da mesma empresa enxerga o fornecedor" e o negativo "empresa diferente não enxerga", usando as empresas de teste que o arquivo já cria.
- **Como verificar**: `psql "$PROD_DB_URL" -f supabase/tests/sql/rls_multi_empresa.sql` sem erro. Cole a linha final da saída.
- **Precisa de aprovação humana**: não (só teste), mas o merge é em `main` — CI verde obrigatório.

---

### 009 · Lote 1 das tabelas de dinheiro: `notas_fiscais` e `nfe_recebidas`

- **Onda**: 2 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 002
- **Arquivos e objetos a tocar**: migration nova com as policies dessas duas tabelas.
- **Não tocar / armadilhas**: `notas_fiscais_tenant_delete` mistura papel (`admin`/`manager`) com isolamento — preserve a parte de papel e troque só o predicado (a consolidação de papéis é a etapa 015 em diante; não antecipe). `nfe_recebidas` usa o padrão 3 (`EXISTS ... user_empresas`), que é funcionalmente equivalente: a troca é por uniformidade, não por bug — não gaste a etapa procurando o defeito que não existe.
- **Caminho recomendado**: use a lista da etapa 001 como fila de trabalho e escolha as tabelas de dinheiro na ordem em que o achado as cita: `notas_fiscais`, `nfe_recebidas`. Para cada uma, leia as policies atuais antes de reescrever e mantenha nomes, `cmd` e `roles`.
- **Como verificar**: a consulta da etapa 001 deixa de listar as duas tabelas; `supabase/tests/sql/rls_multi_empresa.sql` continua passando.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 010 · Lote 2: `transferencias`, `plano_contas`, `contratos`

- **Onda**: 2 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 009
- **Arquivos e objetos a tocar**: migration nova com as policies das três tabelas.
- **Não tocar / armadilhas**: `transferencias` tem policy citada em migration de movimentação bilateral (`20261027120000_transferencias_movimentacao_bilateral.sql`) — leia essa migration antes; ela pode recriar a policy antiga e desfazer a sua troca se for reaplicada numa base nova.
- **Caminho recomendado**: mesmo procedimento da etapa 009, três tabelas por lote. Se `contratos` tiver policy por papel além do isolamento, mantenha a parte de papel.
- **Como verificar**: a consulta da etapa 001 deixa de listar as três; teste de RLS verde; e `rg "20261027120000" supabase/migrations` para confirmar que nenhuma migration posterior recria as policies trocadas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 011 · Lote 3: `faturamento_mensal`, `folha_pagamento`, `acordos_parcelamento`

- **Onda**: 2 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 010
- **Arquivos e objetos a tocar**: migration nova com as policies das três tabelas.
- **Não tocar / armadilhas**: `folha_pagamento` é dado pessoal de terceiro — a troca de policy aqui muda quem lê salário; faça uma tabela por migration dentro da mesma etapa só se o teste de RLS cobrir cada uma. Não "aproveite" para mexer em `11_pii_mask.sql`.
- **Caminho recomendado**: mesmo procedimento; para `folha_pagamento`, confirme antes se existe policy por papel (`has_any_role`) e preserve-a somada ao isolamento.
- **Como verificar**: a consulta da etapa 001 deixa de listar as três; teste de RLS verde. Cole as saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 012 · Lote 4: `anexos_financeiros`, `auditoria_financeira`, `execucoes_cobranca`, `historico_cobranca`

- **Onda**: 2 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 011
- **Arquivos e objetos a tocar**: migration nova com as policies das quatro tabelas.
- **Não tocar / armadilhas**: `anexos_financeiros` é o padrão 3 e usa `ue.role = ANY (...)`: aqui o papel está **dentro** do predicado de isolamento, então os dois assuntos se cruzam. Separe: isolamento nesta etapa, vocabulário de papel na 015+. Não altere `auditoria_financeira` de escrita — isso é a etapa 026.
- **Caminho recomendado**: `anexos_financeiros` precisa de cuidado extra: reescreva como `empresa_acessivel(empresa_id)` mais a checagem de papel atual, sem `ue.role`. Se não houver função de papel equivalente, mantenha `ue.role` e registre a dívida para a etapa 017.
- **Como verificar**: a consulta da etapa 001 deixa de listar as quatro; teste de RLS verde; e `SELECT count(*) FROM anexos_financeiros` inalterado antes/depois (a troca não pode esconder linha existente de quem deveria vê-la).
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 013 · Lote 5: fechar o restante da lista do inventário

- **Onda**: 2 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 012
- **Arquivos e objetos a tocar**: migrations novas, quantas forem necessárias para zerar a lista da etapa 001.
- **Não tocar / armadilhas**: `fornecedores` já foi resolvida (006–008) e `clientes` também (003–005) — se aparecerem na lista, alguma etapa anterior regrediu: pare e registre. Tabelas sem dado financeiro podem ir em lote maior; as de dinheiro que sobrarem (`divergencias_conciliacao`, `pedidos_compra`) merecem migration própria.
- **Caminho recomendado**: trabalhe pela consulta da etapa 001, não por memória. Cada migration fecha um conjunto pequeno (3–6 tabelas) do **mesmo domínio**, para o revisor conseguir julgar o diff. Ao final, a consulta tem de devolver zero linhas.
- **Como verificar**: `psql "$PROD_DB_URL" -f scripts/integrity/16_isolamento_empresa.sql` devolve **0** tabelas. Cole a saída — é o fechamento de ACH-DB-01.
- **Precisa de aprovação humana**: sim (DDL em produção, em várias PRs).

---

### 014 · Gate no CI: nova tabela com `empresa_id` fora do predicado reprova a PR

- **Onda**: 8 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 013
- **Arquivos e objetos a tocar**: `.github/workflows/ci.yml` (job que já roda `psql "$PROD_DB_URL"`, perto de `ci.yml:353`, onde `14_retencao.sql` é executado) e a checagem `scripts/integrity/16_isolamento_empresa.sql`.
- **Não tocar / armadilhas**: o repo proíbe PR de workflow sem `actionlint` e `act -j <job> -n` — rode os dois via WSL antes do push. Não transforme o gate em "aviso": o valor dele é reprovar. E não inclua a checagem em job que roda em PR de fork com secret, porque `PROD_DB_URL` não estará disponível.
- **Caminho recomendado**: o gate só entra **depois** de a lista estar vazia (etapa 013) — antes disso ele nasceria vermelho e seria desligado. Saída esperada: `pass` quando a consulta devolve 0 linhas, `fail` com a lista das tabelas quando devolve qualquer linha.
- **Como verificar**: o job lê o estado de **produção** (`ci.yml:342-359` usa `secrets.PROD_DB_URL`), e nenhum workflow aplica a migration da PR antes do merge — então o caminho de prova é local, não pela PR: rode a checagem dentro de uma transação em produção, criando a tabela de teste e revertendo (`BEGIN; CREATE TABLE teste_gate (id uuid, empresa_id uuid); <rodar a checagem>; ROLLBACK;`) e mostre o `fail` citando `teste_gate`; depois rode a checagem fora da transação e mostre `pass` com a lista vazia. O comportamento do job em si (ler o exit code e emitir `::error::`) é provado com `act -j quality-gate -n` e com um push de teste na própria branch do gate. A prova mais forte, e a única que exercita o gate contra o **esquema candidato**, é aplicar as migrations da PR num banco descartável (branch de preview do Supabase ou `supabase db reset` local) e rodar lá o mesmo `scripts/integrity/<n>.sql`: o `DATABASE_URL` aponta para esse banco descartável e o resultado tem de ser `fail` para a tabela de teste e `pass` ao removê-la. Colar as quatro saídas.
- **Precisa de aprovação humana**: sim (workflow).

---

### 015 · Matriz papel → capacidade, derivada das policies reais

- **Onda**: 3 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-04 · **Depende de**: —
- **Arquivos e objetos a tocar**: `docs/qa/06-MATRIZ_PAPEIS.md` (novo).
- **Não tocar / armadilhas**: não é etapa de código. Não decida ainda qual vocabulário vence (isso é a 016) — a matriz só descreve o que existe hoje.
- **Caminho recomendado**: extraia `SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename` e, dela, as policies que citam `has_role`, `has_any_role` ou `ue.role`. Monte uma tabela com as colunas `papel`, `tabela`, `comando`, `policy` — cada célula com o nome da policy, para o leitor conseguir abrir a origem. Feche com a contagem por papel: os 8 valores do enum `app_role` (`admin, manager, operator, viewer, financeiro, operacional, visualizador, contador`).
- **Como verificar**: a matriz cita as quatro divergências de vocabulário do achado (`query_telemetry` × `clientes`/`notas_fiscais` × `notas_fiscais_tenant_delete` × `anexos_financeiros`) e todo papel do enum aparece em ao menos uma linha ou está marcado como "sem uso em policy". Cole a contagem final.
- **Precisa de aprovação humana**: não (documento).

---

### 016 · Decidir o vocabulário canônico de papéis e escrever a decisão

- **Onda**: 3 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 015
- **Arquivos e objetos a tocar**: `docs/qa/06-MATRIZ_PAPEIS.md` (seção "Decisão") e `AGENTS.md` (seção de isolamento/autorização).
- **Não tocar / armadilhas**: **esta etapa precisa de decisão do dono do negócio** — qual rótulo sobrevive (`manager` vs `financeiro`, `operator` vs `operacional`, `viewer` vs `visualizador`) muda o que cada pessoa pode fazer. Não escolha sozinho. `contador` não tem par em inglês: não é duplicata, é papel de terceiro.
- **Caminho recomendado**: apresente ao dono a matriz da etapa 015 com uma proposta de mapeamento 1:1 (`manager`→`financeiro`, `operator`→`operacional`, `viewer`→`visualizador`, `admin` e `contador` mantidos) e o efeito em cada tela. Registre a resposta em `06-MATRIZ_PAPEIS.md` com data, para as etapas seguintes citarem.
- **Como verificar**: a decisão está escrita, com o mapeamento e a lista de policies afetadas por papel. Sem essa decisão registrada, as etapas 017–022 não começam.
- **Precisa de aprovação humana**: sim (decisão de negócio).

---

### 017 · Lote de policies 1: `clientes` e `notas_fiscais`

- **Onda**: 3 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 016
- **Arquivos e objetos a tocar**: migration nova com as policies por papel dessas duas tabelas.
- **Não tocar / armadilhas**: o isolamento por empresa dessas tabelas acabou de ser padronizado (003–005, 009) — não volte a mexer nele. Aqui só muda a **lista de papéis** dentro das policies, para o vocabulário decidido na 016.
- **Caminho recomendado**: as duas usam `has_any_role(uid(), ARRAY['admin','financeiro','operacional'])`. Se a decisão da 016 for "português vence", essas já estão certas e a etapa vira conferência: registre em `05-PROGRESSO.md` que não houve mudança, com a saída da consulta. Se a decisão for o contrário, reescreva a lista mantendo o mesmo conjunto de pessoas.
- **Como verificar**: para cada papel do enum, uma consulta que mostra se ele passa na policy antes e depois — o conjunto de pessoas autorizadas tem de ser idêntico ao da decisão da 016, nem mais nem menos. Cole a comparação.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 018 · Lote de policies 2: `query_telemetry`

- **Onda**: 3 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 017
- **Arquivos e objetos a tocar**: migration nova com as policies de `query_telemetry`.
- **Não tocar / armadilhas**: hoje `SELECT` exige `manager` e `INSERT` aceita `admin`/`manager`/`operator` — são **dois** vocabulários na mesma tabela. Não iguale os dois sem decidir: leitura de telemetria e escrita de telemetria podem legitimamente ter públicos diferentes.
- **Caminho recomendado**: aplique o mapa da 016 nas duas policies separadamente e escreva no comentário da migration por que leitura e escrita têm listas diferentes (ou iguais, se for o caso).
- **Como verificar**: um usuário `financeiro` (o papel que hoje não vê telemetria) passa a ver — ou não, conforme a decisão — e a consulta com `SET ROLE authenticated` comprova o comportamento escolhido. Cole a saída.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 019 · Lote de policies 3: `notas_fiscais_tenant_delete` e `anexos_financeiros`

- **Onda**: 3 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 018
- **Arquivos e objetos a tocar**: migration nova com a policy de `DELETE` de `notas_fiscais` e a de `anexos_financeiros`.
- **Não tocar / armadilhas**: `anexos_financeiros` mistura papel com `ue.role` dentro de `EXISTS` — é o caso mais delicado do plano. Se a troca exigir função nova de papel, ela é **objeto novo**, com justificativa; não reescreva `has_role`/`has_any_role`.
- **Caminho recomendado**: `notas_fiscais_tenant_delete` hoje aceita `admin` **ou** `manager`; com o mapa da 016, `manager` vira `financeiro` e a policy passa a `admin` **ou** `financeiro`. Para `anexos_financeiros`, troque `ue.role = ANY (...)` por `has_any_role(uid(), ARRAY[...])` equivalente, provando a equivalência na verificação.
- **Como verificar**: para cada papel, comparar "antes" e "depois" (quem passa) e mostrar que o conjunto é o mesmo, exceto onde a 016 decidiu mudar. Cole a tabela comparativa.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 020 · Lote de policies 4: `asaas_*` e cobrança

- **Onda**: 3 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 019
- **Arquivos e objetos a tocar**: migration nova com as policies dessas tabelas.
- **Não tocar / armadilhas**: `asaas_audit_trail` e `asaas_transfers` ganham índice na etapa 034 — não misture índice com policy na mesma PR.
- **Caminho recomendado**: mesma técnica: lista atual, mapa da 016, conjunto de pessoas preservado. Onde a policy citar papel por nome em texto livre (e não por `has_role`), padronize para a função.
- **Como verificar**: consulta de papéis por tabela antes/depois, conjunto idêntico ao decidido. Cole.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 021 · Lote de policies 5: restante das tabelas com papel

- **Onda**: 3 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 020
- **Arquivos e objetos a tocar**: migrations novas até não sobrar policy citando rótulo aposentado.
- **Não tocar / armadilhas**: a consulta de verificação é a fonte da verdade — se ela devolver zero e ainda houver policy com rótulo antigo, a consulta está errada. Ajuste a consulta, não a conclusão.
- **Caminho recomendado**: varra `pg_policies` por `qual`/`with_check` citando os rótulos aposentados e feche em lotes por domínio, como nas etapas 017–020.
- **Como verificar**: `SELECT count(*) FROM pg_policies WHERE schemaname='public' AND (qual LIKE '%manager%' OR qual LIKE '%operator%' OR qual LIKE '%viewer%' OR with_check LIKE '%manager%' OR with_check LIKE '%operator%' OR with_check LIKE '%viewer%')` = **0** (ajustando a lista ao mapa da 016). Cole a saída.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 022 · Aposentar os rótulos mortos do enum `app_role`

- **Onda**: 3 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 021
- **Arquivos e objetos a tocar**: migration nova com `ALTER TYPE app_role ...` e, antes, os `UPDATE` de **`user_empresas.role` e `user_roles.role`** — as duas colunas são do tipo `app_role`.
- **Não tocar / armadilhas**: valor de enum não se remove com `ALTER TYPE ... DROP VALUE` (não existe). O caminho é criar o tipo novo, migrar as colunas e renomear — operação que trava as tabelas. Faça em janela combinada, com `BEGIN`/`COMMIT` e contagem de linhas antes/depois. `contador` **fica**: não é sinônimo de nenhum rótulo em inglês. **`user_roles` é a tabela de papéis globais** (`role app_role NOT NULL DEFAULT 'visualizador'`), criada em `20251214170739_...:41-48`, e é ela que `has_role`/`has_any_role` leem (`20260728140000_fix_has_any_role.sql:3-28`) — migrar só `user_empresas.role` deixaria papéis globais apontando para valores que o tipo novo não tem. As duas funções são `SECURITY DEFINER` com a assinatura tipada no enum (`_roles public.app_role[]`, `_role public.app_role`): a troca do tipo exige recriá-las depois do `DROP TYPE`, na mesma migration, com `CREATE OR REPLACE` idêntico ao versionado — sem isso o `DROP TYPE` falha por dependência e as policies que dependem delas caem junto.
- **Caminho recomendado**: medir antes com `SELECT role, count(*) FROM user_empresas GROUP BY role` **e** `SELECT role, count(*) FROM user_roles GROUP BY role`; `UPDATE` dos rótulos nas duas tabelas conforme a decisão da 016; recriar `has_role`/`has_any_role`; só então a troca do tipo. Confira também se alguma outra coluna ou função usa `app_role` antes de tocar no tipo. Se qualquer linha usar `manager`/`operator`/`viewer` depois da 021, **pare** — significa policy ou código ainda dependente.
- **Como verificar**: `SELECT unnest(enum_range(NULL::app_role))` sem os rótulos aposentados; `SELECT role, count(*) FROM user_empresas GROUP BY role` e o mesmo para `user_roles`, com a soma total igual à de antes nas duas; e `SELECT proname FROM pg_proc WHERE proname IN ('has_role','has_any_role')` devolvendo as duas, sem erro de tipo. Cole as saídas.
- **Precisa de aprovação humana**: sim (DDL destrutiva em produção).

---

### 023 · Alinhar o front-end e os helpers ao vocabulário único

- **Onda**: 3 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 022
- **Arquivos e objetos a tocar**: `src/**` onde o papel é comparado por string (procure `'manager'`, `'operator'`, `'viewer'`), e os testes desses arquivos.
- **Não tocar / armadilhas**: não renomeie variáveis nem componentes; troque só o literal do papel. Se encontrar papel escrito como `any`/`string`, não "conserte" o tipo nesta etapa.
- **Caminho recomendado**: `rg "'(manager|operator|viewer)'" src --glob '!**/*.test.*'` é o mapa. Cada ocorrência vira o rótulo decidido na 016. Atualize os testes que fixam o literal, sem mudar a expectativa de comportamento.
- **Como verificar**: `bun run type-check` e `bun run test:run` verdes nos arquivos tocados, e `rg "'(manager|operator|viewer)'" src` sem resultado. Cole a saída.
- **Precisa de aprovação humana**: não.

---

### 024 · Gate: papel fora do vocabulário não passa no CI

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-04 · **Depende de**: 023
- **Arquivos e objetos a tocar**: script novo em `scripts/ci/` (o diretório já tem `check-claude-md-integrity.mjs` como modelo) e o job correspondente em `.github/workflows/ci.yml`.
- **Não tocar / armadilhas**: workflow exige `actionlint` + `act -j <job> -n` antes do push. O gate não pode depender de banco: ele lê o código e as migrations. **Não varra o histórico de migrations**: `20260712223143_stub-app-role-values.sql:4` acrescenta `manager` ao enum por shim e continuará no repositório depois da aposentadoria — um gate que olha todo `supabase/migrations/**` nasce vermelho e para de ser lido.
- **Caminho recomendado**: o script varre `src/**` inteiro e, em `supabase/migrations/**`, **apenas o que a PR acrescenta** (comparar com a base do merge, ex.: `git diff --name-only origin/main...HEAD`), procurando rótulo aposentado e `has_role`/`has_any_role` com valor fora do enum; sai 1 com a lista. Mesmo formato de saída dos outros checks de `scripts/ci/`. O estado atual do banco já é coberto pelas etapas 021 e 022 — aqui o alvo é impedir a reincidência.
- **Como verificar**: rodar o script na `main` atual = 0 ocorrências (o histórico fica fora do escopo); acrescentar um `'manager'` numa migration nova numa cópia local e ver o script sair 1 citando `arquivo:linha`. Cole as duas saídas.
- **Precisa de aprovação humana**: sim (workflow).

---

### 025 · `audit_logs`: fechar o `INSERT` aberto a `authenticated`

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-05 · **Depende de**: —
- **Arquivos e objetos a tocar**: `supabase/migrations/<YYYYMMDDHHmmss>_fechar_insert_audit_logs.sql` (novo): `DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;` e, na mesma migration, `DROP POLICY IF EXISTS audit_logs_insert_self_attributed ON public.audit_logs;` — os dois `IF EXISTS` porque o nome **medido em produção** é o primeiro e a cadeia versionada recria o segundo (`20260825110000_reconciliar_schema_v3_completo.sql:5315`, repetido em `20260825230000_initplan_rls_e67.sql:105`).
- **Não tocar / armadilhas**: quem grava na trilha é **trigger de banco** — as migrations fazem `INSERT INTO audit_logs` dentro de funções de trigger, que rodam com privilégio de dono, não como `authenticated`; e o service role não passa por RLS. As policies de **leitura** ficam intactas: `src/hooks/` usa `audit_logs` em `useAnomaliaAuditHistory`, `useAnomaliasReabertasIndex`, `useComplianceKpis`, `usePlanoContaHistory` e `useRealtimeAuditToasts`. Leia `20260519134955_drop-user-action-audit-policies.sql` antes: parte da limpeza das policies de ação de usuário já foi feita e não deve ser repetida.
- **Caminho recomendado**: (1) inventariar as policies de `audit_logs` **em produção**, por `cmd` e `roles` — `SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'audit_logs'` —, porque é o nome que está vivo que a migration precisa alcançar, e o histórico do repositório não é prova do que está no banco: aqui há drift visível, já que o `DROP POLICY "System can insert audit logs"` versionado (`20260728172037_567a8100-...:22`) não chegou a produção; (2) dropar só a de `INSERT` concedida a `{authenticated}` (com `IF EXISTS`, para não falhar se uma das duas já tiver saído); (3) se algum caminho de aplicação precisar gravar na trilha, esse caminho é Edge Function com service role — não uma policy aberta.
- **Como verificar**: `SET ROLE authenticated; INSERT INTO public.audit_logs (...) VALUES (...)` responde `ERROR: new row violates row-level security policy.` E a gravação legítima continua: fazer uma alteração numa tabela auditada e ver `SELECT count(*) FROM audit_logs` subir, com o `user_id` correto na linha nova. Sem as duas provas, a etapa não fecha.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 026 · `auditoria_financeira`: o `INSERT` passa a validar `empresa_id`

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-06 · **Depende de**: —
- **Arquivos e objetos a tocar**: `supabase/migrations/<YYYYMMDDHHmmss>_auditoria_insert_valida_empresa.sql` (novo): `ALTER POLICY auditoria_user_insert ON public.auditoria_financeira WITH CHECK (...)`.
- **Não tocar / armadilhas**: **este achado é de integridade, não de imutabilidade.** O defeito é a regra de escrita não validar `empresa_id`, enquanto a de leitura (`auditoria_financeira_empresa_select`) filtra justamente por ele. Não transforme a tabela em append-only nesta etapa. As policies de leitura ficam como estão.
- **Caminho recomendado**: `WITH CHECK (uid() = user_id AND empresa_acessivel(empresa_id))` — o mesmo par que as tabelas já corrigidas usam. Se `empresa_acessivel` devolver `true` para nulo, inclua `empresa_id IS NOT NULL AND` na frente. Antes de alterar, confirme que `auditoria_user_insert` é a **única** policy de `INSERT` viva: `SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'auditoria_financeira' AND cmd = 'INSERT'`. Policies permissivas somam por `OR`, então uma segunda policy de `INSERT` esquecida anula o endurecimento — no histórico isso já aconteceu (`20260518165826_e969533a-...:11` criou `"auth insert auditoria_financeira"` com `WITH CHECK (true)`, removida em `20260518172812_52b52fb1-...:43`) e o sinal de que a limpeza chegou a produção é justamente a evidência do achado, que só encontrou a policy de autoria.
- **Como verificar**: com usuário da empresa A, gravar registro carimbado com o `empresa_id` da empresa B deve ser **recusado**; com o `empresa_id` da própria empresa A, aceito; e o registro aceito aparece no `SELECT` de um colega da empresa A. Colar as três saídas — isso também produz o teste de isolamento dessa tabela.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 027 · `frontend_error_logs`: o `INSERT` de `anon` precisa de limite

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-07 · **Depende de**: —
- **Arquivos e objetos a tocar**: ou `supabase/functions/frontend-error-report/` (novo, com `validatePayload` em Zod) + migration que revoga o `INSERT` de `anon`; ou só a migration, com `WITH CHECK` de formato e tamanho na policy `frontend_error_anon_insert` — nome **medido em produção**. No histórico o mesmo furo aparece com outro nome, `frontend_error_user_insert` (`20260825110000_reconciliar_schema_v3_completo.sql:5944`, recriada em `20260825230000_initplan_rls_e67.sql:401`, já só para `authenticated`), então meça antes de escrever a migration: `SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'frontend_error_logs'`.
- **Não tocar / armadilhas**: a policy tem `roles = {anon}` porque o erro de quem **não está logado** precisa ser capturado; quem grava é o navegador, via `src/lib/telemetry.ts` (cliente anon) — `/supabase/functions` e `src/lib/telemetry.ts` são os dois lados que têm de continuar de pé. Revogar o insert sem oferecer o caminho novo para a telemetria é regressão de observabilidade, não conserto. O cron `monitorar-erros-frontend` (a cada 30 min) lê a tabela e não muda.
- **Caminho recomendado**: a opção completa é mover a escrita para uma Edge Function com `validatePayload` (Zod: limite de tamanho por campo, formato de `metadata`, versão) e revogar o `INSERT` direto de `anon`; isso troca "aberto" por "validado". A opção mínima é `WITH CHECK` com `octet_length(mensagem) <= 2000` e limites por campo — reduz o dano por requisição, **não** impede enchimento em volume; escolher a mínima deixa essa limitação registrada em `05-PROGRESSO.md`.
- **Como verificar**: (a escolhida) `INSERT` direto como `anon` é recusado por RLS, e um erro real provocado no navegador deslogado chega na tabela pela função nova — `SELECT count(*)` antes/depois. (b) `SET ROLE anon; INSERT` com `mensagem` de 1 MB é recusado por `WITH CHECK`, e um erro normal continua gravando. Colar as saídas dos dois lados.
- **Precisa de aprovação humana**: sim (DDL e/ou função nova em produção).

---

### 028 · Regerar o `bun.lock` contra o registry público do npm

- **Onda**: 8 · **Severidade**: Alta · **Achados resolvidos**: ACH-INF-01 · **Depende de**: —
- **Arquivos e objetos a tocar**: `bun.lock` (regerado).
- **Não tocar / armadilhas**: **nenhum bump de versão nesta etapa.** O objetivo é trocar o endereço de origem dos pacotes, não as versões resolvidas: se o registry público resolver versão diferente para algum pacote, pare e trate à parte. `vendor/xlsx-0.20.3.tgz` fica como está (a vendorização é decisão registrada em ACH-INF-02 e não se troca aqui).
- **Caminho recomendado**: o achado mediu **209** URLs de `europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache` e `europe-west1-npm.pkg.dev` em 1.072 entradas (19,5%), e provou que a origem é o lock e não a rede: `curl` ao mesmo pacote em `registry.npmjs.org` devolve HTTP 200, enquanto ao host do Lovable devolve **403 no CONNECT**. Hoje `grep -c 'pkg\.dev' bun.lock` devolve **205**. Regenere em cópia isolada com `bun install --registry https://registry.npmjs.org` e revise o diff linha a linha.
- **Como verificar**: `grep -c 'pkg\.dev' bun.lock` = **0**; `git diff --stat` mostrando **só** `bun.lock`; `bun install --frozen-lockfile` em diretório limpo instala do npm público; e `Quality Gate & Tests` verde. Colar as saídas.
- **Precisa de aprovação humana**: sim (lockfile e build).

---

### 029 · Impedir que o registry privado volte ao lock

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-INF-01 · **Depende de**: 028
- **Arquivos e objetos a tocar**: `bunfig.toml` (novo, na raiz) — hoje **não existe** `bunfig.toml` nem `.npmrc` no repositório.
- **Não tocar / armadilhas**: escolher o arquivo que o `bun` lê (`bunfig.toml`), não `.npmrc`: um `.npmrc` que só o npm lê não trava nada do `bun`, que é o gerenciador do projeto (ACH-INF-02). Não repita a lista de pacotes aqui.
- **Caminho recomendado**: `[install] registry = "https://registry.npmjs.org"` no `bunfig.toml`, e uma linha no `README.md` dizendo que o registry é fixado ali (é o que evita alguém gerar o lock de novo dentro de um ambiente com cache próprio).
- **Como verificar**: com o `bunfig.toml` no lugar, `bun install` numa cópia limpa (sem cache herdado) resolve tudo em `registry.npmjs.org` — conferir no log da instalação — e o `bun.lock` não ganha URL de `pkg.dev`. Colar o trecho do log e `grep -c 'pkg\.dev' bun.lock` = 0.
- **Precisa de aprovação humana**: não.

---

### 030 · Gate: nenhum endereço privado no lockfile

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-INF-01 · **Depende de**: 029
- **Arquivos e objetos a tocar**: script novo em `scripts/ci/` (mesmo formato de `scripts/ci/check-claude-md-integrity.mjs`) e um passo em `.github/workflows/ci.yml`, na mesma seção do Gate #35 (`ci.yml:342-359`), terminando em `::error::` + `exit 1`.
- **Não tocar / armadilhas**: o repo proíbe PR de workflow sem `actionlint` e `act -j <job> -n` (rodar via `wsl -d Ubuntu-24.04`). O gate olha só o lockfile — não varra o repositório inteiro, ou o `README`/docs que citam o host viram falso positivo.
- **Caminho recomendado**: o script conta ocorrências de `pkg.dev` (e dos hosts do Lovable) em `bun.lock` e sai 1 com a contagem e a primeira linha ofendida.
- **Como verificar**: rodar o script sobre o lock **antigo** (`git show <commit-anterior-a-028>:bun.lock > /tmp/antigo.lock`) tem de sair **1** citando as 205 URLs; sobre o lock novo, **0**. Colar as duas saídas — é a prova de que o gate não nasceu verde por acidente.
- **Precisa de aprovação humana**: sim (workflow).

---

### 031 · Declarar um único gerenciador de pacotes

- **Onda**: 8 · **Severidade**: Baixa · **Achados resolvidos**: ACH-INF-02 · **Depende de**: —
- **Arquivos e objetos a tocar**: `package.json`, `README.md`, `CONTRIBUTING.md`, `docs/agentes/mapa-repo.md`.
- **Não tocar / armadilhas**: **não** trocar a vendorização do `xlsx` (`vendor/xlsx-0.20.3.tgz`, 2,4 MB, versionado) e **não** criar `package-lock.json`. A conclusão do achado sobre o `npm` vale para o contêiner onde foi medido (`npm install` aborta com `TypeError: Cannot read properties of null (reading 'edgesOut')`, resolvendo em `xlsx@file:vendor/xlsx-0.20.3.tgz`), não para qualquer máquina — a etapa padroniza o declarado, não afirma que o npm quebrou em todo lugar.
- **Caminho recomendado**: `package.json` **não** tem campo `packageManager`. Acrescente `"packageManager": "bun@<versão que o CI usa>"` (pegar de `ci.yml`/`bun --version` no runner) e alinhe as três fontes divergentes — `docs/agentes/mapa-repo.md:40` (bun é o gerenciador), `README.md:24` (`npm install # ou: bun install`) e `CONTRIBUTING.md:70-78` (npm 10+ e `npm run dev`).
- **Como verificar**: `rg -n "npm install|npm run" README.md CONTRIBUTING.md docs/agentes/mapa-repo.md` sem instrução conflitante; `node -e "console.log(require('./package.json').packageManager)"` imprime a versão; `bun install --frozen-lockfile` continua funcionando. Colar as saídas.
- **Precisa de aprovação humana**: não.

---

### 032 · `gerar_lancamento_contabil_automatico()`: parar o drift entre produção e a cadeia versionada

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-08 · **Depende de**: —
- **Arquivos e objetos a tocar**: nenhum arquivo novo — DDL de convergência em produção (`DROP FUNCTION`, se o gatilho já não existir) **ou** `ALTER FUNCTION ... SET search_path` acompanhado de migration que registre a decisão.
- **Não tocar / armadilhas**: não drope nada antes de ler `pg_trigger`. Se `trigger_gerar_contabilidade` ainda existir apontando para a função, dropar só a função falha (dependência) ou deixa gatilho órfão; e dropar os dois significa que a contabilização automática **para** em produção — que é exatamente o que a cadeia versionada já decidiu (`20261112023354_contabilizacao_automatica_movimentacoes.sql:12` dropa o gatilho e `:149` dropa a função), mas a decisão é do dono: confirme antes.
- **Caminho recomendado**: medir em produção, nesta ordem — `SELECT proname, proconfig FROM pg_proc WHERE proname = 'gerar_lancamento_contabil_automatico'` e `SELECT tgname, tgenabled FROM pg_trigger WHERE tgfoid = 'public.gerar_lancamento_contabil_automatico()'::regprocedure`. A partir da resposta: (a) sem gatilho → convergir com produção aplicando o `DROP FUNCTION` que a migration já contém; (b) com gatilho → decidir entre manter a função viva com `search_path` fixo (`ALTER FUNCTION ... SET search_path = public, pg_temp`, enquanto ela existir) ou dropar função + gatilho. A evidência do achado: entre as **170** funções `SECURITY DEFINER` de `public`, é a única com `proconfig IS NULL` — as outras 169 fixam `search_path`.
- **Como verificar**: `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prosecdef AND p.proconfig IS NULL` = **0** (hoje é 1), e a contabilização automática com o comportamento escolhido, provado por um lançamento de teste em `movimentacoes` numa transação revertida. Colar as saídas.
- **Precisa de aprovação humana**: sim (DDL e decisão de comportamento em produção).

---

### 033 · Medir em produção o privilégio da view materializada

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-09 · **Depende de**: —
- **Arquivos e objetos a tocar**: nenhum — esta etapa é medição. A ferramenta já existe: `scripts/integrity/15_views_pii_rpcs.sql:80-97`, checagem `views.matview_not_exposed_to_clients`.
- **Não tocar / armadilhas**: **`ausente` não é mitigação.** A checagem devolve `pass` quando `to_regclass('public.mv_performance_alerts_weekly') IS NULL` (`15_views_pii_rpcs.sql:83`) — isso quer dizer que a view **não existe** em produção, e não que ela está protegida; se for o caso, o achado **não** fecha e o drift vira achado novo em `05-PROGRESSO.md`. Não rode `REVOKE` preventivo: sem ver `true`, não há o que revogar. `information_schema.role_table_grants` não lista view materializada e `pg_class.relacl` não resolve privilégio herdado de dono/PUBLIC — a medição certa é `has_table_privilege`, que é o que a checagem já usa.
- **Caminho recomendado**: `psql "$PROD_DB_URL" -f scripts/integrity/15_views_pii_rpcs.sql` e ler a linha `views.matview_not_exposed_to_clients`. Contexto: `mv_performance_alerts_weekly` é a única das 18 views de `public` sem `security_invoker` (view materializada não aceita essa opção — por isso consulta a base com privilégio do dono, ignorando RLS), o acesso direto já foi revogado na criação (`20260712194623_...:48-49`) e no hardening (`20260827101000_hardening_views_pii_rpcs.sql:51-58`: `REVOKE ALL ... FROM PUBLIC, anon, authenticated` + `GRANT SELECT ... TO service_role`), e nenhuma migration posterior devolve o `SELECT`. O achado é **hipótese** justamente porque o efetivo não foi medido.
- **Como verificar**: `actual = false` → fechar como "mitigado por privilégio, sem DDL", colando a saída do comando em `05-PROGRESSO.md`. `actual = true` → uma das roles clientes lê a view: abrir a etapa de `REVOKE` (aprovação humana) e colar a saída. `actual = ausente` → registrar o drift e **não** fechar o achado.
- **Precisa de aprovação humana**: não (medição somente leitura).

---

### 034 · Criar os cinco índices de chave estrangeira que faltam

- **Onda**: 6 · **Severidade**: Baixa · **Achados resolvidos**: ACH-DB-10 · **Depende de**: —
- **Arquivos e objetos a tocar**: `supabase/migrations/<YYYYMMDDHHmmss>_indices_fk_faltantes.sql` (novo), com cinco `CREATE INDEX`.
- **Não tocar / armadilhas**: **nada de `CONCURRENTLY`** — o gateway do Supabase recusa. Não aproveite para criar índice fora da lista do achado: os 404 índices com `idx_scan = 0` (PR #243) são outro assunto, com decisão própria, e o PR #243 **não** mergeia por causa desta etapa.
- **Caminho recomendado**: as cinco colunas, exatamente como medidas — `execucoes_cobranca.cliente_id`, `asaas_audit_trail.user_id`, `asaas_transfers.user_id`, `sso_login_attempts.empresa_id`, `aprovacao_assinaturas.user_id`. Nenhuma delas aparece como primeira coluna de índice algum (consulta cruzando `pg_constraint` com `contype = 'f'` e `pg_index`); o Postgres não cria índice de FK sozinho. Nome no padrão do repositório (`idx_<tabela>_<coluna>`) e todas em uma migration, porque as tabelas têm ≤10 linhas e o lock é desprezível.
- **Como verificar**: repetir a consulta do achado (`pg_constraint` `contype = 'f'` cruzado com `pg_index`) e obter **0** linhas sem índice; e `EXPLAIN (ANALYZE, BUFFERS)` de um `DELETE`/junção no lado pai mostrando `Index Scan`/`Bitmap` em vez de `Seq Scan`. Colar as duas saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 035 · Gate: FK nova nasce com índice

- **Onda**: 8 · **Severidade**: Baixa · **Achados resolvidos**: ACH-DB-10 · **Depende de**: 034
- **Arquivos e objetos a tocar**: `scripts/integrity/17_fk_sem_indice.sql` (novo — `16_` fica para o inventário de isolamento da etapa 001), a lista em `scripts/integrity/README.md` e um passo em `.github/workflows/ci.yml`.
- **Não tocar / armadilhas**: `actionlint` e `act -j <job> -n` antes do push (regra do repo para workflow). Não renumere as checagens existentes de `scripts/integrity/` (01 a 15) nem as do `run.sh` — some a nova. O gate precisa do `if: steps.db_url_preflight.outputs.available == 'true'`, como os outros que usam `PROD_DB_URL`, senão PR de fork com secret ausente reprova por motivo errado.
- **Caminho recomendado**: copie o formato do Gate #35 (`ci.yml:342-359`): `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/integrity/17_fk_sem_indice.sql | tee fk.tsv`, e `grep -qP '\tfail\t' fk.tsv` → `::error::` nomeando a FK, `exit 1`. A consulta é a mesma do achado: FK sem índice como primeira coluna.
- **Como verificar**: na `main` atual o script devolve `pass`; o `fail` é provado criando uma tabela com FK sem índice dentro de uma transação em produção e rodando o script antes do `ROLLBACK` (`BEGIN; CREATE TABLE ... REFERENCES ...; <script>; ROLLBACK;`), ou no banco de staging. Colar as duas saídas.
- **Precisa de aprovação humana**: sim (workflow).
