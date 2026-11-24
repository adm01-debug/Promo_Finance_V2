# public.parcelas_acordo

> Dicionário estrutural de public.parcelas_acordo (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (acordo_id) REFERENCES acordos_parcelamento(id) ON DELETE CASCADE; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.parcelas_acordo. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `acordo_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna acordo_id em public.parcelas_acordo. Papel funcional indicado pelo identificador: acordo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (acordo_id) REFERENCES acordos_parcelamento(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `numero_parcela` | `integer` | não |  |  | Dicionário estrutural da coluna numero_parcela em public.parcelas_acordo. Papel funcional indicado pelo identificador: numero_parcela; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `valor` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor em public.parcelas_acordo. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `data_vencimento` | `date` | não |  |  | Dicionário estrutural da coluna data_vencimento em public.parcelas_acordo. Papel funcional indicado pelo identificador: data_vencimento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | sim | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.parcelas_acordo. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.parcelas_acordo. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `data_pagamento` | `date` | sim |  |  | Dicionário estrutural da coluna data_pagamento em public.parcelas_acordo. Papel funcional indicado pelo identificador: data_pagamento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `valor_pago` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna valor_pago em public.parcelas_acordo. Papel funcional indicado pelo identificador: valor_pago; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| parcelas_acordo_acordo_id_fkey | FOREIGN KEY | `FOREIGN KEY (acordo_id) REFERENCES acordos_parcelamento(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| parcelas_acordo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_parcelas_acordo_acordo_id_fk | btree | acordo_id | não | sim |  | `CREATE INDEX idx_parcelas_acordo_acordo_id_fk ON public.parcelas_acordo USING btree (acordo_id)` |
| parcelas_acordo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX parcelas_acordo_pkey ON public.parcelas_acordo USING btree (id)` |


## Policies (RLS)

### `parcelas_acordo_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(acordo_id IN ( SELECT a.id    FROM acordos_parcelamento a   WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `parcelas_acordo_tenant_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1    FROM acordos_parcelamento a   WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))` |
| WITH CHECK | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1    FROM acordos_parcelamento a   WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
