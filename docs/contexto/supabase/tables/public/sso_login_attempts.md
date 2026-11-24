# public.sso_login_attempts

> Dicionário estrutural de public.sso_login_attempts (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sso_login_attempts. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `email` | `text` | sim |  |  | Dicionário estrutural da coluna email em public.sso_login_attempts. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `provider_id` | `text` | sim |  |  | Dicionário estrutural da coluna provider_id em public.sso_login_attempts. Papel funcional indicado pelo identificador: provider_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `event_type` | `text` | não |  |  | Dicionário estrutural da coluna event_type em public.sso_login_attempts. Papel funcional indicado pelo identificador: event_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `success` | `boolean` | sim | `true` |  | Dicionário estrutural da coluna success em public.sso_login_attempts. Papel funcional indicado pelo identificador: success; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `error_code` | `text` | sim |  |  | Dicionário estrutural da coluna error_code em public.sso_login_attempts. Papel funcional indicado pelo identificador: error_code; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.sso_login_attempts. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `context` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna context em public.sso_login_attempts. Papel funcional indicado pelo identificador: context; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.sso_login_attempts. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `app_redirect` | `text` | sim |  |  | Dicionário estrutural da coluna app_redirect em public.sso_login_attempts. Papel funcional indicado pelo identificador: app_redirect; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `code_verifier_hash` | `text` | sim |  |  | Dicionário estrutural da coluna code_verifier_hash em public.sso_login_attempts. Papel funcional indicado pelo identificador: code_verifier_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `duration_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna duration_ms em public.sso_login_attempts. Papel funcional indicado pelo identificador: duration_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 13 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.sso_login_attempts. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `state` | `text` | sim |  |  | Dicionário estrutural da coluna state em public.sso_login_attempts. Papel funcional indicado pelo identificador: state; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna expires_at em public.sso_login_attempts. Papel funcional indicado pelo identificador: expires_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_login_attempts_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sso_login_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sso_attempts_state | btree | state | não | sim | `(state IS NOT NULL)` | `CREATE INDEX idx_sso_attempts_state ON public.sso_login_attempts USING btree (state) WHERE (state IS NOT NULL)` |
| idx_sso_login_attempts_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_sso_login_attempts_empresa_id ON public.sso_login_attempts USING btree (empresa_id)` |
| sso_login_attempts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_login_attempts_pkey ON public.sso_login_attempts USING btree (id)` |


## Policies (RLS)

### `Admins can view SSO login attempts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(( SELECT sp.empresa_id    FROM sso_providers sp   WHERE ((sp.id)::text = sso_login_attempts.provider_id))))` |
| WITH CHECK |  |

### `Admins veem tentativas SSO`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(( SELECT sp.empresa_id    FROM sso_providers sp   WHERE ((sp.id)::text = sso_login_attempts.provider_id))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
