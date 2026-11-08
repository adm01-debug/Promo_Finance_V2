# public.retencoes_fonte

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
| 3 | `tipo_imposto` | `text` | sim |  |  |  |
| 4 | `valor` | `numeric(15,2)` | sim |  |  |  |
| 5 | `data_fato_gerador` | `date` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `tipo_retencao` | `text` | sim |  |  |  |
| 8 | `tipo_operacao` | `text` | sim |  |  |  |
| 9 | `nota_fiscal_id` | `uuid` | sim |  |  |  |
| 10 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 11 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 12 | `cnpj_participante` | `text` | sim |  |  |  |
| 13 | `nome_participante` | `text` | sim |  |  |  |
| 14 | `valor_base` | `numeric` | sim |  |  |  |
| 15 | `aliquota` | `numeric` | sim |  |  |  |
| 16 | `valor_retido` | `numeric` | sim |  |  |  |
| 17 | `data_retencao` | `date` | sim |  |  |  |
| 18 | `data_recolhimento` | `date` | sim |  |  |  |
| 19 | `data_vencimento` | `date` | sim |  |  |  |
| 20 | `codigo_receita` | `text` | sim |  |  |  |
| 21 | `numero_documento` | `text` | sim |  |  |  |
| 22 | `darf_gerado` | `boolean` | sim | `false` |  |  |
| 23 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 24 | `competencia` | `text` | sim |  |  |  |
| 25 | `observacoes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| retencoes_fonte_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| retencoes_fonte_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| retencoes_fonte_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'recolhido'::text, 'compensado'::text, 'cancelado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| retencoes_fonte_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX retencoes_fonte_pkey ON public.retencoes_fonte USING btree (id)` |


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
