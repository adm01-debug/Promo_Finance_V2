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
| 025 | `audit_logs`: fechar o `INSERT` de `authenticated` | 1 | sim | aberta | — | — | — |
| 026 | `auditoria_financeira`: validar `empresa_id` no `INSERT` | 1 | sim | aberta | — | — | — |
| 027 | `frontend_error_logs`: limitar o `INSERT` de `anon` | 1 | sim | aberta | — | — | — |
| 028 | Regerar o `bun.lock` contra o registry público | 8 | sim | aberta | — | — | — |
| 029 | Impedir a volta do registry privado ao lock | 8 | não | aberta | — | — | — |
| 030 | Gate: endereço privado no lockfile | 8 | sim | aberta | — | — | — |
| 031 | Declarar um único gerenciador de pacotes | 8 | não | aberta | — | — | — |
| 032 | `gerar_lancamento_contabil_automatico()`: parar o drift | 1 | sim | aberta | — | — | — |
| 033 | Medir o privilégio da view materializada | 1 | não | aberta | — | — | — |
| 034 | Cinco índices de chave estrangeira | 6 | sim | aberta | — | — | — |
| 035 | Gate: FK nova nasce com índice | 8 | sim | aberta | — | — | — |

**Total**: 35 etapas · 28 com aprovação humana obrigatória (DDL, segredo, workflow ou decisão de negócio) · 7 sem.

## Cobertura dos achados

| Achado | Severidade | Etapas que o fecham | Fechado? |
| --- | --- | --- | --- |
| ACH-DB-01 — 58 tabelas com `empresa_id` fora do predicado | Alta | 001, 002, 009–014 | não |
| ACH-DB-02 — `clientes` aceita `empresa_id` nulo | Alta | 003–005 | não |
| ACH-DB-03 — `fornecedores` sem isolamento por empresa | Alta | 006–008 | não |
| ACH-DB-04 — quatro vocabulários de papel | Alta | 015–024 | não |
| ACH-DB-05 — qualquer usuário logado escreve na trilha de auditoria | Alta | 025 | não |
| ACH-DB-06 — `auditoria_financeira` aceita registro de qualquer empresa | Média | 026 | não |
| ACH-DB-07 — tabela de erros de front aberta para a internet | Média | 027 | não |
| ACH-INF-01 — um quinto do build vem de registry privado de terceiro | Alta | 028–030 | não |
| ACH-INF-02 — só o `bun` consegue instalar o projeto | Baixa | 031 | não |
| ACH-DB-08 — função com privilégio elevado sem `search_path` fixo | Média | 032 | não |
| ACH-DB-09 — view materializada fora do controle de acesso | Média | 033 | não |
| ACH-DB-10 — cinco chaves estrangeiras sem índice | Baixa | 034–035 | não |

## Desvios

| Data | Etapa | O que mudou | Motivo | Autorizou |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Achados novos

Descobertas feitas durante a execução. **Não** alteram o escopo da etapa em curso e **não** são corrigidas na mesma PR.

| Data | Onde | O que é | Severidade proposta | Virou etapa? |
| --- | --- | --- | --- | --- |
| 2026-11-24 | `docs/qa/04-PLANO.md`, etapas 025–035 | A primeira redação deste plano apontava as etapas 025–035 para objetos que **não** são os dos achados do grupo B/C/D — citava `oportunidades_elisao`, Vault e os 404 índices idle (que pertencem ao PR #243, outro assunto). As onze etapas foram reescritas a partir de `03-ACHADOS.md`; nenhum número de etapa e nenhum vínculo achado→etapa mudou | Alta | não — corrigido na revisão da própria PR |

## Decisões registradas

| Data | Assunto | Decisão | Quem decidiu |
| --- | --- | --- | --- |
| — | Vocabulário de papéis (etapa 016) | pendente | — |

## Como este arquivo é atualizado

No PR da etapa, junto com a migration ou o código:

1. Trocar o `status` da linha da etapa (máximo `em PR` antes do merge) — o PR não pode se declarar `concluída` por conta própria.
2. Preencher `Branch / PR` e colar a **saída literal** do comando de verificação da etapa na coluna `Evidência` (ou num bloco abaixo, com o número da etapa como título).
3. Só marcar `concluída` **depois** do merge, numa PR curta de atualização deste arquivo (`docs:`), e preencher `Commit` com o hash do commit **na `main`** — depois de um squash-merge esse hash é o commit de squash, então o valor se lê com `git log --oneline -1 origin/main` logo após o merge, não com o hash da branch (a branch é apagada). Sem esse hash na `main`, o status máximo continua `em PR`.
4. Etapa com `Precisa de aprovação humana: sim` só vira `concluída` se o item 3 vier acompanhado do aval registrado em "Decisões registradas" (data + quem autorizou). Sem o registro, o status fica `bloqueada` com o motivo.

Uma etapa cuja evidência não pôde ser produzida (sem acesso, ambiente indisponível) fica `bloqueada` com o motivo escrito — **nunca** `concluída` por inferência.