# public.acessos_suspeitos

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `event_type` | `text` | sim |  |  |  |
| 7 | `details` | `jsonb` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `tipo` | `text` | não |  |  |  |
| 10 | `severidade` | `text` | não |  |  |  |
| 11 | `janela_inicio` | `timestamp with time zone` | não |  |  |  |
| 12 | `janela_fim` | `timestamp with time zone` | não |  |  |  |
| 13 | `user_email` | `text` | sim |  |  |  |
| 14 | `table_name` | `text` | sim |  |  |  |
| 15 | `ocorrencias` | `integer` | não | `0` |  |  |
| 16 | `baseline` | `numeric` | sim |  |  |  |
| 17 | `detalhes` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 18 | `revisado_em` | `timestamp with time zone` | sim |  |  |  |
| 19 | `revisado_por` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| acessos_suspeitos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| acessos_suspeitos_severidade_check | CHECK | `CHECK (severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| acessos_suspeitos_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| acessos_suspeitos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX acessos_suspeitos_pkey ON public.acessos_suspeitos USING btree (id)` |
| uq_acessos_suspeitos_janela | btree | tipo, janela_inicio | sim | sim |  | `CREATE UNIQUE INDEX uq_acessos_suspeitos_janela ON public.acessos_suspeitos USING btree (tipo, janela_inicio, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(table_name, ''::text))` |


## Policies (RLS)

### `acessos_suspeitos_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND ((empresa_id IS NULL) OR empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
