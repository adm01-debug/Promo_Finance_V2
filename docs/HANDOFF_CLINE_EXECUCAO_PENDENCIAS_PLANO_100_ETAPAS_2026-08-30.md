# Handoff operacional para o Cline — execução das pendências do plano de 100 etapas

- **Projeto:** Promo Finance V2
- **Data do handoff:** 30 de agosto de 2026
- **Baseline canônica observada:** `origin/main` em `5093a727b6cc996bdf3a008e6627a2fc145109ae`
- **Repositório:** `adm01-debug/Promo_Finance_V2`
- **Plano mestre:** `docs/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md`
- **Finalidade:** orientar o Cline a revalidar e executar, em lotes seguros, todas as tarefas ainda abertas ou parciais, produzindo evidência suficiente para uma revisão independente posterior pelo Codex.
- **Natureza deste documento:** instrução operacional. Este handoff não autoriza exclusões, mutações de banco, deploys, rotações de credenciais, cutover ou mudanças produtivas destrutivas.

---

## 1. Ordem principal para o Cline

Execute este programa até esgotar todas as ações seguras e todas as ações expressamente autorizadas. Não transforme o pedido “executar tudo” em um mega-PR, uma migration massiva ou um deploy direto. O resultado desejado é um sistema comprovadamente melhor, não apenas uma grande quantidade de código alterado.

Antes de qualquer mudança:

- leia integralmente `AGENTS.md`, `README.md`, `CLAUDE.md` e a documentação aplicável em `docs/`;
- atualize `origin/main` e crie um worktree próprio e isolado;
- inventarie os worktrees e branches existentes e não toque em nenhum trabalho de Claude, Hermes, Codex ou outro agente;
- revalide cada status deste handoff contra o commit atual, porque outro agente pode ter concluído parte da tarefa após esta data;
- execute primeiro simulações e testes negativos; só depois escreva o patch mínimo;
- mantenha toda comunicação, código documental, commits e PRs em Português do Brasil;
- trate “pronto” como: codificado + testado + revisado + implantado no ambiente autorizado + observado com tráfego controlado + evidência anexada.

Se uma tarefa depender de autorização, acesso, segredo, decisão de produto ou janela de produção, não improvise. Registre-a como `BLOQUEADA`, prepare o artefato reversível necessário e solicite a decisão exata.

---

## 2. Fontes de verdade e precedência

Use esta ordem quando documentos divergirem:

1. decisão explícita mais recente do proprietário;
2. `AGENTS.md` e ADRs aceitos;
3. runtime e catálogo ao vivo, coletados de forma somente leitura e com timestamp;
4. `origin/main` no commit de início do lote;
5. migrations homologadas e sua genealogia comprovada;
6. tipos gerados do ambiente canônico;
7. plano mestre de 100 etapas;
8. documentos históricos.

Documentos antigos contêm contagens e conclusões vencidas. Em especial:

- `docs/migracao/PLANO-CORRECOES-100-ETAPAS.md` e `docs/migracao/PLANO-CORRECAO-60-ETAPAS.md` são fontes históricas, não ordens para reaplicar DDL em bloco;
- `docs/EDGE_FUNCTIONS_CATALOG.md`, `docs/MIGRATIONS_ADR.md`, `docs/MIGRATION_CHECKLIST.md`, `docs/TESTING.md` e `CLAUDE.md` possuem números desatualizados e devem ser corrigidos por geração reproduzível, não usados como prova do estado atual;
- `docs/ADR-001-LALAMOVE-FORA-DE-ESCOPO.md` autoriza somente a classificação dos 14 objetos nominalmente listados; não autoriza exclusões por padrão, dependência presumida ou curinga;
- `docs/ADR-002-FUNCOES-ESSENCIAIS-PROMO-FINANCE.md` protege 11 funções legítimas. Não removê-las, ainda que sem tráfego ou temporariamente sem consumidor localizado.

Uma tabela vazia não é lixo. Um índice com zero scans recentes não é lixo. Uma função sem chamada textual no frontend pode ser trigger, cron, webhook ou integração externa. Toda classificação precisa de dependências, owner, retenção, caminho de execução e decisão.

---

## 3. Ambientes e conectores — não confundir

### 3.1 Banco canônico/destino do Promo Finance V2

- project ref: `bwwbeyolnnzppeuhgkcd`;
- URL pública: `https://bwwbeyolnnzppeuhgkcd.supabase.co`;
- conector esperado no ambiente de agentes: `Promo_Finance_V2` / `SUPABASE - PROMO FINANCE V2 - MCP`;
- endpoint MCP informado pelo proprietário: `https://supabase-mcp-bwwbey.adm01.workers.dev/<identificador-privado>/mcp`; obtenha o caminho completo apenas pela configuração segura do conector.

Estado no momento deste handoff: o conector aparece carregado, mas o probe `db_health` falhou porque o runtime do MCP não recebeu `DATABASE_URL`/`DATABASE_URL_FILE`. Isso é **acesso indisponível**, não banco fora do ar. Corrigir apenas por secret store/configuração do servidor MCP; nunca gravar a connection string no repositório.

### 3.2 Banco de origem Lovable/Cloud

- project ref: `lszcmoymovkpckehlagr`;
- URL pública: `https://lszcmoymovkpckehlagr.supabase.co`;
- endpoint MCP informado pelo proprietário: `https://supabase-promofinance-mcp.adm01.workers.dev/mcp`;
- finalidade neste programa: inventário e comparação **somente leitura**.

Não persista bearer, service role, senha, connection string ou token OAuth no repositório, relatório, terminal compartilhado, issue, PR ou chat. Se o acesso expirar, peça a reativação do conector sem reproduzir valores sensíveis.

### 3.3 Ambientes proibidos por engano

- `supabase_canonico_selfhosted` não é o banco canônico do Promo Finance V2;
- `pgxfvjmuubtbowutlide` pertence a Gestão de Clientes e, quando necessário, é somente leitura;
- não aponte frontend, migrations, Edge Functions, webhooks ou testes do Promo Finance para qualquer ambiente não homologado.

Antes de toda consulta de banco, prove o destino com `current_database()`, usuário, host/ref do projeto e timestamp, sem imprimir segredo.

---

## 4. Regras inegociáveis de segurança e colaboração

### 4.1 Isolamento Git

Use um worktree novo a partir de `origin/main`. Não execute `git checkout -b` no workspace compartilhado.

