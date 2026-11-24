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
> **Ondas**: 1 = segurança e perda de dado (001–008, 025–027) · 2 = fluxos quebrados (009–013) · 3 = integridade e regra de negócio (015–024) · 6 = performance (034–035) · 8 = higiene, CI e cadeia de suprimentos (014, 028–033).

---

### 001 · Inventário executável das tabelas com `empresa_id` fora do predicado único

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: —
- **Arquivos e objetos a tocar**: `scripts/integrity/16_isolamento_empresa.sql` (novo) e a tabela de checagens em `scripts/integrity/README.md`.
- **Não tocar / armadilhas**: nenhuma policy e nenhuma migration nesta etapa — é só medição. Não altere `scripts/integrity/15_views_pii_rpcs.sql`, que é o modelo de formato. Não conte como "fora do predicado" a tabela que tem `empresa_acessivel(` dentro de `EXISTS (...)` — o casamento é textual em `pg_policies.qual` e `with_check`.
- **Caminho recomendado**: copie o formato de saída de `scripts/integrity/15_views_pii_rpcs.sql:80-97` (`check`, `actual`, `expected`, veredito `pass`/`fail`). A consulta cruza `information_schema.columns` (`column_name = 'empresa_id'`, `table_schema = 'public'`) com `pg_policies`, e devolve as tabelas cujas policies **não** mencionam `empresa_acessivel(`. Ordenar por nome da tabela para o resultado ser comparável entre execuções.
- **Como verificar**: `psql "$PROD_DB_URL" -f scripts/integrity/16_isolamento_empresa.sql` deve devolver **58** tabelas — o número medido em 2026-11-22. Cole a lista real em `05-PROGRESSO.md`. Se vier diferente, a diferença é o primeiro dado novo: anote quais tabelas entraram ou saíram e siga.
- **Precisa de aprovação humana**: não (somente leitura).

---

