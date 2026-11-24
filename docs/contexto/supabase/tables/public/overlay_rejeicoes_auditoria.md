# public.overlay_rejeicoes_auditoria

> Dicionário estrutural de public.overlay_rejeicoes_auditoria (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text])); PRIMARY KEY (id); CHECK (severidade = ANY (ARRAY['critico'::text, 'atencao'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nota_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna nota_id em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: nota_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `chave_acesso` | `text` | sim |  |  | Dicionário estrutural da coluna chave_acesso em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: chave_acesso; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `codigo_rejeicao` | `text` | não |  |  | Dicionário estrutural da coluna codigo_rejeicao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: codigo_rejeicao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `descricao_rejeicao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao_rejeicao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: descricao_rejeicao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `resolvido` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna resolvido em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: resolvido; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `resolved_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolved_at em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: resolved_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `catalogo` | `text` | não |  |  | Dicionário estrutural da coluna catalogo em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: catalogo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `identificador` | `text` | não |  |  | Dicionário estrutural da coluna identificador em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: identificador; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `campo` | `text` | não |  |  | Dicionário estrutural da coluna campo em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: campo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `motivo` | `text` | não |  |  | Dicionário estrutural da coluna motivo em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: motivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `valor_recebido` | `text` | sim |  |  | Dicionário estrutural da coluna valor_recebido em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: valor_recebido; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `severidade` | `text` | não | `'critico'::text` |  | Dicionário estrutural da coluna severidade em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: severidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'critico'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severidade = ANY (ARRAY['critico'::text, 'atencao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `referencia` | `date` | não |  |  | Dicionário estrutural da coluna referencia em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: referencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `ocorrencias` | `integer` | não | `1` |  | Dicionário estrutural da coluna ocorrencias em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: ocorrencias; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 1. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 19 | `primeira_deteccao` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna primeira_deteccao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: primeira_deteccao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 20 | `ultima_deteccao` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna ultima_deteccao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: ultima_deteccao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 21 | `resolvido_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolvido_em em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: resolvido_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 22 | `resolvido_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna resolvido_por em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: resolvido_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `observacao` | `text` | sim |  |  | Dicionário estrutural da coluna observacao em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: observacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.overlay_rejeicoes_auditoria. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| overlay_rejeicoes_auditoria_catalogo_check | CHECK | `CHECK (catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text]))` |  |  | sim |
| overlay_rejeicoes_auditoria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| overlay_rejeicoes_auditoria_severidade_check | CHECK | `CHECK (severidade = ANY (ARRAY['critico'::text, 'atencao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_overlay_rejeicoes_auditoria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_overlay_rejeicoes_auditoria_empresa_id ON public.overlay_rejeicoes_auditoria USING btree (empresa_id)` |
| overlay_rejeicoes_auditoria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX overlay_rejeicoes_auditoria_pkey ON public.overlay_rejeicoes_auditoria USING btree (id)` |


## Policies (RLS)

### `Gestores atualizam auditoria de overlay`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |

### `Gestores inserem auditoria de overlay`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |

### `Gestores leem auditoria de overlay`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Gestores removem auditoria de overlay`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_overlay_rejeicoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
