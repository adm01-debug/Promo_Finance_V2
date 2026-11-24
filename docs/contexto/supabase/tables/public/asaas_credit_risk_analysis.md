# public.asaas_credit_risk_analysis

> Dicionário estrutural de public.asaas_credit_risk_analysis (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE; CHECK (faixa_risco = ANY (ARRAY['BAIXO'::text, 'MEDIO'::text, 'ALTO'::text])); PRIMARY KEY (id); CHECK (score_risco >= 0 AND score_risco <= 1000). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cliente_id` | `uuid` | não |  |  | Dicionário estrutural da coluna cliente_id em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: cliente_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `score_risco` | `integer` | não |  |  | Dicionário estrutural da coluna score_risco em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: score_risco; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (score_risco >= 0 AND score_risco <= 1000). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `faixa_risco` | `text` | não |  |  | Dicionário estrutural da coluna faixa_risco em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: faixa_risco; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (faixa_risco = ANY (ARRAY['BAIXO'::text, 'MEDIO'::text, 'ALTO'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `recomendacao` | `text` | sim |  |  | Dicionário estrutural da coluna recomendacao em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: recomendacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.asaas_credit_risk_analysis. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_credit_risk_analysis_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_credit_risk_analysis_faixa_risco_check | CHECK | `CHECK (faixa_risco = ANY (ARRAY['BAIXO'::text, 'MEDIO'::text, 'ALTO'::text]))` |  |  | sim |
| asaas_credit_risk_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| asaas_credit_risk_analysis_score_risco_check | CHECK | `CHECK (score_risco >= 0 AND score_risco <= 1000)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_credit_risk_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_credit_risk_analysis_pkey ON public.asaas_credit_risk_analysis USING btree (id)` |
| idx_asaas_credit_risk_analysis_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_asaas_credit_risk_analysis_cliente_id_fk ON public.asaas_credit_risk_analysis USING btree (cliente_id)` |


## Policies (RLS)

### `Users can view credit risk analysis of their customers`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(cliente_id IN ( SELECT clientes.id    FROM clientes   WHERE empresa_acessivel(clientes.empresa_id)))` |
| WITH CHECK |  |

### `credit_risk_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM clientes c   WHERE ((c.id = asaas_credit_risk_analysis.cliente_id) AND empresa_acessivel(c.empresa_id))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