```sh
git fetch origin --prune
HERMES_BRANCH_ID="h$(date +%s | tail -c 7)"
BRANCH="fix/hermes-${HERMES_BRANCH_ID}-<lote-curto>"
WORKSPACE="/home/joaquim_ataides/hermes-workspaces/chat-${HERMES_BRANCH_ID}"
git worktree add "$WORKSPACE" -b "$BRANCH" origin/main
cd "$WORKSPACE"
test "$(git branch --show-current)" = "$BRANCH"
```

Regras adicionais:

- rode `git worktree list --porcelain` e `git status --short --branch` antes de começar;
- não altere, limpe, faça stash, reset, rebase ou commit em worktree de outro agente;
- workers/subagentes editam somente arquivos atribuídos; somente o orquestrador opera Git;
- atualize a branch entre lotes e resolva conflitos preservando mudanças canônicas recentes;
- um lote funcional por PR; não misture formatação massiva, limpeza, schema e feature;
- commit convencional em pt-BR com `--no-verify`, push, PR, CI e revisão antes do merge;
- não faça squash/merge nem apague branch sem a autorização prevista no fluxo do proprietário.

Na coleta deste handoff havia worktrees com alterações de outros agentes, inclusive branches de hardening e contratos. Eles são evidência de trabalho em andamento, não fonte canônica. Não copie arquivos diretamente desses worktrees. Se houver conteúdo útil, espere o PR/commit revisado e importe por Git com rastreabilidade.

### 4.2 Ações que exigem autorização explícita

Pare antes de qualquer uma destas ações:

- `DROP`, `TRUNCATE`, exclusão ou renomeação de tabela, coluna, constraint, índice, policy, função, trigger, view, enum, extensão, job ou migration;
- alteração de dados, backfill, correção de linha, cópia de dados ou uso de service role em produção;
- aplicação de migration em origem, destino, staging compartilhado ou produção;
- criação/alteração de policy, grant, RLS, função `SECURITY DEFINER`, cron, trigger ou extensão em banco remoto;
- deploy, desativação ou remoção de Edge Function;
- rotação, revogação ou criação de segredo/credencial;
- alteração de usuário Auth, MFA, sessão, bucket ou objeto de Storage;
- repontamento de webhooks, provedores, frontend ou DNS;
- cutover, canário produtivo ou descomissionamento da origem;
- remoção ou arquivamento de qualquer candidato a “lixo”;
- merge de PR quando a governança exigir aceite humano.

É permitido, sem nova autorização, realizar leitura, diagnóstico, simulação local, testes, documentação, criação de patch e migration **não aplicada**, desde que o diff seja reversível e permaneça em PR.

### 4.3 Condições de parada imediata

Interrompa o lote e abra incidente se ocorrer:

- segredo real em diff, log, relatório ou artefato;
- comando apontando para project ref diferente do declarado;
- migration gerando drop/recriação não prevista;
- teste cross-tenant conseguindo ler ou escrever dados de outro tenant;
- endpoint administrativo aceitando chamada anônima;
- replay divergindo do baseline de forma não explicada;
- teste “verde” porque foi pulado, mockado indevidamente ou executado contra alvo errado;
- conflito com trabalho não integrado de outro agente;
- alteração de produção sem rollback testado.

---

## 5. Estado inicial que deve ser revalidado

No commit `5093a727` foram observados:

- 551 migrations SQL;
- 103 diretórios de Edge Functions e 103 blocos em `supabase/config.toml`;
- 99 funções com `verify_jwt=false` e somente 4 com `verify_jwt=true` no arquivo local;
- 35 arquivos de teste Deno localizados;
- 204 arquivos Vitest;
- três lockfiles: `bun.lock`, `bun.lockb` e `package-lock.json`;
- zero PR aberto no GitHub no instante da coleta;
- workflow Deno verde no `main`;
- CI Pipeline vermelho porque os três shards E2E falharam; o Quality Gate passou, mas vários gates dependentes de segredo/banco foram pulados;
- `migrate-helper` presente, com `verify_jwt=false` e comportamento/credenciais operacionais sensíveis no código;
- fallback de token sensível detectado em `scripts/mcp-phd-suite.mjs`;
- `api-keys-manage` e `webhook-financeiro` ausentes;
- 7 ocorrências de `@ts-nocheck`, 36 de `eslint-disable` e dívida relevante de TODO/FIXME/HACK.

Essas contagens são ponto de partida. Recompute-as no primeiro lote e registre qualquer mudança causada por commits posteriores.

### 5.1 Status consolidado do plano mestre

Legenda:

- `✅` comprovadamente concluída na última auditoria;
- `🟡` parcial: existe trabalho útil que deve ser preservado, mas falta aceite integral;
- `❌` aberta: não implementada ou sem evidência suficiente;
- `⛔` bloqueada: depende de acesso, decisão, autorização, staging ou produção.

Resumo inicial:

| Estado       | Quantidade |
| ------------ | ---------: |
| ✅ concluída |          2 |
| 🟡 parcial   |         37 |
| ❌ aberta    |         41 |
| ⛔ bloqueada |         20 |
| **Total**    |    **100** |

As duas etapas comprovadas são `007` e `075`. Elas continuam no gate de regressão e não devem ser reimplementadas sem motivo.

---

## 6. Simulações obrigatórias antes de patch

Para cada lote, escreva primeiro uma matriz de cenários contendo entrada, precondição, ação, efeito esperado, efeito proibido, telemetria e rollback.

### 6.1 Segurança e identidade

Simule ao menos:

- sem `Authorization`, bearer inválido, expirado, usuário comum, admin, service-to-service correto e segredo alternativo incorreto;
- usuário válido de tenant A tentando ler/escrever/enviar para tenant B;
- HMAC correta, incorreta, ausente, replay da mesma assinatura, timestamp velho e corpo alterado após assinatura;
- segredo de cron/webhook ausente no servidor: o resultado deve ser fail-closed, nunca bypass;
- rate limit por IP, usuário, tenant e endpoint caro;
- payload válido, inválido, grande, recursivo, com campos extras e tipos limítrofes.

### 6.2 SQL administrativo e `mcp-query`

Simule consultas legítimas e ataques:

- `SELECT` somente leitura com filtros válidos;
- `UPDATE`/`DELETE` com filtro por chave e confirmação explícita quando o contrato permitir;
- ausência de `WHERE`, `WHERE true`, `1=1`, `id=id`, `IS NOT NULL`, `OR` amplo, comentário, múltiplos statements e literal malformado;
- CTE, subquery, alias, casts, operadores JSON, arrays e strings que contêm palavras SQL sem serem comandos;
- corrida TOCTOU entre validação e execução;
- parser falhando: a decisão deve ser negar ou exigir `allow_all_rows`, nunca liberar;
- consulta legítima complexa: exige aprovação explícita e trilha de auditoria, não relaxamento global do guard.

