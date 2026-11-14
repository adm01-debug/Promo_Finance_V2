# public.aliquotas_iss_municipal

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `codigo_ibge` | `integer` | não |  |  |  |
| 3 | `municipio` | `text` | não |  |  |  |
| 4 | `uf` | `uf_brasil` | não |  |  |  |
| 5 | `item_lista_id` | `uuid` | sim |  |  |  |
| 6 | `aliquota` | `numeric(6,4)` | não |  |  |  |
| 7 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  |  |
| 8 | `vigente_ate` | `date` | sim |  |  |  |
| 9 | `base_legal` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_iss_mun_ibge_chk | CHECK | `CHECK (codigo_ibge >= 1000000 AND codigo_ibge <= 9999999)` |  |  | sim |
| aliq_iss_mun_range_chk | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 0.05)` |  |  | sim |
| aliq_iss_mun_unq | UNIQUE | `UNIQUE (codigo_ibge, item_lista_id, vigente_de)` |  |  | sim |
| aliq_iss_mun_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |
| aliquotas_iss_municipal_item_lista_id_fkey | FOREIGN KEY | `FOREIGN KEY (item_lista_id) REFERENCES itens_lista_iss(id)` | NO ACTION | NO ACTION | sim |
| aliquotas_iss_municipal_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliq_iss_mun_geral_unq | btree | codigo_ibge, vigente_de | sim | sim | `(item_lista_id IS NULL)` | `CREATE UNIQUE INDEX aliq_iss_mun_geral_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de) WHERE (item_lista_id IS NULL)` |
| aliq_iss_mun_unq | btree | codigo_ibge, item_lista_id, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliq_iss_mun_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, item_lista_id, vigente_de)` |
| aliquotas_iss_municipal_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_iss_municipal_pkey ON public.aliquotas_iss_municipal USING btree (id)` |
| idx_aliq_iss_ibge | btree | codigo_ibge | não | sim |  | `CREATE INDEX idx_aliq_iss_ibge ON public.aliquotas_iss_municipal USING btree (codigo_ibge)` |
| idx_aliquotas_iss_municipal_item_lista_id_fk | btree | item_lista_id | não | sim |  | `CREATE INDEX idx_aliquotas_iss_municipal_item_lista_id_fk ON public.aliquotas_iss_municipal USING btree (item_lista_id)` |


## Policies (RLS)

### `aliq_iss_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_iss_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_aliq_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_iss_municipal_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
