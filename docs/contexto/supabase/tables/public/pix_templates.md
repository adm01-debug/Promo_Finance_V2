# public.pix_templates

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `chave_pix` | `text` | não |  |  |  |
| 4 | `tipo_chave` | `text` | não |  |  |  |
| 5 | `beneficiario_nome` | `text` | não |  |  |  |
| 6 | `cidade` | `text` | não |  |  |  |
| 7 | `ativo` | `boolean` | não | `true` |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `instrucoes` | `text` | sim |  |  |  |
| 11 | `uso_count` | `integer` | não | `0` |  |  |
| 12 | `descricao` | `text` | sim |  |  |  |
| 13 | `centro_custo_id` | `uuid` | sim |  |  |  |
| 14 | `favorecido_nome` | `text` | sim |  |  |  |
| 15 | `favorecido_cpf_cnpj` | `text` | sim |  |  |  |
| 16 | `tipo_chave_pix` | `text` | sim |  |  |  |
| 17 | `valor_padrao` | `numeric(14,2)` | não | `0` |  |  |
| 18 | `valor_fixo` | `boolean` | não | `false` |  |  |
| 19 | `categoria` | `text` | sim |  |  |  |
| 20 | `tags` | `text[]` | não | `'{}'::text[]` |  |  |
| 21 | `ultimo_uso` | `timestamp with time zone` | sim |  |  |  |
| 22 | `created_by` | `uuid` | sim |  |  |  |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pix_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pix_templates_uso_count_check | CHECK | `CHECK (uso_count >= 0)` |  |  | sim |
| pix_templates_valor_padrao_nao_negativo | CHECK | `CHECK (valor_padrao >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| pix_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pix_templates_pkey ON public.pix_templates USING btree (id)` |


## Policies (RLS)

### `Admins can manage pix`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `pix_templates_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `pix_templates_tenant_rw`

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
| trg_pix_template_sync_legacy | BEFORE | INSERT OR UPDATE | ROW | enabled | public.pix_template_sync_legacy |
| trg_pix_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
