# public.notas_fiscais

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `numero` | `text` | sim |  |  |  |
| 4 | `serie` | `text` | sim |  |  |  |
| 5 | `chave_acesso` | `text` | sim |  |  |  |
| 6 | `valor_total` | `numeric` | sim | `0` |  |  |
| 7 | `valor_icms` | `numeric` | sim | `0` |  |  |
| 8 | `status` | `text` | sim | `'emitida'::text` |  |  |
| 9 | `xml_url` | `text` | sim |  |  |  |
| 10 | `data_emissao` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `valor_produtos` | `numeric` | sim | `0` |  |  |
| 13 | `cliente_cnpj` | `text` | sim |  |  |  |
| 14 | `cliente_nome` | `text` | sim |  |  |  |
| 15 | `valor_desconto` | `numeric` | não | `0` |  |  |
| 16 | `valor_frete` | `numeric` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notas_fiscais_chave_acesso_key | UNIQUE | `UNIQUE (chave_acesso)` |  |  | sim |
| notas_fiscais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notas_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.creditos_tributarios | creditos_tributarios_nota_fiscal_id_fkey | nota_fiscal_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notas_fiscais_chave_acesso_key | btree | chave_acesso | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_chave_acesso_key ON public.notas_fiscais USING btree (chave_acesso)` |
| notas_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_pkey ON public.notas_fiscais USING btree (id)` |


## Policies (RLS)

### `notas_fiscais_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `notas_fiscais_tenant_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_membro_ativo(empresa_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
