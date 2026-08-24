# Plano de Correções e Melhorias — 50 Etapas

> Criado em 24/08/2026 a partir da revisão de `ESTADO_ATUAL.md` e
> `docs/PLANO_EXCELENCIA_10_10.md`.
>
> **Regra de conclusão:** código escrito ou migration criada não significam conclusão.
> Uma etapa só recebe `✅` quando a implementação, os testes, o deploy e a evidência de
> funcionamento no ambiente-alvo estiverem registrados.

## Objetivo

Levar a Promo Finance de um repositório funcional, porém parcialmente desconectado do
runtime, para um sistema reproduzível, seguro, observável e validado com tráfego real.
O plano corrige tanto funções sugeridas ainda inexistentes quanto funcionalidades
implementadas parcialmente, simuladas ou sem comprovação de deploy.

## Estados permitidos

| Estado | Significado |
|---|---|
| `⬜` | Não iniciada |
| `🟨` | Em execução ou implementada apenas em código |
| `🧪` | Implantada em staging, aguardando validação |
| `🚀` | Implantada em produção, aguardando evidência de uso |
| `✅` | Validada em produção com evidência registrada |
| `⛔` | Bloqueada, com causa e responsável identificados |

## Gates obrigatórios para todas as etapas

1. Diagnóstico reproduzível antes de qualquer patch.
2. Diff mínimo e migration idempotente quando houver banco.
3. Lint, type-check, testes afetados e build verdes.
4. E2E do fluxo alterado verde em staging.
5. Segurança multiempresa, RLS e privilégios validados quando houver persistência.
6. Deploy realizado no ambiente correto, com rollback documentado.
7. Telemetria ou consulta read-only provando o resultado.
8. Documentação e inventários atualizados no mesmo PR.

---

## Onda 1 — Verdade operacional e baseline

### 01. Confirmar o projeto Supabase de produção

- [ ] **Resultado:** registrar `project_ref`, URL, região e responsável do projeto que atende o domínio produtivo.
- **Evidência:** configuração do frontend implantado comparada ao projeto consultado; nenhum segredo exposto.
- **Aceite:** produção, staging e desenvolvimento têm identificadores distintos e documentados.

### 02. Criar inventário read-only do runtime produtivo

- [ ] **Resultado:** exportar tabelas, views, funções, policies, triggers, extensões, buckets e crons existentes.
- **Evidência:** artefatos JSON/CSV datados e vinculados ao commit da auditoria.
- **Aceite:** inventário reproduzível por script sem DDL ou DML.

### 03. Gerar diff completo repositório × produção

- [ ] **Resultado:** classificar cada objeto como ausente, divergente, excedente ou compatível.
- **Evidência:** matriz cobrindo as 46 tabelas, 15 RPCs, 3 views e objetos descobertos após 16/08.
- **Aceite:** todo gap aponta para a migration que o declara ou para uma nova ação de correção.

### 04. Tornar a cadeia de migrations reproduzível

- [ ] **Resultado:** definir baseline canônico e estratégia para reconciliar o histórico Lovable/Supabase.
- **Evidência:** `supabase db reset` ou criação limpa de staging produz schema equivalente ao esperado.
- **Aceite:** nenhuma migration depende de estado manual não documentado.

### 05. Atualizar inventários e documentos canônicos

- [ ] **Resultado:** corrigir contagens de rotas, Edge Functions, migrations, testes e objetos de banco.
- **Evidência:** script de inventário gera os números usados nos documentos.
- **Aceite:** `ESTADO_ATUAL.md`, catálogo de Edge Functions, ADR de migrations e README não se contradizem.

---

## Onda 2 — Persistência, RLS e storage

### 06. Aplicar e validar as migrations de reconciliação de 22/08 em staging

- [ ] **Resultado:** criar fundação tenant, observabilidade, notificações, organizações, relatórios, régua, risco e auditoria tributária.
- **Evidência:** consultas `to_regclass`, `pg_proc` e smoke tests após deploy.
- **Aceite:** todas as migrations são idempotentes e o rollback foi ensaiado.

### 07. Reconciliar todas as tabelas consumidas pelo código

