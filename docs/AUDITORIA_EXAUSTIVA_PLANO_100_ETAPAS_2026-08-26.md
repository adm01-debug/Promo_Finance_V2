# Auditoria exaustiva e plano mestre de 100 etapas

**Sistema:** Promo Finance V2  
**Data de corte:** 26 de agosto de 2026  
**Commit auditado:** `b44077fa346c10f0ef66800f494cd518d6406038` (`origin/main`)  
**Banco de origem informado:** `lszcmoymovkpckehlagr`  
**Banco de destino auditado ao vivo:** `bwwbeyolnnzppeuhgkcd`  
**Natureza desta entrega:** diagnóstico e planejamento; nenhuma correção funcional, exclusão ou mutação de banco foi executada.

---

## 1. Conclusão executiva

O sistema tem uma base técnica extensa e vários sinais positivos: o TypeScript do frontend compila, o build de produção conclui, 2.680 testes Vitest passam, todas as 102 Edge Functions presentes no repositório também constam como `ACTIVE` no destino, os 271 objetos classificados como tabelas públicas do destino estão com RLS habilitada e não há índice inválido no inventário ao vivo.

Ainda assim, **não é seguro declarar o sistema pronto para produção**. A auditoria encontrou bloqueadores objetivos:

1. credenciais operacionais estão embutidas em dois arquivos versionados, sem reproduzir os valores neste relatório;
2. uma Edge Function pública de push usa cliente administrativo e alcança todas as inscrições sem autenticação de entrada;
3. o ledger do destino contém migrations inexistentes no commit auditado e omite parte da cadeia local, impedindo provar um replay reprodutível;
4. o banco de origem não pôde ser relido ao vivo nesta execução — o MCP retornou `401` e a API de gestão retornou `403` —, portanto a comparação origem × destino só pode usar o último snapshot documentado, de 25/08/2026, e deve ser tratada como provisória;
5. há recursos fiscais e financeiros que parecem reais na interface, mas ainda usam simulação, aleatoriedade, estado local ou backend inexistente;
6. a execução E2E isolada não é hermética: com variáveis públicas fictícias, 111 de 147 casos falharam principalmente porque o boot depende de Supabase alcançável; isso não prova que 111 recursos estejam quebrados, mas prova que a suíte atual não fornece um gate confiável fora do ambiente canônico;
7. o pipeline mascara lint de Deno e auditoria de dependências e não aplica o gate estrito que o próprio repositório declara.

O diagnóstico correto é: **quase pronto em amplitude de código, mas ainda não pronto em segurança, verdade de schema, integração real e evidência de operação**. Pelo critério do projeto, “pronto” exigirá código, deploy controlado, tráfego real, telemetria e aceite observável — não apenas arquivos existentes.

---

## 2. Garantias, método e limitações

### 2.1 Garantias de integridade

- Toda consulta ao banco de destino foi `SELECT`/somente leitura.
- Nenhuma tabela, coluna, constraint, índice, policy, função, trigger, view, enum, extensão, privilégio, job, migration ou dado foi criado, alterado ou apagado.
- Nenhum candidato a “lixo” foi removido ou movido.
- O repositório original, que já possuía alterações locais, não foi tocado. A auditoria ocorreu no worktree isolado `/tmp/promo-finance-audit-h260826150225`.
- A única alteração versionável desta entrega é este documento.
- Valores de segredos encontrados no código foram deliberadamente omitidos. Eles não devem ser copiados para issue, PR, log ou chat.

### 2.2 Fontes examinadas

- `README.md`, `AGENTS.md` e toda a documentação existente em `docs/` antes de qualquer ação;
- 2.761 arquivos versionados;
- frontend React/TypeScript, rotas, componentes, páginas, hooks, integrações e estado;
- 548 migrations oficiais em `supabase/migrations/`;
- 102 Edge Functions e os módulos em `_shared`;
- 34 scripts em `sql/`, 7 itens em `db/functions/` e os testes/harnesses Supabase;
- workflows, configurações de lint, TypeScript, Vitest, Playwright, Vite, lockfiles e dependências;
- catálogo PostgreSQL ao vivo do destino: schemas, relações, colunas, constraints, índices, RLS, policies, rotinas, triggers, views, enums, extensões, privilégios, publicações, cron e ledger;
- metadata de runtime das Edge Functions do destino;
- tipos Supabase gerados do repositório comparados com tipos regenerados do destino.

### 2.3 Mapeamento estrutural com Graphify

O corpus detectado possui 2.733 arquivos e aproximadamente 1.467.579 palavras. A extração combinou AST e leitura semântica, com 14.253 nós e 42.772 arestas brutas; após normalização, o grafo útil ficou com 14.235 nós, 37.341 arestas e 1.484 comunidades. Os principais hubs são `supabase`, `useAuth`, as rotas de `App.tsx`, formatadores e os componentes centrais do design system.

O diagnóstico do grafo encontrou 4.771 arestas com endpoint não resolvido, uma self-loop e 660 colapsos de pares em modo não direcionado. Isso ocorre sobretudo na junção entre referências SQL/AST, imports externos e IDs semânticos. Portanto, o grafo foi usado como mapa e índice de navegação, **não como prova isolada**; todos os achados críticos foram confirmados diretamente no código, na configuração ou no catálogo do destino.

### 2.4 Limitações que bloqueiam uma conclusão absoluta

- **Origem sem acesso ao vivo:** os números de origem são o snapshot documentado em 25/08/2026, não uma leitura de 26/08/2026.
- **Produção frontend não observada:** não foi fornecida uma URL de produção nem acesso à telemetria de tráfego do frontend. Uma build local bem-sucedida não comprova deploy ou uso real.
- **Dados sensíveis não amostrados:** foram usados metadados e estimativas do catálogo; nenhuma linha de negócio foi exportada.
- **Estimativa não é contagem:** `reltuples = 0` ou `-1` não prova que uma tabela esteja vazia. Tabelas vazias nesta fase são esperadas e nunca foram classificadas automaticamente como lixo.
- **Edge `ACTIVE` não significa correta:** a metadata confirma presença e estado de deploy, mas não substitui teste de contrato, autenticação, observabilidade e tráfego.

---

## 3. Inventário do repositório e arquitetura real

| Área | Estado observado |
|---|---:|
| Arquivos versionados | 2.761 |
| Rotas declaradas em `src/App.tsx` | 129 |
| Links de navegação lateral | 87 |
| Arquivos `.tsx` em `src/pages` | 177 |
| Páginas com `default export` mapeadas | 122 |
| Edge Functions reais, excluindo `_shared` | 102 |
| Seções de função em `supabase/config.toml` | 39 |
| Migrations oficiais | 548 |
| Scripts SQL paralelos em `sql/` | 34 |
| Itens em `db/functions/` | 7 |
| Testes/specs em `src` | 201 arquivos |
| Specs em `e2e/` | 25 arquivos |
| Spec paralelo em `e2e-tests/` | 1 arquivo |
| Testes de Edge localizados | 28 arquivos |
| Workflows GitHub Actions | 5 |

### 3.1 Fluxo arquitetural predominante

```text
Rotas/páginas React
        ↓
hooks e serviços do frontend
        ↓
cliente Supabase ─────→ tabelas/views/RPC com RLS
        └─────────────→ Edge Functions
                              ↓
                      integrações externas, filas,
                      webhooks e cliente service_role

migrations oficiais ─→ contrato esperado do PostgreSQL
tipos gerados ────────→ contrato consumido pelo frontend
cron/pg_net ──────────→ RPCs e Edge Functions agendadas
```

O maior risco arquitetural não é falta de arquivos: é a existência de **múltiplas verdades concorrentes** — migrations, tipos gerados, scripts soltos, `db/functions/`, ledger live e documentos antigos — que hoje não convergem completamente.

### 3.2 Rotas e integração parcial

- `src/App.tsx` é o roteador canônico; há duas páginas completas sem rota confirmada: `src/pages/tributario/ConsultaRapidaFiscal.tsx` e `src/pages/admin/AdminErrosFrontend.tsx`.
- O comando de alertas preditivos navega para `/#alertas-preditivos`, mas o destino real é `/inteligencia#alertas-preditivos` (`CommandPalette.tsx:173-178`).
- O estado ativo do menu considera o pathname, não o hash (`SidebarNavGroups.tsx:282,287`).
- O prefetch cobre somente 17 imports frente a 129 padrões de rota; isso é dívida de desempenho, não necessariamente bug funcional.
- Há nomes de hooks duplicados em extensões `.ts` e `.tsx`, elevando ambiguidade de manutenção.

