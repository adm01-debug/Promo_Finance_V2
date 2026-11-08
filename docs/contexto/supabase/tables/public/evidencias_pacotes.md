# public.evidencias_pacotes

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
| 2 | `verificacao_id` | `uuid` | sim |  |  |  |
| 3 | `url` | `text` | sim |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 5 | `gerado_por_email` | `text` | sim |  |  |  |
| 6 | `periodo_inicio` | `date` | sim |  |  |  |
| 7 | `periodo_fim` | `date` | sim |  |  |  |
| 8 | `escopos` | `text[]` | não | `'{}'::text[]` |  |  |
| 9 | `storage_path` | `text` | sim |  |  |  |
| 10 | `tamanho_bytes` | `bigint` | sim |  |  |  |
| 11 | `manifest` | `jsonb` | não | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| evidencias_pacotes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| evidencias_pacotes_verificacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (verificacao_id) REFERENCES verificacoes_conformidade(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| evidencias_pacotes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX evidencias_pacotes_pkey ON public.evidencias_pacotes USING btree (id)` |


## Policies (RLS)

### `Evidencias scoped by verificacao`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM verificacoes_conformidade vc   WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM verificacoes_conformidade vc   WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
