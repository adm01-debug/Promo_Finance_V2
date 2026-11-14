# public.fluxos_aprovacao_niveis

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
| 2 | `configuracao_id` | `uuid` | sim |  |  |  |
| 3 | `nivel` | `integer` | sim |  |  |  |
| 4 | `role_responsavel` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `empresa_id` | `uuid` | sim |  |  |  |
| 7 | `ordem` | `integer` | sim |  |  |  |
| 8 | `nome` | `text` | sim |  |  |  |
| 9 | `descricao` | `text` | sim |  |  |  |
| 10 | `valor_minimo` | `numeric` | sim | `0` |  |  |
| 11 | `aprovadores_obrigatorios` | `integer` | sim | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fluxos_aprovacao_niveis_configuracao_id_fkey | FOREIGN KEY | `FOREIGN KEY (configuracao_id) REFERENCES configuracoes_aprovacao(id)` | NO ACTION | NO ACTION | sim |
| fluxos_aprovacao_niveis_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| fluxos_aprovacao_niveis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fluxos_aprovacao_niveis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fluxos_aprovacao_niveis_pkey ON public.fluxos_aprovacao_niveis USING btree (id)` |
| idx_fluxos_aprovacao_niveis_configuracao_id_fk | btree | configuracao_id | não | sim |  | `CREATE INDEX idx_fluxos_aprovacao_niveis_configuracao_id_fk ON public.fluxos_aprovacao_niveis USING btree (configuracao_id)` |
| idx_fluxos_aprovacao_niveis_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_fluxos_aprovacao_niveis_empresa_id ON public.fluxos_aprovacao_niveis USING btree (empresa_id)` |


## Policies (RLS)

### `Access by empresa_id`

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
