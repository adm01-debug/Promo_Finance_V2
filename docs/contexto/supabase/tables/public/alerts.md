# public.alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `type` | `alert_type` | não |  |  |  |
| 3 | `severity` | `alert_severity` | não | `'INFO'::alert_severity` |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `message` | `text` | não |  |  |  |
| 6 | `order_id` | `uuid` | sim |  |  |  |
| 7 | `driver_id` | `uuid` | sim |  |  |  |
| 8 | `is_read` | `boolean` | sim | `false` |  |  |
| 9 | `is_dismissed` | `boolean` | sim | `false` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alerts_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.alerts_sent | alerts_sent_alert_id_fkey | alert_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alerts_pkey ON public.alerts USING btree (id)` |


## Policies (RLS)

### `Authorized roles can view alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operator'::app_role))` |
| WITH CHECK |  |

### `Managers can delete alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Operators can insert alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operator'::app_role))` |

### `Operators can update alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operator'::app_role))` |
| WITH CHECK |  |

### `Viewers can view alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'viewer'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_alerts_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_default |


## Grants

_nenhum_