---

## 4. Evidências de compilação, testes e qualidade

Todos os comandos abaixo foram executados no commit auditado. Variáveis públicas fictícias foram usadas no build/E2E; nenhum segredo real foi introduzido.

| Verificação | Resultado | Interpretação |
|---|---|---|
| `npm run type-check` | **passou** | O escopo real é apenas `src`; testes e E2E estão excluídos, e `strict` está desabilitado. |
| `npm run lint` | **passou com 17 avisos** | O gate permissivo aceita avisos e ignora Edge/scripts. |
| `npm run lint:strict` | **falhou** | Os 17 avisos quebram o gate estrito, que não é usado na CI. |
| `npm run format:check` | **falhou** | 1.470 arquivos reportados com divergência de formatação; não se recomenda formatar tudo num único diff. |
| build de produção | **passou** | 6.102 módulos; `dist` de aproximadamente 36 MB e chunks JS grandes. |
| Vitest | **passou** | 201 arquivos, 2.680 testes, cerca de 14 s. |
| cobertura | **passou no gate atual** | 72,40% statements; 66,36% branches; 63,58% functions; 73,44% lines. |
| `deno lint supabase/functions/` | **falhou** | 551 problemas; a CI usa `|| true`, portanto não bloqueia. |
| `deno check` no conjunto do workflow | **passou** | Quatro módulos do workflow validaram. |
| comando Deno idêntico ao workflow | **falhou** | 67 testes passaram e 2 falharam por permissão de leitura ausente. |
| Deno com `--allow-read` | **passou** | 69 testes; evidencia erro no comando do workflow, não nos dois testes. |
| Playwright Chromium isolado | **inconclusivo/falhou** | 147 casos: 10 passaram, 111 falharam e 26 foram pulados; boot reportou `Failed to fetch` sem backend canônico. |

### 4.1 Cobertura declarada versus gate real

`docs/TESTING.md` promete mínimo de 80%, enquanto `vitest.config.ts` permite aproximadamente 6% para linhas/statements, 18% para funções e 50% para branches. A cobertura observada é bem melhor que o mínimo configurado, mas a política documentada não é aplicada.

### 4.2 Lacunas de CI

- `deno lint ... || true` mascara falhas de backend.
- `bun audit || echo ...` transforma vulnerabilidades em aviso.
- o ESLint ignora `supabase/functions/**` e `scripts/**`;
- TypeScript não verifica testes, E2E nem `src/test`;
- Vitest inclui somente `src`, e o workflow Deno executa um subconjunto fixo;
- Playwright declara cinco projetos, mas a CI roda só Chromium;
- a CI chama `lint`, não `lint:strict`;
- `staging-migrate.yml` usa Bun `latest`, enquanto o CI principal fixa `1.3.11`;
- coexistem `bun.lock`, `bun.lockb` e `package-lock.json`;
- `@supabase/supabase-js` do frontend aceita `^2.38.4`, enquanto o guard das Edge espera `2.49.4`.

### 4.3 Indicadores de dívida no frontend

| Indicador | Quantidade |
|---|---:|
| `TODO`, `FIXME` ou `HACK` em `src` | 46 |
| `@ts-nocheck` | 7 |
| `eslint-disable` | 36 |
| TODOs de schema datados de 14/08/2026 | 36 |
| `Math.random` ou `setTimeout` | 205 ocorrências heurísticas |
| awaits Supabase sem tratamento explícito de `error` | 198 ocorrências heurísticas |

As duas últimas métricas são triagem, não condenação automática: timers, dados de demonstração e operações em que o erro é tratado em outra camada devem ser separados dos fluxos financeiros/fiscais reais.

---

## 5. Inventário ao vivo do banco de destino

Snapshot somente leitura obtido em 26/08/2026. PostgreSQL `17.6`.

| Classe de objeto | Quantidade observada |
|---|---:|
| Schemas | 15 |
| Tabelas públicas | 271 |
| Colunas públicas no `information_schema` | 3.795 |
| Constraints públicas | 775 |
| Índices públicos | 852 |
| Índices inválidos | 0 |
| Tabelas públicas com RLS habilitada | 271/271 |
| Policies públicas | 529 |
| Rotinas públicas | 180 |
| Rotinas `SECURITY DEFINER` | 149 |
| Triggers não internos | 158 |
| Views | 17 |
| Materialized views | 1 |
| Enums públicos | 25, com 154 labels |
| Extensões | 8 |
| Cron jobs ativos | 22 |
| Entradas no ledger de migrations | 28 |
| Constraint `NOT VALID` | 1 |

### 5.1 Schemas

`auth`, `cron`, `extensions`, `graphql`, `graphql_public`, `information_schema`, `net`, `pg_catalog`, `pgbouncer`, `private`, `public`, `realtime`, `storage`, `supabase_migrations`, `vault`.

### 5.2 Extensões

| Extensão | Versão |
|---|---:|
| `pg_net` | 0.20.0 |
| `pg_stat_statements` | 1.11 |
| `pg_trgm` | 1.6 |
| `pgcrypto` | 1.3 |
| `uuid-ossp` | 1.1 |
| `pg_cron` | 1.6.4 |
| `plpgsql` | 1.0 |
| `supabase_vault` | 0.3.1 |

### 5.3 Views e materialized view

- Materialized view: `mv_performance_alerts_weekly`.
- Views: `extratos_bancarios_importados`, `v_sefaz_observability`, `v_table_bloat`, `vw_contas_pagar_painel`, `vw_contas_receber_painel`, `vw_dre_mensal`, `vw_dso_aging`, `vw_edge_health`, `vw_fluxo_caixa`, `vw_fluxo_caixa_diario`, `vw_gastos_centro_custo`, `vw_metricas_cobranca`, `vw_rpc_hotspots`, `vw_rpc_slow_calls`, `vw_saldos_contas`, `vw_tributario_dashboard`, `vw_webhooks_recentes`.

### 5.4 Enums

`alert_severity`, `alert_type`, `app_role`, `approval_priority`, `approval_status`, `atividade_economica`, `delivery_outcome`, `driver_status`, `incident_severity`, `incident_type`, `nfe_manifestacao_status`, `nfe_schema_tipo`, `nivel_risco`, `order_status`, `org_papel`, `prioridade_alerta`, `regiao_brasil`, `regime_tributario_enum`, `sefaz_ambiente`, `status_workflow`, `tipo_alerta_tributario`, `tipo_cobranca`, `tipo_destinatario`, `uf_brasil`, `vehicle_type`.

Os enums de motorista, entrega, incidente, pedido, veículo e alertas de logística sobreviveram à remoção das tabelas Lalamove. Isso pode ser compatibilidade intencional ou resíduo; **não deve ser removido sem verificar dependências e obter autorização explícita**.

### 5.5 Publicação realtime

Foram observadas oito relações publicadas: `public.performance_alerts` e sete partições diárias de `realtime.messages`. A presença de `performance_alerts` está coerente com a migration de hardening e parece intencional.

### 5.6 Jobs

Os 22 jobs abaixo estão ativos:

| Job | Agenda |
|---|---|
| `executar-regua-cobranca-diaria` | `0 12 * * *` |
| `capture-slow-queries` | `*/15 * * * *` |
| `cleanup-cron-logs` | `0 4 * * 0` |
| `cleanup-expired-tokens` | `0 1 * * *` |
| `cleanup-login-attempts` | `30 1 * * *` |
| `cleanup-rpc-obs-metrics-daily` | `0 5 * * *` |
| `daily-log-cleanup` | `0 6 * * *` |
| `detect-query-regressions-5min` | `*/5 * * * *` |
| `integrity-invariants-hourly` | `45 * * * *` |
| `maintain-monthly-partitions` | `0 0 1 * *` |
| `monitor-table-bloat-daily` | `0 2 * * *` |
| `pgss-baseline-cleanup` | `0 23 * * 0` |
| `recarregar-seeds-fiscais-diario` | `0 0 * * *` |
| `refresh-performance-alerts-weekly` | `0 1 * * 0` |
| `sefaz-observability-hourly` | `15 * * * *` |
| `snapshot-table-bloat-daily` | `30 2 * * *` |
| `gerar-alertas-vencimento-diario` | `0 8 * * *` |
| `gerar-contas-recorrentes-diario` | `35 3 * * *` |
| `processar-regua-cobranca-diario` | `0 9 * * *` |
| `pgss-weekly-baseline` | `0 4 * * 0` |
| `cron-failure-watch` | `10 * * * *` |
| `daily-log-retention` | `0 3 * * *` |