- [ ] **Resultado:** eliminar tabelas fantasma do contrato TypeScript/runtime.
- **Evidência:** cada `.from('<tabela>')` resolve no banco-alvo e possui teste de acesso autorizado/negado.
- **Aceite:** zero tabela consumida pelo código ausente em staging e produção.

### 08. Reconciliar as 15 RPCs ausentes

- [ ] **Resultado:** implantar e validar telemetria, crons, integridade, filtros, duplicidade, recorrência e relatórios contábeis.
- **Evidência:** matriz de execução para `anon`, `authenticated` e `service_role`.
- **Aceite:** zero RPC chamada pelo código ausente ou com assinatura divergente.

### 09. Reconciliar as views consumidas

- [ ] **Resultado:** validar `vw_edge_health`, `vw_auditoria_tributaria_recente` e `vw_transferencias_painel`.
- **Evidência:** consultas reais, plano de execução e teste do consumidor frontend.
- **Aceite:** as 14 views usadas pelo sistema existem e respeitam o isolamento multiempresa.

### 10. Criar e proteger os buckets necessários

- [ ] **Resultado:** provisionar `relatorios-tributarios`, `nfe-certificados`, `notas-fiscais-upload` e `uploads`.
- **Evidência:** upload, leitura e remoção autorizados; tentativa cross-tenant negada.
- **Aceite:** policies de storage, limites, MIME types, retenção e antivírus/document validation documentados.

---

## Onda 3 — Automações e processamento assíncrono

### 11. Instalar e validar `pg_net`

- [ ] **Resultado:** habilitar chamadas seguras de cron para Edge Functions.
- **Evidência:** chamada controlada em staging com resposta e telemetria correlacionadas.
- **Aceite:** secrets vêm do Vault e não aparecem em migrations ou logs.

### 12. Reconciliar os 16 cron jobs históricos

- [ ] **Resultado:** cada job recebe decisão explícita: ativar, substituir ou remover.
- **Evidência:** catálogo com nome, schedule, comando, owner, timeout, retry e rollback.
- **Aceite:** nenhum cron declarado fica sem destino operacional documentado.

### 13. Validar a régua de cobrança ponta a ponta

- [ ] **Resultado:** configuração → seleção → envio → idempotência por canal → histórico.
- **Evidência:** execução `dry-run`, execução real controlada e prova de não duplicação.
- **Aceite:** cron ativo, métricas e DLQ monitoradas em produção.

### 14. Ativar automações tributárias e de conformidade

- [ ] **Resultado:** snapshots, alertas, benchmark, digest e fechamento executam nos horários definidos.
- **Evidência:** `cron.job_run_details`, tabelas de saída e logs das Edge Functions.
- **Aceite:** pelo menos três execuções consecutivas bem-sucedidas de cada job.

### 15. Ativar automações de observabilidade e manutenção

- [ ] **Resultado:** retenção, bloat, partições, slow queries, baseline pg_stat e alertas operacionais ativos.
- **Evidência:** histórico de execução e alertas sintéticos controlados.
- **Aceite:** falhas geram alerta; sucesso silencioso não é usado como única evidência.

---

## Onda 4 — Funções ausentes e contratos de backend

### 16. Implementar `orquestrador-elisao`

- [ ] **Resultado:** Edge Function real para coordenar estratégias de elisão com contrato Zod.
- **Evidência:** testes de autorização, cálculo, persistência, idempotência e falhas parciais.
- **Aceite:** UI deixa de depender de referência documental inexistente.

### 17. Implementar `importar-xml-nfe`

- [ ] **Resultado:** importação segura de XML, validação de assinatura/schema, deduplicação e persistência.
- **Evidência:** corpus de XMLs válidos, inválidos, duplicados e maliciosos.
- **Aceite:** arquivo rejeitado não produz efeito parcial e toda importação é auditável.

### 18. Implementar `exportar-sped`

- [ ] **Resultado:** exportação SPED com seleção explícita de modalidade e período.
- **Evidência:** golden files, validação estrutural e reconciliação de totais.
- **Aceite:** saída homologada por especialista contábil/fiscal antes de produção.

### 19. Implementar `previsao-tributaria-ia`

