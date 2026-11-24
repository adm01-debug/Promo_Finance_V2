# public.oportunidades_elisao

> Dicionário estrutural de public.oportunidades_elisao (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; FOREIGN KEY (estrategia_id) REFERENCES estrategias_elisao_catalogo(id); PRIMARY KEY (id); CHECK (status = ANY (ARRAY['identificada'::text, 'em_analise'::text, 'aprovada'::text, 'em_execucao'::text, 'implementada'::text, 'descartada'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.oportunidades_elisao. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.oportunidades_elisao. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `estrategia_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna estrategia_id em public.oportunidades_elisao. Papel funcional indicado pelo identificador: estrategia_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (estrategia_id) REFERENCES estrategias_elisao_catalogo(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `titulo` | `text` | não |  |  | Dicionário estrutural da coluna titulo em public.oportunidades_elisao. Papel funcional indicado pelo identificador: titulo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.oportunidades_elisao. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `economia_estimada` | `numeric` | não | `0` |  | Dicionário estrutural da coluna economia_estimada em public.oportunidades_elisao. Papel funcional indicado pelo identificador: economia_estimada; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `economia_percentual` | `numeric` | sim |  |  | Dicionário estrutural da coluna economia_percentual em public.oportunidades_elisao. Papel funcional indicado pelo identificador: economia_percentual; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `status` | `text` | não | `'identificada'::text` |  | Dicionário estrutural da coluna status em public.oportunidades_elisao. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'identificada'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['identificada'::text, 'em_analise'::text, 'aprovada'::text, 'em_execucao'::text, 'implementada'::text, 'descartada'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `prazo_estimado` | `text` | sim |  |  | Dicionário estrutural da coluna prazo_estimado em public.oportunidades_elisao. Papel funcional indicado pelo identificador: prazo_estimado; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `prioridade` | `text` | sim | `'media'::text` |  | Dicionário estrutural da coluna prioridade em public.oportunidades_elisao. Papel funcional indicado pelo identificador: prioridade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'media'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.oportunidades_elisao. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.oportunidades_elisao. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `estrategia` | `text` | sim |  |  | Dicionário estrutural da coluna estrategia em public.oportunidades_elisao. Papel funcional indicado pelo identificador: estrategia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `categoria` | `text` | sim |  |  | Dicionário estrutural da coluna categoria em public.oportunidades_elisao. Papel funcional indicado pelo identificador: categoria; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `aplicavel` | `boolean` | não | `true` |  | Dicionário estrutural da coluna aplicavel em public.oportunidades_elisao. Papel funcional indicado pelo identificador: aplicavel; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `motivo_nao_aplicavel` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_nao_aplicavel em public.oportunidades_elisao. Papel funcional indicado pelo identificador: motivo_nao_aplicavel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `economia_10anos_estimada` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna economia_10anos_estimada em public.oportunidades_elisao. Papel funcional indicado pelo identificador: economia_10anos_estimada; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `custo_implementacao` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna custo_implementacao em public.oportunidades_elisao. Papel funcional indicado pelo identificador: custo_implementacao; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `roi_pct` | `numeric(9,2)` | sim |  |  | Dicionário estrutural da coluna roi_pct em public.oportunidades_elisao. Papel funcional indicado pelo identificador: roi_pct; o catálogo não especifica significado adicional. Tipo: numeric(9,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `payback_meses` | `numeric(7,2)` | sim |  |  | Dicionário estrutural da coluna payback_meses em public.oportunidades_elisao. Papel funcional indicado pelo identificador: payback_meses; o catálogo não especifica significado adicional. Tipo: numeric(7,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `base_legal` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal em public.oportunidades_elisao. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `risco` | `text` | sim |  |  | Dicionário estrutural da coluna risco em public.oportunidades_elisao. Papel funcional indicado pelo identificador: risco; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.oportunidades_elisao. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `inputs_utilizados` | `jsonb` | sim |  |  | Dicionário estrutural da coluna inputs_utilizados em public.oportunidades_elisao. Papel funcional indicado pelo identificador: inputs_utilizados; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 25 | `memoria_calculo` | `text` | sim |  |  | Dicionário estrutural da coluna memoria_calculo em public.oportunidades_elisao. Papel funcional indicado pelo identificador: memoria_calculo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `status_alterado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna status_alterado_em em public.oportunidades_elisao. Papel funcional indicado pelo identificador: status_alterado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 27 | `status_alterado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna status_alterado_por em public.oportunidades_elisao. Papel funcional indicado pelo identificador: status_alterado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 28 | `data_identificacao` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_identificacao em public.oportunidades_elisao. Papel funcional indicado pelo identificador: data_identificacao; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 29 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.oportunidades_elisao. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| oportunidades_elisao_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| oportunidades_elisao_estrategia_id_fkey | FOREIGN KEY | `FOREIGN KEY (estrategia_id) REFERENCES estrategias_elisao_catalogo(id)` | NO ACTION | NO ACTION | sim |
| oportunidades_elisao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| oportunidades_elisao_status_check | CHECK | `CHECK (status = ANY (ARRAY['identificada'::text, 'em_analise'::text, 'aprovada'::text, 'em_execucao'::text, 'implementada'::text, 'descartada'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_oportunidades_elisao_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_oportunidades_elisao_empresa_id ON public.oportunidades_elisao USING btree (empresa_id)` |
| idx_oportunidades_elisao_estrategia_id_fk | btree | estrategia_id | não | sim |  | `CREATE INDEX idx_oportunidades_elisao_estrategia_id_fk ON public.oportunidades_elisao USING btree (estrategia_id)` |
| oportunidades_elisao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX oportunidades_elisao_pkey ON public.oportunidades_elisao USING btree (id)` |


## Policies (RLS)

### `Admin/financeiro can delete oportunidades elisao`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Admin/financeiro can update oportunidades elisao`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Authorized roles can insert oportunidades elisao`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Authorized roles can view oportunidades elisao`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role, 'visualizador'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_oport_elisao_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