No último estado disponível, 17 já haviam executado com sucesso e cinco ainda nunca haviam chegado ao horário semanal/mensal. Não havia job atual com última execução falha. `sefaz-observability-hourly` e `cron-failure-watch` tiveram falhas históricas nos 30 dias consultados, mas a execução mais recente estava bem-sucedida. Assim, documentos antigos que afirmam “2 jobs falhando” estão desatualizados.

### 5.7 Estimativas de volume

O catálogo apontou 64 tabelas com estimativa positiva, 149 com estimativa zero e 58 com estatística desconhecida (`-1`), total aproximado de 10.938 linhas estimadas. Essas cifras servem apenas para priorizar inspeção. **Nenhuma das 149 tabelas foi marcada como lixo**, pois uma tabela nova ou esvaziada intencionalmente pode estar correta.

---

## 6. Origem, destino, tipos e migrations

### 6.1 Origem: evidência datada, não revalidada

O último documento de auditoria de 25/08/2026 registra para a origem: 279 tabelas públicas, 3.891 colunas, 855 constraints, 908 índices, 507 policies, 173 funções e 31 cron jobs. Esses números **não podem ser apresentados como estado atual de 26/08/2026** porque ambos os caminhos fornecidos recusaram a autenticação disponível.

Antes de qualquer migration corretiva ou destrutiva, é obrigatório restabelecer o acesso somente leitura à origem e gerar um snapshot novo, com hash, timestamp e consultas reproduzíveis.

### 6.2 Tipos do repositório versus tipos do destino

| Contrato tipado | Repositório | Destino regenerado |
|---|---:|---:|
| Tabelas | 279 | 271 |
| Colunas `Row` de tabelas | 3.537 | 3.577 |
| Views tipadas | 25 | 18 |
| Funções expostas no typegen | 97 | 87 |
| Enums do typegen | 28 | 28 |

Essa comparação é **tipos do commit × typegen do destino**, não origem live × destino live. O catálogo contém 180 rotinas; o typegen expõe apenas o subconjunto PostgREST relevante.

Tabelas presentes apenas nos tipos do repositório:

`active_tracking`, `audit_logs_2026_11`, `bitrix24_sync`, `driver_approval_queue`, `driver_evaluations`, `driver_incidents`, `driver_locations`, `drivers`, `frontend_error_logs_2026_11`, `lalamove_orders`, `lalamove_status_history`, `lalamove_stops`, `lalamove_uapi_sessions`, `tracking_events`.

Tabelas presentes apenas no typegen do destino:

`audit_logs_2026_01`, `estrategias_elisao_catalogo`, `frontend_error_logs_2026_01`, `frontend_error_logs_2026_02`, `frontend_error_logs_2026_03`, `frontend_error_logs_2026_04`.

Views presentes apenas nos tipos do repositório:

`drivers_safe_view`, `estrategias_elisao_catalogo` (no destino é tabela), `mv_benchmark_setorial`, `orders_operator_view`, `orders_safe_view`, `vw_auditoria_tributaria_recente`, `vw_transferencias_painel`.

O destino possui colunas adicionais em 51 tabelas compartilhadas. Isso confirma que `src/integrations/supabase/types.ts` está defasado e explica parte dos sete `@ts-nocheck` e dos 36 TODOs de schema.

### 6.3 Ledger de migrations

O repositório possui 548 migrations, mas o ledger live contém 28 entradas. Seis versões do ledger não existem neste commit:

- `20260826010000_restaurar_exec_sql_wrapper_e03`;
- `20260826020000_fix_cron_source_check_e23_e24`;
- `20260826030000_add_colunas_ausentes_e30`;
- `20260826040000_fechar_policies_abertas_e06_e08`;
- `20260826050000_revoke_execute_authenticated_e09`;
- `20260827090000_reconciliar_integration_secrets_sem_drop` — inclusive com data posterior ao corte.

Ao mesmo tempo, a migration local `20260825250000_recreate_6_constraints.sql` não aparece no ledger. A maior parte da história anterior também não foi registrada nele. Isso pode representar baseline manual, aplicação fora da branch ou edição direta do ledger; até que a proveniência seja reconstruída, o destino não é reproduzível a partir de `main`.

### 6.4 Classificação das diferenças

| Diferença | Classificação | Fundamentação |
|---|---|---|
| Remoção das tabelas Lalamove/driver/tracking | Intencional, com resíduos | Há migration explícita de descomissionamento; enums, sequence e corpo de função ainda precisam ser reconciliados. |
| Hardening de extensões e publicação de `performance_alerts` | Intencional | Coerente entre migration e runtime. |
| Partições mensais diferentes | Pendente de confirmação | Partições variam com calendário/retenção; não são perda automática. |
| `estrategias_elisao_catalogo` como view no tipo antigo e tabela no destino | Pendente de confirmação | Mudança de natureza exige contrato e policy explícitos. |
| Ledger com arquivos inexistentes no commit | Perda de proveniência real | Não se consegue reproduzir nem revisar o que foi aplicado. |
| Tipos defasados em 51 tabelas | Perda real de contrato | Já força `@ts-nocheck` e payloads parciais. |
| `check_integrity_invariants` live ainda referenciando logística removida | Perda real | O corpo não acompanha o descomissionamento intencional. |
| Dois triggers de `updated_at` em `organizacao_membros` | Perda real | Executam a mesma responsabilidade duas vezes. |
| Views antigas de driver/order | Provavelmente intencional | Coerente com Lalamove, mas a remoção de tipos/docs deve ser autorizada. |
| `driver_locations_id_seq` sobrevivente | Candidato órfão | Possui privilégios `anon`; dependências devem ser provadas antes de qualquer remoção. |

---

## 7. Segurança e isolamento de tenants

### 7.1 Achados bloqueadores

| Prioridade | Achado | Evidência e impacto |
|---|---|---|
| P0 | Segredos versionados em `compare-schemas` | `supabase/functions/compare-schemas/index.ts:17-20` contém URL/chaves de outro projeto; a função está com `verify_jwt=false` e não valida autenticação própria. Rotacionar/revogar sem reproduzir os valores. |
| P0 | Token operacional como fallback | `scripts/mcp-phd-suite.mjs:13` contém fallback hardcoded. Remover do histórico corrente não basta: é preciso revogar/rotacionar. |
| P0 | Push público com privilégio administrativo | `send-push-notification` está `verify_jwt=false`, cria cliente service-role, lê todas as inscrições e insere alertas fallback sem autenticação de entrada. Permite abuso de fan-out e escrita privilegiada. |
| P1 | Endpoints de IA custosos expostos | `expert-agent` e `analyze-document` dependem apenas de rate limit por IP, sem identidade/autorização de usuário. |
| P1 | Privilégios amplos de `authenticated` | O catálogo reporta todas as permissões relacionais, inclusive `TRUNCATE`, em 284 relações; RLS reduz acesso a linhas, mas não justifica privilégio de DDL/DML excessivo. |
| P1 | Grants anônimos residuais | `frontend_error_logs` permite `INSERT` anônimo; `driver_locations_id_seq` e `rpc_observability_metrics_id_seq` expõem privilégios de sequence. O primeiro pode ser telemetria intencional, mas precisa antiabuso. |

### 7.2 RLS e policies

- 271/271 tabelas públicas estão com RLS habilitada — sinal positivo.
- Existem 529 policies.
- `estrategias_elisao_catalogo` tem RLS habilitada sem policy: é **fail-closed**, portanto não é vazamento, mas pode tornar a funcionalidade inutilizável.
- Foram detectadas 23 policies com expressão literal `true`. A classificação automática gera falsos positivos: várias são leitura global de catálogos fiscais para `authenticated`, e outras pertencem somente a `service_role`. Cada uma deve ser julgada com o papel alvo; `true` sozinho não prova exposição pública.
- `frontend_error_logs` aceita inserção anônima. Pode ser desenho de telemetria, mas precisa limite, validação de payload, proteção contra PII e retenção.

### 7.3 Funções e privilégios de execução

