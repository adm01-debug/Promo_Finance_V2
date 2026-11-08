# public.itens_lista_iss

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
| 2 | `codigo` | `text` | não |  |  |  |
| 3 | `descricao` | `text` | não |  |  |  |
| 4 | `retem_no_tomador` | `boolean` | não | `false` |  |  |
| 5 | `aliquota_minima` | `numeric` | não | `0.02` |  |  |
| 6 | `aliquota_maxima` | `numeric` | não | `0.05` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `vigente_de` | `date` | não | `'2004-01-01'::date` |  |  |
| 10 | `vigente_ate` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| itens_lista_iss_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| itens_lista_iss_faixa_chk | CHECK | `CHECK (aliquota_minima >= 0::numeric AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima)` |  |  | sim |
| itens_lista_iss_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| itens_lista_iss_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.aliquotas_iss_municipal | aliquotas_iss_municipal_item_lista_id_fkey | item_lista_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_itens_lista_iss_vigencia | btree | vigente_de, vigente_ate | não | sim |  | `CREATE INDEX idx_itens_lista_iss_vigencia ON public.itens_lista_iss USING btree (vigente_de, vigente_ate)` |
| itens_lista_iss_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX itens_lista_iss_codigo_key ON public.itens_lista_iss USING btree (codigo)` |
| itens_lista_iss_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX itens_lista_iss_pkey ON public.itens_lista_iss USING btree (id)` |


## Policies (RLS)

### `itens_iss_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `itens_iss_write_admin`

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
| trg_itens_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_itens_lista_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
