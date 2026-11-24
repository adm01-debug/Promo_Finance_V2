# public.slo_metrics_diarias

> Dicionário estrutural de public.slo_metrics_diarias (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (data, servico); PRIMARY KEY (id); CHECK (taxa_erro_pct >= 0::numeric AND taxa_erro_pct <= 100::numeric); CHECK (uptime_pct >= 0::numeric AND uptime_pct <= 100::numeric). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `data` | `date` | não |  |  | Dicionário estrutural da coluna data em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: data; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (data, servico). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `servico` | `text` | não |  |  | Dicionário estrutural da coluna servico em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: servico; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (data, servico). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `disponibilidade` | `numeric(5,4)` | sim |  |  | Dicionário estrutural da coluna disponibilidade em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: disponibilidade; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `latencia_p50_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna latencia_p50_ms em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: latencia_p50_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `latencia_p95_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna latencia_p95_ms em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: latencia_p95_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `latencia_p99_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna latencia_p99_ms em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: latencia_p99_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `total_requests` | `bigint` | sim |  |  | Dicionário estrutural da coluna total_requests em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: total_requests; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `error_rate` | `numeric(5,4)` | sim |  |  | Dicionário estrutural da coluna error_rate em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: error_rate; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `total_requisicoes` | `bigint` | não | `0` |  | Dicionário estrutural da coluna total_requisicoes em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: total_requisicoes; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `taxa_erro_pct` | `numeric` | não | `0` |  | Dicionário estrutural da coluna taxa_erro_pct em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: taxa_erro_pct; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (taxa_erro_pct >= 0::numeric AND taxa_erro_pct <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 13 | `uptime_pct` | `numeric` | não | `100` |  | Dicionário estrutural da coluna uptime_pct em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: uptime_pct; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 100. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (uptime_pct >= 0::numeric AND uptime_pct <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 14 | `cron_jobs_sucesso` | `integer` | não | `0` |  | Dicionário estrutural da coluna cron_jobs_sucesso em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: cron_jobs_sucesso; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 15 | `cron_jobs_falha` | `integer` | não | `0` |  | Dicionário estrutural da coluna cron_jobs_falha em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: cron_jobs_falha; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 16 | `edges_health` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna edges_health em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: edges_health; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 17 | `calculado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna calculado_em em public.slo_metrics_diarias. Papel funcional indicado pelo identificador: calculado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| slo_metrics_diarias_data_servico_key | UNIQUE | `UNIQUE (data, servico)` |  |  | sim |
| slo_metrics_diarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| slo_metrics_diarias_taxa_erro_pct_check | CHECK | `CHECK (taxa_erro_pct >= 0::numeric AND taxa_erro_pct <= 100::numeric)` |  |  | sim |
| slo_metrics_diarias_uptime_pct_check | CHECK | `CHECK (uptime_pct >= 0::numeric AND uptime_pct <= 100::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| slo_metrics_diarias_data_servico_key | btree | data, servico | sim | sim |  | `CREATE UNIQUE INDEX slo_metrics_diarias_data_servico_key ON public.slo_metrics_diarias USING btree (data, servico)` |
| slo_metrics_diarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX slo_metrics_diarias_pkey ON public.slo_metrics_diarias USING btree (id)` |


## Policies (RLS)

### `slo_metrics_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