- Nenhuma rotina pública foi encontrada com `EXECUTE` concedido a `PUBLIC`.
- `anon` pode executar duas rotinas: `gerar_numero_acordo()` e `resolve_sso_providers_for_domain(...)`. A segunda pode fazer parte do início de SSO; a primeira precisa justificativa e teste de abuso.
- `authenticated` pode executar 72 rotinas e `service_role`, 180.
- Todas as 149 `SECURITY DEFINER` inventariadas têm alguma configuração de `search_path`, mas “alguma configuração” não significa hardening completo. `has_any_role` e `empresa_membro_ativo` usam `public` sem `pg_catalog` explícito e divergem da convenção mais segura do projeto.

### 7.4 Sobrecargas e RPC

Sete nomes estão sobrecarregados: `close_stale_integrity_alerts`, `escalate_stale_integrity_alerts`, `get_performance_alerts`, `purge_old_rows`, `registrar_evento_receber`, `resolve_integrity_alert`, `watch_cron_failures`.

Sobrecarga não é bug por si só. Porém, assinaturas com defaults ou payloads nomeados sobrepostos podem gerar ambiguidade no PostgREST. `get_performance_alerts` e `registrar_evento_receber` possuem callers reais no frontend e devem ser tratados como P1 até haver teste de contrato. `watch_cron_failures` já teve combinação sem argumentos versus argumentos defaultados que coincide com falha histórica de cron.

### 7.5 Constraints, índices e triggers

- Zero índices inválidos.
- Uma constraint permanece `NOT VALID`: `faixas_simples_nacional.faixas_simples_reparticao_soma_chk`.
- Há dois triggers ativos de `updated_at` em `organizacao_membros`: `trg_org_membros_updated_at` e `trg_organizacao_membros_updated_at`.
- A migration `20260825110000_reconciliar_schema_v3_completo.sql:4145-4147` usa `DROP FUNCTION ... CASCADE` em `set_empresa_id_from_profile`, com risco de apagar dependências durante replay parcial.

---

## 8. Edge Functions e automações

### 8.1 Presença no runtime

Os 102 diretórios locais correspondem exatamente às 102 funções `ACTIVE` do destino: não há nome local ausente no runtime nem função live sem diretório local. A metadata live aponta 45 com `verify_jwt=false` e 57 com `verify_jwt=true`.

Isso corrige documentos antigos que afirmavam dezenas de deploys ausentes. O problema atual não é quantidade de deploy, mas contrato e autenticação. `supabase/config.toml` declara explicitamente apenas 39 das 102 funções, portanto 63 dependem de metadata/defaults fora do arquivo canônico.

### 8.2 Funções ausentes ou sem ligação

| Recurso | Estado |
|---|---|
| `api-keys-manage` | O frontend chama a função, mas não existe diretório local nem deploy live; a própria UI admite simulação. |
| `webhook-financeiro` | Há expectativa/caller de produto, mas não há implementação canônica correspondente. |
| `migrate-helper` | Ausência parece intencional; era ferramenta de migração, não endpoint de produto. |
| Push de performance | A migration chama `/enviar-push-notification`, enquanto a função real é `send-push-notification`. |
| WhatsApp proativo | A Edge é chamada, mas a tela não usa `useCreateWhatsAppCobranca`; o histórico de cobrança pode não ser persistido. |

### 8.3 Controles já bem implementados

- webhook Asaas possui token e idempotência;
- webhook WhatsApp valida assinatura;
- integrações n8n usam secrets;
- módulos compartilhados oferecem guard de autenticação, contratos versionados, validação e rate limit.

Esses padrões devem ser reutilizados nos endpoints públicos frágeis, não recriados de forma paralela.

---

## 9. Funcionalidades incompletas, simuladas ou frágeis

| Módulo/fluxo | Estado real | Risco |
|---|---|---|
| Convite de usuário | `ConviteUsuarioDialog.tsx:31` grava apenas `audit_logs`, mas anuncia “Convite enviado”; não cria convite, email ou papel. | Onboarding placebo e acesso não provisionado. |
| Gestão de API keys | `useApiKeys.ts:44-64` chama `api-keys-manage`, explicitamente não implantada. | Tela parcial; criação/rotação não confiável. |
| NF-e | `NotasFiscais.tsx`, `NovaNFeForm.tsx` e `ContingenciaNFe.tsx` usam mocks, timers, aleatoriedade e estado local em fluxos apresentados como emissão/SEFAZ. | Operação fiscal aparente sem persistência/integração real. |
| Boleto “system” | `useBoletos.ts:62-83` gera linha digitável e código de barras com `Math.random` antes de insert real. | Documento financeiro potencialmente inválido. |
| Oportunidades de elisão | `useOportunidadesElisao.ts:128-154` apaga registros antigos antes de inserir os novos, sem transação e sem verificar erro do delete. | Perda de dados se o insert falhar. |
| Regras de conciliação | `useRegrasConciliacao.ts` usa `@ts-nocheck` e ignora erros de select/update/insert. | Aprendizado silenciosamente perdido. |
| Queries “otimizadas” | `useOptimizedQueries.ts` converte falha em `data || []`. | RLS, indisponibilidade e schema drift parecem “sem dados”. |
| Auditoria de conciliação | `useConciliacaoAudit.ts` não verifica falha de leitura e sempre pode emitir sucesso. | Falso positivo de auditoria. |
| Histórico de boletos | Escritas secundárias de histórico não verificam retorno. | Estado principal sem trilha correspondente. |
| Cobranças | `Cobrancas.tsx:232-233` mistura dados reais com `CustomerDeepScore` aleatório. | Métrica artificial influenciando decisão. |
| WhatsApp proativo | Envia pela Edge, mas não registra pelo hook canônico de histórico. | Canal executado sem rastreabilidade completa. |
| Alertas preditivos | Deep link do command palette aponta para hash/rota errados. | Navegação quebra ou abre seção incorreta. |
| Sidebar com hash | Estado ativo ignora `location.hash`. | Destaque incorreto entre subtelas. |
| Páginas órfãs | `ConsultaRapidaFiscal` e `AdminErrosFrontend` não têm rota confirmada. | Código completo, porém inalcançável. |

### 9.1 TODOs de schema

Há 36 TODOs datados de 14/08/2026 em hooks como `useImportacaoXMLNFe`, `useCreditosTributarios`, `useFinancialOperations` e `useAlertasTributarios`. Vários payloads omitem campos porque os tipos estão defasados. Cada TODO deve ser cruzado com catálogo e migration: uma coluna removida intencionalmente deve limpar o código; uma coluna live ausente no tipo deve regenerar o contrato; nenhum caso deve permanecer silenciado por `@ts-nocheck`.

---

## 10. Higiene do repositório — candidatos para sua validação

**Nenhum item desta tabela foi removido.** “Sem referência” não é sinônimo de lixo; scripts de recuperação, documentação histórica e caminhos alternativos podem ser deliberados.

| Candidato | Evidência | Risco | Recomendação antes de decidir |
|---|---|---:|---|
| `bun.lockb` | CI usa `bun.lock`; nenhuma referência encontrada. | Médio | Validar que nenhuma ferramenta antiga ainda o consome; depois pedir autorização para remover. |
| `package-lock.json` | CI usa Bun, mas README ainda oferece `npm install`. | Alto | Decidir oficialmente se npm continua suportado. |
| `e2e-tests/` + `playwright-dyad.config.ts` | Trilha paralela com um teste; CI usa `e2e/`. | Médio | Confirmar se Dyad ainda faz parte do fluxo. |
| `supabase/tests/test_results*.json` | Snapshots gerados e datados, versionados. | Baixo | Arquivar ou remover somente após decidir política de evidência. |
| harnesses Supabase | Paths externos hardcoded e uma URL de destino com typo. | Médio | Corrigir/parametrizar antes de classificar. |
| `db/functions/` | 6 de 7 itens não entram em migrations. | Médio | Definir se é biblioteca documental ou fonte operacional. |
| `sql/` | 34/34 scripts sem replay oficial; alguns contêm `DROP ... CASCADE`. | Alto | Inventariar intenção individual; nunca executar ou apagar em bloco. |
| cinco relatórios de restyle/handoff na raiz | Sem referências internas. | Baixo | Arquivar após validação histórica. |
| `AI_RULES.md`, `SECURITY_RULES.md`, `.hermes.md` | Sem referência por código, mas úteis a agentes/processo. | Alto | Manter. |
| docs de testes/inventário/Edge/scripts/estado | Contagens e comandos estão desatualizados. | Nenhum | Corrigir; não remover. |

