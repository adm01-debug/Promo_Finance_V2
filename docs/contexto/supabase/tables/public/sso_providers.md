# public.sso_providers

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `configuracoes` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 5 | `ativo` | `boolean` | sim | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `ordem` | `integer` | não | `0` |  |  |
| 8 | `preset` | `text` | sim |  |  |  |
| 9 | `client_id` | `text` | sim |  |  |  |
| 10 | `client_secret_ref` | `text` | sim |  |  |  |
| 11 | `discovery_url` | `text` | sim |  |  |  |
| 12 | `authorization_endpoint` | `text` | sim |  |  |  |
| 13 | `token_endpoint` | `text` | sim |  |  |  |
| 14 | `userinfo_endpoint` | `text` | sim |  |  |  |
| 15 | `jwks_uri` | `text` | sim |  |  |  |
| 16 | `scopes` | `text[]` | não | `ARRAY['openid'::text, 'profile'::text, 'email'::text]` |  |  |
| 17 | `entity_id_idp` | `text` | sim |  |  |  |
| 18 | `sso_url` | `text` | sim |  |  |  |
| 19 | `slo_url` | `text` | sim |  |  |  |
| 20 | `x509_cert` | `text` | sim |  |  |  |
| 21 | `metadata_xml` | `text` | sim |  |  |  |
| 22 | `name_id_format` | `text` | não | `'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'::text` |  |  |
| 23 | `signature_algorithm` | `text` | não | `'RSA-SHA256'::text` |  |  |
| 24 | `allowed_domains` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 25 | `claim_mapping` | `jsonb` | não | `'{"email": "email", "groups": "groups", "full_name": "name"}'::jsonb` |  |  |
| 26 | `default_role` | `app_role` | não | `'visualizador'::app_role` |  |  |
| 27 | `auto_provision_users` | `boolean` | não | `true` |  |  |
| 28 | `force_sso_for_domains` | `boolean` | não | `false` |  |  |
| 29 | `ultimo_teste_em` | `timestamp with time zone` | sim |  |  |  |
| 30 | `ultimo_teste_sucesso` | `boolean` | sim |  |  |  |
| 31 | `ultimo_teste_mensagem` | `text` | sim |  |  |  |
| 32 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 33 | `created_by` | `uuid` | sim |  |  |  |
| 34 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_providers_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sso_providers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.scim_tokens | scim_tokens_provider_id_fkey | provider_id | CASCADE |
| public.sso_role_mappings | sso_role_mappings_provider_id_fkey | provider_id | CASCADE |
| public.sso_sandbox_runs | sso_sandbox_runs_provider_id_fkey | provider_id | SET NULL |
| public.sso_user_groups | sso_user_groups_provider_id_fkey | provider_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sso_providers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_providers_pkey ON public.sso_providers USING btree (id)` |


## Policies (RLS)

### `Admins manage sso providers`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_cf7fd5d83c82e171dad1 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_audit_sso_providers | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