### 6.3 Banco e migrations

Simule:

- replay em banco vazio;
- replay sobre baseline anonimizada do destino;
- migration repetida;
- interrupção no meio;
- lock/timeout;
- dados que violam nova constraint;
- dependência de view, trigger, policy, grant ou função;
- rollback técnico e rollback de negócio;
- diferenças por partição futura, tabela vazia, extensão gerenciada e objeto intencionalmente descomissionado.

### 6.4 Fluxos financeiros/fiscais

Simule:

- boleto concorrente e callback duplicado;
- elisão: falha após cálculo e antes de persistir;
- conciliação: uma suboperação falha e o restante não pode gerar sucesso total;
- convite expirado, reutilizado, papel inválido e email já membro;
- WhatsApp aceito pelo provedor e falha ao gravar histórico, e o inverso;
- NF-e autorizada, rejeitada, timeout, contingência, cancelamento e inutilização;
- PER/DCOMP sem protocolo real;
- indisponibilidade de Bling, Asaas, Bitrix, Open Finance, SEFAZ e provedor de email.

### 6.5 CI, build e frontend

Simule:

- instalação limpa, sem cache e com lockfile canônico;
- login com diagnóstico de startup degradado;
- rotas públicas sem Supabase disponível;
- sessão inválida, refresh falho e recuperação;
- E2E sem segredos: deve declarar `unverified`/falha de pré-condição, não falso verde;
- rota com hash em navegação direta, refresh, back/forward, mobile e command palette;
- bundle acima do orçamento;
- teste deliberadamente quebrado para provar que cada gate realmente bloqueia.

---

## 7. Ordem de execução por lotes e gates

Cada lote começa com rebase/merge da `origin/main`, simulação, plano de arquivos, teste de falha antes do patch e critérios de aceite. Cada lote termina com PR, logs sanitizados e relatório.

| Lote | Escopo                           | Etapas  | Dependência para iniciar                         | Saída mínima                                                       |
| ---- | -------------------------------- | ------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| A    | Baseline, severidade e contenção | 001–010 | nenhuma                                          | inventário atual + correções locais P0 + pedidos de rotação/deploy |
| B    | Origem, destino e genealogia     | 011–020 | MCPs read-only operacionais                      | snapshots assinados + diff tripartido + decisão de baseline        |
| C    | Schema, RLS, rotinas e jobs      | 021–040 | lote B homologado                                | migrations aditivas não aplicadas + testes SQL + matriz de decisão |
| D    | Edge Functions e contratos       | 041–050 | contenção P0 e ambiente de teste                 | matriz auth 103/103 + testes negativos + canário proposto          |
| E    | Rotas e funcionalidades parciais | 051–060 | contratos/backend definidos                      | fluxos honestos, sem simulação apresentada como real               |
| F    | Consistência de domínio e dívida | 061–070 | tipos/schema homologados                         | atomicidade, erros visíveis e invariantes                          |
| G    | Qualidade, CI e build            | 071–080 | baseline estável                                 | gates reais, herméticos e sem sucesso por skip                     |
| H    | Performance, arquitetura e docs  | 081–086 | CI confiável                                     | orçamento, config moderna, docs regeneráveis                       |
| I    | Higiene sob decisão humana       | 087–090 | inventário de dependências                       | matriz manter/integrar/arquivar/remover, sem exclusão automática   |
| J    | Staging, rollout e aceite        | 091–100 | autorização e todos os P0/P1 anteriores fechados | replay, E2E, carga, canário, tráfego real e dossiê final           |

Não inicie o lote J com qualquer P0/P1 aberto. Os lotes C, D e E podem ser paralelizados apenas quando os arquivos forem disjuntos e houver um único orquestrador responsável pelos merges.

---

## 8. Registro das 100 etapas pendentes, agrupadas por tipo

O status abaixo é inicial. Para mudar qualquer item para `✅`, anexe evidência conforme a seção 13.

### Grupo A — governança, baseline e contenção

| Etapa | Estado | Entrega exigida do Cline                                                                                                               |
| ----: | :----: | -------------------------------------------------------------------------------------------------------------------------------------- |
|   001 |   🟡   | Recriar baseline com commit, ferramentas, ambiente, timestamp e hashes.                                                                |
|   002 |   🟡   | Atualizar matriz P0–P3 e classificar vulnerabilidade, perda, drift, parcial, dívida ou falso positivo.                                 |
|   003 |   🟡   | Revalidar `compare-schemas`; preservar hardening existente e fechar qualquer segredo/auth restante. Rotação/deploy exigem autorização. |
|   004 |   🟡   | Revalidar `send-push-notification` por tenant/usuário, chamadas internas e fallback; corrigir apenas gaps comprovados.                 |
|   005 |   🟡   | Cobrir todos os endpoints caros de IA com identidade, autorização, cota, orçamento e testes de abuso.                                  |
|   006 |   ❌   | Remover fallback sensível da suíte MCP em PR; preparar revogação/rotação externa sem expor valor.                                      |
|   007 |   ✅   | Manter a regra de não destruição e provar que os novos lotes a respeitam.                                                              |
|   008 |   🟡   | Atualizar painel de prontidão com estados codificado/testado/deployado/tráfego/aceito.                                                 |
|   009 |   ❌   | Implantar varredura ampliada de segredos no conteúdo e histórico, com saída mascarada e gate real.                                     |
|   010 |   ❌   | Fechar o gate de contenção somente após todos os P0 terem runtime e testes negativos aprovados.                                        |

### Grupo B — origem, destino, migrations e fonte de verdade

| Etapa | Estado | Entrega exigida do Cline                                                                                        |
| ----: | :----: | --------------------------------------------------------------------------------------------------------------- |
|   011 |   ⛔   | Restabelecer MCP da origem estritamente read-only; requer acesso/autorização operacional.                       |
|   012 |   ⛔   | Coletar catálogo integral da origem após 011, sem DDL/DML.                                                      |
|   013 |   🟡   | Recoletar destino e explicar variações frente ao snapshot anterior.                                             |
|   014 |   ❌   | Construir genealogia das 551 migrations atuais versus ledger live; não replayar em bloco.                       |
|   015 |   🟡   | Internalizar SQL real das migrations destino-only sem reconstrução por suposição ou reaplicação cega.           |
|   016 |   ❌   | Explicar migration local ausente no ledger e classificar não aplicável, falha, substituição ou perda de deploy. |
|   017 |   ❌   | Classificar individualmente `sql/` e `db/functions/` como oficial, biblioteca, diagnóstico ou legado.           |
|   018 |   ❌   | Regenerar tipos por ambiente após homologar baseline; remover compensações com testes.                          |
|   019 |   ⛔   | Produzir diff semântico origem × destino × repo quando ambos os acessos estiverem disponíveis.                  |
|   020 |   ⛔   | Obter decisão do proprietário sobre baseline e eventual desativação da origem.                                  |

