# public.regua_cobranca_etapas

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
| 2 | `regua_id` | `uuid` | não |  |  |  |
| 3 | `template_id` | `uuid` | não |  |  |  |
| 4 | `dias_offset` | `integer` | não |  |  |  |
| 5 | `ordem` | `integer` | não | `0` |  |  |
| 6 | `ativo` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regua_cobranca_etapas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regua_cobranca_etapas_regua_id_fkey | FOREIGN KEY | `FOREIGN KEY (regua_id) REFERENCES regua_cobranca(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| regua_cobranca_etapas_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES templates_cobranca(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.fila_cobrancas | fila_cobrancas_etapa_id_fkey | etapa_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| regua_cobranca_etapas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regua_cobranca_etapas_pkey ON public.regua_cobranca_etapas USING btree (id)` |


## Policies (RLS)

### `Admins can manage stages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `regua_cobranca_etapas_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(regua_id IN ( SELECT regua_cobranca.id    FROM regua_cobranca   WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `regua_cobranca_etapas_tenant_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM regua_cobranca r   WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM regua_cobranca r   WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
