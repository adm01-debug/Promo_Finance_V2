# public.per_dcomp

> Dicionário estrutural de public.per_dcomp (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL; FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (status = ANY (ARRAY['rascunho'::text, 'aguardando_transmissao'::text, 'transmitido'::text, 'em_analise'::text, 'deferido'::text, 'indeferido'::text, 'cancelado'::text])); CHECK (tipo = ANY (ARRAY['per'::text, 'dcomp'::text])); CHECK (tipo_credito_origem = ANY (ARRAY['saldo_negativo'::text, 'pagamento_indevido'::text, 'retencao'::text, 'ressarcimento'::text, 'exportacao'::text])); CHECK (valor_atualizado IS NULL OR valor_atualizado >= 0::numeric); CHECK (valor_compensado IS NULL OR valor_compensado >= 0::numeric); CHECK (valor_original >= 0::numeric). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.per_dcomp. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.per_dcomp. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.per_dcomp. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['per'::text, 'dcomp'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `numero_processo` | `text` | sim |  |  | Dicionário estrutural da coluna numero_processo em public.per_dcomp. Papel funcional indicado pelo identificador: numero_processo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `numero_recibo` | `text` | sim |  |  | Dicionário estrutural da coluna numero_recibo em public.per_dcomp. Papel funcional indicado pelo identificador: numero_recibo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `data_transmissao` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna data_transmissao em public.per_dcomp. Papel funcional indicado pelo identificador: data_transmissao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `tipo_credito_origem` | `text` | não |  |  | Dicionário estrutural da coluna tipo_credito_origem em public.per_dcomp. Papel funcional indicado pelo identificador: tipo_credito_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo_credito_origem = ANY (ARRAY['saldo_negativo'::text, 'pagamento_indevido'::text, 'retencao'::text, 'ressarcimento'::text, 'exportacao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `tributo_origem` | `text` | não |  |  | Dicionário estrutural da coluna tributo_origem em public.per_dcomp. Papel funcional indicado pelo identificador: tributo_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `competencia_origem` | `text` | não |  |  | Dicionário estrutural da coluna competencia_origem em public.per_dcomp. Papel funcional indicado pelo identificador: competencia_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `valor_original` | `numeric(18,2)` | não | `0` |  | Dicionário estrutural da coluna valor_original em public.per_dcomp. Papel funcional indicado pelo identificador: valor_original; o catálogo não especifica significado adicional. Tipo: numeric(18,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor_original >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `valor_atualizado` | `numeric(18,2)` | sim |  |  | Dicionário estrutural da coluna valor_atualizado em public.per_dcomp. Papel funcional indicado pelo identificador: valor_atualizado; o catálogo não especifica significado adicional. Tipo: numeric(18,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor_atualizado IS NULL OR valor_atualizado >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `tributo_destino` | `text` | sim |  |  | Dicionário estrutural da coluna tributo_destino em public.per_dcomp. Papel funcional indicado pelo identificador: tributo_destino; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `competencia_destino` | `text` | sim |  |  | Dicionário estrutural da coluna competencia_destino em public.per_dcomp. Papel funcional indicado pelo identificador: competencia_destino; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `valor_compensado` | `numeric(18,2)` | sim |  |  | Dicionário estrutural da coluna valor_compensado em public.per_dcomp. Papel funcional indicado pelo identificador: valor_compensado; o catálogo não especifica significado adicional. Tipo: numeric(18,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor_compensado IS NULL OR valor_compensado >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `creditos_ids` | `uuid[]` | não | `'{}'::uuid[]` |  | Dicionário estrutural da coluna creditos_ids em public.per_dcomp. Papel funcional indicado pelo identificador: creditos_ids; o catálogo não especifica significado adicional. Tipo: uuid[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::uuid[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `status` | `text` | não | `'rascunho'::text` |  | Dicionário estrutural da coluna status em public.per_dcomp. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'rascunho'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['rascunho'::text, 'aguardando_transmissao'::text, 'transmitido'::text, 'em_analise'::text, 'deferido'::text, 'indeferido'::text, 'cancelado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `data_protocolo` | `date` | sim |  |  | Dicionário estrutural da coluna data_protocolo em public.per_dcomp. Papel funcional indicado pelo identificador: data_protocolo; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `data_decisao` | `date` | sim |  |  | Dicionário estrutural da coluna data_decisao em public.per_dcomp. Papel funcional indicado pelo identificador: data_decisao; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `prazo_recurso` | `date` | sim |  |  | Dicionário estrutural da coluna prazo_recurso em public.per_dcomp. Papel funcional indicado pelo identificador: prazo_recurso; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `justificativa` | `text` | sim |  |  | Dicionário estrutural da coluna justificativa em public.per_dcomp. Papel funcional indicado pelo identificador: justificativa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `fundamentacao_legal` | `text` | sim |  |  | Dicionário estrutural da coluna fundamentacao_legal em public.per_dcomp. Papel funcional indicado pelo identificador: fundamentacao_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.per_dcomp. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.per_dcomp. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 24 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.per_dcomp. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.per_dcomp. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| per_dcomp_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| per_dcomp_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| per_dcomp_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| per_dcomp_status_check | CHECK | `CHECK (status = ANY (ARRAY['rascunho'::text, 'aguardando_transmissao'::text, 'transmitido'::text, 'em_analise'::text, 'deferido'::text, 'indeferido'::text, 'cancelado'::text]))` |  |  | sim |
| per_dcomp_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['per'::text, 'dcomp'::text]))` |  |  | sim |
| per_dcomp_tipo_credito_origem_check | CHECK | `CHECK (tipo_credito_origem = ANY (ARRAY['saldo_negativo'::text, 'pagamento_indevido'::text, 'retencao'::text, 'ressarcimento'::text, 'exportacao'::text]))` |  |  | sim |
| per_dcomp_valor_atualizado_check | CHECK | `CHECK (valor_atualizado IS NULL OR valor_atualizado >= 0::numeric)` |  |  | sim |
| per_dcomp_valor_compensado_check | CHECK | `CHECK (valor_compensado IS NULL OR valor_compensado >= 0::numeric)` |  |  | sim |
| per_dcomp_valor_original_check | CHECK | `CHECK (valor_original >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_per_dcomp_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_per_dcomp_created_by_fk ON public.per_dcomp USING btree (created_by)` |
| idx_per_dcomp_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_per_dcomp_empresa ON public.per_dcomp USING btree (empresa_id)` |
| per_dcomp_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX per_dcomp_pkey ON public.per_dcomp USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar per_dcomp`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar per_dcomp`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir per_dcomp`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver per_dcomp`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_per_dcomp_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
