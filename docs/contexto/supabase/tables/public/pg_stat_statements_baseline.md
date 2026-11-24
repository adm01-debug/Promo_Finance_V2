# public.pg_stat_statements_baseline

> Dicionário estrutural de public.pg_stat_statements_baseline (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `label` | `text` | não |  |  | Dicionário estrutural da coluna label em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: label; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `queryid` | `bigint` | sim |  |  | Dicionário estrutural da coluna queryid em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: queryid; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `query` | `text` | sim |  |  | Dicionário estrutural da coluna query em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: query; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `calls` | `bigint` | sim |  |  | Dicionário estrutural da coluna calls em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: calls; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `total_exec_time` | `double precision` | sim |  |  | Dicionário estrutural da coluna total_exec_time em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: total_exec_time; o catálogo não especifica significado adicional. Tipo: double precision. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `mean_exec_time` | `double precision` | sim |  |  | Dicionário estrutural da coluna mean_exec_time em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: mean_exec_time; o catálogo não especifica significado adicional. Tipo: double precision. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `max_exec_time` | `double precision` | sim |  |  | Dicionário estrutural da coluna max_exec_time em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: max_exec_time; o catálogo não especifica significado adicional. Tipo: double precision. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `rows` | `bigint` | sim |  |  | Dicionário estrutural da coluna rows em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: rows; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `shared_blks_hit` | `bigint` | sim |  |  | Dicionário estrutural da coluna shared_blks_hit em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: shared_blks_hit; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `shared_blks_read` | `bigint` | sim |  |  | Dicionário estrutural da coluna shared_blks_read em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: shared_blks_read; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `captured_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna captured_at em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: captured_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.pg_stat_statements_baseline. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pg_stat_statements_baseline_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pgss_baseline_captured_at | btree | captured_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_captured_at ON public.pg_stat_statements_baseline USING btree (captured_at DESC)` |
| idx_pgss_baseline_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_created_at ON public.pg_stat_statements_baseline USING btree (created_at DESC)` |
| idx_pgss_baseline_label | btree | label | não | sim |  | `CREATE INDEX idx_pgss_baseline_label ON public.pg_stat_statements_baseline USING btree (label)` |
| idx_pgss_baseline_label_captured | btree | label, captured_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_label_captured ON public.pg_stat_statements_baseline USING btree (label, captured_at DESC)` |
| pg_stat_statements_baseline_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pg_stat_statements_baseline_pkey ON public.pg_stat_statements_baseline USING btree (id)` |


## Policies (RLS)

### `Admins can view baselines`

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
