# public.sso_sandbox_runs

> Dicionário estrutural de public.sso_sandbox_runs (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text])); PRIMARY KEY (id); FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE SET NULL. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `provider_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna provider_id em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: provider_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `config_snapshot` | `jsonb` | sim |  |  | Dicionário estrutural da coluna config_snapshot em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: config_snapshot; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 4 | `test_result` | `jsonb` | sim |  |  | Dicionário estrutural da coluna test_result em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: test_result; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'pending'::text` |  | Dicionário estrutural da coluna status em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pending'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_by_email` | `text` | sim |  |  | Dicionário estrutural da coluna created_by_email em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: created_by_email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `provider_nome` | `text` | sim |  |  | Dicionário estrutural da coluna provider_nome em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: provider_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `use_provider_config` | `boolean` | não | `true` |  | Dicionário estrutural da coluna use_provider_config em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: use_provider_config; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `input` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna input em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: input; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 12 | `result` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna result em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: result; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 13 | `outcome` | `text` | não |  |  | Dicionário estrutural da coluna outcome em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: outcome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `email_masked` | `text` | sim |  |  | Dicionário estrutural da coluna email_masked em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: email_masked; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `resolved_role` | `text` | sim |  |  | Dicionário estrutural da coluna resolved_role em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: resolved_role; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `matched_group` | `text` | sim |  |  | Dicionário estrutural da coluna matched_group em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: matched_group; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `has_errors` | `boolean` | não | `false` |  | Dicionário estrutural da coluna has_errors em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: has_errors; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `batch_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna batch_id em public.sso_sandbox_runs. Papel funcional indicado pelo identificador: batch_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_sandbox_runs_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text]))` |  |  | sim |
| sso_sandbox_runs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_sandbox_runs_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sso_sandbox_runs_provider_id_fk | btree | provider_id | não | sim |  | `CREATE INDEX idx_sso_sandbox_runs_provider_id_fk ON public.sso_sandbox_runs USING btree (provider_id)` |
| sso_sandbox_runs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_sandbox_runs_pkey ON public.sso_sandbox_runs USING btree (id)` |


## Policies (RLS)

### `sso_sandbox_runs_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid()))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
