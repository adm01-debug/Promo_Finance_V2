# public.creditos_tributarios

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `tipo_tributo` | `text` | não |  |  |  |
| 4 | `saldo_disponivel` | `numeric` | não | `0` |  |  |
| 5 | `data_origem` | `date` | não | `CURRENT_DATE` |  |  |
| 6 | `competencia_origem` | `text` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'disponivel'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `nota_fiscal_id` | `uuid` | sim |  |  |  |
| 10 | `valor_credito` | `numeric(15,2)` | sim |  |  |  |
| 11 | `valor_utilizado` | `numeric` | sim | `0` |  |  |
| 12 | `tipo_credito` | `text` | sim |  |  |  |
| 13 | `documento_tipo` | `text` | sim |  |  |  |
| 14 | `documento_numero` | `text` | sim |  |  |  |
| 15 | `documento_chave` | `text` | sim |  |  |  |
| 16 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 17 | `fornecedor_cnpj` | `text` | sim |  |  |  |
| 18 | `fornecedor_nome` | `text` | sim |  |  |  |
| 19 | `valor_base` | `numeric(15,2)` | sim |  |  |  |
| 20 | `aliquota` | `numeric(9,6)` | sim |  |  |  |
| 21 | `observacoes` | `text` | sim |  |  |  |
| 22 | `apuracao_id` | `uuid` | sim |  |  |  |
| 23 | `competencia_utilizacao` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| creditos_tributarios_apuracao_id_fkey | FOREIGN KEY | `FOREIGN KEY (apuracao_id) REFERENCES apuracoes_tributarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| creditos_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| creditos_tributarios_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| creditos_tributarios_nota_fiscal_id_fkey | FOREIGN KEY | `FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id)` | NO ACTION | NO ACTION | sim |
| creditos_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| creditos_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX creditos_tributarios_pkey ON public.creditos_tributarios USING btree (id)` |
| idx_creditos_tributarios_apuracao_id | btree | apuracao_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_apuracao_id ON public.creditos_tributarios USING btree (apuracao_id)` |
| idx_creditos_tributarios_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_empresa_id ON public.creditos_tributarios USING btree (empresa_id)` |
| idx_creditos_tributarios_fornecedor_id | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_fornecedor_id ON public.creditos_tributarios USING btree (fornecedor_id)` |
| idx_creditos_tributarios_nota_fiscal_id_fk | btree | nota_fiscal_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_nota_fiscal_id_fk ON public.creditos_tributarios USING btree (nota_fiscal_id)` |


## Policies (RLS)

### `Access by empresa_id`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Admin pode deletar creditos_tributarios`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar creditos_tributarios`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir creditos_tributarios`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver creditos_tributarios`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
