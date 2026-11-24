# public.asaas_audit_trail

> Dicionário estrutural de public.asaas_audit_trail (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (asaas_payment_id) REFERENCES asaas_payments(id) ON DELETE CASCADE; PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES auth.users(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.asaas_audit_trail. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `asaas_payment_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna asaas_payment_id em public.asaas_audit_trail. Papel funcional indicado pelo identificador: asaas_payment_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (asaas_payment_id) REFERENCES asaas_payments(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `action` | `text` | sim |  |  | Dicionário estrutural da coluna action em public.asaas_audit_trail. Papel funcional indicado pelo identificador: action; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `actor` | `uuid` | sim |  |  | Dicionário estrutural da coluna actor em public.asaas_audit_trail. Papel funcional indicado pelo identificador: actor; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `details` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna details em public.asaas_audit_trail. Papel funcional indicado pelo identificador: details; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.asaas_audit_trail. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `new_status` | `text` | sim |  |  | Dicionário estrutural da coluna new_status em public.asaas_audit_trail. Papel funcional indicado pelo identificador: new_status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `previous_status` | `text` | sim |  |  | Dicionário estrutural da coluna previous_status em public.asaas_audit_trail. Papel funcional indicado pelo identificador: previous_status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `user_id` | `uuid` | sim | `auth.uid()` |  | Dicionário estrutural da coluna user_id em public.asaas_audit_trail. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_audit_trail_asaas_payment_id_fkey | FOREIGN KEY | `FOREIGN KEY (asaas_payment_id) REFERENCES asaas_payments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_audit_trail_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| asaas_audit_trail_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_audit_trail_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_audit_trail_pkey ON public.asaas_audit_trail USING btree (id)` |
| idx_asaas_audit_trail_asaas_payment_id_fk | btree | asaas_payment_id | não | sim |  | `CREATE INDEX idx_asaas_audit_trail_asaas_payment_id_fk ON public.asaas_audit_trail USING btree (asaas_payment_id)` |
| idx_asaas_audit_trail_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_asaas_audit_trail_user_id ON public.asaas_audit_trail USING btree (user_id)` |


## Policies (RLS)

### `Users can view audit trail of their company`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((asaas_payment_id IN ( SELECT p.id    FROM asaas_payments p   WHERE empresa_acessivel(p.empresa_id))) OR ((asaas_payment_id IS NULL) AND (actor = auth.uid())))` |
| WITH CHECK |  |

### `asaas_audit_admin_all`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND ((asaas_payment_id IN ( SELECT p.id    FROM asaas_payments p   WHERE empresa_acessivel(p.empresa_id))) OR (asaas_payment_id IS NULL)))` |
| WITH CHECK |  |

### `asaas_audit_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM asaas_payments p   WHERE ((p.id = asaas_audit_trail.asaas_payment_id) AND empresa_acessivel(p.empresa_id)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
