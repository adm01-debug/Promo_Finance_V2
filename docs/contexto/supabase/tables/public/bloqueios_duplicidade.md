# public.bloqueios_duplicidade

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
| 3 | `transacao_id` | `uuid` | sim |  |  |  |
| 4 | `valor_bloqueado` | `numeric(15,2)` | sim |  |  |  |
| 5 | `motivo` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `usuario_id` | `uuid` | sim |  |  |  |
| 8 | `dados_tentativa` | `jsonb` | sim |  |  |  |
| 9 | `fornecedor_nome` | `text` | sim |  |  |  |
| 10 | `cnpj_fornecedor` | `text` | sim |  |  |  |
| 11 | `numero_documento` | `text` | sim |  |  |  |
| 12 | `mes_vencimento` | `text` | sim |  |  |  |
| 13 | `nivel_criticidade` | `text` | sim |  |  |  |
| 14 | `status` | `text` | sim | `'ativo'::text` |  |  |
| 15 | `ip_origem` | `text` | sim |  |  |  |
| 16 | `agente` | `text` | sim |  |  |  |
| 17 | `tabela` | `text` | sim | `'contas_pagar'::text` |  |  |
| 18 | `motivo_bloqueio` | `text` | sim |  |  |  |
| 19 | `match_type` | `text` | sim |  |  |  |
| 20 | `campos_conflitantes` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bloqueios_duplicidade_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| bloqueios_duplicidade_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bloqueios_duplicidade_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| bloqueios_duplicidade_usuario_id_fkey | FOREIGN KEY | `FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bloqueios_duplicidade_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bloqueios_duplicidade_pkey ON public.bloqueios_duplicidade USING btree (id)` |


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
