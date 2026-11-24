# public.asaas_reconciliation_suggestions

> Dicionário estrutural de public.asaas_reconciliation_suggestions (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (contas_pagar_id) REFERENCES contas_pagar(id); FOREIGN KEY (contas_receber_id) REFERENCES contas_receber(id); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `transaction_id` | `text` | sim |  |  | Dicionário estrutural da coluna transaction_id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: transaction_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `score` | `numeric(5,4)` | sim | `0` |  | Dicionário estrutural da coluna score em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: score; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | sim | `'PENDING'::text` |  | Dicionário estrutural da coluna status em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'PENDING'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `contas_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna contas_receber_id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: contas_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (contas_receber_id) REFERENCES contas_receber(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `contas_pagar_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna contas_pagar_id em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: contas_pagar_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (contas_pagar_id) REFERENCES contas_pagar(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `valor` | `numeric` | sim |  |  | Dicionário estrutural da coluna valor em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 14 | `data_vencimento` | `date` | sim |  |  | Dicionário estrutural da coluna data_vencimento em public.asaas_reconciliation_suggestions. Papel funcional indicado pelo identificador: data_vencimento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_reconciliation_suggestions_contas_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (contas_pagar_id) REFERENCES contas_pagar(id)` | NO ACTION | NO ACTION | sim |
| asaas_reconciliation_suggestions_contas_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (contas_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| asaas_reconciliation_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_reconciliation_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_reconciliation_suggestions_pkey ON public.asaas_reconciliation_suggestions USING btree (id)` |
| idx_asaas_reconciliation_suggestions_contas_pagar_id_fk | btree | contas_pagar_id | não | sim |  | `CREATE INDEX idx_asaas_reconciliation_suggestions_contas_pagar_id_fk ON public.asaas_reconciliation_suggestions USING btree (contas_pagar_id)` |
| idx_asaas_reconciliation_suggestions_contas_receber_id_fk | btree | contas_receber_id | não | sim |  | `CREATE INDEX idx_asaas_reconciliation_suggestions_contas_receber_id_fk ON public.asaas_reconciliation_suggestions USING btree (contas_receber_id)` |


## Policies (RLS)

### `asaas_recon_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `asaas_reconciliation_suggestions_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_4efff01553ff16302e45 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
