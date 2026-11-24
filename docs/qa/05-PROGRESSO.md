# 05 — Progresso da execução do plano

Este arquivo é o **estado real** do plano de `04-PLANO.md`. Ele é atualizado a cada etapa concluída, no mesmo PR da etapa: uma etapa só conta como concluída quando a linha desta tabela tem branch, PR e **evidência colada** (saída de comando, `EXPLAIN`, contagem antes/depois, link de run de CI). Etapa sem evidência fica `aberta`, ainda que o código tenha sido escrito.

Regras de uso:

1. Nenhuma etapa começa sem a anterior da mesma `Onda` estar `concluída` **ou** marcada `bloqueada` com motivo.
2. Toda linha `concluída` cita o commit que a fechou. Sem commit na `main`, o status máximo é `em PR`.
3. Etapa que mudou de escopo não é reescrita aqui: ela é registrada em "Desvios" com o motivo, e a etapa original continua com o texto do plano.
4. Achado descoberto durante a execução entra em "Achados novos" e **não** interrompe a etapa em curso.
5. `Precisa de aprovação humana: sim` só vira `concluída` depois do aval registrado com data.

## Situação por etapa

Legenda de status: `aberta` · `em andamento` · `em PR` · `concluída` · `bloqueada` · `dispensada` (com motivo)

| Etapa | Título curto | Onda | Aprovação | Status | Branch / PR | Commit | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Inventário executável de `empresa_id` | 1 | não | aberta | — | — | — |
| 002 | Piloto do predicado em `movimentacoes` | 1 | sim | aberta | — | — | — |
| 003 | `clientes`: fechar insert sem empresa | 1 | sim | aberta | — | — | — |
| 004 | `clientes`: trocar as `tenant_*` | 1 | sim | aberta | — | — | — |
| 005 | `clientes`: aposentar `owner_*` | 1 | sim | aberta | — | — | — |
| 006 | `fornecedores`: backfill de `empresa_id` | 1 | sim | aberta | — | — | — |
| 007 | `fornecedores`: predicado por empresa | 1 | sim | aberta | — | — | — |
| 008 | `fornecedores`: caso novo no teste RLS | 1 | não | aberta | — | — | — |
| 009 | Lote 1: `notas_fiscais`, `nfe_recebidas` | 2 | sim | aberta | — | — | — |
| 010 | Lote 2: `transferencias`, `plano_contas`, `contratos` | 2 | sim | aberta | — | — | — |
| 011 | Lote 3: `faturamento_mensal`, `folha_pagamento`, `acordos_parcelamento` | 2 | sim | aberta | — | — | — |
| 012 | Lote 4: anexos, auditoria, cobrança | 2 | sim | aberta | — | — | — |
| 013 | Lote 5: zerar a lista do inventário | 2 | sim | aberta | — | — | — |
| 014 | Gate de CI para `empresa_id` | 8 | sim | aberta | — | — | — |
| 015 | Matriz papel → capacidade | 3 | não | aberta | — | — | — |
| 016 | Decidir o vocabulário de papéis | 3 | sim | aberta | — | — | — |
| 017 | Policies 1: `clientes`, `notas_fiscais` | 3 | sim | aberta | — | — | — |
| 018 | Policies 2: `query_telemetry` | 3 | sim | aberta | — | — | — |
| 019 | Policies 3: `notas_fiscais_tenant_delete`, `anexos_financeiros` | 3 | sim | aberta | — | — | — |
| 020 | Policies 4: `asaas_*` e cobrança | 3 | sim | aberta | — | — | — |
| 021 | Policies 5: restante com papel | 3 | sim | aberta | — | — | — |
| 022 | Aposentar rótulos do enum `app_role` | 3 | sim | aberta | — | — | — |
| 023 | Front-end e helpers no vocabulário único | 3 | não | aberta | — | — | — |
| 024 | Gate de CI para papel fora do vocabulário | 8 | sim | aberta | — | — | — |
| 025 | `oportunidades_elisao`: fechar escrita anônima | 1 | sim | aberta | — | — | — |
| 026 | `auditoria_financeira`: log imutável | 1 | sim | aberta | — | — | — |
| 027 | `oportunidades_elisao`: `empresa_id` + backfill | 1 | sim | aberta | — | — | — |
| 028 | Aposentar `Vault` → `secrets` | 8 | sim | aberta | — | — | — |
| 029 | Confirmar ausência de leitura de Vault | 8 | não | aberta | — | — | — |
| 030 | Remover `config.toml` duplicado | 8 | sim | aberta | — | — | — |
| 031 | Alinhar os dois workflows de documentação | 8 | sim | aberta | — | — | — |
| 032 | `.env.example` órfão | 8 | não | aberta | — | — | — |
| 033 | Check de matview exige acesso negado | 8 | não | aberta | — | — | — |
| 034 | Índices nas tabelas de dinheiro quentes | 6 | sim | aberta | — | — | — |
| 035 | Critério dos 404 índices idle | 6 | sim | aberta | — | — | — |

**Total**: 35 etapas · 28 com aprovação humana obrigatória (DDL, segredo, workflow ou decisão de negócio) · 7 sem.

## Cobertura dos achados

| Achado | Severidade | Etapas que o fecham | Fechado? |
| --- | --- | --- | --- |
| ACH-DB-01 — 58 tabelas com `empresa_id` fora do predicado | Alta | 001, 002, 009–014 | não |
| ACH-DB-02 — `clientes` aceita `empresa_id` nulo | Alta | 003–005 | não |
| ACH-DB-03 — `fornecedores` sem isolamento por empresa | Alta | 006–008 | não |
| ACH-DB-04 — quatro vocabulários de papel | Alta | 015–024 | não |
| ACH-DB-05 — `oportunidades_elisao` aceita escrita anônima | Alta | 025 | não |
| ACH-DB-06 — `auditoria_financeira` aceita `UPDATE`/`DELETE` | Média | 026 | não |
| ACH-DB-07 — `oportunidades_elisao` sem `empresa_id` | Média | 027 | não |
| ACH-INF-01 — `Vault` e `config.toml` duplicado | Média | 028–030 | não |
| ACH-INF-02 — dois workflows de doc divergentes | Média | 031 | não |
| ACH-DB-08 — `.env.example` órfão | Baixa | 032 | não |
| ACH-DB-09 — check de matview aprova quando não existe | Média | 033 | não |
| ACH-DB-10 — 404 índices com `idx_scan = 0` | Baixa | 034–035 | não |

## Desvios

| Data | Etapa | O que mudou | Motivo | Autorizou |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Achados novos

Descobertas feitas durante a execução. **Não** alteram o escopo da etapa em curso e **não** são corrigidas na mesma PR.

| Data | Onde | O que é | Severidade proposta | Virou etapa? |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Decisões registradas

| Data | Assunto | Decisão | Quem decidiu |
| --- | --- | --- | --- |
| — | Vocabulário de papéis (etapa 016) | pendente | — |

## Como este arquivo é atualizado

No PR da etapa, junto com a migration ou o código:

1. Trocar o `status` da linha da etapa (máximo `em PR` antes do merge).
2. Preencher `Branch / PR` e colar a **saída literal** do comando de verificação da etapa na coluna `Evidência` (ou num bloco abaixo, com o número da etapa como título).
3. No merge, trocar para `concluída` e preencher `Commit` com o hash na `main`.

Uma etapa cuja evidência não pôde ser produzida (sem acesso, ambiente indisponível) fica `bloqueada` com o motivo escrito — **nunca** `concluída` por inferência.