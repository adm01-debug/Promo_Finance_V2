# public.estrategias_elisao_catalogo

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
| 2 | `codigo` | `text` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `tipo` | `text` | sim |  |  |  |
| 6 | `economia_estimada_padrao` | `numeric` | sim |  |  |  |
| 7 | `ativo` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| estrategias_elisao_catalogo_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| estrategias_elisao_catalogo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.oportunidades_elisao | oportunidades_elisao_estrategia_id_fkey | estrategia_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| estrategias_elisao_catalogo_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_catalogo_codigo_key ON public.estrategias_elisao_catalogo USING btree (codigo)` |
| estrategias_elisao_catalogo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_catalogo_pkey ON public.estrategias_elisao_catalogo USING btree (id)` |


## Policies (RLS)

### `estrategias_elisao_catalogo_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
