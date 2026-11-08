# public.profiles

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_auditoria_tributaria_recente |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não |  |  |  |
| 2 | `full_name` | `text` | sim |  |  |  |
| 3 | `avatar_url` | `text` | sim |  |  |  |
| 4 | `role` | `text` | sim | `'visualizador'::text` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |
| 7 | `email` | `text` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| profiles_id_fkey | FOREIGN KEY | `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bloqueios_duplicidade | bloqueios_duplicidade_usuario_id_fkey | usuario_id | SET NULL |
| public.entregas_obrigacoes | entregas_obrigacoes_registrado_por_fkey | registrado_por | SET NULL |
| public.per_dcomp | per_dcomp_created_by_fkey | created_by | SET NULL |
| public.saved_filters | saved_filters_created_by_fkey | created_by | SET NULL |
| public.saved_filters | saved_filters_user_id_fkey | user_id | CASCADE |
| public.solicitacoes_lgpd | solicitacoes_lgpd_user_id_fkey | user_id | CASCADE |
| public.user_active_filters | user_active_filters_user_id_fkey | user_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)` |
| profiles_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id)` |


## Policies (RLS)

### `Admins can manage profiles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Users can update own profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id))` |
| WITH CHECK | `(((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id)) AND profile_sensitive_fields_unchanged(id, user_id, role, empresa_id))` |

### `Users can view own profile`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_d970728376beb1370578 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_prevent_profile_privilege_escalation | BEFORE | UPDATE | ROW | enabled | public.prevent_profile_privilege_escalation |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
