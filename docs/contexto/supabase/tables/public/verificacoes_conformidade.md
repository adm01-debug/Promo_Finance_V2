# public.verificacoes_conformidade

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `titulo` | `text` | não |  |  |  |
| 4 | `status` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `score` | `numeric(5,2)` | sim |  |  |  |
| 7 | `periodo` | `text` | sim |  |  |  |
| 8 | `nivel` | `text` | sim |  |  |  |
| 9 | `total_checks` | `integer` | sim | `0` |  |  |
| 10 | `checks_aprovados` | `integer` | sim | `0` |  |  |
| 11 | `itens` | `jsonb` | sim | `'[]'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| verificacoes_conformidade_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| verificacoes_conformidade_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.evidencias_pacotes | evidencias_pacotes_verificacao_id_fkey | verificacao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| verificacoes_conformidade_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX verificacoes_conformidade_pkey ON public.verificacoes_conformidade USING btree (id)` |


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

_nenhum_