### 002 · Piloto do predicado único em `movimentacoes`

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-01 · **Depende de**: 001
- **Arquivos e objetos a tocar**: `supabase/migrations/<YYYYMMDDHHmmss>_isolamento_piloto_movimentacoes.sql` (novo).
- **Não tocar / armadilhas**: `empresa_membro_ativo()`, `user_empresas`, e qualquer tabela diferente de `movimentacoes`. Não remova a exigência de papel (`has_any_role`) que a policy atual carrega — o predicado de isolamento **soma** a checagem de papel, não substitui. Não use `CONCURRENTLY`: nada aqui é índice, e o gateway transacional recusa.
- **Caminho recomendado**: antes de escrever a migration, rode `SELECT polname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movimentacoes'` e guarde a saída no `05-PROGRESSO.md`; é o contrato que a nova policy precisa preservar. Confirme também o corpo de `empresa_acessivel(uuid)` (`SELECT prosrc FROM pg_proc WHERE proname = 'empresa_acessivel'`): se ela devolver `true` para `NULL`, a policy precisa de `empresa_id IS NOT NULL AND empresa_acessivel(empresa_id)`. Uma policy por comando (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), mantendo os nomes existentes para a auditoria continuar rastreável.
- **Como verificar**: a consulta da etapa 001 deixa de listar `movimentacoes`, e `psql "$PROD_DB_URL" -f supabase/tests/sql/rls_multi_empresa.sql` continua passando (é o teste que o CI roda contra produção). Cole as duas saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 003 · `clientes`: fechar a criação de cliente sem empresa

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-02 · **Depende de**: 002
- **Arquivos e objetos a tocar**: migration nova com a policy de `INSERT` de `clientes`.
- **Não tocar / armadilhas**: as policies `SELECT`/`UPDATE`/`DELETE` de `clientes` são as etapas 004 e 005 — aqui só entra o caminho de escrita que hoje aceita `empresa_id IS NULL`. Não acrescente `CHECK` na coluna: linha existente com nulo faria a migration falhar em produção; hoje são 0, mas o `CHECK` é decisão da etapa 005, junto com a limpeza.
- **Caminho recomendado**: o buraco é `clientes_tenant_insert`, cujo `with_check` é `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))`. Reduza a `empresa_acessivel(empresa_id)` (com `empresa_id IS NOT NULL AND` na frente se a função aceitar nulo). `clientes_owner_insert` e `Operacional+ can manage clientes` continuam válidas — elas não abrem o caminho para empresa nula.
- **Como verificar**: com um usuário autenticado de teste, `INSERT INTO clientes (nome, empresa_id) VALUES ('teste', NULL)` deve ser **recusado** por RLS; o mesmo insert com o `empresa_id` da empresa do usuário deve passar. Cole os dois resultados em `05-PROGRESSO.md` e apague a linha de teste na mesma transação (`BEGIN; ... ROLLBACK;`).
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
- **Como verificar**: abrir uma PR de teste que cria uma tabela com `empresa_id` e sem policy: o job tem de falhar citando o nome da tabela; apagar a tabela na mesma PR de teste e o job volta a passar. Cole os dois runs.
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
- **Arquivos e objetos a tocar**: migration nova com `ALTER TYPE app_role ...` e, antes, o `UPDATE` de `user_empresas.role`.
- **Não tocar / armadilhas**: valor de enum não se remove com `ALTER TYPE ... DROP VALUE` (não existe). O caminho é criar o tipo novo, migrar a coluna e renomear — operação que trava a tabela. Faça em janela combinada, com `BEGIN`/`COMMIT` e contagem de linhas antes/depois. `contador` **fica**: não é sinônimo de nenhum rótulo em inglês.
- **Caminho recomendado**: `SELECT role, count(*) FROM user_empresas GROUP BY role` antes; `UPDATE` dos rótulos conforme a decisão da 016; só então a troca do tipo. Se qualquer linha usar `manager`/`operator`/`viewer` depois da 021, **pare** — significa policy ou código ainda dependente.
- **Como verificar**: `SELECT unnest(enum_range(NULL::app_role))` sem os rótulos aposentados, e `SELECT role, count(*) FROM user_empresas GROUP BY role` com a mesma soma total de antes. Cole as duas saídas.
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
- **Não tocar / armadilhas**: workflow exige `actionlint` + `act -j <job> -n` antes do push. O gate não pode depender de banco: ele lê o código e as migrations.
- **Caminho recomendado**: o script varre `src/**` e `supabase/migrations/**` procurando rótulo aposentado e `has_role`/`has_any_role` com valor fora do enum; sai 1 com a lista. Mesmo formato de saída dos outros checks de `scripts/ci/`.
- **Como verificar**: rodar o script na `main` atual = 0 ocorrências; inserir um `'manager'` numa cópia local e ver o script sair 1 citando `arquivo:linha`. Cole as duas saídas.
- **Precisa de aprovação humana**: sim (workflow).
### 025 · `oportunidades_elisao`: parar de aceitar escrita anônima

- **Onda**: 1 · **Severidade**: Alta · **Achados resolvidos**: ACH-DB-05 · **Depende de**: —
- **Arquivos e objetos a tocar**: migration nova com as policies de `oportunidades_elisao`.
- **Não tocar / armadilhas**: a tabela tem `fluxo_id` e não tem `empresa_id` — a policy antiga a tratava como "mesa de oportunidade" e aceitava `fornecedores_owner` como identificação: **esse é o buraco**, porque a condição não exige que a linha de `fornecedores` pertença a quem escreve. Não acrescente `empresa_id` à tabela nesta etapa (é a 027): primeiro feche a escrita, depois modele.
- **Caminho recomendado**: a evidência é `INSERT` aceito sem usuário autenticado. Reescreva as quatro policies por `empresa_acessivel(...)` via a empresa do `fluxo_id` (`fluxo_id IN (SELECT id FROM fluxos WHERE empresa_acessivel(empresa_id))`) e mantenha `empresa_membro_ativo` na de `INSERT`. Se a 027 (que dá `empresa_id` à tabela) estiver pronta antes, use a coluna direta — a ordem preferida é 027 → 025 justamente por isso.
- **Como verificar**: no psql, `SET ROLE anon; INSERT INTO oportunidades_elisao (...) VALUES (...);` deve responder `ERROR: new row violates row-level security policy`; e com usuário autenticado da empresa dona do fluxo, o mesmo insert passa. Cole as duas saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 026 · `auditoria_financeira`: tornar o log imutável

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-06 · **Depende de**: —
- **Arquivos e objetos a tocar**: migration nova: `DROP POLICY` de `UPDATE`/`DELETE` (e de `INSERT` direto, se existir) + `GRANT` só de `SELECT` para `authenticated`.
- **Não tocar / armadilhas**: quem escreve no log é código de servidor com service role — ele **não** passa por RLS, então revogar o `INSERT` do `authenticated` não quebra a gravação. Confirme isso antes: `rg "auditoria_financeira" supabase/functions src --glob '!**/*.test.*'` e veja se algum caminho grava com a sessão do usuário. Se gravar, o caminho é `SECURITY DEFINER`, não permissão aberta.
- **Caminho recomendado**: remova as policies de escrita de usuário e confie no `BYPASSRLS` do service role; o `REVOKE` no `GRANT` só é necessário se houver GRANT de tabela para `authenticated` — confira com `SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'auditoria_financeira'`.
- **Como verificar**: autenticado, `UPDATE auditoria_financeira SET ...` e `DELETE FROM auditoria_financeira` respondem `ERROR: ... violates row-level security policy` (ou `permission denied`); e a listagem continua funcionando. Cole as duas saídas e o grep de quem grava.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 027 · `oportunidades_elisao`: dar `empresa_id` à tabela e migrar as linhas

