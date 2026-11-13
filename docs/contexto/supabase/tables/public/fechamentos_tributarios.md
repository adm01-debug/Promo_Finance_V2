# public.fechamentos_tributarios

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `ano` | `integer` | não |  |  |  |
| 4 | `mes` | `integer` | não |  |  |  |
| 5 | `status` | `text` | não | `'em_revisao'::text` |  |  |
| 6 | `score` | `numeric(5,2)` | sim |  |  |  |
| 7 | `total_apurado` | `numeric(15,2)` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `fechado_por` | `uuid` | sim |  |  |  |
| 10 | `fechado_em` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `checklist` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 14 | `score_conformidade` | `numeric(5,2)` | não | `0` |  |  |
| 15 | `forcado` | `boolean` | não | `false` |  |  |
| 16 | `justificativa_forcado` | `text` | sim |  |  |  |
| 17 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fechamento_forcado_justificado | CHECK | `CHECK (NOT forcado OR justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10)` |  |  | sim |
| fechamentos_tributarios_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| fechamentos_tributarios_empresa_id_ano_mes_key | UNIQUE | `UNIQUE (empresa_id, ano, mes)` |  |  | sim |
| fechamentos_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| fechamentos_tributarios_fechado_por_fkey | FOREIGN KEY | `FOREIGN KEY (fechado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| fechamentos_tributarios_mes_check | CHECK | `CHECK (mes >= 1 AND mes <= 12)` |  |  | sim |
| fechamentos_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| fechamentos_tributarios_score_conformidade_check | CHECK | `CHECK (score_conformidade >= 0::numeric AND score_conformidade <= 100::numeric)` |  |  | sim |
| fechamentos_tributarios_status_check | CHECK | `CHECK (status = ANY (ARRAY['aberto'::text, 'em_revisao'::text, 'fechado'::text, 'reaberto'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fechamentos_tributarios_empresa_id_ano_mes_key | btree | empresa_id, ano, mes | sim | sim |  | `CREATE UNIQUE INDEX fechamentos_tributarios_empresa_id_ano_mes_key ON public.fechamentos_tributarios USING btree (empresa_id, ano, mes)` |
| fechamentos_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fechamentos_tributarios_pkey ON public.fechamentos_tributarios USING btree (id)` |


## Policies (RLS)

### `Apenas admin pode deletar fechamentos`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `fechamentos_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `fechamentos_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `fechamentos_tributarios_all_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |

### `fechamentos_tributarios_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT profiles.empresa_id    FROM profiles   WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))` |
| WITH CHECK |  |

### `fechamentos_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_fechamentos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