### Grupo C — schema, objetos e isolamento do banco

| Etapa | Estado | Entrega exigida do Cline                                                                                                           |
| ----: | :----: | ---------------------------------------------------------------------------------------------------------------------------------- |
|   021 |   🟡   | Reclassificar objetos só nos tipos, respeitando ADR-001 e partições futuras; nada de recriação automática.                         |
|   022 |   🟡   | Explicar objetos só no destino, inclusive partições e `estrategias_elisao_catalogo`.                                               |
|   023 |   ❌   | Reconciliar views ausentes por definição, consumidor e decisão; nunca apenas por nome.                                             |
|   024 |   ❌   | Mapear as colunas divergentes contra payloads, defaults, nulabilidade, migrations e tipos.                                         |
|   025 |   ❌   | Preparar validação da constraint `faixas_simples_reparticao_soma_chk`; aplicar somente após autorização e zero linha incompatível. |
|   026 |   🟡   | Auditar índices com workload, FKs, filtros RLS, custo de escrita e janela suficiente.                                              |
|   027 |   ❌   | Definir uso e policy mínima de `estrategias_elisao_catalogo`; aplicar somente após autorização.                                    |
|   028 |   🟡   | Completar matriz CRUD das policies e testes cross-tenant; justificar policies literais verdadeiras.                                |
|   029 |   🟡   | Preparar redução de `GRANT ALL`/`TRUNCATE` para `authenticated` sem quebrar fluxos.                                                |
|   030 |   🟡   | Revisar anon insert de telemetria e grants de sequences com antiabuso e consumidor comprovado.                                     |

### Grupo D — funções, triggers, views e cron

| Etapa | Estado | Entrega exigida do Cline                                                                                                                               |
| ----: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   031 |   🟡   | Completar catálogo de rotinas: assinatura, owner, segurança, grants, callers e dependências.                                                           |
|   032 |   ❌   | Remover referências Lalamove residuais de `check_integrity_invariants` por migration nova e autorizada.                                                |
|   033 |   🟡   | Testar overloads no PostgREST e resolver somente ambiguidades comprovadas.                                                                             |
|   034 |   🟡   | Revisar todas as `SECURITY DEFINER`; preservar `search_path` fixo e reduzir superfície.                                                                |
|   035 |   🟡   | Ajustar `EXECUTE` por consumidor comprovado; toda revogação remota exige autorização.                                                                  |
|   036 |   ❌   | Provar efeito duplicado em triggers de organização antes de propor retirada de um deles.                                                               |
|   037 |   🟡   | Completar catálogo/teste de triggers com evento, ordem, custo, falha e owner.                                                                          |
|   038 |   🟡   | Certificar filtros tenant, segurança, colunas e refresh de views/matview.                                                                              |
|   039 |   🟡   | Revalidar jobs e corrigir o refresh concorrente de `mv_performance_alerts_weekly`, que exige índice único compatível ou estratégia sem `CONCURRENTLY`. |
|   040 |   🟡   | Reconciliar cron origem/destino/migrations; nenhuma alteração de schedule sem homologação.                                                             |

### Grupo E — Edge Functions, gateways e integrações

| Etapa | Estado | Entrega exigida do Cline                                                                                                              |
| ----: | :----: | ------------------------------------------------------------------------------------------------------------------------------------- |
|   041 |   🟡   | Manter catálogo/config explícito 103/103, atualizar contratos, secrets e auth conforme implementação real.                            |
|   042 |   🟡   | Regressão completa de `compare-schemas` com admin, segredo externo, auditoria e fail-closed.                                          |
|   043 |   🟡   | Regressão completa do push com tenant, destinatário, idempotência e chamada interna.                                                  |
|   044 |   ❌   | Implementar `api-keys-manage` ou adaptar UI ao contrato aprovado; segredo exibido uma única vez.                                      |
|   045 |   ❌   | Implementar `webhook-financeiro` ou remover/desabilitar a promessa após decisão de produto.                                           |
|   046 |   ❌   | Corrigir referência `enviar-push-notification` para `send-push-notification` em migration corretiva nova.                             |
|   047 |   🟡   | Consolidar auth, cota, timeout, cancelamento, custo e auditoria das funções de IA.                                                    |
|   048 |   ❌   | Classificar as 99 funções locais sem JWT: JWT, webhook/HMAC, cron secret, chamada interna ou público controlado. Testar cada exceção. |
|   049 |   🟡   | Fazer CI cobrir todos os testes Edge, check e lint reais sem mascaramento.                                                            |
|   050 |   ⛔   | Deploy canário e observação de tráfego requerem autorização, staging e rollback.                                                      |

### Grupo F — rotas e funcionalidades parcialmente implementadas

| Etapa | Estado | Entrega exigida do Cline                                                                                     |
| ----: | :----: | ------------------------------------------------------------------------------------------------------------ |
|   051 |   🟡   | Certificar rota, página, menu, permissão, dados e estados de erro/vazio para todo o mapa atual.              |
|   052 |   ❌   | Corrigir deep link de alertas preditivos e cobrir navegação direta/command palette.                          |
|   053 |   ⛔   | Integrar, arquivar ou retirar páginas órfãs somente após decisão explícita do proprietário.                  |
|   054 |   ❌   | Tornar seleção do menu sensível ao hash com testes de histórico/refresh/mobile.                              |
|   055 |   ❌   | Eliminar score aleatório de cobranças; usar dado determinístico ou “indisponível”.                           |
|   056 |   🟡   | Garantir persistência canônica e correlação do histórico WhatsApp proativo ponta a ponta.                    |
|   057 |   ❌   | Substituir convite placebo por convite real ou UI honesta de intenção.                                       |
|   058 |   ❌   | Concluir NF-e em homologação real ou isolar visualmente como simulação; nunca aparentar emissão fiscal real. |
|   059 |   ❌   | Gerar identificadores de boleto somente no backend/provedor homologado, com concorrência testada.            |
|   060 |   ❌   | Corrigir prefetch/imports e duplicidade `usePrefetchRoutes.ts`/`.tsx` com medição e diff mínimo.             |

