# ADR-002 — Funções essenciais do Promo Finance V2

- **Status:** aceito
- **Data:** 2026-08-25
- **Decisão:** responsável pelo produto
- **Escopo:** funções PostgreSQL, triggers, jobs, RPCs, migrations e tipos gerados

## Contexto

Durante a reconciliação do banco canônico, funções legítimas do Promo Finance V2 poderiam ser confundidas com resíduos de outros projetos. A decisão de excluir o módulo de logística/Lalamove não alcança as funções registradas neste documento.

Todas elas possuem implementação, consumidor ou dependência documentada nas migrations e no código do projeto. Mesmo que estejam vazias, sem tráfego ou temporariamente sem chamada em algum ambiente, continuam pertencendo ao produto.

## Registro de preservação

| Função | Responsabilidade no Promo Finance V2 |
| --- | --- |
| `check_integrity_invariants()` | Verificar invariantes e integridade do banco financeiro. |
| `capture_index_usage_snapshot()` | Capturar telemetria de utilização de índices. |
| `frontend_error_logs_sanitize()` | Remover dados sensíveis dos logs de erro do frontend. |
| `gerar_alertas_vencimento()` | Gerar alertas financeiros de vencimento. |
| `gerar_contas_recorrentes()` | Materializar contas e pagamentos recorrentes. |
| `get_cobertura_fiscal_uf()` | Consultar a cobertura dos dados fiscais por UF. |
| `get_ultima_carga_fiscal()` | Consultar o estado da última carga fiscal. |
| `provisionar_usuario_atual()` | Provisionar o usuário autenticado no modelo multiempresa. |
| `set_empresa_id_from_profile()` | Preencher o vínculo de empresa a partir do perfil do usuário. |
| `sync_regime_tributario_empresa()` | Sincronizar o regime tributário com a empresa correspondente. |
| `trigger_bitrix24_sync()` | Disparar a sincronização de dados com o Bitrix24. |

## Decisão

As 11 funções acima são parte do Promo Finance V2 e devem ser preservadas. Elas não podem ser apagadas, descomissionadas ou classificadas como objetos alheios sem uma nova decisão explícita do responsável pelo produto.

Se alguma estiver ausente no banco canônico, a ausência deve ser tratada como possível drift ou implementação pendente. A recuperação deve partir da versão mais recente das migrations do repositório, com validação de assinatura, corpo, privilégios, `search_path`, triggers, jobs e consumidores antes do deploy.

## Regras operacionais

1. Não usar `DROP FUNCTION` nessas funções como limpeza de resíduos.
2. Mudanças de assinatura exigem levantamento de RPCs, triggers, cron jobs, Edge Functions e chamadas do frontend.
3. Funções `SECURITY DEFINER` devem manter `search_path` seguro e privilégios mínimos.
4. Funções de trigger devem ser validadas junto aos triggers que as invocam; apenas a existência da função não comprova funcionamento.
5. Funções agendadas devem ser validadas junto ao cron, permissões e idempotência.
6. A restauração deve usar migration nova e idempotente; migrations históricas aplicadas não devem ser alteradas.
7. Antes de produção, executar testes de existência, assinatura, privilégios e comportamento esperado.

## Observação sobre o histórico

A migration `20260824124500_descomissionar_modulo_lalamove.sql` contém remoções históricas de `check_integrity_invariants()` e `trigger_bitrix24_sync()`. Essas duas funções não pertencem ao módulo Lalamove. Migrations posteriores voltam a defini-las; portanto, a remoção histórica não representa a decisão arquitetural atual e não deve ser reproduzida isoladamente.

## Consequências

- Auditorias devem sinalizar a ausência ou implementação incompleta dessas funções.
- A geração de tipos deve preservar as RPCs aplicáveis ao cliente.
- O ADR-001 continua válido somente para os 14 objetos de logística nominalmente listados nele.
- Qualquer remoção futura de uma destas funções exige novo ADR, análise de dependências e plano de rollback.