- **Onda**: 1 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-07 · **Depende de**: —
- **Arquivos e objetos a tocar**: migration nova: `ADD COLUMN empresa_id`, backfill, `SET NOT NULL`, índices e policies.
- **Não tocar / armadilhas**: o `SET NOT NULL` só depois do backfill verificado — é o mesmo cuidado das etapas 005 e 006. `oportunidades_elisao` alimenta tela de negócio: se o backfill não achar a empresa de alguma linha, **pare** e traga a lista; não escolha a empresa "mais provável".
- **Caminho recomendado**: a linha tem `fluxo_id`; a empresa vem de `fluxos.empresa_id`. Faça `UPDATE ... FROM fluxos f WHERE f.id = o.fluxo_id`; conte as linhas antes e depois; só então `SET NOT NULL`; e acrescente índice em `(empresa_id)` porque as policies novas vão filtrar por ele. Se preferir entregar junto com a 025, esta migration vem **primeiro**.
- **Como verificar**: `SELECT count(*) FROM oportunidades_elisao WHERE empresa_id IS NULL` = 0; contagem total inalterada; `\d oportunidades_elisao` com `NOT NULL` e o índice novo. Cole as saídas.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 028 · Aposentar o `Vault` em favor de `secrets` do Supabase

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-INF-01 · **Depende de**: —
- **Arquivos e objetos a tocar**: `supabase/functions/**` (o arquivo onde o cliente Vault é instanciado) e a documentação de variáveis.
- **Não tocar / armadilhas**: mover segredo não é renomear arquivo — é ler o valor do Vault, gravar no `secrets` do Supabase e só então remover a leitura antiga. Faça na ordem inversa e a função quebra em produção. **Nunca** cole valor de segredo em código, comentário, PR ou `05-PROGRESSO.md`.
- **Caminho recomendado**: `rg "Vault|vault" supabase/functions` para localizar o ponto único; confirme qual variável é lida (`SLACK_WEBHOOK_URL` ou equivalente) e se ela já existe em `secrets`. Se já existir com o mesmo valor, a etapa é só remover o caminho antigo. A queda do Vault derruba **todas** as integrações que passam por ele — a verificação é por integração, não por função.
- **Como verificar**: invocar cada função que usa o segredo e ver status 200 no log do Supabase, com o mesmo efeito observável no destino (mensagem recebida, dado sincronizado). Cole o `curl` e a linha do log.
- **Precisa de aprovação humana**: sim (segredos e produção).

---

### 029 · Confirmar que não sobrou leitura de Vault no runtime

