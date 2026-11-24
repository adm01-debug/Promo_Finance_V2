# public.tax_audit_trail

> Dicionário estrutural de public.tax_audit_trail (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (action = ANY (ARRAY['simulated'::text, 'cache_hit'::text, 'decided'::text, 'exported'::text])); CHECK (ano >= 2000 AND ano <= 2100); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (mes >= 1 AND mes <= 12); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.tax_audit_trail. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.tax_audit_trail. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.tax_audit_trail. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `ano` | `integer` | sim |  |  | Dicionário estrutural da coluna ano em public.tax_audit_trail. Papel funcional indicado pelo identificador: ano; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ano >= 2000 AND ano <= 2100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `mes` | `integer` | sim |  |  | Dicionário estrutural da coluna mes em public.tax_audit_trail. Papel funcional indicado pelo identificador: mes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (mes >= 1 AND mes <= 12). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `action` | `text` | não |  |  | Dicionário estrutural da coluna action em public.tax_audit_trail. Papel funcional indicado pelo identificador: action; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (action = ANY (ARRAY['simulated'::text, 'cache_hit'::text, 'decided'::text, 'exported'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `parameters` | `jsonb` | sim |  |  | Dicionário estrutural da coluna parameters em public.tax_audit_trail. Papel funcional indicado pelo identificador: parameters; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `prompt` | `text` | sim |  |  | Dicionário estrutural da coluna prompt em public.tax_audit_trail. Papel funcional indicado pelo identificador: prompt; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `response` | `text` | sim |  |  | Dicionário estrutural da coluna response em public.tax_audit_trail. Papel funcional indicado pelo identificador: response; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `is_ai_justified` | `boolean` | não | `false` |  | Dicionário estrutural da coluna is_ai_justified em public.tax_audit_trail. Papel funcional indicado pelo identificador: is_ai_justified; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.tax_audit_trail. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tax_audit_trail_action_check | CHECK | `CHECK (action = ANY (ARRAY['simulated'::text, 'cache_hit'::text, 'decided'::text, 'exported'::text]))` |  |  | sim |
| tax_audit_trail_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| tax_audit_trail_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tax_audit_trail_mes_check | CHECK | `CHECK (mes >= 1 AND mes <= 12)` |  |  | sim |
| tax_audit_trail_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tax_audit_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_tax_audit_empresa ON public.tax_audit_trail USING btree (empresa_id, created_at DESC)` |
| tax_audit_trail_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tax_audit_trail_pkey ON public.tax_audit_trail USING btree (id)` |


## Policies (RLS)

### `tax_audit_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