Os candidatos mais perigosos são `sql/fix_user_active_filters.sql`, `sql/views_corrigidas.sql`, `sql/fix_divergencias_col.sql` e `sql/tabelas_ausentes_r5.sql`: contêm operações destrutivas ou representam outra fonte de verdade. Eles devem permanecer intocados até análise individual e sua autorização explícita.

---

## 11. Registro priorizado de achados

### P0 — bloquear promoção

1. Segredos versionados em `compare-schemas` e `mcp-phd-suite`.
2. `send-push-notification` pública com acesso administrativo e fan-out global.
3. Proveniência de migrations do destino não reprodutível a partir de `main`.
4. Impossibilidade de revalidar a origem ao vivo; comparação final bloqueada.

### P1 — corrigir antes de tráfego real

1. endpoints de IA sem identidade/autorização;
2. privilégios de `authenticated` excessivos;
3. RPCs potencialmente ambíguas;
4. trigger duplicado;
5. função de integridade ainda referenciando módulo removido;
6. operação de elisão que apaga antes de inserir sem transação;
7. NF-e, boleto e convite apresentados como reais, mas simulados/parciais;
8. Edge `api-keys-manage` ausente;
9. nome errado da função push em migration;
10. falhas Supabase mascaradas como listas vazias/sucesso.

### P2 — robustez e governança

1. tipos defasados e `@ts-nocheck`;
2. constraint não validada;
3. RLS fail-closed sem policy na nova tabela de estratégias;
4. policies literais `true` sem classificação documentada por role;
5. 63 Edge Functions sem seção explícita em `config.toml`;
6. CI permissiva e Deno lint mascarado;
7. E2E dependente do ambiente, pouco hermético;
8. três lockfiles e duas trilhas Playwright;
9. scripts SQL e funções paralelas fora do replay;
10. documentação factual envelhecida.

### P3 — manutenção e desempenho

1. prefetch de rotas parcial;
2. chunks grandes no build;
3. arquivos manuais muito extensos;
4. nomes de hooks ambíguos;
5. relatórios históricos sem política de arquivo.

---

## 12. Regras de execução do plano

- Cada etapa que altera banco ou remove/move arquivo exige **AUTORIZAÇÃO EXPLÍCITA** do proprietário, além de backup e rollback.
- Nenhuma alteração destrutiva será agrupada com correção funcional.
- Toda migration deve ser aditiva/idempotente quando possível e testada primeiro em banco efêmero e staging.
- Toda conclusão deve anexar evidência: comando, resultado, hash, timestamp e ambiente.
- Uma funcionalidade só muda para “pronta” após código + testes + deploy + tráfego controlado + telemetria + aceite.
- As etapas são ordenadas; etapas com “bloqueia” devem impedir a próxima onda.

---

## 13. Plano mestre de melhorias e correções — exatamente 100 etapas

## Onda 1 — verdade operacional e contenção

### Etapa 001 — Congelar a linha de base auditável

- **Prioridade:** P0 de governança.
- **Ação:** registrar commit, data, versões das ferramentas, consultas e checksums dos inventários somente leitura.
- **Aceite:** snapshot reproduzível, sem escrita em banco/produção, guardado junto ao dossiê da execução.

### Etapa 002 — Instituir uma matriz única de severidade

- **Prioridade:** P0 de governança.
- **Ação:** classificar cada achado como P0–P3 e como vulnerabilidade, perda real, drift, implementação parcial, dívida ou falso positivo.
- **Aceite:** todo achado possui evidência, impacto, responsável sugerido e condição objetiva de encerramento.

### Etapa 003 — Conter `compare-schemas`

- **Prioridade:** P0.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** desabilitar temporariamente ou autenticar o endpoint e revogar/rotacionar as credenciais codificadas.
- **Aceite:** credenciais antigas inválidas, nenhum segredo no código e requisições anônimas rejeitadas em staging e produção.

### Etapa 004 — Conter `send-push-notification`

- **Prioridade:** P0.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** impedir acesso anônimo à função administrativa e limitar assinatura, envio e fallback por tenant/usuário.
- **Aceite:** chamadas sem identidade falham e testes negativos comprovam que não há leitura, envio ou escrita cruzada.

### Etapa 005 — Conter consumo público de IA

- **Prioridade:** P1 alto.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** proteger `expert-agent` e `analyze-document` com autenticação, autorização, cota, orçamento e limites por usuário/empresa.
- **Aceite:** anônimos não consomem provedores pagos e testes de abuso exercitam todos os limites.

### Etapa 006 — Revogar o token exposto da suíte MCP

- **Prioridade:** P0 se ainda válido; P1 mesmo se expirado.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** remover o fallback de `scripts/mcp-phd-suite.mjs`, rotacionar a credencial e exigir secret externo.
- **Aceite:** o token anterior não autentica e as varreduras não encontram valor utilizável no conteúdo corrente.

### Etapa 007 — Formalizar a regra de não destruição

- **Prioridade:** P0 de governança.
- **Ação:** registrar que objeto de banco ou candidato a limpeza só pode mudar após decisão explícita com alvo, dependências, impacto, backup e rollback.
- **Aceite:** todo `DROP`, `TRUNCATE`, revogação, remoção ou arquivamento proposto está bloqueado por um registro de decisão.

### Etapa 008 — Publicar o veredito real de prontidão

- **Prioridade:** P0 de governança.
- **Ação:** manter um painel que diferencie “codificado”, “testado”, “implantado”, “observado com tráfego” e “aceito”.
- **Aceite:** nenhum módulo simulado ou apenas implantado aparece como pronto para produção.

### Etapa 009 — Executar varredura ampliada de segredos

- **Prioridade:** P0.
- **Ação:** examinar código, histórico Git, migrations, scripts, docs e artefatos; o relatório deve mascarar todos os valores.
- **Aceite:** cada ocorrência confirmada tem plano de revogação/rotação e prevenção no CI, sem expor a credencial.

### Etapa 010 — Fechar o portão de contenção

- **Prioridade:** P0.
- **Ação:** bloquear mudanças funcionais de produção enquanto credenciais válidas estiverem expostas ou endpoints administrativos permanecerem públicos.
- **Aceite:** todos os P0 de contenção possuem correção implantada, revisão independente e teste negativo em runtime.

## Onda 2 — proveniência, origem e reprodutibilidade

### Etapa 011 — Restabelecer acesso somente leitura à origem

- **Prioridade:** P0 de governança.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** reautorizar o MCP ou fornecer uma credencial estritamente read-only para `lszcmoymovkpckehlagr`.
- **Aceite:** consultas `SELECT` funcionam e DDL, DML e ações administrativas continuam tecnicamente bloqueadas.

### Etapa 012 — Recoletar o catálogo completo da origem

- **Prioridade:** P0 de governança.
- **Ação:** inventariar schemas, tabelas, colunas, constraints, índices, RLS, policies, funções, triggers, views, enums, extensões, grants, jobs e ledger.
- **Aceite:** um snapshot atual, com hash e timestamp, substitui explicitamente os números datados de 25/08/2026.

### Etapa 013 — Revalidar o catálogo do destino

- **Prioridade:** P1.
- **Ação:** repetir a coleta ao vivo que encontrou 271 tabelas, 3.795 colunas, 775 constraints, 852 índices, 529 policies, 180 rotinas, 158 triggers, 18 views/matviews e 22 jobs.
- **Aceite:** duas coletas concordam ou cada variação é explicada por evento e timestamp conhecidos.

### Etapa 014 — Construir a genealogia das 548 migrations

- **Prioridade:** P0 de governança.
- **Ação:** associar cada migration a objetos/efeitos e confrontá-la com as 28 versões do ledger live.
- **Aceite:** cada arquivo está marcado como aplicado, consolidado, substituído, ausente, destino-only ou indeterminado.

### Etapa 015 — Internalizar migrations existentes apenas no destino

- **Prioridade:** P0 de governança.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** obter o SQL real e versionar as seis versões destino-only; nunca reconstruí-las por suposição nem reaplicar efeitos cegamente.
- **Aceite:** `main` contém a proveniência revisada e um replay novo converge sem duplicar a alteração live.

### Etapa 016 — Explicar a migration local ausente no ledger

- **Prioridade:** P1.
- **Ação:** investigar por que `20260825250000_recreate_6_constraints.sql` existe no commit, mas não no destino.
- **Aceite:** evidência conclui se não se aplica, falhou, foi substituída ou representa perda de deploy.

