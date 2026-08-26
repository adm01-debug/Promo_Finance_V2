# ADR-001 — Exclusão do módulo de logística/Lalamove

- **Status:** aceito
- **Data:** 2026-08-25
- **Decisão:** responsável pelo produto
- **Escopo:** banco de dados, migrations, tipos gerados, Edge Functions e frontend

## Contexto

Objetos de um projeto de logística foram criados por engano no Promo Finance. Eles não pertencem ao domínio financeiro deste produto e não devem ser interpretados como funcionalidades incompletas, tabelas vazias a preservar ou drift a recuperar.

## Decisão

Os 14 objetos abaixo estão definitivamente fora do escopo do Promo Finance:

### Tabelas

- `drivers`
- `lalamove_orders`
- `active_tracking`
- `tracking_events`
- `driver_locations`
- `driver_approval_queue`
- `driver_evaluations`
- `driver_incidents`
- `lalamove_stops`
- `lalamove_status_history`
- `lalamove_uapi_sessions`
- `bitrix24_sync`

### Views

- `drivers_safe_view`
- `orders_safe_view`

Esses objetos podem ser removidos caso sejam encontrados em qualquer ambiente do Promo Finance. Eles não devem ser recriados, restaurados, migrados, populados ou incluídos na geração de tipos deste projeto. A ausência deles no banco canônico é o estado esperado e não constitui perda de dados nem drift de schema.

## Regras de execução

1. Não executar exclusões por padrão de nome ou curingas; confirmar cada objeto pelo nome exato.
2. Antes de uma remoção futura, inventariar dependências e confirmar que elas atendem exclusivamente ao módulo excluído.
3. Realizar a remoção por migration versionada, revisada e idempotente, sem alterar objetos financeiros homônimos ou compartilhados.
4. Funções, triggers, enums, jobs, rotas e colunas associados só podem ser removidos após comprovação de uso exclusivo por esses objetos.
5. Não inserir dados de simulação nesses objetos nem criar compatibilidade retroativa para eles.

## Estado atual

Na verificação do banco canônico, os 14 objetos já estavam ausentes. Portanto, esta decisão apenas documenta e protege o estado atual; ela não autoriza nem exige uma operação destrutiva imediata.

## Consequências

- Auditorias futuras não devem abrir incidente para recuperar esses objetos.
- Migrations históricas que os mencionem representam legado e não definem o escopo atual.
- Qualquer necessidade futura de logística/Lalamove exige uma nova decisão arquitetural e implementação própria, sem reativação automática do legado.
- A remoção de outros objetos continua exigindo análise individual; esta decisão não amplia a autorização além dos 14 nomes listados.

