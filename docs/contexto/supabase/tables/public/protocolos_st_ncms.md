# public.protocolos_st_ncms

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
| 2 | `protocolo_id` | `uuid` | não |  |  |  |
| 3 | `ncm_id` | `uuid` | sim |  |  |  |
| 4 | `ncm_codigo` | `text` | não |  |  |  |
| 5 | `mva_original` | `numeric` | sim |  |  |  |
| 6 | `cest` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `vigente_de` | `date` | não | `'2000-01-01'::date` |  |  |
| 10 | `vigente_ate` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protocolos_st_ncms_codigo_formato_chk | CHECK | `CHECK (ncm_codigo ~ '^[0-9]{8}$'::text)` |  |  | sim |
| protocolos_st_ncms_mva_range_chk | CHECK | `CHECK (mva_original IS NULL OR mva_original >= 0::numeric)` |  |  | sim |
| protocolos_st_ncms_ncm_id_fkey | FOREIGN KEY | `FOREIGN KEY (ncm_id) REFERENCES ncms(id)` | NO ACTION | NO ACTION | sim |
| protocolos_st_ncms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| protocolos_st_ncms_protocolo_id_fkey | FOREIGN KEY | `FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| protocolos_st_ncms_unq | UNIQUE | `UNIQUE (protocolo_id, ncm_codigo)` |  |  | sim |
| protocolos_st_ncms_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_protocolos_st_ncms_ncm_id_fk | btree | ncm_id | não | sim |  | `CREATE INDEX idx_protocolos_st_ncms_ncm_id_fk ON public.protocolos_st_ncms USING btree (ncm_id)` |
| idx_protocolos_st_ncms_protocolo_id_fk | btree | protocolo_id | não | sim |  | `CREATE INDEX idx_protocolos_st_ncms_protocolo_id_fk ON public.protocolos_st_ncms USING btree (protocolo_id)` |
| idx_pst_ncms_codigo | btree | ncm_codigo | não | sim |  | `CREATE INDEX idx_pst_ncms_codigo ON public.protocolos_st_ncms USING btree (ncm_codigo)` |
| protocolos_st_ncms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ncms_pkey ON public.protocolos_st_ncms USING btree (id)` |
| protocolos_st_ncms_unq | btree | protocolo_id, ncm_codigo | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ncms_unq ON public.protocolos_st_ncms USING btree (protocolo_id, ncm_codigo)` |


## Policies (RLS)

### `protocolos_st_ncms_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `protocolos_st_ncms_write_admin`

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
| trg_protocolo_st_ncm_autolink | BEFORE | INSERT OR UPDATE | ROW | enabled | public.protocolo_st_ncm_autolink |
| trg_protocolos_st_ncms_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