### Etapa 017 — Separar legado do replay oficial

- **Prioridade:** P1.
- **Ação:** classificar os 34 scripts de `sql/` e os sete itens de `db/functions/` como fonte oficial, biblioteca, diagnóstico ou legado.
- **Aceite:** nenhum script paralelo entra no caminho de deploy sem revisão de dependências e aprovação explícita.

### Etapa 018 — Regenerar tipos por ambiente

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** gerar contratos separados de origem e destino e atualizar o tipo consumido pelo frontend após homologar a fonte canônica.
- **Aceite:** diferenças entre 279 tabelas tipadas no repositório e 271 no destino ficam explicadas sem `@ts-nocheck` compensatório.

### Etapa 019 — Produzir diff semântico tripartido

- **Prioridade:** P0 de governança.
- **Ação:** comparar origem atual × destino × migrations/tipos, classificando cada diferença como intencional, perda real ou pendente.
- **Aceite:** nenhuma ausência vira “perda” apenas por tabela estar vazia, particionada ou descomissionada.

### Etapa 020 — Homologar a fonte de verdade

- **Prioridade:** P0 de governança.
- **Ação:** obter decisão registrada do proprietário sobre a baseline que rege cada domínio e sobre a desativação definitiva da origem, se aplicável.
- **Aceite:** toda mudança posterior referencia baseline, diff e decisão aprovados.

## Onda 3 — schema, constraints, índices, RLS e privilégios

### Etapa 021 — Julgar as 14 tabelas presentes só nos tipos

- **Prioridade:** P1.
- **Ação:** investigar partições, Bitrix e objetos de driver/Lalamove/tracking, separando descomissionamento intencional de perda.
- **Aceite:** cada tabela tem consumidor, migration, retenção e decisão; nenhuma recriação ou exclusão automática.

### Etapa 022 — Julgar as seis tabelas presentes só no destino

- **Prioridade:** P1.
- **Ação:** analisar `audit_logs_2026_01`, `estrategias_elisao_catalogo` e as quatro partições mensais de erros frontend.
- **Aceite:** origem de criação, owner, retenção e presença esperada em migrations estão documentados.

### Etapa 023 — Reconciliar as sete views ausentes no destino

- **Prioridade:** P1.
- **Ação:** avaliar views de drivers/pedidos, `mv_benchmark_setorial`, auditoria tributária e transferências com base em consumidores reais.
- **Aceite:** cada ausência é intencional, obsoleta ou perda comprovada; nenhuma view é criada/apagada por nome apenas.

### Etapa 024 — Reconciliar colunas divergentes

- **Prioridade:** P1.
- **Ação:** mapear as colunas adicionais do destino em 51 tabelas compartilhadas contra queries, payloads, defaults e tipos.
- **Aceite:** toda coluna tem proveniência, nulabilidade, default e contrato de uso conhecidos.

### Etapa 025 — Resolver a constraint não validada

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** procurar dados incompatíveis e só então validar `faixas_simples_nacional.faixas_simples_reparticao_soma_chk`.
- **Aceite:** `convalidated=true`, zero linha inválida e rollback ensaiado antes da execução.

### Etapa 026 — Auditar os 852 índices

- **Prioridade:** P1.
- **Ação:** correlacionar índices com FKs, filtros RLS e workload; índice sem uso recente não deve ser chamado de lixo.
- **Aceite:** ausências/redundâncias têm evidência de plano, custo de escrita, tamanho, consultas e janela de observação.

### Etapa 027 — Tornar utilizável `estrategias_elisao_catalogo`

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** criar policies mínimas se a tabela for realmente consumida; hoje a RLS fail-closed não possui policy.
- **Aceite:** acesso autorizado funciona e acessos anônimo e cross-tenant continuam negados.

### Etapa 028 — Revisar as 529 policies

- **Prioridade:** P0 de isolamento.
- **Ação:** classificar as 23 expressões `true` pelo papel e operação, separando catálogos autenticados e policies `service_role` de exposição indevida.
- **Aceite:** matriz CRUD e testes positivos/negativos demonstram isolamento multiempresa; falsos positivos ficam registrados.

### Etapa 029 — Reduzir privilégios amplos de `authenticated`

- **Prioridade:** P0 de isolamento.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** substituir `GRANT ALL`, inclusive `TRUNCATE`, por privilégios mínimos compatíveis com RLS e RPCs.
- **Aceite:** o papel não possui operação administrativa desnecessária e todos os fluxos legítimos continuam funcionando em staging.

### Etapa 030 — Sanear privilégios anônimos

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** revisar insert em `frontend_error_logs` e grants nas sequences `driver_locations_id_seq` e `rpc_observability_metrics_id_seq`.
- **Aceite:** telemetria pública possui antiabuso/validação e nenhuma sequence concede capacidade sem consumidor justificado.

## Onda 4 — funções, triggers, views e jobs

### Etapa 031 — Catalogar contratos das 180 rotinas

- **Prioridade:** P1.
- **Ação:** relacionar assinatura, owner, volatilidade, segurança, grants, callers e dependências de cada função/procedure.
- **Aceite:** todas as diferenças entre catálogo, typegen e repositório têm explicação individual.

### Etapa 032 — Remover referências residuais de Lalamove da integridade

- **Prioridade:** P1 alto.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** corrigir `check_integrity_invariants`, cujo corpo live ainda consulta conceitos descomissionados.
- **Aceite:** a função executa sem objetos removidos e preserva todas as invariantes financeiras ainda válidas.

### Etapa 033 — Desambiguar as sete famílias sobrecarregadas

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** testar PostgREST/callers e consolidar apenas overloads comprovadamente ambíguos; qualificar o restante.
- **Aceite:** `get_performance_alerts`, `registrar_evento_receber`, `watch_cron_failures` e demais famílias resolvem deterministicamente.

### Etapa 034 — Endurecer as 149 `SECURITY DEFINER`

- **Prioridade:** P0 de segurança.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** revisar owner, qualificação, `search_path`, entradas e isolamento; incluir `pg_catalog` quando necessário.
- **Aceite:** checklist e testes demonstram ausência de shadowing, escalada e vazamento entre empresas.

### Etapa 035 — Aplicar mínimo privilégio de execução

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** revisar as duas rotinas para `anon`, 72 para `authenticated` e 180 para `service_role`.
- **Aceite:** cada `EXECUTE` tem consumidor comprovado; `gerar_numero_acordo()` não permanece anônimo sem justificativa formal.

### Etapa 036 — Consolidar triggers duplicados de organização

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** provar a redundância entre `trg_org_membros_updated_at` e `trg_organizacao_membros_updated_at` e retirar apenas o aprovado.
- **Aceite:** uma atualização produz exatamente um efeito esperado e as dependências históricas permanecem íntegras.

### Etapa 037 — Validar os 158 triggers não internos

- **Prioridade:** P1.
- **Ação:** mapear evento, ordem, função, custo, comportamento de falha e consumidor de cada trigger.
- **Aceite:** todo trigger possui propósito, teste e owner; itens sem consumidor entram apenas na lista para decisão.

### Etapa 038 — Certificar as views e a materialized view

- **Prioridade:** P1.
- **Ação:** comparar definição, dependências, segurança e consumidores das 17 views e de `mv_performance_alerts_weekly`.
- **Aceite:** colunas, filtros tenant, owner e refresh são testados com dados representativos.

### Etapa 039 — Revalidar os 22 jobs ativos

- **Prioridade:** P1.
- **Ação:** observar os cinco que ainda não chegaram ao calendário e as falhas históricas de SEFAZ/cron watcher.
- **Aceite:** cada job executa em janela controlada ou possui teste equivalente e próxima execução monitorada.

### Etapa 040 — Reconciliar cron com origem e migrations

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** criar, alterar ou remover jobs somente após explicar 22 atuais versus 31 do snapshot datado da origem.
- **Aceite:** schedule, comando, owner, timeout, retry, destino e alerta estão versionados e homologados.

## Onda 5 — Edge Functions

### Etapa 041 — Versionar o catálogo das 102 Edge Functions

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** expandir a configuração hoje explícita para 39 funções, registrando auth, secrets requeridos e contratos das 102.
- **Aceite:** nomes locais/live permanecem 102/102 e nenhuma flag crítica depende de default implícito.

