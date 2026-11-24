# public.profiles

> Dicionário estrutural de public.profiles (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_auditoria_tributaria_recente |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não |  |  | Dicionário estrutural da coluna id em public.profiles. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `full_name` | `text` | sim |  |  | Dicionário estrutural da coluna full_name em public.profiles. Papel funcional indicado pelo identificador: full_name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `avatar_url` | `text` | sim |  |  | Dicionário estrutural da coluna avatar_url em public.profiles. Papel funcional indicado pelo identificador: avatar_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `role` | `text` | sim | `'visualizador'::text` |  | Dicionário estrutural da coluna role em public.profiles. Papel funcional indicado pelo identificador: role; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'visualizador'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `created_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  | Dicionário estrutural da coluna created_at em public.profiles. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: timezone('utc'::text, now()). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `updated_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  | Dicionário estrutural da coluna updated_at em public.profiles. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: timezone('utc'::text, now()). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `email` | `text` | sim |  |  | Dicionário estrutural da coluna email em public.profiles. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.profiles. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.profiles. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `telefone` | `text` | sim |  |  | Dicionário estrutural da coluna telefone em public.profiles. Papel funcional indicado pelo identificador: telefone; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| profiles_id_fkey | FOREIGN KEY | `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bloqueios_duplicidade | bloqueios_duplicidade_usuario_id_fkey | usuario_id | SET NULL |
| public.entregas_obrigacoes | entregas_obrigacoes_registrado_por_fkey | registrado_por | SET NULL |
| public.per_dcomp | per_dcomp_created_by_fkey | created_by | SET NULL |
| public.saved_filters | saved_filters_created_by_fkey | created_by | SET NULL |
| public.saved_filters | saved_filters_user_id_fkey | user_id | CASCADE |
| public.solicitacoes_lgpd | solicitacoes_lgpd_user_id_fkey | user_id | CASCADE |
| public.user_active_filters | user_active_filters_user_id_fkey | user_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_profiles_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_profiles_empresa_id ON public.profiles USING btree (empresa_id)` |
| profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)` |
| profiles_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id)` |


## Policies (RLS)

### `Admins can manage profiles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |

### `Admins can update all profiles`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Admins can view all profiles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Users can update own profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id))` |
| WITH CHECK | `(((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id)) AND profile_sensitive_fields_unchanged(id, user_id, role, empresa_id))` |

### `Users can view own profile`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id) OR (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_d970728376beb1370578 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_prevent_profile_privilege_escalation | BEFORE | UPDATE | ROW | enabled | public.prevent_profile_privilege_escalation |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
