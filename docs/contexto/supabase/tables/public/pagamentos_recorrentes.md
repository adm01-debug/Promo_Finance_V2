# public.pagamentos_recorrentes

> Dicionário estrutural de public.pagamentos_recorrentes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (data_fim IS NULL OR data_fim >= data_inicio); CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])); PRIMARY KEY (id); CHECK (total_gerado >= 0); CHECK (valor >= 0::numeric). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `plano` | `text` | sim |  |  | Dicionário estrutural da coluna plano em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: plano; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `valor` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `frequencia` | `text` | não | `'mensal'::text` |  | Dicionário estrutural da coluna frequencia em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: frequencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'mensal'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `data_inicio` | `date` | não |  |  | Dicionário estrutural da coluna data_inicio em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: data_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (data_fim IS NULL OR data_fim >= data_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `data_proximo` | `date` | sim |  |  | Dicionário estrutural da coluna data_proximo em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: data_proximo; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `data_vencimento` | `date` | sim |  |  | Dicionário estrutural da coluna data_vencimento em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: data_vencimento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `status` | `text` | não | `'ativo'::text` |  | Dicionário estrutural da coluna status em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'ativo'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `ultima_transacao_id` | `text` | sim |  |  | Dicionário estrutural da coluna ultima_transacao_id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: ultima_transacao_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `gateway` | `text` | sim |  |  | Dicionário estrutural da coluna gateway em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: gateway; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 15 | `fornecedor_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna fornecedor_id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: fornecedor_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `fornecedor_nome` | `text` | não |  |  | Dicionário estrutural da coluna fornecedor_nome em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: fornecedor_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `dia_vencimento` | `integer` | não |  |  | Dicionário estrutural da coluna dia_vencimento em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: dia_vencimento; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 18 | `data_fim` | `date` | sim |  |  | Dicionário estrutural da coluna data_fim em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: data_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (data_fim IS NULL OR data_fim >= data_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `centro_custo_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna centro_custo_id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: centro_custo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `conta_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_bancaria_id em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: conta_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `tipo_cobranca` | `tipo_cobranca` | não | `'transferencia'::tipo_cobranca` |  | Dicionário estrutural da coluna tipo_cobranca em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: tipo_cobranca; o catálogo não especifica significado adicional. Tipo: tipo_cobranca. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'transferencia'::tipo_cobranca. Valores de enum: transferencia, pix, boleto, debito_automatico, cartao_credito, cartao_debito, cheque, dinheiro. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `ultima_geracao` | `date` | sim |  |  | Dicionário estrutural da coluna ultima_geracao em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: ultima_geracao; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `proxima_geracao` | `date` | sim |  |  | Dicionário estrutural da coluna proxima_geracao em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: proxima_geracao; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `total_gerado` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_gerado em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: total_gerado; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (total_gerado >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 27 | `created_by` | `uuid` | não | `auth.uid()` |  | Dicionário estrutural da coluna created_by em public.pagamentos_recorrentes. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pag_recorrente_periodo | CHECK | `CHECK (data_fim IS NULL OR data_fim >= data_inicio)` |  |  | sim |
| pagamentos_recorrentes_dia_vencimento_check | CHECK | `CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31)` |  |  | sim |
| pagamentos_recorrentes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| pagamentos_recorrentes_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text]))` |  |  | sim |
| pagamentos_recorrentes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pagamentos_recorrentes_total_gerado_check | CHECK | `CHECK (total_gerado >= 0)` |  |  | sim |
| pagamentos_recorrentes_valor_check | CHECK | `CHECK (valor >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pag_recorr_proxima | btree | proxima_geracao | não | sim | `ativo` | `CREATE INDEX idx_pag_recorr_proxima ON public.pagamentos_recorrentes USING btree (proxima_geracao) WHERE ativo` |
| idx_pagamentos_recorrentes_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_pagamentos_recorrentes_empresa_id ON public.pagamentos_recorrentes USING btree (empresa_id)` |
| pagamentos_recorrentes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pagamentos_recorrentes_pkey ON public.pagamentos_recorrentes USING btree (id)` |


## Policies (RLS)

### `Admins podem deletar pagamentos recorrentes`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar pagamentos_recorrentes`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Operacional+ podem ver pagamentos_recorrentes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Usuários podem criar pagamentos recorrentes`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((auth.uid() = created_by) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_pag_recorr_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
