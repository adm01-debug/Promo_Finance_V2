# Índice de Execução — Programa de Remediação em 100 Etapas

> **Fonte:** handoff de origem (documento do PR #48), seções §7 (lotes) e §8 (registro das 100 etapas).
> **Base da revalidação:** branch `fix/cline-h120728-indice-e-matrizes`, derivada de `origin/main` @ `5093a727` (2026-08-30).
> **Escopo deste documento:** status consolidado das etapas, revalidações estáticas executadas e apontamentos para as matrizes de apoio. Não substitui as evidências de cada lote (`RELATORIO_LOTE_<id>.md`).

## Resumo de status

| Status | Qtde | Significado |
|--------|------|-------------|
| ✅ | 2 | Concluída e comprovada por evidência (`007`, `075`) |
| 🟡 | 37 | Parcial — falta evidência, teste de falha ou fechamento formal |
| ❌ | 41 | Pendente de execução |
| ⛔ | 20 | Bloqueada por autorização do proprietário ou acesso externo (MCP/infra) |
| **Total** | **100** | |

## Lotes e gates (§7)

| Lote | Escopo | Etapas | Dependência para iniciar | Saída mínima |
|------|--------|--------|--------------------------|--------------|
| A | Baseline, severidade e contenção | 001–010 | nenhuma | inventário atual + correções locais P0 + pedidos de rotação/deploy |
| B | Origem, destino e genealogia | 011–020 | MCPs read-only operacionais | snapshots assinados + diff tripartido + decisão de baseline |
| C | Schema, RLS, rotinas e jobs | 021–040 | lote B homologado | migrations aditivas não aplicadas + testes SQL + matriz de decisão |
| D | Edge Functions e contratos | 041–050 | contenção P0 e ambiente de teste | matriz auth 103/103 + testes negativos + canário proposto |
| E | Rotas e funcionalidades parciais | 051–060 | contratos/backend definidos | fluxos honestos, sem simulação apresentada como real |
| F | Consistência de domínio e dívida | 061–070 | tipos/schema homologados | atomicidade, erros visíveis e invariantes |
| G | Qualidade, CI e build | 071–080 | baseline estável | gates reais, herméticos e sem sucesso por skip |
| H | Performance, arquitetura e docs | 081–086 | CI confiável | orçamento, config moderna, docs regeneráveis |
| I | Higiene sob decisão humana | 087–090 | inventário de dependências | matriz manter/integrar/arquivar/remover, sem exclusão automática |
| J | Staging, rollout e aceite | 091–100 | autorização e todos os P0/P1 anteriores fechados | replay, E2E, carga, canário, tráfego real e dossiê final |

Regra do handoff: **não iniciar o lote J com qualquer P0/P1 aberto**; lotes C, D e E podem ser paralelizados apenas com arquivos disjuntos e orquestrador único responsável pelos merges.

## Revalidações estáticas desta execução (2026-08-30)

Itens verificados diretamente no código-fonte nesta rodada, com evidência em `MATRIZ_AUTH_EDGE.md`:

- **Etapa 041/048 (pré-classificação):** `supabase/config.toml` contém **103 seções `[functions.*]`**; `verify_jwt = true` em exatamente **4** funções (`analise-preditiva`, `bitrix24-sync`, `conciliacao-ia`, `open-finance`) → **99 funções sem JWT de gateway confirmadas**, como previsto no handoff. Matriz completa em `MATRIZ_AUTH_EDGE.md`.
- **Etapa 002 (achados novos):** `supabase/functions/fuzz_test.ts` e `supabase/functions/stress_test.ts` são **arquivos soltos** no diretório de funções (não são funções deployáveis) — risco para `supabase functions deploy`; e `migrate-helper` ainda existe em `origin/main` (PR #50 ainda não mesclado).
- **Falso positivo resolvido:** a suposta duplicidade de `sefaz-dfe-puxar` em `config.toml` era artefato de parsing `awk` (linha 121 é comentário contendo `verify_jwt`). Não há duplicidade; 103 entradas únicas confirmadas.
- **Bloqueios confirmados:** conector MCP do banco indisponível neste ambiente → etapas 011/012/019/020 permanecem ⛔; merges dos PRs #48/#49/#50 e qualquer deploy exigem autorização do proprietário.

## Etapas 001–100 (status do handoff, revalidado)

Legenda: ✅ concluída · 🟡 parcial · ❌ pendente · ⛔ bloqueada por decisão/acesso externo.

| Etapa | Lote | Status | Descrição |
|-------|------|--------|-----------|
| 001 | A | 🟡 | Recriar baseline com commit, ferramentas, ambiente, timestamp e hashes. |
| 002 | A | 🟡 | Atualizar matriz P0–P3 e classificar vulnerabilidade, perda, drift, parcial, dívida ou falso positivo. |
| 003 | A | 🟡 | Revalidar `compare-schemas`; preservar hardening existente e fechar qualquer segredo/auth restante. Rotação/deploy exigem autorização. |
| 004 | A | 🟡 | Revalidar `send-push-notification` por tenant/usuário, chamadas internas e fallback; corrigir apenas gaps comprovados. |
| 005 | A | 🟡 | Cobrir todos os endpoints caros de IA com identidade, autorização, cota, orçamento e testes de abuso. |
| 006 | A | ❌ | Remover fallback sensível da suíte MCP em PR; preparar revogação/rotação externa sem expor valor. |
| 007 | A | ✅ | Manter a regra de não destruição e provar que os novos lotes a respeitam. |
| 008 | A | 🟡 | Atualizar painel de prontidão com estados codificado/testado/deployado/tráfego/aceito. |
| 009 | A | ❌ | Implantar varredura ampliada de segredos no conteúdo e histórico, com saída mascarada e gate real. |
| 010 | A | ❌ | Fechar o gate de contenção somente após todos os P0 terem runtime e testes negativos aprovados. |
| 011 | B | ⛔ | Restabelecer MCP da origem estritamente read-only; requer acesso/autorização operacional. |
| 012 | B | ⛔ | Coletar catálogo integral da origem após 011, sem DDL/DML. |
| 013 | B | 🟡 | Recoletar destino e explicar variações frente ao snapshot anterior. |
| 014 | B | ❌ | Construir genealogia das 551 migrations atuais versus ledger live; não replayar em bloco. |
| 015 | B | 🟡 | Internalizar SQL real das migrations destino-only sem reconstrução por suposição ou reaplicação cega. |
| 016 | B | ❌ | Explicar migration local ausente no ledger e classificar não aplicável, falha, substituição ou perda de deploy. |
| 017 | B | ❌ | Classificar individualmente `sql/` e `db/functions/` como oficial, biblioteca, diagnóstico ou legado. |
| 018 | B | ❌ | Regenerar tipos por ambiente após homologar baseline; remover compensações com testes. |
| 019 | B | ⛔ | Produzir diff semântico origem × destino × repo quando ambos os acessos estiverem disponíveis. |
| 020 | B | ⛔ | Obter decisão do proprietário sobre baseline e eventual desativação da origem. |
| 021 | C | 🟡 | Reclassificar objetos só nos tipos, respeitando ADR-001 e partições futuras; nada de recriação automática. |
| 022 | C | 🟡 | Explicar objetos só no destino, inclusive partições e `estrategias_elisao_catalogo`. |
| 023 | C | ❌ | Reconciliar views ausentes por definição, consumidor e decisão; nunca apenas por nome. |
| 024 | C | ❌ | Mapear as colunas divergentes contra payloads, defaults, nulabilidade, migrations e tipos. |
| 025 | C | ❌ | Preparar validação da constraint `faixas_simples_reparticao_soma_chk`; aplicar somente após autorização e zero linha incompatível. |
| 026 | C | 🟡 | Auditar índices com workload, FKs, filtros RLS, custo de escrita e janela suficiente. |
| 027 | C | ❌ | Definir uso e policy mínima de `estrategias_elisao_catalogo`; aplicar somente após autorização. |
| 028 | C | 🟡 | Completar matriz CRUD das policies e testes cross-tenant; justificar policies literais verdadeiras. |
| 029 | C | 🟡 | Preparar redução de `GRANT ALL`/`TRUNCATE` para `authenticated` sem quebrar fluxos. |
| 030 | C | 🟡 | Revisar anon insert de telemetria e grants de sequences com antiabuso e consumidor comprovado. |
| 031 | C | 🟡 | Completar catálogo de rotinas: assinatura, owner, segurança, grants, callers e dependências. |
| 032 | C | ❌ | Remover referências Lalamove residuais de `check_integrity_invariants` por migration nova e autorizada. |
| 033 | C | 🟡 | Testar overloads no PostgREST e resolver somente ambiguidades comprovadas. |
| 034 | C | 🟡 | Revisar todas as `SECURITY DEFINER`; preservar `search_path` fixo e reduzir superfície. |
| 035 | C | 🟡 | Ajustar `EXECUTE` por consumidor comprovado; toda revogação remota exige autorização. |
| 036 | C | ❌ | Provar efeito duplicado em triggers de organização antes de propor retirada de um deles. |
| 037 | C | 🟡 | Completar catálogo/teste de triggers com evento, ordem, custo, falha e owner. |
| 038 | C | 🟡 | Certificar filtros tenant, segurança, colunas e refresh de views/matview. |
| 039 | C | 🟡 | Revalidar jobs e corrigir o refresh concorrente de `mv_performance_alerts_weekly`, que exige índice único compatível ou estratégia sem `CONCURRENTLY`. |
| 040 | C | 🟡 | Reconciliar cron origem/destino/migrations; nenhuma alteração de schedule sem homologação. |
| 041 | D | 🟡 | Manter catálogo/config explícito 103/103, atualizar contratos, secrets e auth conforme implementação real. |
| 042 | D | 🟡 | Regressão completa de `compare-schemas` com admin, segredo externo, auditoria e fail-closed. |
| 043 | D | 🟡 | Regressão completa do push com tenant, destinatário, idempotência e chamada interna. |
| 044 | D | ❌ | Implementar `api-keys-manage` ou adaptar UI ao contrato aprovado; segredo exibido uma única vez. |
| 045 | D | ❌ | Implementar `webhook-financeiro` ou remover/desabilitar a promessa após decisão de produto. |
| 046 | D | ❌ | Corrigir referência `enviar-push-notification` para `send-push-notification` em migration corretiva nova. |
| 047 | D | 🟡 | Consolidar auth, cota, timeout, cancelamento, custo e auditoria das funções de IA. |
| 048 | D | ❌ | Classificar as 99 funções locais sem JWT: JWT, webhook/HMAC, cron secret, chamada interna ou público controlado. Testar cada exceção. |
| 049 | D | 🟡 | Fazer CI cobrir todos os testes Edge, check e lint reais sem mascaramento. |
| 050 | D | ⛔ | Deploy canário e observação de tráfego requerem autorização, staging e rollback. |
| 051 | E | 🟡 | Certificar rota, página, menu, permissão, dados e estados de erro/vazio para todo o mapa atual. |
| 052 | E | ❌ | Corrigir deep link de alertas preditivos e cobrir navegação direta/command palette. |
| 053 | E | ⛔ | Integrar, arquivar ou retirar páginas órfãs somente após decisão explícita do proprietário. |
| 054 | E | ❌ | Tornar seleção do menu sensível ao hash com testes de histórico/refresh/mobile. |
| 055 | E | ❌ | Eliminar score aleatório de cobranças; usar dado determinístico ou “indisponível”. |
| 056 | E | 🟡 | Garantir persistência canônica e correlação do histórico WhatsApp proativo ponta a ponta. |
| 057 | E | ❌ | Substituir convite placebo por convite real ou UI honesta de intenção. |
| 058 | E | ❌ | Concluir NF-e em homologação real ou isolar visualmente como simulação; nunca aparentar emissão fiscal real. |
| 059 | E | ❌ | Gerar identificadores de boleto somente no backend/provedor homologado, com concorrência testada. |
| 060 | E | ❌ | Corrigir prefetch/imports e duplicidade `usePrefetchRoutes.ts`/`.tsx` com medição e diff mínimo. |
| 061 | F | ❌ | Tornar atualização de oportunidades de elisão atômica e idempotente; preservar estado anterior em falha. |
| 062 | F | 🟡 | Remover `@ts-nocheck` e tratar todos os erros em regras de conciliação. |
| 063 | F | ❌ | Diferenciar vazio real, RLS, indisponibilidade e drift nas queries otimizadas. |
| 064 | F | ❌ | Impedir sucesso integral quando qualquer suboperação da auditoria de conciliação falhar. |
| 065 | F | ❌ | Resolver TODOs de schema individualmente contra o catálogo atual. |
| 066 | F | ❌ | Modelar escrita secundária com atomicidade, compensação ou tolerância observável. |
| 067 | F | ❌ | Revisar awaits Supabase suspeitos caso a caso; corrigir somente erros realmente ignorados. |
| 068 | F | ❌ | Triar TODO/FIXME/HACK, `@ts-nocheck` e `eslint-disable`; não ampliar ignores. |
| 069 | F | ❌ | Mapear objetos sem consumidor para roadmap/owner; lista de decisão, nunca exclusão automática. |
| 070 | F | 🟡 | Completar invariantes de cobrança, boleto, conciliação, fiscal, convite e elisão, incluindo concorrência e falha parcial. |
| 071 | G | ❌ | Alinhar thresholds documentados e reais, elevando gradualmente a partir de baseline comprovado. |
| 072 | G | ❌ | Incluir testes/E2E/apoio no typecheck e avançar strictness por domínio. |
| 073 | G | 🟡 | Executar todos os 35 arquivos Deno atuais ou justificar tecnicamente exclusões explícitas. |
| 074 | G | ❌ | Corrigir Deno lint em lotes revisáveis e remover ` \| \| true`; não gerar mega-diff. |
| 075 | G | ✅ | Preservar a permissão mínima de leitura no comando Deno e seu teste de regressão. |
| 076 | G | ❌ | Fazer `lint:strict` passar sem ignores globais e promovê-lo a gate real. |
| 077 | G | ❌ | Formatar em PRs mecânicos separados; zero mistura com mudança funcional. |
| 078 | G | 🟡 | Corrigir E2E Supabase HTTP 400, tornar ambiente hermético e provar os browsers/projetos prometidos. |
| 079 | G | ❌ | Preparar decisão de lockfile; remover somente o arquivo individualmente aprovado. |
| 080 | G | 🟡 | Fixar Bun/runners/dependências e fazer auditoria de vulnerabilidade bloquear conforme política. |
| 081 | H | ❌ | Definir e aplicar orçamento de bundle por rota; medir chunks grandes atuais. |
| 082 | H | 🟡 | Remover avisos Vite/OXC/esbuild/depreciações e comprovar artefato final. |
| 083 | H | ❌ | Decompor somente hotspots comprovados, preservando arquivos gerados e comportamento. |
| 084 | H | 🟡 | Atualizar mapa arquitetural/Graphify com commit, saúde e limitações explícitas. |
| 085 | H | 🟡 | Completar SLOs, alertas, owner, correlação e runbooks para todo fluxo P0/P1. |
| 086 | H | ❌ | Atualizar documentação e contagens por scripts reproduzíveis, removendo contradições. |
| 087 | I | ⛔ | Apresentar decisão por lockfile; não remover nada sem aprovação. |
| 088 | I | ⛔ | Comparar suíte E2E paralela/Dyad e preservar cobertura exclusiva antes de decidir. |
| 089 | I | ⛔ | Submeter artefatos, relatórios, `sql/` e `db/functions/` individualmente à decisão. |
| 090 | I | ⛔ | Homologar matriz manter/integrar/arquivar/remover/investigar com o proprietário. |
| 091 | J | ⛔ | Preparar staging representativo, backup e rollback; requer autorização e infraestrutura. |
| 092 | J | ⛔ | Ensaiar migrations do zero e sobre baseline somente após genealogia homologada. |
| 093 | J | ⛔ | Implantar segurança apenas em staging autorizado e testar isolamento. |
| 094 | J | ⛔ | Exercitar E2E real de convite, boleto, cobrança, WhatsApp, conciliação, elisão e NF-e. |
| 095 | J | ⛔ | Executar regressão integral do banco e provar diff apenas com exceções aprovadas. |
| 096 | J | ⛔ | Testar carga, indisponibilidade, retries, orçamento e idempotência. |
| 097 | J | ⛔ | Ativar gates operacionais e provar alertas por falha injetada. |
| 098 | J | ⛔ | Fazer rollout canário produtivo com janela e rollback automático. |
| 099 | J | ⛔ | Observar e reconciliar tráfego real entre frontend, Edge, banco e provedores. |
| 100 | J | ⛔ | Solicitar aceite final apenas com zero P0/P1 aberto e dossiê completo. |

## Artifacts previstos (§14)

| Arquivo | Papel | Situação |
|---------|-------|----------|
| `INDICE.md` | este índice | ✅ criado neste PR |
| `MATRIZ_DECISOES.md` | decisões que exigem o proprietário | ✅ criado neste PR |
| `MATRIZ_AUTH_EDGE.md` | 103 funções × contrato de auth | ✅ criado neste PR (classificação estática; testes de runtime pendentes — etapas 042/043/048) |
| `BASELINE_<data>.md` | baseline com hashes | ❌ pendente (etapa 001) |
| `MATRIZ_DIVERGENCIAS_BD.md` | origem/destino/repo | ⛔ depende de MCP (lote B) |
| `GENEALOGIA_MIGRATIONS.md` | 551 migrations × ledger | ❌ pendente (etapa 014) |
| `CANDIDATOS_HIGIENE.md` | manter/integrar/arquivar/remover | ⛔ decisão do proprietário (lote I) |
| `RELATORIO_LOTE_<id>.md` | evidências por lote | ❌ conforme lotes forem executados |
| `RELATORIO_FINAL.md` | dossiê final | ⛔ somente ao término ou parada em gate externo |
