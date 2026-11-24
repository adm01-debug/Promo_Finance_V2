# public.user_empresas

> Dicionário estrutural de public.user_empresas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (provisioned_via = ANY (ARRAY['manual'::text, 'sso'::text, 'scim'::text])); UNIQUE (user_id, empresa_id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.user_empresas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.user_empresas. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (user_id, empresa_id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.user_empresas. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; UNIQUE (user_id, empresa_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `role` | `app_role` | não | `'visualizador'::app_role` |  | Dicionário estrutural da coluna role em public.user_empresas. Papel funcional indicado pelo identificador: role; o catálogo não especifica significado adicional. Tipo: app_role. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'visualizador'::app_role. Valores de enum: admin, manager, operator, viewer, financeiro, operacional, visualizador, contador. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `is_default` | `boolean` | não | `false` |  | Dicionário estrutural da coluna is_default em public.user_empresas. Papel funcional indicado pelo identificador: is_default; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `provisioned_via` | `text` | não | `'manual'::text` |  | Dicionário estrutural da coluna provisioned_via em public.user_empresas. Papel funcional indicado pelo identificador: provisioned_via; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'manual'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (provisioned_via = ANY (ARRAY['manual'::text, 'sso'::text, 'scim'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `scim_external_id` | `text` | sim |  |  | Dicionário estrutural da coluna scim_external_id em public.user_empresas. Papel funcional indicado pelo identificador: scim_external_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.user_empresas. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.user_empresas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.user_empresas. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_empresas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_empresas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_empresas_provisioned_via_check | CHECK | `CHECK (provisioned_via = ANY (ARRAY['manual'::text, 'sso'::text, 'scim'::text]))` |  |  | sim |
| user_empresas_user_id_empresa_id_key | UNIQUE | `UNIQUE (user_id, empresa_id)` |  |  | sim |
| user_empresas_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_empresas_empresa_ativo | btree | empresa_id, ativo | não | sim |  | `CREATE INDEX idx_user_empresas_empresa_ativo ON public.user_empresas USING btree (empresa_id, ativo)` |
| idx_user_empresas_user_ativo_empresa | btree | user_id, ativo, empresa_id | não | sim |  | `CREATE INDEX idx_user_empresas_user_ativo_empresa ON public.user_empresas USING btree (user_id, ativo, empresa_id)` |
| user_empresas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_empresas_pkey ON public.user_empresas USING btree (id)` |
| user_empresas_user_id_empresa_id_key | btree | user_id, empresa_id | sim | sim |  | `CREATE UNIQUE INDEX user_empresas_user_id_empresa_id_key ON public.user_empresas USING btree (user_id, empresa_id)` |


## Policies (RLS)

### `Admins manage user_empresas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |

### `Users view own empresa links`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_09910d2394bcdefb9694 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
