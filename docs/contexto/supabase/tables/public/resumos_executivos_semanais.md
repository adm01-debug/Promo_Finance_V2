# public.resumos_executivos_semanais

> Dicionário estrutural de public.resumos_executivos_semanais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id); UNIQUE (empresa_id, semana_inicio); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id); UNIQUE (empresa_id, semana_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `semana_inicio` | `date` | não |  |  | Dicionário estrutural da coluna semana_inicio em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: semana_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, semana_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `semana_fim` | `date` | não |  |  | Dicionário estrutural da coluna semana_fim em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: semana_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `resumo_md` | `text` | não |  |  | Dicionário estrutural da coluna resumo_md em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: resumo_md; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `kpis` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna kpis em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: kpis; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 7 | `enviado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna enviado_em em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: enviado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `destinatarios` | `text[]` | não | `ARRAY[]::text[]` |  | Dicionário estrutural da coluna destinatarios em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: destinatarios; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: ARRAY[]::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `erro_envio` | `text` | sim |  |  | Dicionário estrutural da coluna erro_envio em public.resumos_executivos_semanais. Papel funcional indicado pelo identificador: erro_envio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| resumos_executivos_semanais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| resumos_executivos_semanais_empresa_id_semana_inicio_key | UNIQUE | `UNIQUE (empresa_id, semana_inicio)` |  |  | sim |
| resumos_executivos_semanais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_resumos_executivos_semanais_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_resumos_executivos_semanais_empresa_id ON public.resumos_executivos_semanais USING btree (empresa_id)` |
| resumos_executivos_semanais_empresa_id_semana_inicio_key | btree | empresa_id, semana_inicio | sim | sim |  | `CREATE UNIQUE INDEX resumos_executivos_semanais_empresa_id_semana_inicio_key ON public.resumos_executivos_semanais USING btree (empresa_id, semana_inicio)` |
| resumos_executivos_semanais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX resumos_executivos_semanais_pkey ON public.resumos_executivos_semanais USING btree (id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
