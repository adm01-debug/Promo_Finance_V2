# public.projecoes_reforma

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `ano_referencia` | `integer` | sim |  |  |  |
| 4 | `regime_atual` | `text` | sim |  |  |  |
| 5 | `carga_atual` | `numeric(14,2)` | sim |  |  |  |
| 6 | `carga_projetada_iva` | `numeric(14,2)` | sim |  |  |  |
| 7 | `impacto_percentual` | `numeric(5,2)` | sim |  |  |  |
| 8 | `detalhes` | `jsonb` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `ano` | `integer` | não |  |  |  |
| 11 | `pis_cofins` | `numeric(15,2)` | não | `0` |  |  |
| 12 | `icms` | `numeric(15,2)` | não | `0` |  |  |
| 13 | `iss` | `numeric(15,2)` | não | `0` |  |  |
| 14 | `ipi` | `numeric(15,2)` | não | `0` |  |  |
| 15 | `cbs` | `numeric(15,2)` | não | `0` |  |  |
| 16 | `ibs` | `numeric(15,2)` | não | `0` |  |  |
| 17 | `imposto_seletivo` | `numeric(15,2)` | não | `0` |  |  |
| 18 | `total_tributos` | `numeric(15,2)` | não |  |  |  |
| 19 | `carga_percentual` | `numeric(9,4)` | não |  |  |  |
| 20 | `tem_split_payment` | `boolean` | não | `false` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| projecoes_reforma_ano_check | CHECK | `CHECK (ano >= 2026 AND ano <= 2033)` |  |  | sim |
| projecoes_reforma_carga_percentual_check | CHECK | `CHECK (carga_percentual >= 0::numeric AND carga_percentual <= 200::numeric)` |  |  | sim |
| projecoes_reforma_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| projecoes_reforma_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| projecoes_reforma_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX projecoes_reforma_pkey ON public.projecoes_reforma USING btree (id)` |


## Policies (RLS)

### `projecoes_reforma_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_proj_reforma_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
