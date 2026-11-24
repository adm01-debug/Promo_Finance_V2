# public.planos_acao

> Dicionário estrutural de public.planos_acao (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])); CHECK (progresso >= 0 AND progresso <= 100); CHECK (status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'cancelado'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.planos_acao. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.planos_acao. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `titulo` | `text` | não |  |  | Dicionário estrutural da coluna titulo em public.planos_acao. Papel funcional indicado pelo identificador: titulo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.planos_acao. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `prioridade` | `text` | não | `'media'::text` |  | Dicionário estrutural da coluna prioridade em public.planos_acao. Papel funcional indicado pelo identificador: prioridade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'media'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.planos_acao. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'cancelado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `prazo` | `date` | sim |  |  | Dicionário estrutural da coluna prazo em public.planos_acao. Papel funcional indicado pelo identificador: prazo; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `responsavel` | `text` | sim |  |  | Dicionário estrutural da coluna responsavel em public.planos_acao. Papel funcional indicado pelo identificador: responsavel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `categoria` | `text` | sim |  |  | Dicionário estrutural da coluna categoria em public.planos_acao. Papel funcional indicado pelo identificador: categoria; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `origem` | `text` | sim |  |  | Dicionário estrutural da coluna origem em public.planos_acao. Papel funcional indicado pelo identificador: origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `progresso` | `integer` | não | `0` |  | Dicionário estrutural da coluna progresso em public.planos_acao. Papel funcional indicado pelo identificador: progresso; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (progresso >= 0 AND progresso <= 100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `tags` | `text[]` | sim |  |  | Dicionário estrutural da coluna tags em public.planos_acao. Papel funcional indicado pelo identificador: tags; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 13 | `impacto` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna impacto em public.planos_acao. Papel funcional indicado pelo identificador: impacto; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `esforco` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna esforco em public.planos_acao. Papel funcional indicado pelo identificador: esforco; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `metadata` | `jsonb` | sim |  |  | Dicionário estrutural da coluna metadata em public.planos_acao. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.planos_acao. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.planos_acao. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| planos_acao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| planos_acao_prioridade_check | CHECK | `CHECK (prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| planos_acao_progresso_check | CHECK | `CHECK (progresso >= 0 AND progresso <= 100)` |  |  | sim |
| planos_acao_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'cancelado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_planos_acao_user | btree | user_id | não | sim |  | `CREATE INDEX idx_planos_acao_user ON public.planos_acao USING btree (user_id)` |
| planos_acao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX planos_acao_pkey ON public.planos_acao USING btree (id)` |


## Policies (RLS)

### `planos_acao_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_planos_acao_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
