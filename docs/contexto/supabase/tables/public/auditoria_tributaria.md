# public.auditoria_tributaria

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
| usada por views | public.vw_auditoria_tributaria_recente |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `periodo_referencia` | `date` | sim |  |  |  |
| 4 | `tipo_auditoria` | `text` | sim |  |  |  |
| 5 | `resultado` | `jsonb` | sim |  |  |  |
| 6 | `observacoes` | `text` | sim |  |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `user_id` | `uuid` | sim |  |  |  |
| 11 | `user_email` | `text` | sim |  |  |  |
| 12 | `acao` | `text` | não |  |  |  |
| 13 | `entidade_tipo` | `text` | não |  |  |  |
| 14 | `entidade_id` | `uuid` | sim |  |  |  |
| 15 | `payload_anterior` | `jsonb` | sim |  |  |  |
| 16 | `payload_novo` | `jsonb` | sim |  |  |  |
| 17 | `criado_em` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| auditoria_tributaria_acao_check | CHECK | `CHECK (acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text]))` |  |  | sim |
| auditoria_tributaria_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auditoria_tributaria_entidade_tipo_check | CHECK | `CHECK (char_length(entidade_tipo) >= 1 AND char_length(entidade_tipo) <= 120)` |  |  | sim |
| auditoria_tributaria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| auditoria_tributaria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX auditoria_tributaria_pkey ON public.auditoria_tributaria USING btree (id)` |
| idx_auditoria_trib_criado | btree | criado_em | não | sim |  | `CREATE INDEX idx_auditoria_trib_criado ON public.auditoria_tributaria USING btree (criado_em DESC)` |
| idx_auditoria_tributaria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_auditoria_tributaria_empresa_id ON public.auditoria_tributaria USING btree (empresa_id)` |


## Policies (RLS)

### `auditoria_trib_select_tenant`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
