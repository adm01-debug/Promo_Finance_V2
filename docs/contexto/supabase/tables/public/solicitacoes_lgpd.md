# public.solicitacoes_lgpd

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `user_email` | `text` | não |  |  |  |
| 4 | `tipo` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'aberta'::text` |  |  |
| 6 | `justificativa` | `text` | sim |  |  |  |
| 7 | `payload_resposta` | `jsonb` | sim |  |  |  |
| 8 | `url_dump` | `text` | sim |  |  |  |
| 9 | `atendida_em` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `empresa_id` | `uuid` | sim |  |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| solicitacoes_lgpd_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| solicitacoes_lgpd_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| solicitacoes_lgpd_status_check | CHECK | `CHECK (status = ANY (ARRAY['aberta'::text, 'em_analise'::text, 'atendida'::text, 'rejeitada'::text]))` |  |  | sim |
| solicitacoes_lgpd_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['acesso'::text, 'portabilidade'::text, 'exclusao'::text, 'retificacao'::text, 'anonimizacao'::text]))` |  |  | sim |
| solicitacoes_lgpd_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_solicitacoes_lgpd_created | btree | created_at | não | sim |  | `CREATE INDEX idx_solicitacoes_lgpd_created ON public.solicitacoes_lgpd USING btree (created_at DESC)` |
| idx_solicitacoes_lgpd_user | btree | user_id | não | sim |  | `CREATE INDEX idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd USING btree (user_id)` |
| solicitacoes_lgpd_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX solicitacoes_lgpd_pkey ON public.solicitacoes_lgpd USING btree (id)` |


## Policies (RLS)

### `solicitacoes_lgpd_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `solicitacoes_lgpd_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `solicitacoes_lgpd_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_solicitacoes_lgpd_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_from_profile |
| trg_solicitacoes_lgpd_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_
