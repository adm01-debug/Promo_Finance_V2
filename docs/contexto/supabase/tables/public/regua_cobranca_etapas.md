# public.regua_cobranca_etapas

> Dicionário estrutural de public.regua_cobranca_etapas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); FOREIGN KEY (regua_id) REFERENCES regua_cobranca(id) ON DELETE CASCADE; FOREIGN KEY (template_id) REFERENCES templates_cobranca(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `regua_id` | `uuid` | não |  |  | Dicionário estrutural da coluna regua_id em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: regua_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (regua_id) REFERENCES regua_cobranca(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `template_id` | `uuid` | não |  |  | Dicionário estrutural da coluna template_id em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: template_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (template_id) REFERENCES templates_cobranca(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `dias_offset` | `integer` | não |  |  | Dicionário estrutural da coluna dias_offset em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: dias_offset; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `ordem` | `integer` | não | `0` |  | Dicionário estrutural da coluna ordem em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: ordem; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.regua_cobranca_etapas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regua_cobranca_etapas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regua_cobranca_etapas_regua_id_fkey | FOREIGN KEY | `FOREIGN KEY (regua_id) REFERENCES regua_cobranca(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| regua_cobranca_etapas_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES templates_cobranca(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.fila_cobrancas | fila_cobrancas_etapa_id_fkey | etapa_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regua_cobranca_etapas_regua_id_fk | btree | regua_id | não | sim |  | `CREATE INDEX idx_regua_cobranca_etapas_regua_id_fk ON public.regua_cobranca_etapas USING btree (regua_id)` |
| idx_regua_cobranca_etapas_template_id_fk | btree | template_id | não | sim |  | `CREATE INDEX idx_regua_cobranca_etapas_template_id_fk ON public.regua_cobranca_etapas USING btree (template_id)` |
| regua_cobranca_etapas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regua_cobranca_etapas_pkey ON public.regua_cobranca_etapas USING btree (id)` |


## Policies (RLS)

### `Admins can manage stages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `regua_cobranca_etapas_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(regua_id IN ( SELECT regua_cobranca.id    FROM regua_cobranca   WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `regua_cobranca_etapas_tenant_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM regua_cobranca r   WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM regua_cobranca r   WHERE ((r.id = regua_cobranca_etapas.regua_id) AND empresa_acessivel(r.empresa_id)))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