- **Onda**: 8 · **Severidade**: Baixa · **Achados resolvidos**: ACH-INF-01 · **Depende de**: 028
- **Arquivos e objetos a tocar**: nada novo — verificação e registro.
- **Não tocar / armadilhas**: "não achei no grep" não é prova de que o caminho morreu: o Vault pode ser lido por SQL dentro de função `SECURITY DEFINER`. Cheque também `SELECT count(*) FROM vault.secrets`.
- **Caminho recomendado**: `rg -i "vault" supabase/ .github/ src/` sem resultado relevante + `vault.secrets` vazio (ou com segredo que nenhuma função lê). Registre em `05-PROGRESSO.md` com o commit da 028.
- **Como verificar**: as duas saídas acima coladas no progresso, e a data.
- **Precisa de aprovação humana**: não (leitura).

---

### 030 · Remover o `config.toml` duplicado e manter um só caminho de configuração

- **Onda**: 8 · **Severidade**: Baixa · **Achados resolvidos**: ACH-INF-01 · **Depende de**: 029
- **Arquivos e objetos a tocar**: o `config.toml` redundante fora de `supabase/`, ou a seção duplicada dentro dele.
- **Não tocar / armadilhas**: confirme por **hash** qual dos dois arquivos está em uso antes de apagar — apagar o que a CLI lê derruba o `supabase start` de todo mundo. Compare `git hash-object` dos dois e veja qual é referenciado por script/CI.
- **Caminho recomendado**: `rg "config.toml" .github/ scripts/ package.json supabase/` para achar quem lê; se ninguém lê o duplicado, remova-o. Se ambos são lidos, a duplicação é intencional e a etapa termina com "não removido" justificado.
- **Como verificar**: `supabase/config.toml` continua sendo o único lido (`rg` sem referência ao removido) e o job de CI que sobe Supabase (se houver) continua verde.
- **Precisa de aprovação humana**: sim (config de CLI).

---

### 031 · Alinhar os dois workflows de documentação

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-INF-02 · **Depende de**: —
- **Arquivos e objetos a tocar**: `.github/workflows/` (os dois workflows de docs) e `CONTRIBUTING.md:70-78`, que é onde a regra de formatação de doc está escrita.
- **Não tocar / armadilhas**: os dois workflows têm gatilhos e escopos de arquivo diferentes — o conserto pode ser no gatilho, não no comando. Não desligue nenhum dos dois para "parar o ruído": um deles provavelmente é o único que roda em PR de fork. `actionlint` obrigatório.
- **Caminho recomendado**: leia os dois `on:` e os dois passos de verificação; compare com a regra de `CONTRIBUTING.md:70-78`. Se a divergência é de escopo (`paths:`), alinhe os `paths:`; se é de comando, escolha o que está documentado como correto e ajuste o outro.
- **Como verificar**: abrir uma PR que toca só documentação e ver **um** conjunto de checagens de doc, sem duplicata; abrir uma PR que não toca doc e nenhuma checagem de doc rodar. Cole os dois runs.
- **Precisa de aprovação humana**: sim (workflow).

---

### 032 · Documentar (ou remover) o `.env.example` órfão

- **Onda**: 8 · **Severidade**: Baixa · **Achados resolvidos**: ACH-DB-08 · **Depende de**: —
- **Arquivos e objetos a tocar**: o `.env.example` órfão e o README/`CONTRIBUTING.md` que descreve variáveis.
- **Não tocar / armadilhas**: apagar antes de confirmar que nenhuma variável dele é necessária deixa quem clona o repo sem sabê-la. Compare o conteúdo dele com o `.env` real de referência (nomes, nunca valores) e com o que as funções leem.
- **Caminho recomendado**: liste as chaves do órfão e do usado; as que existirem só no órfão viram entrada no usado (nome, sem valor) ou entram no README; depois remova o órfão. Se ele estiver obsoleto por inteiro, removal + registro em `05-PROGRESSO.md`.
- **Como verificar**: `rg "\.env\.example" -g '!node_modules'` aponta para o arquivo remanescente, e a lista de chaves do `.env` de referência cobre todas as variáveis lidas por `supabase/functions` e por `src`. Cole a lista de chaves (nomes).
- **Precisa de aprovação humana**: não.

---

### 033 · Corrigir o check de exposição de matview para exigir acesso negado

