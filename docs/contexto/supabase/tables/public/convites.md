# public.convites

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
| 2 | `organizacao_id` | `uuid` | não |  |  |  |
| 3 | `email_convidado` | `text` | não |  |  |  |
| 4 | `papel_proposto` | `org_papel` | não | `'MEMBRO'::org_papel` |  |  |
| 5 | `token` | `text` | não | `encode(gen_random_bytes(32), 'hex'::text)` |  |  |
| 6 | `expira_em` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 7 | `utilizado_em` | `timestamp with time zone` | sim |  |  |  |
| 8 | `convidado_por` | `uuid` | não |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| convites_organizacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| convites_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| convites_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| convites_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX convites_pkey ON public.convites USING btree (id)` |
| convites_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX convites_token_key ON public.convites USING btree (token)` |
| idx_convites_organizacao_id | btree | organizacao_id | não | sim |  | `CREATE INDEX idx_convites_organizacao_id ON public.convites USING btree (organizacao_id)` |
| idx_convites_organizacao_id_fk | btree | organizacao_id | não | sim |  | `CREATE INDEX idx_convites_organizacao_id_fk ON public.convites USING btree (organizacao_id)` |


## Policies (RLS)

### `convites_manage_responsavel`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((convidado_por = ( SELECT auth.uid() AS uid)) AND (is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