- [ ] **Resultado:** previsão com contrato de entrada, proveniência, limites e explicabilidade.
- **Evidência:** dataset de avaliação, erro medido e fallback sem IA.
- **Aceite:** nenhuma recomendação é apresentada como fato ou decisão fiscal automática.

### 20. Implementar `api-keys-manage`

- [ ] **Resultado:** criar, listar metadados, rotacionar e revogar chaves sem revelar o segredo novamente.
- **Evidência:** hashing, escopos, expiração, rate limit e audit log testados.
- **Aceite:** acesso restrito a administrador e revogação efetiva comprovada.

---

## Onda 5 — Autenticação avançada e módulos simulados

### 21. Implementar `webauthn-register`

- [ ] **Resultado:** registro de passkeys com challenge efêmero e verificação de origem/RP ID.
- **Evidência:** testes de replay, challenge expirado, origem inválida e credencial duplicada.
- **Aceite:** integração validada em navegadores suportados e auditada.

### 22. Implementar `webauthn-verify`

- [ ] **Resultado:** autenticação WebAuthn completa com contador e prevenção de replay.
- **Evidência:** testes positivo/negativo e recuperação segura quando passkey não estiver disponível.
- **Aceite:** nenhuma redução das proteções atuais de MFA/lockout.

### 23. Retirar a emissão NF-e simulada da superfície produtiva

- [ ] **Resultado:** feature flag fail-closed ou rótulo inequívoco de ambiente demonstrativo.
- **Evidência:** produção não permite gerar número, autorização ou sucesso aleatórios.
- **Aceite:** nenhum usuário pode confundir simulação com documento fiscal válido.

### 24. Decidir e implementar o destino da emissão NF-e

- [ ] **Resultado:** integração real homologada ou remoção definitiva das ações de emissão/cancelamento/inutilização.
- **Evidência:** ADR com riscos fiscais, fornecedor, custo, SLA e responsabilidade operacional.
- **Aceite:** decisão aprovada pelo negócio e jurídico/fiscal.

### 25. Substituir ou restringir o Open Finance simulado

- [ ] **Resultado:** integração real consentida ou modo sandbox claramente isolado.
- **Evidência:** consentimento, renovação, revogação, sincronização e tratamento de indisponibilidade.
- **Aceite:** dados simulados nunca aparecem como saldo ou conta real em produção.

---

## Onda 6 — Qualidade e confiabilidade do CI

### 26. Corrigir os shards E2E 2/3 e 3/3

- [ ] **Resultado:** eliminar falhas atuais de relatórios, SEFAZ, temas e rotas autenticadas.
- **Evidência:** três execuções consecutivas verdes na `main`.
- **Aceite:** nenhum retry mascara falha determinística.

### 27. Eliminar skips condicionais indevidos nos E2E

- [ ] **Resultado:** separar testes anônimos, autenticados e dependentes de integração real.
- **Evidência:** relatório mostra execução ou bloqueio explícito, nunca aprovação por ausência de secret.
- **Aceite:** branch protection exige os conjuntos críticos.

### 28. Habilitar os gates de banco no CI

- [ ] **Resultado:** configurar credenciais de staging para RLS, pgTAP, retenção e privilégios.
- **Evidência:** passos hoje pulados passam a executar em todo PR relevante.
- **Aceite:** ausência de credencial reprova o gate em vez de produzir falso verde.

### 29. Elevar cobertura de forma incremental até 85%

- [ ] **Resultado:** aumentar pisos por ondas: 15%, 30%, 50%, 70% e 85%.
- **Evidência:** cobertura por domínio e testes de comportamento, não testes-espelho.
- **Aceite:** 85% de lines/statements/functions e meta de branches definida por risco.

### 30. Auditar a qualidade dos testes existentes

- [ ] **Resultado:** localizar asserções vacuamente verdadeiras, mocks excessivos e lógica duplicada no teste.
- **Evidência:** relatório por suíte e correções priorizadas por criticidade financeira/fiscal.
- **Aceite:** fluxos críticos têm testes negativos, concorrência e falhas de integração.

---

## Onda 7 — Tipagem, contratos e segurança

### 31. Regenerar os tipos Supabase a partir do schema canônico

- [ ] **Resultado:** alinhar `types.ts` ao banco reconciliado.
- **Evidência:** diff revisado e type-check sem adaptações inseguras.
- **Aceite:** nenhuma tabela tipada inexistente e nenhuma tabela usada sem tipo.