### Grupo G — consistência, atomicidade e supressões

| Etapa | Estado | Entrega exigida do Cline                                                                                                  |
| ----: | :----: | ------------------------------------------------------------------------------------------------------------------------- |
|   061 |   ❌   | Tornar atualização de oportunidades de elisão atômica e idempotente; preservar estado anterior em falha.                  |
|   062 |   🟡   | Remover `@ts-nocheck` e tratar todos os erros em regras de conciliação.                                                   |
|   063 |   ❌   | Diferenciar vazio real, RLS, indisponibilidade e drift nas queries otimizadas.                                            |
|   064 |   ❌   | Impedir sucesso integral quando qualquer suboperação da auditoria de conciliação falhar.                                  |
|   065 |   ❌   | Resolver TODOs de schema individualmente contra o catálogo atual.                                                         |
|   066 |   ❌   | Modelar escrita secundária com atomicidade, compensação ou tolerância observável.                                         |
|   067 |   ❌   | Revisar awaits Supabase suspeitos caso a caso; corrigir somente erros realmente ignorados.                                |
|   068 |   ❌   | Triar TODO/FIXME/HACK, `@ts-nocheck` e `eslint-disable`; não ampliar ignores.                                             |
|   069 |   ❌   | Mapear objetos sem consumidor para roadmap/owner; lista de decisão, nunca exclusão automática.                            |
|   070 |   🟡   | Completar invariantes de cobrança, boleto, conciliação, fiscal, convite e elisão, incluindo concorrência e falha parcial. |

### Grupo H — testes, CI, build e dependências

| Etapa | Estado | Entrega exigida do Cline                                                                            |
| ----: | :----: | --------------------------------------------------------------------------------------------------- |
|   071 |   ❌   | Alinhar thresholds documentados e reais, elevando gradualmente a partir de baseline comprovado.     |
|   072 |   ❌   | Incluir testes/E2E/apoio no typecheck e avançar strictness por domínio.                             |
|   073 |   🟡   | Executar todos os 35 arquivos Deno atuais ou justificar tecnicamente exclusões explícitas.          |
|   074 |   ❌   | Corrigir Deno lint em lotes revisáveis e remover `                                                  |     | true`; não gerar mega-diff. |
|   075 |   ✅   | Preservar a permissão mínima de leitura no comando Deno e seu teste de regressão.                   |
|   076 |   ❌   | Fazer `lint:strict` passar sem ignores globais e promovê-lo a gate real.                            |
|   077 |   ❌   | Formatar em PRs mecânicos separados; zero mistura com mudança funcional.                            |
|   078 |   🟡   | Corrigir E2E Supabase HTTP 400, tornar ambiente hermético e provar os browsers/projetos prometidos. |
|   079 |   ❌   | Preparar decisão de lockfile; remover somente o arquivo individualmente aprovado.                   |
|   080 |   🟡   | Fixar Bun/runners/dependências e fazer auditoria de vulnerabilidade bloquear conforme política.     |

### Grupo I — performance, arquitetura, observabilidade e documentação

| Etapa | Estado | Entrega exigida do Cline                                                              |
| ----: | :----: | ------------------------------------------------------------------------------------- |
|   081 |   ❌   | Definir e aplicar orçamento de bundle por rota; medir chunks grandes atuais.          |
|   082 |   🟡   | Remover avisos Vite/OXC/esbuild/depreciações e comprovar artefato final.              |
|   083 |   ❌   | Decompor somente hotspots comprovados, preservando arquivos gerados e comportamento.  |
|   084 |   🟡   | Atualizar mapa arquitetural/Graphify com commit, saúde e limitações explícitas.       |
|   085 |   🟡   | Completar SLOs, alertas, owner, correlação e runbooks para todo fluxo P0/P1.          |
|   086 |   ❌   | Atualizar documentação e contagens por scripts reproduzíveis, removendo contradições. |

### Grupo J — higiene, staging, rollout e aceite

| Etapa | Estado | Entrega exigida do Cline                                                                 |
| ----: | :----: | ---------------------------------------------------------------------------------------- |
|   087 |   ⛔   | Apresentar decisão por lockfile; não remover nada sem aprovação.                         |
|   088 |   ⛔   | Comparar suíte E2E paralela/Dyad e preservar cobertura exclusiva antes de decidir.       |
|   089 |   ⛔   | Submeter artefatos, relatórios, `sql/` e `db/functions/` individualmente à decisão.      |
|   090 |   ⛔   | Homologar matriz manter/integrar/arquivar/remover/investigar com o proprietário.         |
|   091 |   ⛔   | Preparar staging representativo, backup e rollback; requer autorização e infraestrutura. |
|   092 |   ⛔   | Ensaiar migrations do zero e sobre baseline somente após genealogia homologada.          |
|   093 |   ⛔   | Implantar segurança apenas em staging autorizado e testar isolamento.                    |
|   094 |   ⛔   | Exercitar E2E real de convite, boleto, cobrança, WhatsApp, conciliação, elisão e NF-e.   |
|   095 |   ⛔   | Executar regressão integral do banco e provar diff apenas com exceções aprovadas.        |
|   096 |   ⛔   | Testar carga, indisponibilidade, retries, orçamento e idempotência.                      |
|   097 |   ⛔   | Ativar gates operacionais e provar alertas por falha injetada.                           |
|   098 |   ⛔   | Fazer rollout canário produtivo com janela e rollback automático.                        |
|   099 |   ⛔   | Observar e reconciliar tráfego real entre frontend, Edge, banco e provedores.            |
|   100 |   ⛔   | Solicitar aceite final apenas com zero P0/P1 aberto e dossiê completo.                   |

---

## 9. P0 adicional descoberto após o plano: `migrate-helper`

O plano original tratava a ausência de `migrate-helper` como intencional. No baseline atual, a função foi reintroduzida e precisa ser tratada antes de qualquer declaração de segurança:

- existe `supabase/functions/migrate-helper/index.ts`;
- `supabase/config.toml` define `verify_jwt=false`;
- há material de acesso codificado no fonte; não o copie;
- uma ação do endpoint pode retornar credenciais administrativas/URL de banco;
- o runtime da origem respondeu com barreira própria em teste anterior, enquanto o destino não apresentava deploy correspondente; isso deve ser revalidado, não presumido.

Procedimento obrigatório:

