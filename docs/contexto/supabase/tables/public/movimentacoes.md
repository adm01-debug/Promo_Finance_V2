# public.movimentacoes

> Dicionário estrutural de public.movimentacoes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL; FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL; FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (tipo = ANY (ARRAY['entrada'::text, 'saida'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.movimentacoes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.movimentacoes. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `data_movimentacao` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna data_movimentacao em public.movimentacoes. Papel funcional indicado pelo identificador: data_movimentacao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 4 | `valor` | `numeric` | não | `0` |  | Dicionário estrutural da coluna valor em public.movimentacoes. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 5 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.movimentacoes. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `tipo` | `text` | sim |  |  | Dicionário estrutural da coluna tipo em public.movimentacoes. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['entrada'::text, 'saida'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.movimentacoes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `deleted_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna deleted_at em public.movimentacoes. Papel funcional indicado pelo identificador: deleted_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `conta_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_bancaria_id em public.movimentacoes. Papel funcional indicado pelo identificador: conta_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `transferencia_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transferencia_id em public.movimentacoes. Papel funcional indicado pelo identificador: transferencia_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.movimentacoes. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `origem` | `text` | sim | `'manual'::text` |  | Dicionário estrutural da coluna origem em public.movimentacoes. Papel funcional indicado pelo identificador: origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'manual'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `conta_pagar_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_pagar_id em public.movimentacoes. Papel funcional indicado pelo identificador: conta_pagar_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.movimentacoes. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `categoria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna categoria_id em public.movimentacoes. Papel funcional indicado pelo identificador: categoria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.movimentacoes. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `centro_custo_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna centro_custo_id em public.movimentacoes. Papel funcional indicado pelo identificador: centro_custo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| movimentacoes_categoria_id_fkey | FOREIGN KEY | `FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| movimentacoes_centro_custo_id_fkey | FOREIGN KEY | `FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| movimentacoes_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| movimentacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| movimentacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| movimentacoes_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['entrada'::text, 'saida'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_movimentacoes_categoria_id | btree | categoria_id | não | sim |  | `CREATE INDEX idx_movimentacoes_categoria_id ON public.movimentacoes USING btree (categoria_id)` |
| idx_movimentacoes_centro_custo_id | btree | centro_custo_id | não | sim | `(centro_custo_id IS NOT NULL)` | `CREATE INDEX idx_movimentacoes_centro_custo_id ON public.movimentacoes USING btree (centro_custo_id) WHERE (centro_custo_id IS NOT NULL)` |
| idx_movimentacoes_centro_custo_id_fk | btree | centro_custo_id | não | sim |  | `CREATE INDEX idx_movimentacoes_centro_custo_id_fk ON public.movimentacoes USING btree (centro_custo_id)` |
| idx_movimentacoes_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_movimentacoes_conta_bancaria_id ON public.movimentacoes USING btree (conta_bancaria_id)` |
| idx_movimentacoes_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  | `CREATE INDEX idx_movimentacoes_conta_pagar_id_fk ON public.movimentacoes USING btree (conta_pagar_id)` |
| idx_movimentacoes_conta_receber_id_fk | btree | conta_receber_id | não | sim |  | `CREATE INDEX idx_movimentacoes_conta_receber_id_fk ON public.movimentacoes USING btree (conta_receber_id)` |
| idx_movimentacoes_empresa_data | btree | empresa_id, data_movimentacao | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_movimentacoes_empresa_data ON public.movimentacoes USING btree (empresa_id, data_movimentacao) WHERE (deleted_at IS NULL)` |
| idx_movimentacoes_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_movimentacoes_empresa_id ON public.movimentacoes USING btree (empresa_id)` |
| movimentacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX movimentacoes_pkey ON public.movimentacoes USING btree (id)` |


## Policies (RLS)

### `Access by empresa_id`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_anexos_sync_empresa | AFTER | UPDATE | ROW | enabled | private.sincroniza_empresa_dos_anexos |
| trg_contabilizar_movimentacao | AFTER | INSERT | ROW | enabled | public.contabilizar_movimentacao |
| trg_movimentacao_origem_guard | BEFORE | INSERT OR UPDATE | ROW | enabled | public.fn_movimentacao_origem_guard |
| trg_saldo_movimentacao | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.fn_saldo_movimentacao |
| trg_sync_valor_pago | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.fn_sync_valor_pago_movimentacao |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
