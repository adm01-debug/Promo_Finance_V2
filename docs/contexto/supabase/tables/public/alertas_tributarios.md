# public.alertas_tributarios

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `titulo` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `valor` | `numeric(15,2)` | sim |  |  |  |
| 6 | `data_vencimento` | `date` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `tipo` | `text` | sim |  |  |  |
| 10 | `mensagem` | `text` | sim |  |  |  |
| 11 | `prioridade` | `text` | sim |  |  |  |
| 12 | `lido` | `boolean` | sim | `false` |  |  |
| 13 | `resolvido` | `boolean` | sim | `false` |  |  |
| 14 | `user_id` | `uuid` | sim | `auth.uid()` |  |  |
| 15 | `data_lembrete` | `date` | sim |  |  |  |
| 16 | `entidade_tipo` | `text` | sim |  |  |  |
| 17 | `entidade_id` | `uuid` | sim |  |  |  |
| 18 | `competencia` | `text` | sim |  |  |  |
| 19 | `acao_url` | `text` | sim |  |  |  |
| 20 | `acao_label` | `text` | sim |  |  |  |
| 21 | `resolvido_em` | `timestamp with time zone` | sim |  |  |  |
| 22 | `resolvido_por` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alertas_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| alertas_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alertas_tributarios_resolvido_por_fkey | FOREIGN KEY | `FOREIGN KEY (resolvido_por) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| alertas_tributarios_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.darfs | darfs_alerta_id_fkey | alerta_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alertas_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alertas_tributarios_pkey ON public.alertas_tributarios USING btree (id)` |
| idx_alertas_tributarios_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_alertas_tributarios_empresa_id ON public.alertas_tributarios USING btree (empresa_id)` |
| idx_alertas_tributarios_resolvido_por | btree | resolvido_por | não | sim |  | `CREATE INDEX idx_alertas_tributarios_resolvido_por ON public.alertas_tributarios USING btree (resolvido_por)` |
| idx_alertas_tributarios_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_alertas_tributarios_user_id ON public.alertas_tributarios USING btree (user_id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
