# public.notas_fiscais_ocr

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `chave_acesso` | `text` | sim |  |  |  |
| 4 | `numero` | `text` | sim |  |  |  |
| 5 | `serie` | `text` | sim |  |  |  |
| 6 | `cnpj_emitente` | `text` | sim |  |  |  |
| 7 | `nome_emitente` | `text` | sim |  |  |  |
| 8 | `cnpj_destinatario` | `text` | sim |  |  |  |
| 9 | `nome_destinatario` | `text` | sim |  |  |  |
| 10 | `valor_total` | `numeric(15,2)` | sim |  |  |  |
| 11 | `valor_icms` | `numeric(15,2)` | sim |  |  |  |
| 12 | `valor_pis` | `numeric(15,2)` | sim |  |  |  |
| 13 | `valor_cofins` | `numeric(15,2)` | sim |  |  |  |
| 14 | `valor_ipi` | `numeric(15,2)` | sim |  |  |  |
| 15 | `data_emissao` | `date` | sim |  |  |  |
| 16 | `itens` | `jsonb` | sim |  |  |  |
| 17 | `xml_raw` | `text` | sim |  |  |  |
| 18 | `status` | `text` | sim | `'processada'::text` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `arquivo_nome` | `text` | sim |  |  |  |
| 22 | `arquivo_url` | `text` | sim |  |  |  |
| 23 | `emitente_cnpj` | `text` | sim |  |  |  |
| 24 | `emitente_nome` | `text` | sim |  |  |  |
| 25 | `dados_extraidos` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 26 | `erro_mensagem` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notas_fiscais_ocr_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notas_fiscais_ocr_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notas_fiscais_ocr_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'processando'::text, 'processada'::text, 'erro'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.elisao_creditos_auditoria | elisao_creditos_auditoria_nota_fiscal_id_fkey | nota_fiscal_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notas_fiscais_ocr_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_ocr_pkey ON public.notas_fiscais_ocr USING btree (id)` |


## Policies (RLS)

### `notas_fiscais_ocr_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `notas_fiscais_ocr_all_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |

### `notas_fiscais_ocr_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT profiles.empresa_id    FROM profiles   WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_nf_ocr_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
