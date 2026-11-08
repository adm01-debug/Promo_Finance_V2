# public.convites_contador

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `email` | `text` | não |  |  |  |
| 4 | `token` | `text` | não | `(gen_random_uuid())::text` |  |  |
| 5 | `status` | `text` | não | `'pendente'::text` |  |  |
| 6 | `expires_at` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 7 | `accepted_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `nome` | `text` | sim |  |  |  |
| 11 | `token_hash` | `text` | não |  |  |  |
| 12 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| convite_expira_no_futuro | CHECK | `CHECK (expires_at > created_at)` |  |  | sim |
| convite_revogado_nao_aceito | CHECK | `CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at)` |  |  | sim |
| convites_contador_email_check | CHECK | `CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)` |  |  | sim |
| convites_contador_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| convites_contador_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| convites_contador_token_hash_check | CHECK | `CHECK (token_hash ~ '^[a-f0-9]{64}$'::text)` |  |  | sim |
| convites_contador_token_hash_key | UNIQUE | `UNIQUE (token_hash)` |  |  | sim |
| convites_contador_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| convites_contador_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_pkey ON public.convites_contador USING btree (id)` |
| convites_contador_token_hash_key | btree | token_hash | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_token_hash_key ON public.convites_contador USING btree (token_hash)` |
| convites_contador_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_token_key ON public.convites_contador USING btree (token)` |
| idx_convites_contador_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_convites_contador_empresa ON public.convites_contador USING btree (empresa_id, created_at DESC)` |
| uq_convite_contador_ativo | btree | empresa_id | sim | sim | `((revoked_at IS NULL) AND (accepted_at IS NULL))` | `CREATE UNIQUE INDEX uq_convite_contador_ativo ON public.convites_contador USING btree (empresa_id, lower(email)) WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL))` |


## Policies (RLS)

### `convites_contador_revogar`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |

### `convites_contador_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_convites_contador_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