### 32. Remover os sete `@ts-nocheck` restantes

- [ ] **Resultado:** tipar rate limit, PER/DCOMP, conciliação, histórico, régua, IRPJ/CSLL e sessões.
- **Evidência:** zero `@ts-nocheck` em `src/`.
- **Aceite:** nenhuma substituição por `any` ou cast global inseguro.

### 33. Resolver os TODOs de divergência de schema

- [ ] **Resultado:** decidir coluna por coluna entre migration, rename, adaptação de contrato ou remoção definitiva.
- **Evidência:** inventário dos TODOs antigos com decisão e teste correspondente.
- **Aceite:** zero TODO/FIXME de contrato persistente em código produtivo.

### 34. Validar isolamento multiempresa em toda a superfície

- [ ] **Resultado:** cobrir tabelas, views, storage, RPCs, Realtime e caches.
- **Evidência:** testes com duas empresas e tentativa explícita de acesso cruzado.
- **Aceite:** todo acesso cross-tenant é negado e registrado quando apropriado.

### 35. Promover CSP de report-only para enforcement

- [ ] **Resultado:** analisar violações, remover permissões desnecessárias e ativar `Content-Security-Policy`.
- **Evidência:** período de observação sem violações legítimas e teste automatizado de headers.
- **Aceite:** produção usa CSP enforce sem `'unsafe-eval'`, salvo exceção formalmente justificada.

---

## Onda 8 — Integrações, resiliência e dados reais

### 36. Validar Asaas ponta a ponta

- [ ] **Resultado:** configuração, cobrança, webhook, risco de crédito, idempotência e auditoria funcionando.
- **Evidência:** sandbox completo e transação produtiva controlada.
- **Aceite:** reconciliação entre provider e banco sem perda ou duplicidade.

### 37. Validar Bling ponta a ponta

- [ ] **Resultado:** OAuth/tokens, sync, logs e webhook operacionais.
- **Evidência:** sincronização incremental, retry e expiração/rotação de token.
- **Aceite:** divergência gera alerta e pode ser reprocessada.

### 38. Validar Bitrix24 ponta a ponta

- [ ] **Resultado:** OAuth, mapeamento, sync e webhook com idempotência.
- **Evidência:** operação criada/alterada nos dois sentidos e trilha de auditoria.
- **Aceite:** falha parcial não deixa estados contraditórios silenciosos.

### 39. Fortalecer filas, retries e DLQ

- [ ] **Resultado:** padronizar backoff, limite, idempotency key, dead-letter e replay seguro.
- **Evidência:** testes de indisponibilidade de provider e reprocessamento controlado.
- **Aceite:** nenhuma mensagem é descartada sem estado terminal rastreável.

### 40. Revisar o módulo de logística herdado

- [ ] **Resultado:** remover, isolar em produto próprio ou assumir formalmente o domínio Lalamove.
- **Evidência:** ADR e inventário de rotas, tabelas, funções e integrações afetadas.
- **Aceite:** zero código morto e zero tabela alheia sem owner.

---

## Onda 9 — Performance, observabilidade e operação

### 41. Gerar baseline real de bundle por rota

- [ ] **Resultado:** registrar tamanho bruto, gzip e brotli de cada chunk.
- **Evidência:** artefato versionado no CI e comparação automática por PR.
- **Aceite:** regressão superior a 5% exige justificativa ou reprova o gate.

### 42. Aplicar lazy loading às rotas e módulos pesados

- [ ] **Resultado:** reduzir carregamento inicial sem quebrar prefetch, guards ou ErrorBoundary.
- **Evidência:** Web Vitals e bundle antes/depois.
- **Aceite:** nenhuma rota não crítica acima do limite acordado no chunk inicial.

### 43. Revalidar índices com telemetria atual

- [ ] **Resultado:** analisar slow queries, scans, seletividade, bloat e índices não utilizados.
- **Evidência:** `EXPLAIN (ANALYZE, BUFFERS)` em staging representativo.
- **Aceite:** mudanças são dirigidas por dados e incluem custo de escrita/manutenção.

### 44. Tornar o SRE Command Center operacional

