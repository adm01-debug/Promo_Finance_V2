# public.slow_query_alerts

> Dicionário estrutural de public.slow_query_alerts (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.slow_query_alerts. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `queryid` | `bigint` | não |  |  | Dicionário estrutural da coluna queryid em public.slow_query_alerts. Papel funcional indicado pelo identificador: queryid; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 3 | `query_normalized` | `text` | não |  |  | Dicionário estrutural da coluna query_normalized em public.slow_query_alerts. Papel funcional indicado pelo identificador: query_normalized; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `calls` | `bigint` | não | `0` |  | Dicionário estrutural da coluna calls em public.slow_query_alerts. Papel funcional indicado pelo identificador: calls; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `mean_exec_ms` | `numeric(12,3)` | não | `0` |  | Dicionário estrutural da coluna mean_exec_ms em public.slow_query_alerts. Papel funcional indicado pelo identificador: mean_exec_ms; o catálogo não especifica significado adicional. Tipo: numeric(12,3). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `total_exec_ms` | `numeric(14,3)` | não | `0` |  | Dicionário estrutural da coluna total_exec_ms em public.slow_query_alerts. Papel funcional indicado pelo identificador: total_exec_ms; o catálogo não especifica significado adicional. Tipo: numeric(14,3). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `max_exec_ms` | `numeric(12,3)` | não | `0` |  | Dicionário estrutural da coluna max_exec_ms em public.slow_query_alerts. Papel funcional indicado pelo identificador: max_exec_ms; o catálogo não especifica significado adicional. Tipo: numeric(12,3). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `rows_returned` | `bigint` | não | `0` |  | Dicionário estrutural da coluna rows_returned em public.slow_query_alerts. Papel funcional indicado pelo identificador: rows_returned; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `severity` | `text` | não | `'warning'::text` |  | Dicionário estrutural da coluna severity em public.slow_query_alerts. Papel funcional indicado pelo identificador: severity; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'warning'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `captured_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna captured_at em public.slow_query_alerts. Papel funcional indicado pelo identificador: captured_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.slow_query_alerts. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| slow_query_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| slow_query_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_slow_query_alerts_captured_at | btree | captured_at | não | sim |  | `CREATE INDEX idx_slow_query_alerts_captured_at ON public.slow_query_alerts USING btree (captured_at DESC)` |
| idx_slow_query_alerts_severity | btree | severity, captured_at | não | sim |  | `CREATE INDEX idx_slow_query_alerts_severity ON public.slow_query_alerts USING btree (severity, captured_at DESC)` |
| slow_query_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX slow_query_alerts_pkey ON public.slow_query_alerts USING btree (id)` |


## Policies (RLS)

### `Admins podem visualizar slow_query_alerts`

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
