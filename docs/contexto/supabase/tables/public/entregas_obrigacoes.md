# public.entregas_obrigacoes

> Dicionário estrutural de public.entregas_obrigacoes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); FOREIGN KEY (registrado_por) REFERENCES profiles(id) ON DELETE SET NULL; CHECK (status = ANY (ARRAY['pendente'::text, 'entregue'::text, 'dispensada'::text, 'retificada'::text])); UNIQUE (empresa_id, obrigacao_id, competencia). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; UNIQUE (empresa_id, obrigacao_id, competencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `obrigacao_id` | `text` | não |  |  | Dicionário estrutural da coluna obrigacao_id em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: obrigacao_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, obrigacao_id, competencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `competencia` | `text` | não |  |  | Dicionário estrutural da coluna competencia em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: competencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text); UNIQUE (empresa_id, obrigacao_id, competencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `prazo` | `date` | não |  |  | Dicionário estrutural da coluna prazo em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: prazo; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `data_entrega` | `date` | sim |  |  | Dicionário estrutural da coluna data_entrega em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: data_entrega; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['pendente'::text, 'entregue'::text, 'dispensada'::text, 'retificada'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `protocolo` | `text` | sim |  |  | Dicionário estrutural da coluna protocolo em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: protocolo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `valor_multa` | `numeric(18,2)` | não | `0` |  | Dicionário estrutural da coluna valor_multa em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: valor_multa; o catálogo não especifica significado adicional. Tipo: numeric(18,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `registrado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna registrado_por em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: registrado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (registrado_por) REFERENCES profiles(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.entregas_obrigacoes. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entregas_obrigacoes_competencia_fmt | CHECK | `CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text)` |  |  | sim |
| entregas_obrigacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| entregas_obrigacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| entregas_obrigacoes_registrado_por_fkey | FOREIGN KEY | `FOREIGN KEY (registrado_por) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| entregas_obrigacoes_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'entregue'::text, 'dispensada'::text, 'retificada'::text]))` |  |  | sim |
| entregas_obrigacoes_unica | UNIQUE | `UNIQUE (empresa_id, obrigacao_id, competencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entregas_obrigacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX entregas_obrigacoes_pkey ON public.entregas_obrigacoes USING btree (id)` |
| entregas_obrigacoes_unica | btree | empresa_id, obrigacao_id, competencia | sim | sim |  | `CREATE UNIQUE INDEX entregas_obrigacoes_unica ON public.entregas_obrigacoes USING btree (empresa_id, obrigacao_id, competencia)` |
| idx_entregas_obrigacoes_competencia | btree | competencia | não | sim |  | `CREATE INDEX idx_entregas_obrigacoes_competencia ON public.entregas_obrigacoes USING btree (competencia)` |
| idx_entregas_obrigacoes_registrado_por_fk | btree | registrado_por | não | sim |  | `CREATE INDEX idx_entregas_obrigacoes_registrado_por_fk ON public.entregas_obrigacoes USING btree (registrado_por)` |


## Policies (RLS)

### `entregas_obrigacoes_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `entregas_obrigacoes_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `entregas_obrigacoes_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK |  |

### `entregas_obrigacoes_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `entregas_obrigacoes_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_entregas_obrigacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