### Etapa 042 — Reconstruir `compare-schemas` com segurança

- **Prioridade:** P0.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** usar secrets rotacionados, exigir papel administrativo e restringir projetos/queries consultáveis.
- **Aceite:** o bundle implantado não contém credencial, usuários comuns são negados e toda chamada é auditada.

### Etapa 043 — Reconstruir o envio push com escopo

- **Prioridade:** P0.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** autorizar comunicação servidor-servidor e limitar assinaturas/fallback por usuário e empresa, com idempotência.
- **Aceite:** um tenant não lê, envia nem grava alerta para outro em testes de contrato e runtime.

### Etapa 044 — Implementar o contrato de chaves de API

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** implementar `api-keys-manage` ou adaptar a UI a um contrato existente aprovado.
- **Aceite:** criar, listar, revogar e rotacionar funciona ponta a ponta, e o valor secreto só é exibido uma vez.

### Etapa 045 — Resolver `webhook-financeiro`

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** implementar o endpoint previsto ou retirar/desabilitar a promessa de interface após decisão funcional.
- **Aceite:** não existe chamada que prometa backend inexistente; o caminho aprovado tem contrato e teste.

### Etapa 046 — Corrigir o nome divergente do push

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** alinhar `enviar-push-notification` a `send-push-notification` por migration corretiva, sem reescrever migration aplicada.
- **Aceite:** trigger/job chama função existente e teste integrado confirma entrega e fallback.

### Etapa 047 — Consolidar auth e custo das funções de IA

- **Prioridade:** P1 alto.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** adicionar autorização de domínio, cota, orçamento, timeout, cancelamento e auditoria aos endpoints caros.
- **Aceite:** carga/abuso demonstra limite previsível e nenhum consumo anônimo.

### Etapa 048 — Justificar as 45 funções sem JWT

- **Prioridade:** P0 de revisão.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** classificar cada uma como webhook assinado, endpoint público controlado ou configuração incorreta; habilitar JWT onde cabível.
- **Aceite:** cada exceção possui ameaça modelada, autenticação alternativa e teste negativo automatizado.

### Etapa 049 — Incorporar qualidade Edge ao pipeline

- **Prioridade:** P1.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** integrar todos os testes Edge, `deno check` e lint real, removendo o subconjunto e o `|| true`.
- **Aceite:** regressão em qualquer função quebra a CI e os 69 testes executam com permissões mínimas declaradas.

### Etapa 050 — Implantar correções Edge por canário

- **Prioridade:** P0 de rollout.
- **Ação:** **[AUTORIZAÇÃO EXPLÍCITA]** publicar versões corrigidas gradualmente e acompanhar erros, latência, custo e correlação.
- **Aceite:** há tráfego real controlado estável e rollback exercitado; presença `ACTIVE` sozinha não encerra a etapa.

### 001. Congelar a baseline oficial da auditoria

Registrar como linha de base o commit `b44077fa`, o snapshot do destino em `2026-08-26` e todos os artefatos de teste usados nesta revisão.

### 002. Revogar e rotacionar as credenciais expostas

Rotacionar imediatamente as chaves encontradas hardcoded em `compare-schemas` e em utilitários auxiliares, sem republicar os valores em novos commits.

### 003. Retirar `compare-schemas` da superfície pública

Exigir autenticação administrativa ou retirar a função do runtime se ela for apenas ferramenta interna.

### 004. Reclassificar `send-push-notification` como endpoint privilegiado

Exigir JWT, papel explícito e trilha de auditoria para qualquer fan-out de push.

### 005. Inventariar as 45 Edge Functions com `verify_jwt=false`

Classificar uma a uma em: webhook público legítimo, endpoint interno incorretamente exposto, ou caso ambíguo.

### 006. Fechar endpoints públicos de IA de alto custo

Aplicar identidade, autorização e cota operacional em `expert-agent`, `analyze-document` e equivalentes.

### 007. Corrigir a migration que chama `enviar-push-notification`

Alinhar o nome do endpoint invocado com a função real `send-push-notification`.

### 008. Remover fallback hardcoded de token em scripts

Trocar o padrão atual por leitura obrigatória de segredo em ambiente seguro.

### 009. Criar um inventário de segredos por superfície

Mapear segredos por frontend, Edge, CI, cron, integração externa e script local.

### 010. Colocar varredura de segredos como gate de CI

Bloquear novos commits que tentem reintroduzir credenciais no repositório.

### 011. Restabelecer acesso somente leitura ao banco origem

Sem esse acesso, a reconciliação origem versus destino permanece parcialmente inferida.

### 012. Exportar um snapshot novo e reproduzível da origem

Capturar tabelas, colunas, constraints, índices, policies, funções, triggers, views, enums, extensões, grants e jobs com timestamp.

### 013. Reexecutar o diff origem x destino com a mesma metodologia

Evitar conclusões assimétricas entre uma origem datada e um destino live.

### 014. Congelar o ledger atual do destino

Registrar a ordem exata das 28 entradas atuais e os metadados de cada uma.

### 015. Construir o mapa `arquivo de migration -> ledger live`

Relacionar o que existe no repositório com o que realmente foi aplicado no destino.

### 016. Catalogar as migrations live ausentes em `main`

Tratar especialmente as versões de `2026-08-26` e `2026-08-27`.

### 017. Escolher uma estratégia formal de reconciliação histórica

Decidir entre baseline nova, replay reconciliado ou trilha suplementar documentada.

### 018. Criar um banco efêmero para replay controlado

Subir um ambiente descartável para testar a trilha atual sem tocar ambientes reais.

### 019. Medir quais migrations falham no replay

Identificar dependências implícitas, arquivos não idempotentes e ordens inválidas.

### 020. Formalizar a política de migrations futuras

Proibir aplicações fora da trilha oficial sem registro claro de proveniência.

### 021. Regenerar os tipos Supabase do repositório

Atualizar o contrato TypeScript com base no estado aprovado do banco.

### 022. Revisar as 14 tabelas presentes só no repositório

Classificar cada uma em legado intencional, perda real no destino ou objeto nunca implantado.

### 023. Revisar as 6 tabelas presentes só no destino

Classificar cada uma em rotação legítima, evolução recente ou drift sem versionamento.

### 024. Revisar as 7 views presentes só no repositório

Confirmar se são vistas legadas, substituídas por tabela ou perda real de runtime.

### 025. Revisar as 12 funções presentes só no repositório

Confirmar se são assinaturas antigas, rotinas não publicadas ou drift.

### 026. Revisar as 2 funções presentes só no destino

Trazer `fe_error_signature` e `has_any_role` para trilha versionada se forem canônicas.

### 027. Auditar as 51 tabelas com diferença de colunas

Classificar coluna por coluna em evolução legítima, quebra de contrato ou tipo desatualizado.

### 028. Validar a constraint `NOT VALID`

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Decidir se a constraint deve ser validada, ajustada ou substituída.

### 029. Revisar os grants massivos para `authenticated`

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Reduzir privilégios que hoje extrapolam o mínimo necessário.

### 030. Revisar grants de sequence expostos

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Tratar especialmente `driver_locations_id_seq` e `rpc_observability_metrics_id_seq`.

### 031. Classificar as policies que parecem abertas

Separar catálogos de leitura ampla, policies `service_role_only` e riscos reais multi-tenant.

### 032. Decidir o futuro de `estrategias_elisao_catalogo`

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Manter fail-closed, criar policy explícita ou redefinir o contrato.

### 033. Revisar `SECURITY DEFINER` sem hardening completo de `search_path`

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Priorizar `has_any_role` e `empresa_membro_ativo`.

### 034. Auditar famílias de funções sobrecarregadas

Confirmar se as 7 sobrecargas são intencionais e seguras no contexto de PostgREST e cron.

### 035. Remover ambiguidade de `watch_cron_failures`

Consolidar assinaturas para impedir repetição de erro histórico de agendamento.

### 036. Revisar os triggers duplicados de `organizacao_membros`

[AUTORIZAÇÃO OBRIGATÓRIA para alteração] Verificar qual trigger é canônica antes de remover qualquer uma.

### 037. Corrigir a função `check_integrity_invariants`

Eliminar referências residuais ao módulo logístico removido sem perder as demais invariantes.

### 038. Auditar views operacionais contra o schema real

Validar `vw_edge_health`, `vw_rpc_hotspots`, `vw_webhooks_recentes` e correlatas.

