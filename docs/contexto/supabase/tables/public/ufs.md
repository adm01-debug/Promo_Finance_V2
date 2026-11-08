# public.ufs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `sigla` | `uf_brasil` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `codigo_ibge` | `integer` | não |  |  |  |
| 5 | `regiao` | `regiao_brasil` | não |  |  |  |
| 6 | `aliquota_interna_padrao` | `numeric` | não | `0.18` |  |  |
| 7 | `possui_fcp` | `boolean` | não | `false` |  |  |
| 8 | `aliquota_fcp` | `numeric` | não | `0` |  |  |
| 9 | `exige_antecipacao` | `boolean` | não | `false` |  |  |
| 10 | `difal_base_dupla` | `boolean` | não | `false` |  |  |
| 11 | `observacoes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `vigente_de` | `date` | não | `'2000-01-01'::date` |  |  |
| 15 | `vigente_ate` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ufs_aliquota_fcp_range_chk | CHECK | `CHECK (aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05)` |  |  | sim |
| ufs_aliquota_interna_range_chk | CHECK | `CHECK (aliquota_interna_padrao >= 0::numeric AND aliquota_interna_padrao <= 0.35)` |  |  | sim |
| ufs_codigo_ibge_range_chk | CHECK | `CHECK (codigo_ibge >= 11 AND codigo_ibge <= 53)` |  |  | sim |
| ufs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ufs_sigla_key | UNIQUE | `UNIQUE (sigla)` |  |  | sim |
| ufs_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ufs_codigo_ibge_unq | btree | codigo_ibge | sim | sim |  | `CREATE UNIQUE INDEX ufs_codigo_ibge_unq ON public.ufs USING btree (codigo_ibge)` |
| ufs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ufs_pkey ON public.ufs USING btree (id)` |
| ufs_sigla_key | btree | sigla | sim | sim |  | `CREATE UNIQUE INDEX ufs_sigla_key ON public.ufs USING btree (sigla)` |


## Policies (RLS)

### `admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `ufs_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ufs_write_admin`

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
| trg_ufs_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