1. abrir incidente P0 sem reproduzir o segredo;
2. confirmar escopo e histórico Git da exposição com ferramenta que masque valores;
3. preparar patch fail-closed que remova qualquer credencial do bundle e limite o endpoint a uma identidade administrativa/interna verificável;
4. criar testes negativos para chamada anônima, bearer inválido, usuário comum, enumeração de ações e exfiltração;
5. preparar inventário de credenciais a rotacionar e logs a auditar;
6. pedir autorização explícita para revogação/rotação, deploy/desativação e investigação operacional;
7. não considerar resolvido até a credencial anterior falhar e o runtime implantado rejeitar ataques.

Não substitua esse endpoint por outro “helper” genérico de SQL. Ferramentas administrativas devem ter superfície mínima, allowlist de operações, auditoria e separação do plano de dados.

---

## 10. Inventário técnico mínimo que não pode ser esquecido

### 10.1 Banco canônico — último snapshot auditado

Revalidar, sem usar estes números como verdade eterna:

- 271 tabelas públicas, 3.795 colunas, 775 constraints e 852 índices;
- RLS em 271/271 tabelas e 529 policies;
- 180 rotinas, incluindo overloads, e 149 `SECURITY DEFINER`;
- 158 triggers;
- 17 views e 1 materialized view;
- 25 enums e 8 extensões;
- 22 cron jobs ativos;
- 28 entradas no ledger de migrations;
- 1 constraint ainda não validada;
- `estrategias_elisao_catalogo` com RLS e sem policy no snapshot;
- 14 views normais sem `security_invoker` no snapshot anterior, sujeitas a revisão;
- 0 índice inválido e 0 trigger desabilitado no snapshot;
- job `refresh-performance-alerts-weekly` com falha por `REFRESH MATERIALIZED VIEW CONCURRENTLY` sem índice único adequado.

Tabelas estimadas vazias foram deliberadamente excluídas da classificação de bug/lixo.

### 10.2 Drift de tipos e objetos

Revalidar os candidatos abaixo:

- banco com 271 tabelas versus tipos com 279 no snapshot;
- objetos só no banco: partições mensais, `audit_logs_2026_01` e `estrategias_elisao_catalogo`;
- objetos só nos tipos: duas partições futuras e objetos do módulo Lalamove/driver já decididos pelo ADR-001;
- cerca de 210 colunas live ausentes nos tipos, distribuídas por 51 tabelas comuns;
- views somente nos tipos: `drivers_safe_view`, `estrategias_elisao_catalogo`, `mv_benchmark_setorial`, `orders_operator_view`, `orders_safe_view`, `vw_auditoria_tributaria_recente`, `vw_transferencias_painel`;
- quatro funções tipadas sem equivalente único no catálogo anterior: `calcular_potencial_elisao`, `gate_34_indices_nao_utilizados`, `get_acessos_suspeitos`, `get_active_uapi_token`;
- funções live sem typegen podem ser helpers/triggers intencionais; não classificá-las por ausência no cliente.

### 10.3 Proveniência de migrations

- não replayar as 551 migrations cegamente;
- o ledger live anterior continha 28 migrations de reconciliação;
- havia versões aplicadas não presentes em `main`;
- parte do SQL foi localizada apenas em histórico/branch remota de convergência;
- uma versão aplicada não tinha fonte localizada;
- internalizar o SQL real e registrar genealogia antes de qualquer replay;
- migrations aplicadas nunca são reescritas; correções entram em nova migration crescente e idempotente.

### 10.4 Edge Functions e autenticação

O arquivo local tem 103 funções e 99 `verify_jwt=false`. Isso não significa que 99 funções são automaticamente vulneráveis, mas obriga classificação individual:

- sessão JWT de usuário;
- papel administrativo;
- HMAC de webhook sobre corpo bruto;
- segredo de cron com anti-replay;
- segredo interno/server-to-server;
- callback público com state/nonce/PKCE;
- endpoint público deliberado com rate limit e dados estritamente públicos.

O gate estático existente cobre apenas parte das funções sensíveis. Revalidar especialmente funções com service role e ausência de guard reconhecido, incluindo `comparar-benchmark-setorial`, `detectar-anomalias-financeiras`, `gerar-alertas-tributarios`, `migrate-helper`, `prever-carga-tributaria` e `validate-ip-geo`. `n8n-*`, `sso-initiate` e `health` possuem contratos especiais e devem ser avaliados pelo comportamento, não por busca textual.

Preservar e regredir o hardening já existente em:

- diagnóstico de startup não bloqueante;
- dependência explícita necessária ao build limpo;
- `mcp-query` integrado ao guard SQL;
- `compare-schemas`;
- `send-push-notification` e `send-device-alert`;
- `gerar-alertas`;
- `bling-webhook`;
- validação Zod das funções que consomem body.

### 10.5 Funcionalidades simuladas, parciais ou sem ligação completa

Além das etapas 051–070, buscar e testar:

- `enviar-convite-organizacao` e outros fluxos de convite que possam responder sucesso simulado;
- `enviar-alerta-email` em modo simulado quando o provedor não está configurado;
- `copilot-global` com stream simulado;
- emissão, cancelamento, inutilização e contingência NF-e simulados/aleatórios;
- score Serasa/Boa Vista aleatório em Cobranças;
- identificadores/códigos de boleto gerados no cliente;
- recibo PER/DCOMP simulado;
- dados mock na página de Compras;
- benchmarking simulado no frontend;
- `useOportunidadesElisao` com delete antes de insert e erro de delete ignorado;
- hook `useBudget` sem consumidor e persistência somente local;
- rotas/painéis tributários pouco descobríveis descritos em `docs/FUNCIONALIDADES_SEM_UI.md`;
- componentes/páginas dormentes que precisam de decisão de produto, não de exclusão automática.

Use busca estrutural e leitura direta. `Math.random`, `setTimeout`, `mock`, `demo` e `simulado` são heurísticas; IDs visuais, jitter de retry e skeletons podem ser legítimos. Corrija somente após classificar o uso.

---

## 11. Contrato de implementação por tarefa

Cada tarefa executada deve conter:

1. **hipótese:** qual falha real está sendo corrigida;
2. **evidência anterior:** código/runtime/teste que prova a falha;
3. **cenários:** sucesso, falha, abuso, concorrência, tenant e integração;
4. **escopo de arquivos:** lista fechada e owner do lote;
5. **patch mínimo:** sem refatoração oportunista;
6. **teste que falhava antes:** ou justificativa objetiva quando não for reproduzível;
7. **testes após o patch:** unitário, contrato, integração, build e E2E proporcionais ao risco;
8. **efeito externo:** nenhum, staging ou produção, com autorização anexada;
9. **rollback:** comando/commit/migration compensatória ensaiada;
10. **observabilidade:** logs estruturados sem PII/segredo, métrica, alerta e correlation ID;
11. **documentação:** contrato e estado atualizados;
12. **riscos residuais:** explícitos, nunca escondidos no texto do PR.

