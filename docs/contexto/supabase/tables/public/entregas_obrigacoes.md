# public.entregas_obrigacoes

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `obrigacao_id` | `text` | não |  |  |  |
| 4 | `competencia` | `text` | não |  |  |  |
| 5 | `prazo` | `date` | não |  |  |  |
| 6 | `data_entrega` | `date` | sim |  |  |  |
| 7 | `status` | `text` | não | `'pendente'::text` |  |  |
| 8 | `protocolo` | `text` | sim |  |  |  |
| 9 | `valor_multa` | `numeric(18,2)` | não | `0` |  |  |
| 10 | `observacoes` | `text` | sim |  |  |  |
| 11 | `registrado_por` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entregas_obrigacoes_competencia_fmt | CHECK | `CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text)` |  |  | sim |
| entregas_obrigacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| entregas_obrigacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| entregas_obrigacoes_registrado_por_fkey | FOREIGN KEY | `FOREIGN KEY (registrado_por) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| entregas_obrigacoes_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'entregue'::text, 'dispensada'::text, 'retificada'::text]))` |  |  | sim |
| entregas_obrigacoes_unica | UNIQUE | `UNIQUE (empresa_id, obrigacao_id, competencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entregas_obrigacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX entregas_obrigacoes_pkey ON public.entregas_obrigacoes USING btree (id)` |
| entregas_obrigacoes_unica | btree | empresa_id, obrigacao_id, competencia | sim | sim |  | `CREATE UNIQUE INDEX entregas_obrigacoes_unica ON public.entregas_obrigacoes USING btree (empresa_id, obrigacao_id, competencia)` |
| idx_entregas_obrigacoes_competencia | btree | competencia | não | sim |  | `CREATE INDEX idx_entregas_obrigacoes_competencia ON public.entregas_obrigacoes USING btree (competencia)` |


## Policies (RLS)

### `entregas_obrigacoes_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `entregas_obrigacoes_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `entregas_obrigacoes_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK |  |

### `entregas_obrigacoes_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `entregas_obrigacoes_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_entregas_obrigacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
