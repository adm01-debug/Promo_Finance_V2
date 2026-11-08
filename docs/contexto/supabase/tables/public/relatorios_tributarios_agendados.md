# public.relatorios_tributarios_agendados

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `ano` | `integer` | não |  |  |  |
| 4 | `frequencia` | `text` | não | `'mensal'::text` |  |  |
| 5 | `dia_envio` | `integer` | não | `5` |  |  |
| 6 | `destinatarios` | `text[]` | não | `'{}'::text[]` |  |  |
| 7 | `ativo` | `boolean` | não | `true` |  |  |
| 8 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  |  |
| 9 | `proximo_envio_em` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| relatorios_tributarios_agendados_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| relatorios_tributarios_agendados_dia_envio_check | CHECK | `CHECK (dia_envio >= 1 AND dia_envio <= 28)` |  |  | sim |
| relatorios_tributarios_agendados_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| relatorios_tributarios_agendados_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['mensal'::text, 'trimestral'::text, 'anual'::text]))` |  |  | sim |
| relatorios_tributarios_agendados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_relatorios_tributarios_agendados_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_relatorios_tributarios_agendados_empresa ON public.relatorios_tributarios_agendados USING btree (empresa_id)` |
| relatorios_tributarios_agendados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX relatorios_tributarios_agendados_pkey ON public.relatorios_tributarios_agendados USING btree (id)` |


## Policies (RLS)

### `rel_trib_agend_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `relatorios_tributarios_agendados_all_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |

### `relatorios_tributarios_agendados_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT profiles.empresa_id    FROM profiles   WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_rel_trib_agend_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
