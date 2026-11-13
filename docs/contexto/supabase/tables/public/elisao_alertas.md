# public.elisao_alertas

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `titulo` | `text` | não |  |  |  |
| 4 | `mensagem` | `text` | sim |  |  |  |
| 5 | `tipo` | `text` | não |  |  |  |
| 6 | `severidade` | `text` | não | `'media'::text` |  |  |
| 7 | `contexto` | `jsonb` | sim |  |  |  |
| 8 | `resolvido` | `boolean` | não | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `tipo_divergencia` | `text` | sim |  |  |  |
| 11 | `descricao` | `text` | sim |  |  |  |
| 12 | `valor_estimado` | `numeric(15,2)` | sim |  |  |  |
| 13 | `referencia_id` | `uuid` | sim |  |  |  |
| 14 | `lido` | `boolean` | não | `false` |  |  |
| 15 | `resolvido_em` | `timestamp with time zone` | sim |  |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_alertas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| elisao_alertas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| elisao_alertas_severidade_check | CHECK | `CHECK (severidade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_alertas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_alertas_pkey ON public.elisao_alertas USING btree (id)` |
| idx_elisao_alertas_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_elisao_alertas_empresa_id ON public.elisao_alertas USING btree (empresa_id)` |


## Policies (RLS)

### `elisao_alertas_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_elisao_alertas_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
