# public.transacoes_bancarias

> Dicionário estrutural de public.transacoes_bancarias (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (confirmado_por) REFERENCES auth.users(id); PRIMARY KEY (id); FOREIGN KEY (regra_id) REFERENCES regras_conciliacao(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.transacoes_bancarias. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `conta_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_bancaria_id em public.transacoes_bancarias. Papel funcional indicado pelo identificador: conta_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `data` | `date` | não |  |  | Dicionário estrutural da coluna data em public.transacoes_bancarias. Papel funcional indicado pelo identificador: data; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.transacoes_bancarias. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `valor` | `numeric` | não |  |  | Dicionário estrutural da coluna valor em public.transacoes_bancarias. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 6 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.transacoes_bancarias. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.transacoes_bancarias. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `categoria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna categoria_id em public.transacoes_bancarias. Papel funcional indicado pelo identificador: categoria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.transacoes_bancarias. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `compensacao_valor` | `numeric` | sim |  |  | Dicionário estrutural da coluna compensacao_valor em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 11 | `compensacao_aceita_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna compensacao_aceita_por em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_aceita_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `compensacao_aceita_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna compensacao_aceita_em em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_aceita_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `compensacao_regra` | `text` | sim |  |  | Dicionário estrutural da coluna compensacao_regra em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_regra; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `compensacao_motivo` | `text` | sim |  |  | Dicionário estrutural da coluna compensacao_motivo em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_motivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `conciliada` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna conciliada em public.transacoes_bancarias. Papel funcional indicado pelo identificador: conciliada; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `compensacao_classificacao` | `text` | sim |  |  | Dicionário estrutural da coluna compensacao_classificacao em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_classificacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `compensacao_evidencia_url` | `text` | sim |  |  | Dicionário estrutural da coluna compensacao_evidencia_url em public.transacoes_bancarias. Papel funcional indicado pelo identificador: compensacao_evidencia_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `deleted_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna deleted_at em public.transacoes_bancarias. Papel funcional indicado pelo identificador: deleted_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 19 | `saldo` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna saldo em public.transacoes_bancarias. Papel funcional indicado pelo identificador: saldo; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 20 | `regra_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna regra_id em public.transacoes_bancarias. Papel funcional indicado pelo identificador: regra_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (regra_id) REFERENCES regras_conciliacao(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `data_confirmacao` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna data_confirmacao em public.transacoes_bancarias. Papel funcional indicado pelo identificador: data_confirmacao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 22 | `confirmado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna confirmado_por em public.transacoes_bancarias. Papel funcional indicado pelo identificador: confirmado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (confirmado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `conciliacao_parcial` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna conciliacao_parcial em public.transacoes_bancarias. Papel funcional indicado pelo identificador: conciliacao_parcial; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `valor_conciliado` | `numeric` | sim |  |  | Dicionário estrutural da coluna valor_conciliado em public.transacoes_bancarias. Papel funcional indicado pelo identificador: valor_conciliado; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transacoes_bancarias_confirmado_por_fkey | FOREIGN KEY | `FOREIGN KEY (confirmado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| transacoes_bancarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| transacoes_bancarias_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES regras_conciliacao(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bloqueios_duplicidade | bloqueios_duplicidade_transacao_id_fkey | transacao_id | SET NULL |
| public.divergencias_conciliacao | divergencias_conciliacao_transacao_id_fkey | transacao_id | NO ACTION |
| public.feedback_conciliacao_ia | feedback_conciliacao_ia_transacao_id_fkey | transacao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_transacoes_bancarias_confirmado_por_fk | btree | confirmado_por | não | sim |  | `CREATE INDEX idx_transacoes_bancarias_confirmado_por_fk ON public.transacoes_bancarias USING btree (confirmado_por)` |
| idx_transacoes_bancarias_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_transacoes_bancarias_created_at ON public.transacoes_bancarias USING btree (created_at DESC)` |
| idx_transacoes_bancarias_empresa_data | btree | conta_bancaria_id, data | não | sim |  | `CREATE INDEX idx_transacoes_bancarias_empresa_data ON public.transacoes_bancarias USING btree (conta_bancaria_id, data DESC)` |
| idx_transacoes_bancarias_regra_id_fk | btree | regra_id | não | sim |  | `CREATE INDEX idx_transacoes_bancarias_regra_id_fk ON public.transacoes_bancarias USING btree (regra_id)` |
| idx_transacoes_compensacao_aceita_em | btree | compensacao_aceita_em | não | sim |  | `CREATE INDEX idx_transacoes_compensacao_aceita_em ON public.transacoes_bancarias USING btree (compensacao_aceita_em)` |
| idx_transacoes_compensacao_aceita_por | btree | compensacao_aceita_por | não | sim |  | `CREATE INDEX idx_transacoes_compensacao_aceita_por ON public.transacoes_bancarias USING btree (compensacao_aceita_por)` |
| idx_transacoes_compensacao_classificacao | btree | compensacao_classificacao | não | sim |  | `CREATE INDEX idx_transacoes_compensacao_classificacao ON public.transacoes_bancarias USING btree (compensacao_classificacao)` |
| idx_transacoes_conta | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_transacoes_conta ON public.transacoes_bancarias USING btree (conta_bancaria_id)` |
| idx_transacoes_data | btree | data | não | sim |  | `CREATE INDEX idx_transacoes_data ON public.transacoes_bancarias USING btree (data)` |
| idx_transacoes_pendentes | btree | conta_bancaria_id, data | não | sim | `(status = 'pendente'::text)` | `CREATE INDEX idx_transacoes_pendentes ON public.transacoes_bancarias USING btree (conta_bancaria_id, data DESC) WHERE (status = 'pendente'::text)` |
| transacoes_bancarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transacoes_bancarias_pkey ON public.transacoes_bancarias USING btree (id)` |


## Policies (RLS)

### `transacoes_bancarias_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(conta_bancaria_id IN ( SELECT contas_bancarias.id    FROM contas_bancarias   WHERE (contas_bancarias.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `transacoes_bancarias_financeiro_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND (conta_bancaria_id IN ( SELECT cb.id    FROM contas_bancarias cb   WHERE empresa_acessivel(cb.empresa_id))))` |

### `transacoes_bancarias_financeiro_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND (conta_bancaria_id IN ( SELECT cb.id    FROM contas_bancarias cb   WHERE empresa_acessivel(cb.empresa_id))))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND (conta_bancaria_id IN ( SELECT cb.id    FROM contas_bancarias cb   WHERE empresa_acessivel(cb.empresa_id))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