- **Onda**: 8 · **Severidade**: Média · **Achados resolvidos**: ACH-DB-09 · **Depende de**: —
- **Arquivos e objetos a tocar**: `scripts/integrity/15_views_pii_rpcs.sql:80-97`.
- **Não tocar / armadilhas**: o defeito é sutil e real: hoje a verificação retorna `pass` quando `actual = 'ausente'` — ou seja, quando a matview **não existe**, o check aprova. A verificação certa é `has_table_privilege` devolvendo **`false`** para os papéis de cliente. Os `grantee` de `role_table_grants` são o dono/`service_role`, por isso a medição antiga (`role_table_grants`) não mede o que diz medir — é exatamente a diferença que o PR #533 alterou e a `main` mantém correta.
- **Caminho recomendado**: troque a expectativa para "acesso negado" e faça o check reprovar quando a matview existir e o cliente puder ler. Ajuste a mensagem de saída para distinguir os três casos: existe e negado (`pass`), existe e liberado (`fail`), não existe (`fail` — matview esperada não encontrada).
- **Como verificar**: rodar o script contra produção e ver `pass` para as matviews atuais; depois, num teste em transação, `GRANT SELECT` a um desses papéis e confirmar que o check vira `fail` (`BEGIN; GRANT ...; ROLLBACK;` com o script rodando dentro). Cole as duas saídas.
- **Precisa de aprovação humana**: não (script de verificação).

---

### 034 · Índices de baixo custo nas tabelas de dinheiro quentes

- **Onda**: 6 · **Severidade**: Baixa · **Achados resolvidos**: ACH-DB-10 · **Depende de**: —
- **Arquivos e objetos a tocar**: migration nova com os `CREATE INDEX` e o script de medição de uso.
- **Não tocar / armadilhas**: **nada de `CONCURRENTLY`** — o gateway do Supabase recusa. Índice em `(empresa_id, criado_em DESC)` já cobre o filtro de tenant e a ordenação: não crie os dois separados. Não drope índice "não usado" nesta etapa: o PR #243 (404 índices com `idx_scan = 0`) está aberto justamente para isso e é decisão de produção.
- **Caminho recomendado**: meça primeiro o que existe: `SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE relname IN ('notas_fiscais','movimentacoes','nfe_recebidas','asaas_transfers') ORDER BY idx_scan`. Se já houver índice equivalente, a etapa é "nada a fazer" com a medição no progresso. Use FKs órfãs como sinal: coluna de FK sem índice é o candidato mais seguro.
- **Como verificar**: `idx_scan` do índice novo > 0 depois de uso real, e `EXPLAIN (ANALYZE, BUFFERS)` da consulta que ele deve servir mostrando `Index Scan` (ou `Bitmap`) em vez de `Seq Scan`. Cole o `EXPLAIN`.
- **Precisa de aprovação humana**: sim (DDL em produção).

---

### 035 · Definir o critério de decisão sobre os 404 índices idle

- **Onda**: 6 · **Severidade**: Baixa · **Achados resolvidos**: ACH-DB-10 · **Depende de**: 034
- **Arquivos e objetos a tocar**: `docs/qa/06-INDICES.md` (novo) e, se o critério for aprovado, as migrations do PR #243.
- **Não tocar / armadilhas**: `idx_scan = 0` **não** prova que o índice é lixo — índice que serve só `UPDATE`/`DELETE`, ou que protege uma FK contra varredura completa no `UPDATE` pai, aparece com `idx_scan = 0`. Dropar por esse número é o erro clássico. Coleta de estatística zerada (base nova, `pg_stat_reset`) também zera tudo.
- **Caminho recomendado**: classifique os 404 em três grupos: (a) duplicata de outro índice (`pg_index` com mesmas colunas) → seguro dropar; (b) índice de FK sem uso → manter, o custo é do `UPDATE` no pai; (c) índice em coluna consultada por código (`rg "WHERE <coluna>"`) → manter. Escreva o critério e o grupo de cada índice. O PR #243 só mergeia depois deste documento.
- **Como verificar**: `docs/qa/06-INDICES.md` com os 404 classificados e a lista dos "seguro dropar" (grupo a) conferida por `pg_index`/`pg_indexes` mostrando a duplicata real. Cole a contagem por grupo.
- **Precisa de aprovação humana**: sim (o merge do PR #243 é decisão de produção).
