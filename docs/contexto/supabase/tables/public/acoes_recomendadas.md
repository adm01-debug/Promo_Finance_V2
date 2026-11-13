# public.acoes_recomendadas

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
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `prioridade` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `urgencia` | `text` | sim |  |  |  |
| 9 | `impacto_estimado` | `numeric(15,2)` | sim |  |  |  |
| 10 | `impacto_tipo` | `text` | sim |  |  |  |
| 11 | `link_resolucao` | `text` | sim |  |  |  |
| 12 | `fonte` | `text` | sim |  |  |  |
| 13 | `ordem` | `integer` | sim |  |  |  |
| 14 | `gerado_em` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `score` | `numeric(5,2)` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| acoes_recomendadas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| acoes_recomendadas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| acoes_recomendadas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX acoes_recomendadas_pkey ON public.acoes_recomendadas USING btree (id)` |
| idx_acoes_recomendadas_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_acoes_recomendadas_empresa_id ON public.acoes_recomendadas USING btree (empresa_id)` |


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
