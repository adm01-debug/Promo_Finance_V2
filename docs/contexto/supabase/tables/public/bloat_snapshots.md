# public.bloat_snapshots

> Dicionário estrutural de public.bloat_snapshots (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); UNIQUE (snapshot_date, table_name). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.bloat_snapshots. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `snapshot_date` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna snapshot_date em public.bloat_snapshots. Papel funcional indicado pelo identificador: snapshot_date; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (snapshot_date, table_name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `table_name` | `text` | não |  |  | Dicionário estrutural da coluna table_name em public.bloat_snapshots. Papel funcional indicado pelo identificador: table_name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (snapshot_date, table_name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `live_rows` | `bigint` | não | `0` |  | Dicionário estrutural da coluna live_rows em public.bloat_snapshots. Papel funcional indicado pelo identificador: live_rows; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `dead_rows` | `bigint` | não | `0` |  | Dicionário estrutural da coluna dead_rows em public.bloat_snapshots. Papel funcional indicado pelo identificador: dead_rows; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `dead_ratio_pct` | `numeric(6,2)` | não | `0` |  | Dicionário estrutural da coluna dead_ratio_pct em public.bloat_snapshots. Papel funcional indicado pelo identificador: dead_ratio_pct; o catálogo não especifica significado adicional. Tipo: numeric(6,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `total_size_bytes` | `bigint` | não | `0` |  | Dicionário estrutural da coluna total_size_bytes em public.bloat_snapshots. Papel funcional indicado pelo identificador: total_size_bytes; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `total_size_pretty` | `text` | sim |  |  | Dicionário estrutural da coluna total_size_pretty em public.bloat_snapshots. Papel funcional indicado pelo identificador: total_size_pretty; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `last_autovacuum` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_autovacuum em public.bloat_snapshots. Papel funcional indicado pelo identificador: last_autovacuum; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `last_vacuum` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_vacuum em public.bloat_snapshots. Papel funcional indicado pelo identificador: last_vacuum; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `autovacuum_count` | `bigint` | não | `0` |  | Dicionário estrutural da coluna autovacuum_count em public.bloat_snapshots. Papel funcional indicado pelo identificador: autovacuum_count; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.bloat_snapshots. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bloat_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bloat_snapshots_snapshot_date_table_name_key | UNIQUE | `UNIQUE (snapshot_date, table_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bloat_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bloat_snapshots_pkey ON public.bloat_snapshots USING btree (id)` |
| bloat_snapshots_snapshot_date_table_name_key | btree | snapshot_date, table_name | sim | sim |  | `CREATE UNIQUE INDEX bloat_snapshots_snapshot_date_table_name_key ON public.bloat_snapshots USING btree (snapshot_date, table_name)` |


## Policies (RLS)

### `Admins podem consultar snapshots de bloat`

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
