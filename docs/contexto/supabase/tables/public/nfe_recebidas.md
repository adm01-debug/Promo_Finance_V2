# public.nfe_recebidas

> Dicionário estrutural de public.nfe_recebidas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (length(chave_acesso) = 44); UNIQUE (chave_acesso); FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id) ON DELETE SET NULL; FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.nfe_recebidas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.nfe_recebidas. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `chave_acesso` | `text` | não |  |  | Dicionário estrutural da coluna chave_acesso em public.nfe_recebidas. Papel funcional indicado pelo identificador: chave_acesso; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(chave_acesso) = 44); UNIQUE (chave_acesso). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `cnpj_destinatario` | `text` | não |  |  | Dicionário estrutural da coluna cnpj_destinatario em public.nfe_recebidas. Papel funcional indicado pelo identificador: cnpj_destinatario; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `cnpj_emitente` | `text` | não |  |  | Dicionário estrutural da coluna cnpj_emitente em public.nfe_recebidas. Papel funcional indicado pelo identificador: cnpj_emitente; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `razao_emitente` | `text` | sim |  |  | Dicionário estrutural da coluna razao_emitente em public.nfe_recebidas. Papel funcional indicado pelo identificador: razao_emitente; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `ie_emitente` | `text` | sim |  |  | Dicionário estrutural da coluna ie_emitente em public.nfe_recebidas. Papel funcional indicado pelo identificador: ie_emitente; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `uf_emitente` | `text` | sim |  |  | Dicionário estrutural da coluna uf_emitente em public.nfe_recebidas. Papel funcional indicado pelo identificador: uf_emitente; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `numero` | `text` | sim |  |  | Dicionário estrutural da coluna numero em public.nfe_recebidas. Papel funcional indicado pelo identificador: numero; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `serie` | `text` | sim |  |  | Dicionário estrutural da coluna serie em public.nfe_recebidas. Papel funcional indicado pelo identificador: serie; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `modelo` | `text` | não | `'55'::text` |  | Dicionário estrutural da coluna modelo em public.nfe_recebidas. Papel funcional indicado pelo identificador: modelo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '55'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `data_emissao` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna data_emissao em public.nfe_recebidas. Papel funcional indicado pelo identificador: data_emissao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `valor_total` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna valor_total em public.nfe_recebidas. Papel funcional indicado pelo identificador: valor_total; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `digest_value` | `text` | sim |  |  | Dicionário estrutural da coluna digest_value em public.nfe_recebidas. Papel funcional indicado pelo identificador: digest_value; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `tipo_documento` | `text` | não | `'NFe'::text` |  | Dicionário estrutural da coluna tipo_documento em public.nfe_recebidas. Papel funcional indicado pelo identificador: tipo_documento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'NFe'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `schema_tipo` | `nfe_schema_tipo` | não |  |  | Dicionário estrutural da coluna schema_tipo em public.nfe_recebidas. Papel funcional indicado pelo identificador: schema_tipo; o catálogo não especifica significado adicional. Tipo: nfe_schema_tipo. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: resNFe, procNFe, resEvento, procEventoNFe, resCTe, procCTe. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `nsu` | `bigint` | não |  |  | Dicionário estrutural da coluna nsu em public.nfe_recebidas. Papel funcional indicado pelo identificador: nsu; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 18 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  | Dicionário estrutural da coluna ambiente em public.nfe_recebidas. Papel funcional indicado pelo identificador: ambiente; o catálogo não especifica significado adicional. Tipo: sefaz_ambiente. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'homologacao'::sefaz_ambiente. Valores de enum: homologacao, producao. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `xml_path` | `text` | sim |  |  | Dicionário estrutural da coluna xml_path em public.nfe_recebidas. Papel funcional indicado pelo identificador: xml_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `xml_completo` | `boolean` | não | `false` |  | Dicionário estrutural da coluna xml_completo em public.nfe_recebidas. Papel funcional indicado pelo identificador: xml_completo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `manifestacao_status` | `nfe_manifestacao_status` | não | `'pendente'::nfe_manifestacao_status` |  | Dicionário estrutural da coluna manifestacao_status em public.nfe_recebidas. Papel funcional indicado pelo identificador: manifestacao_status; o catálogo não especifica significado adicional. Tipo: nfe_manifestacao_status. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::nfe_manifestacao_status. Valores de enum: pendente, ciencia, confirmada, desconhecida, nao_realizada. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `manifestacao_data` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna manifestacao_data em public.nfe_recebidas. Papel funcional indicado pelo identificador: manifestacao_data; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 23 | `manifestacao_justificativa` | `text` | sim |  |  | Dicionário estrutural da coluna manifestacao_justificativa em public.nfe_recebidas. Papel funcional indicado pelo identificador: manifestacao_justificativa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `situacao_nfe` | `text` | sim |  |  | Dicionário estrutural da coluna situacao_nfe em public.nfe_recebidas. Papel funcional indicado pelo identificador: situacao_nfe; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `conta_pagar_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_pagar_id em public.nfe_recebidas. Papel funcional indicado pelo identificador: conta_pagar_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `raw_metadata` | `jsonb` | sim |  |  | Dicionário estrutural da coluna raw_metadata em public.nfe_recebidas. Papel funcional indicado pelo identificador: raw_metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 27 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.nfe_recebidas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 28 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.nfe_recebidas. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nfe_recebidas_chave_acesso_check | CHECK | `CHECK (length(chave_acesso) = 44)` |  |  | sim |
| nfe_recebidas_chave_acesso_key | UNIQUE | `UNIQUE (chave_acesso)` |  |  | sim |
| nfe_recebidas_conta_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| nfe_recebidas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| nfe_recebidas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nfe_rec_dest | btree | cnpj_destinatario, data_emissao | não | sim |  | `CREATE INDEX idx_nfe_rec_dest ON public.nfe_recebidas USING btree (cnpj_destinatario, data_emissao DESC)` |
| idx_nfe_rec_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_nfe_rec_empresa ON public.nfe_recebidas USING btree (empresa_id)` |
| idx_nfe_recebidas_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  | `CREATE INDEX idx_nfe_recebidas_conta_pagar_id_fk ON public.nfe_recebidas USING btree (conta_pagar_id)` |
| nfe_recebidas_chave_acesso_key | btree | chave_acesso | sim | sim |  | `CREATE UNIQUE INDEX nfe_recebidas_chave_acesso_key ON public.nfe_recebidas USING btree (chave_acesso)` |
| nfe_recebidas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nfe_recebidas_pkey ON public.nfe_recebidas USING btree (id)` |
| uq_nfe_rec_conta_pagar | btree | conta_pagar_id | sim | sim | `(conta_pagar_id IS NOT NULL)` | `CREATE UNIQUE INDEX uq_nfe_rec_conta_pagar ON public.nfe_recebidas USING btree (conta_pagar_id) WHERE (conta_pagar_id IS NOT NULL)` |


## Policies (RLS)

### `nfe_rec_empresa_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id))))))` |
| WITH CHECK |  |

### `nfe_rec_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_nfe_rec_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |
| trg_nfe_recebidas_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
