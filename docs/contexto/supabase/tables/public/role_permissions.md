# public.role_permissions

> Dicionário estrutural de public.role_permissions (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE; PRIMARY KEY (id); UNIQUE (role, permission_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.role_permissions. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `role` | `app_role` | não |  |  | Dicionário estrutural da coluna role em public.role_permissions. Papel funcional indicado pelo identificador: role; o catálogo não especifica significado adicional. Tipo: app_role. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: admin, manager, operator, viewer, financeiro, operacional, visualizador, contador. Restrições que envolvem a coluna: UNIQUE (role, permission_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `permission_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna permission_id em public.role_permissions. Papel funcional indicado pelo identificador: permission_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE; UNIQUE (role, permission_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.role_permissions. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| role_permissions_permission_id_fkey | FOREIGN KEY | `FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| role_permissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| role_permissions_role_permission_id_key | UNIQUE | `UNIQUE (role, permission_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_role_permissions_permission_id_fk | btree | permission_id | não | sim |  | `CREATE INDEX idx_role_permissions_permission_id_fk ON public.role_permissions USING btree (permission_id)` |
| role_permissions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id)` |
| role_permissions_role_permission_id_key | btree | role, permission_id | sim | sim |  | `CREATE UNIQUE INDEX role_permissions_role_permission_id_key ON public.role_permissions USING btree (role, permission_id)` |


## Policies (RLS)

### `Admins can delete role permissions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert role permissions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins can manage role_permissions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update role permissions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Anyone authenticated can view role_permissions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_audit_role_permissions | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