### 039. Revisar os 22 jobs ativos de `pg_cron`

Confirmar objetivo, owner, dependências, frequência e política de observabilidade.

### 040. Documentar retenção e particionamento das tabelas rotativas

Evitar que partições mensais sejam confundidas com perda real ou lixo.

### 041. Criar uma matriz `UI -> hook -> tabela/view -> edge`

Materializar o encadeamento funcional das áreas críticas do produto.

### 042. Corrigir o deeplink da command palette

Trocar `/#alertas-preditivos` pela rota/hash funcional correta.

### 043. Corrigir o estado ativo do menu com `location.hash`

Fazer a `SidebarNavGroups` refletir a subtela real selecionada.

### 044. Decidir o destino das páginas órfãs

Conectar ou retirar de circulação `ConsultaRapidaFiscal` e `AdminErrosFrontend`.

### 045. Fechar o fluxo real de convite de usuários

Implementar backend/serviço de convite ou reclassificar a tela como "em implantação".

### 046. Implementar o backend de `api-keys-manage`

Criar a Edge Function com contrato alinhado ao hook já existente.

### 047. Implementar ou religar `webhook-financeiro`

Parar de expor uma URL operacional que hoje não encontra backend correspondente.

### 048. Tornar a persistência de elisão transacional

Substituir o padrão `delete + insert` por operação segura e idempotente.

### 049. Remover aleatoriedade de métricas em cobrança

Substituir `CustomerDeepScore` aleatório por dado real, mock explícito ou ausência declarada.

### 050. Fechar o histórico operacional do WhatsApp proativo

Garantir que envio, persistência, timeline e auditoria usem a mesma trilha.

### 051. Reclassificar o módulo de notas fiscais

Decidir se entra em trilha real agora ou se deve ficar marcado como beta/incompleto.

### 052. Retirar `mockNotasFiscais` do fluxo principal

Substituir a fonte inicial por leitura real, ainda que read-only no primeiro passo.

### 053. Implementar submissão real em `NovaNFeForm`

Persistir com validação, erro auditável e feedback honesto ao usuário.

### 054. Integrar `ContingenciaNFe` ao backend real

Parar de tratá-la como ilha visual sem rastreabilidade operacional.

### 055. Revisar `useRegrasConciliacao`

Remover `@ts-nocheck`, tratar erros e validar efeitos colaterais.

### 056. Revisar `useOptimizedQueries`

Parar de mascarar falhas importantes como listas vazias.

### 057. Revisar `useConciliacaoAudit`

Garantir que leituras e gravações críticas tenham tratamento explícito de erro.

### 058. Auditar awaits de Supabase sem verificação de erro

Percorrer os pontos heurísticos e classificar por risco operacional.

### 059. Reduzir `Math.random` e `setTimeout` em runtime de produto

Separar mock/protótipo do fluxo operacional real.

### 060. Transformar `TODO/FIXME/HACK` em backlog rastreável

Dar dono, decisão e prazo aos 46 apontamentos encontrados.

### 061. Remover `@ts-nocheck` por ordem de criticidade

Priorizar arquivos de regra de negócio e integrações.

### 062. Revisar os `eslint-disable` existentes

Separar exceções legítimas de supressões que escondem bug.

### 063. Corrigir o escopo do TypeScript

Incluir testes, E2E e áreas críticas hoje fora do `tsconfig`.

### 064. Corrigir o escopo do ESLint

Passar a analisar Edge Functions, scripts e outras áreas hoje fora da malha.

### 065. Compartilhar contratos tipados entre frontend e Edge

Reduzir drift de payload, rota e nomes de função.

### 066. Padronizar validação de payload ponta a ponta

Aplicar schema na borda de entrada, processamento e persistência.

### 067. Padronizar tratamento de erro da camada Supabase

Unificar toast, retry, auditoria, telemetria e propagação de falha.

### 068. Revisar mutações com efeitos secundários não verificados

Especialmente onde a escrita principal passa e a secundária falha silenciosamente.

### 069. Auditar coerência entre menu, palette, guards e permissões

Garantir que todas as portas de entrada usem a mesma fonte de verdade.

### 070. Auditar rotas administrativas expostas

Priorizar `/admin/*` e superfícies equivalentes do ponto de vista de RBAC.

### 071. Clusterizar as 111 falhas E2E

Separar por causa raiz: autenticação, RBAC, tema, seletor, renderização, dado ausente ou fixture.

### 072. Corrigir primeiro as falhas-base de autenticação

Sem estabilizar login e sessão, o restante do E2E permanece ruidoso.

### 073. Corrigir primeiro as falhas-base de RBAC

Fazer rotas anônimas e protegidas obedecerem ao contrato esperado.

### 074. Corrigir o problema de tema do E2E visual

Resolver o caso em que a expectativa `light` encontra `<html class="dark">`.

### 075. Revisar markup e seletores da tela de login

Os testes hoje não encontram elementos que deveriam existir ou ficar visíveis.

### 076. Revalidar a suíte visual após estabilização

Executar novamente apenas os cenários afetados para reduzir ruído.

### 077. Tornar `deno lint` obrigatório no CI

Remover mascaramento por `|| true` e tratar o backlog de 551 problemas.

### 078. Transformar `lint:strict` em gate real

Fazer o pipeline falhar quando warnings críticos reaparecerem.

### 079. Corrigir as 1.470 diferenças de formatação por lotes

Executar em ondas pequenas para não poluir PRs lógicos.

### 080. Elevar os thresholds mínimos de cobertura

Subir gradualmente os limites hoje permissivos demais para gerar verde confiável.

### 081. Cobrir Edge Functions críticas com testes

Priorizar push, webhooks, observabilidade e integrações sensíveis.

### 082. Cobrir migrations críticas com smoke tests

Validar criação, grants, policies, jobs e replay básico.

### 083. Criar teste de contrato para nomes/URLs de Edge Functions

Evitar nova quebra como `enviar-push-notification` versus `send-push-notification`.

### 084. Criar teste de contrato para rotas essenciais

Capturar regressões de deeplink, páginas órfãs e redirecionamento.

### 085. Cobrir convites e API keys com teste de fluxo

O produto precisa parar de indicar sucesso onde não existe backend real.

### 086. Revisar os warnings do build Vite/OXC

Confirmar que o comportamento de `drop console/debugger` e afins está realmente valendo.

### 087. Reduzir os maiores chunks de frontend

Priorizar `chart`, `pdf`, `Contabilidade`, `Categorias` e `ofx`.

### 088. Revisar a estratégia de prefetch de rotas

Hoje há prefetch para uma fração pequena das 129 rotas mapeadas.

### 089. Revisar "god nodes" e arquivos excessivamente centrais

Quebrar apenas onde o acoplamento estiver gerando risco de manutenção.

### 090. Atualizar a documentação factual do projeto

Corrigir docs de testes, Edge, scripts, inventário e estado atual.

### 091. Triar os scripts de `sql/` por intenção e risco

Separar material destrutivo, histórico, reutilizável e experimental.

### 092. Triar `db/functions/` por papel real

Decidir o que é fonte de verdade, espelho morto ou backlog técnico.

### 093. Definir a política oficial de package manager

Escolher entre Bun, npm ou suporte híbrido explicitamente documentado.

### 094. Definir o destino de `e2e-tests/` e configs paralelas

Arquivar ou reintegrar; duplicidade sem dono só aumenta ruído.

### 095. Decidir sobre artefatos versionados de teste

[AUTORIZAÇÃO OBRIGATÓRIA para exclusão] Validar se `test_results*.json` e equivalentes continuam no Git.

### 096. Decidir sobre relatórios históricos na raiz

[AUTORIZAÇÃO OBRIGATÓRIA para exclusão/arquivamento] Definir política de retenção documental.

### 097. Preparar um staging fiel ao destino

Subir ambiente que reflita grants, policies, jobs e Edge antes de qualquer correção invasiva.

### 098. Executar regressão por ondas controladas

Rodar smoke manual, unitário, Deno, E2E e validação de observabilidade a cada bloco de mudanças.

### 099. Implantar correções em trilhas pequenas e temáticas

Separar segurança, banco, integrações, UI parcial e higiene em PRs independentes.

### 100. Declarar “pronto” apenas com evidência operacional

Considerar concluído somente quando segurança crítica estiver fechada, drift reconciliado, módulos placebo removidos/completados, E2E núcleo estabilizado e ambiente com tráfego real observado.
