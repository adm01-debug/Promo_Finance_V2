# public.elisao_regras_creditos

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
| 2 | `codigo` | `text` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `ncm` | `text` | sim |  |  |  |
| 6 | `cst_csosn` | `text` | sim |  |  |  |
| 7 | `metodologia` | `text` | sim |  |  |  |
| 8 | `fundamento_legal` | `text` | sim |  |  |  |
| 9 | `aliquota` | `numeric(5,2)` | sim |  |  |  |
| 10 | `ativo` | `boolean` | não | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `tipo_credito` | `text` | sim |  |  |  |
| 13 | `ncm_prefixo` | `text` | sim |  |  |  |
| 14 | `base_legal` | `text` | sim |  |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_regras_creditos_aliquota_check | CHECK | `CHECK (aliquota IS NULL OR aliquota >= 0::numeric AND aliquota <= 100::numeric)` |  |  | sim |
| elisao_regras_creditos_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| elisao_regras_creditos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.elisao_creditos_auditoria | elisao_creditos_auditoria_regra_id_fkey | regra_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_regras_creditos_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX elisao_regras_creditos_codigo_key ON public.elisao_regras_creditos USING btree (codigo)` |
| elisao_regras_creditos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_regras_creditos_pkey ON public.elisao_regras_creditos USING btree (id)` |


## Policies (RLS)

### `elisao_regras_creditos_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |

### `regras_creditos_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `regras_creditos_leitura`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_regras_creditos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_