PR sem evidência anterior ou sem teste negativo não fecha vulnerabilidade. Migration não aplicada não fecha etapa de runtime. Deploy `ACTIVE` sem probe e tráfego não fecha funcionalidade.

---

## 12. Matriz mínima de testes e comandos

Ajuste os comandos ao `package.json` atual, mas registre exatamente o que foi executado.

### 12.1 Baseline local

```sh
bun install --frozen-lockfile
bun run type-check
bun run lint:strict
bun run test:run
bun run build
```

Resultados esperados devem ser definidos a partir do baseline. Não esconda warnings; classifique-os. O build anterior passou com avisos de `__dirname`, configuração depreciada, conflito OXC/esbuild, Browserslist e chunks grandes.

### 12.2 Edge Functions

```sh
deno check supabase/functions/<funcao>/index.ts
deno lint supabase/functions/<escopo-do-lote>
deno test --allow-env --allow-net --allow-read --no-check <testes-do-lote>
npx vitest run src/lib/__tests__/edge-functions.security.test.ts
```

Execute também os testes focados do guard SQL e do Bling. No CI final, todos os arquivos Deno relevantes devem ser descobertos automaticamente ou por manifesto completo versionado. Subconjunto fixo não comprova o restante.

### 12.3 E2E

- reproduza primeiro o HTTP 400 de autenticação Supabase dos três shards;
- valide se credenciais/usuário de teste existem no ambiente correto sem expô-los;
- se o ambiente faltar, marque `BLOQUEADO/UNVERIFIED`; não altere expectativa para fazer o teste passar;
- execute smoke público sem backend, login, troca de tenant, RBAC, rotas críticas e fluxos do lote;
- rode os projetos/browsers que o projeto declara suportar ou corrija a promessa documental;
- capture trace, screenshot e logs sanitizados apenas em falha.

### 12.4 Banco

Todo teste remoto inicial é somente leitura. O dossiê deve cobrir:

- schemas, tabelas, colunas, defaults e nulabilidade;
- PK, FK, UNIQUE, CHECK e validação;
- índices, validade, definição e workload;
- RLS, FORCE RLS, policies CRUD e isolamento multiempresa;
- funções/procedures, overloads, owner, `SECURITY DEFINER`, `search_path` e grants;
- triggers, ordem e funções chamadas;
- views/matview, `security_invoker`, dependências e refresh;
- enums, extensões e publications;
- grants de tabelas, sequences e execução;
- cron jobs, histórico, retry e alertas;
- ledger e checksum/genealogia das migrations.

Qualquer SQL de teste com escrita deve rodar somente em banco efêmero/staging autorizado, dentro de transação revertida quando possível.

### 12.5 Prova de eficácia dos gates

Para cada novo gate, crie uma mutação controlada que deveria falhar:

- segredo fictício com formato proibido;
- Edge com service role sem guard;
- body sem Zod;
- `deno lint` deliberadamente inválido;
- queda de cobertura;
- drift SQL conhecido;
- E2E falhando;
- teste DB sem secret.

O gate só é aceito se bloquear a mutação e não aprovar por `skip`, `|| true`, `continue-on-error`, fallback ou regex superficial.

---

## 13. Protocolo de evidência contra falso positivo

Cada afirmação deve receber um dos estados:

- `PASS`: comando executado no alvo correto e resultado esperado observado;
- `FAIL`: divergência reproduzida;
- `BLOCKED`: precondição externa ausente;
- `UNVERIFIED`: não executado ou evidência insuficiente;
- `NOT_APPLICABLE`: fora de escopo com justificativa/ADR;
- `INTENTIONAL_DIFFERENCE`: diferença aprovada com decisão rastreável.

Regras:

- `UNVERIFIED`, `BLOCKED`, `SKIPPED` e ausência de linha não contam como `PASS`;
- código existir não prova deploy;
- deploy existir não prova contrato correto;
- endpoint 200 não prova efeito correto;
- tabela vazia não prova feature quebrada ou objeto inútil;
- teste de regex que não importa o guard real não prova segurança;
- teste que reimplementa a lógica de produção não prova a implementação;
- mock de Supabase não fecha isolamento RLS;
- consulta sem confirmar project ref não fecha banco canônico;
- percentual agregado não substitui lista de casos e resultados;
- logs devem mostrar timestamp, commit, ambiente e comando, mas nunca segredo/PII.

Formato recomendado por evidência:

```text
ID: PFV2-<lote>-<sequencial>
Etapa: 0NN
Commit: <sha>
Ambiente: local | efêmero | staging | produção
Alvo confirmado: <project ref/URL sem segredo>
Comando/cenário: <texto reproduzível>
Resultado: PASS | FAIL | BLOCKED | UNVERIFIED | NOT_APPLICABLE | INTENTIONAL_DIFFERENCE
Saída resumida: <sem segredo/PII>
Artefato: <path ou URL>
Timestamp UTC: <ISO-8601>
Revisor: <nome/agente>
```

---

## 14. Artefatos que o Cline deve entregar

Crie e mantenha, sem dados sensíveis:

- `docs/execucao-cline/INDICE.md` — índice dos lotes e status das 100 etapas;
- `docs/execucao-cline/BASELINE_<data>.md` — commit, ferramentas, inventários e limitações;
- `docs/execucao-cline/MATRIZ_DECISOES.md` — tudo que precisa de autorização do proprietário;
- `docs/execucao-cline/MATRIZ_DIVERGENCIAS_BD.md` — origem/destino/repo e classificação;
- `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` — as 103 funções, contrato e testes;
- `docs/execucao-cline/GENEALOGIA_MIGRATIONS.md` — versão, fonte, ledger, efeito e status;
- `docs/execucao-cline/CANDIDATOS_HIGIENE.md` — um item por linha, dependências, risco e recomendação;
- `docs/execucao-cline/RELATORIO_LOTE_<id>.md` — evidências, testes, riscos e rollback de cada PR;
- `docs/execucao-cline/RELATORIO_FINAL.md` — somente quando o programa terminar ou parar em gates externos.

O relatório final deve conter:

