# public.historico_conciliacao_ia

> Dicionário estrutural de public.historico_conciliacao_ia (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (aprovado_por) REFERENCES auth.users(id); FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id); FOREIGN KEY (created_by) REFERENCES auth.users(id); PRIMARY KEY (id); FOREIGN KEY (sessao_id) REFERENCES sessoes_conciliacao(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `sessao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna sessao_id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: sessao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (sessao_id) REFERENCES sessoes_conciliacao(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `transacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: transacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `resultado` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: resultado; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 5 | `score` | `numeric` | sim |  |  | Dicionário estrutural da coluna score em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: score; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `acao` | `text` | sim |  |  | Dicionário estrutural da coluna acao em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: acao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `tipo_lancamento` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_lancamento em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: tipo_lancamento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `score_ia` | `numeric` | sim |  |  | Dicionário estrutural da coluna score_ia em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: score_ia; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `confianca` | `text` | sim |  |  | Dicionário estrutural da coluna confianca em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: confianca; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `analise_ia` | `text` | sim |  |  | Dicionário estrutural da coluna analise_ia em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: analise_ia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `transacao_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_bancaria_id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: transacao_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `conta_pagar_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_pagar_id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: conta_pagar_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `aprovado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna aprovado_por em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: aprovado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (aprovado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `motivos` | `jsonb` | sim | `'[]'::jsonb` |  | Dicionário estrutural da coluna motivos em public.historico_conciliacao_ia. Papel funcional indicado pelo identificador: motivos; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_conciliacao_ia_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| historico_conciliacao_ia_sessao_id_fkey | FOREIGN KEY | `FOREIGN KEY (sessao_id) REFERENCES sessoes_conciliacao(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_conciliacao_ia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_conciliacao_ia_pkey ON public.historico_conciliacao_ia USING btree (id)` |
| idx_historico_conciliacao_ia_aprovado_por_fk | btree | aprovado_por | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_aprovado_por_fk ON public.historico_conciliacao_ia USING btree (aprovado_por)` |
| idx_historico_conciliacao_ia_conta_receber_id_fk | btree | conta_receber_id | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_conta_receber_id_fk ON public.historico_conciliacao_ia USING btree (conta_receber_id)` |
| idx_historico_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_created_by_fk ON public.historico_conciliacao_ia USING btree (created_by)` |
| idx_historico_conciliacao_ia_sessao | btree | sessao_id | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_sessao ON public.historico_conciliacao_ia USING btree (sessao_id)` |


## Policies (RLS)

### `Financeiro+ podem inserir historico_conciliacao_ia`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND (((tipo_lancamento = 'pagar'::text) AND (conta_pagar_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM contas_pagar cp   WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND empresa_acessivel(cp.empresa_id))))) OR ((tipo_lancamento = 'receber'::text) AND (conta_receber_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM contas_receber cr   WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND empresa_acessivel(cr.empresa_id)))))))` |

### `Financeiro+ podem ver historico_conciliacao_ia`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND (((tipo_lancamento = 'pagar'::text) AND (conta_pagar_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM contas_pagar cp   WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND empresa_acessivel(cp.empresa_id))))) OR ((tipo_lancamento = 'receber'::text) AND (conta_receber_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM contas_receber cr   WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND empresa_acessivel(cr.empresa_id)))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