- [ ] **Resultado:** todas as abas usam tabelas, views e RPCs existentes e autorizadas.
- **Evidência:** testes E2E admin/non-admin e alertas sintéticos visíveis.
- **Aceite:** SLO, Edge Health, System Health e Telemetria refletem o runtime real.

### 45. Implantar SLOs, alertas e runbooks acionáveis

- [ ] **Resultado:** definir disponibilidade, latência, erro, freshness de cron e backlog de filas.
- **Evidência:** alertas testados por game day e vinculados ao runbook correto.
- **Aceite:** cada alerta tem owner, severidade, janela, canal e procedimento de recuperação.

---

## Onda 10 — Homologação, produção e encerramento

### 46. Executar migração integral para staging limpo

- [ ] **Resultado:** criar staging do zero apenas com artefatos versionados.
- **Evidência:** pipeline de migração, relatório de integridade e comparação com baseline.
- **Aceite:** nenhuma intervenção manual não documentada.

### 47. Executar bateria de homologação financeira e fiscal

- [ ] **Resultado:** validar contas, cobrança, conciliação, tributário, SPED, NF-e recebida e relatórios.
- **Evidência:** cenários assinados por responsáveis técnicos e de negócio.
- **Aceite:** zero defeito crítico/alto aberto e riscos médios formalmente aceitos.

### 48. Realizar ensaio de rollback e recuperação

- [ ] **Resultado:** testar rollback de aplicação/migration, restauração de backup e replay de filas.
- **Evidência:** tempos reais de RTO/RPO e problemas encontrados no exercício.
- **Aceite:** recuperação dentro dos SLOs definidos.

### 49. Promover para produção com observação assistida

- [ ] **Resultado:** rollout gradual, checklist de go/no-go e janela de hypercare.
- **Evidência:** métricas antes/depois, logs, erros, filas, crons e integrações monitorados.
- **Aceite:** estabilidade sustentada pelo período definido, sem rollback pendente.

### 50. Comprovar uso real e encerrar os planos anteriores

- [ ] **Resultado:** reclassificar as 128 funcionalidades com evidência atual de produção.
- **Evidência:** tráfego, operações reais, SLOs, auditoria e aceite do owner de negócio.
- **Aceite:** `ESTADO_ATUAL.md` e `PLANO_EXCELENCIA_10_10.md` são arquivados com resultado final,
  pendências residuais migram para backlog com owner e prazo, e nenhum item parcial é chamado de pronto.

---

## Marcos de controle

| Marco | Etapas | Saída obrigatória |
|---|---:|---|
| M1 — Verdade do runtime | 01–05 | Baseline e diff reproduzíveis |
| M2 — Fundação operacional | 06–15 | Banco, storage e automações funcionais em staging |
| M3 — Produto sem fachadas falsas | 16–25 | Funções ausentes tratadas e simulações isoladas |
| M4 — Rede de segurança | 26–35 | CI verde, cobertura crescente e segurança validada |
| M5 — Operação sustentável | 36–45 | Integrações, performance, SRE e runbooks ativos |
| M6 — Pronto de verdade | 46–50 | Produção validada com tráfego e aceite |

## Ordem de execução

- As etapas 01–05 bloqueiam qualquer DDL em produção.
- As etapas 06–10 bloqueiam automações e funções que dependem de persistência.
- As etapas 11–15 bloqueiam a ativação de jobs reais.
- As etapas 23–25 são bloqueadores de segurança/comunicação e podem ser antecipadas.
- As etapas 26–28 bloqueiam novos merges de funcionalidade.
- As etapas 46–50 só começam após os marcos M1–M5 aprovados.

## Definition of Done do plano

O plano termina somente quando:

1. o banco produtivo nasce de artefatos versionados;
2. zero tabela, view, RPC ou Edge Function consumida está ausente;
3. zero funcionalidade simulada é apresentada como real;
4. os três shards E2E e todos os gates de banco passam;
5. cobertura atinge o alvo aprovado sem testes artificiais;
6. crons, filas, integrações, storage e SLOs possuem evidência operacional;
7. segurança multiempresa foi validada de forma adversarial;
8. as funcionalidades classificadas como concluídas possuem uso real comprovado.