- SHA inicial e final;
- branches, commits e PRs por lote;
- arquivos alterados por PR;
- etapas 001–100 com status e links de evidência;
- testes executados e não executados;
- antes/depois do banco e Edge, se autorizado;
- migrations criadas, aplicadas e não aplicadas;
- deploys, versões e rollback, se autorizados;
- segredos rotacionados apenas pelo nome, nunca pelo valor;
- diferenças intencionais aprovadas;
- lista exata de bloqueios e decisão necessária;
- riscos residuais;
- confirmação de que worktrees de terceiros não foram alterados.

---

## 15. Critério de divisão dos PRs

Use PRs pequenos e verificáveis. Sugestão inicial, ajustável após rebaseline:

1. `security: remove credenciais embutidas e fecha helpers administrativos`;
2. `test: amplia regressão dos guards Edge e mcp-query`;
3. `ci: elimina aprovações por skip e mascaramento no lote definido`;
4. `docs: publica baseline, matrizes e genealogia read-only`;
5. `fix: corrige auth por contrato nas Edge Functions do primeiro grupo`;
6. `fix: corrige rotas e estados de navegação`;
7. `fix: elimina simulações enganosas do primeiro fluxo de negócio`;
8. `fix: torna elisão e conciliação consistentes`;
9. `chore: reduz supressões/lint em lote semântico pequeno`;
10. `perf: estabelece orçamento e corrige configuração de build`;
11. PRs de migrations aditivas, um domínio por vez, sem aplicação remota;
12. PRs mecânicos de formatação separados;
13. PRs de documentação factual gerada;
14. PRs de staging/rollout somente após gates e autorização.

Não combine rotação de segredo, alteração de policy, feature financeira e formatação no mesmo PR.

---

## 16. Perguntas de decisão que o Cline deve preparar, não responder sozinho

- Qual baseline rege cada domínio quando origem, destino e migrations divergem?
- A origem será preservada, congelada ou descomissionada? Em qual janela?
- `api-keys-manage` e `webhook-financeiro` devem ser implementados ou a promessa de produto será retirada?
- O módulo NF-e entra em homologação real agora ou será marcado/ocultado como demonstração?
- O hook `useBudget` deve ganhar backend/UI ou permanecer fora do roadmap?
- As páginas órfãs serão integradas, arquivadas ou removidas?
- Qual lockfile e gerenciador são oficiais? npm continua suportado?
- A suíte Dyad/E2E paralela tem cobertura exclusiva?
- Quais artefatos em `sql/`, `db/functions/`, relatórios e snapshots devem ser mantidos, integrados, arquivados ou removidos?
- Quais policies/grants públicos são requisitos de negócio aceitos?
- Qual política de orçamento/custo vale para IA e provedores externos?
- Qual é o staging homologado e quem autoriza deploy/canário/produção?

Cada pergunta deve vir com opções, impacto, risco, recomendação e reversibilidade.

---

## 17. Handoff de volta ao Codex para revisão independente

Quando terminar o trabalho executável, o Cline deve devolver ao proprietário:

1. URL de cada PR;
2. branch e SHA final de cada lote;
3. `docs/execucao-cline/RELATORIO_FINAL.md`;
4. lista das etapas marcadas `PASS`, `BLOCKED`, `UNVERIFIED` e `INTENTIONAL_DIFFERENCE`;
5. evidências de CI, banco, Edge, staging e produção;
6. decisões ainda pendentes;
7. declaração de qualquer desvio deste handoff.

O proprietário então deve retornar ao Codex com essas referências e a frase: **“Cline terminou; revise o handoff e confira todos os PRs e evidências.”**

Na revisão, o Codex fará auditoria independente, não confiará apenas no relatório do Cline e deverá:

- comparar cada PR com o baseline e com este registro de 100 etapas;
- executar testes localmente em worktree limpo;
- inspecionar CI e detectar skips/falsos verdes;
- repetir probes negativos de segurança;
- repetir consultas de banco somente leitura no alvo confirmado;
- verificar migrations, ledger e tipos;
- confirmar que nenhuma mudança de outro agente foi revertida;
- classificar cada etapa como aceita, reprovada, bloqueada ou inconclusiva;
- produzir lista objetiva de retrabalho, se houver.

---

## 18. Prompt pronto para iniciar o Cline

Copie para o Cline somente o texto abaixo; não acrescente tokens ou credenciais:

> Trabalhe no repositório privado `adm01-debug/Promo_Finance_V2`. Leia integralmente `AGENTS.md`, `README.md`, `CLAUDE.md` e `docs/HANDOFF_CLINE_EXECUCAO_PENDENCIAS_PLANO_100_ETAPAS_2026-08-30.md`. Você é o orquestrador da execução. Crie worktree isolado a partir do `origin/main` mais recente, inventarie todos os worktrees e preserve integralmente mudanças de Claude, Hermes, Codex e outros agentes. Antes de cada patch, simule sucesso, falha, abuso, concorrência, isolamento multiempresa e rollback. Revalide o status das 100 etapas; não refaça trabalho já canônico. Execute todas as ações locais e reversíveis em PRs pequenos, com testes e evidências. Não faça exclusão, DDL/DML remoto, migration aplicada, deploy, rotação/revogação de segredo, mudança Auth/Storage/cron/webhook, cutover, merge ou operação produtiva sem autorização explícita do proprietário. Nunca exponha segredos. `BLOCKED`, `UNVERIFIED` e teste pulado não são sucesso. Ao final, entregue todos os artefatos da seção 14, os PRs, SHAs, testes, evidências e decisões pendentes para revisão independente do Codex.

---

## 19. Definition of Done do programa

O programa chega a 10/10 somente quando:

- as 100 etapas possuem estado e evidência individual;
- nenhum P0/P1 permanece aberto;
- nenhum segredo válido está no conteúdo ou artefatos e credenciais expostas foram rotacionadas;
- todo endpoint sensível possui autenticação/autorização apropriada e teste de abuso;
- origem, destino, migrations e tipos estão reconciliados ou diferem apenas por decisões aprovadas;
- replay do banco converge em vazio e baseline representativa;
- RLS, policies, grants, funções, triggers, views, jobs e Edge passam por regressão real;
- fluxos financeiros/fiscais não apresentam simulação como operação real;
- build, typecheck, lint, unitários, Edge, E2E e gates de segurança passam sem mascaramento;
- staging, rollback, carga, canário e observabilidade foram exercitados;
- tráfego real autorizado foi reconciliado com banco, Edge, provedor e auditoria;
- o proprietário e a revisão técnica independente aceitaram o dossiê.

Até lá, a descrição correta é “em execução” ou “bloqueado por decisão/acesso”, nunca “perfeito” ou “100% pronto”.
