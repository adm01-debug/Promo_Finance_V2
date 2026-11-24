# public.fechamentos_tributarios

> Dicionário estrutural de public.fechamentos_tributarios (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (NOT forcado OR justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10); CHECK (ano >= 2000 AND ano <= 2100); UNIQUE (empresa_id, ano, mes); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; FOREIGN KEY (fechado_por) REFERENCES auth.users(id); CHECK (mes >= 1 AND mes <= 12); PRIMARY KEY (id); CHECK (score_conformidade >= 0::numeric AND score_conformidade <= 100::numeric); CHECK (status = ANY (ARRAY['aberto'::text, 'em_revisao'::text, 'fechado'::text, 'reaberto'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, ano, mes); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `ano` | `integer` | não |  |  | Dicionário estrutural da coluna ano em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: ano; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ano >= 2000 AND ano <= 2100); UNIQUE (empresa_id, ano, mes). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `mes` | `integer` | não |  |  | Dicionário estrutural da coluna mes em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: mes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, ano, mes); CHECK (mes >= 1 AND mes <= 12). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'em_revisao'::text` |  | Dicionário estrutural da coluna status em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'em_revisao'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['aberto'::text, 'em_revisao'::text, 'fechado'::text, 'reaberto'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `score` | `numeric(5,2)` | sim |  |  | Dicionário estrutural da coluna score em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: score; o catálogo não especifica significado adicional. Tipo: numeric(5,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `total_apurado` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna total_apurado em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: total_apurado; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `fechado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna fechado_por em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: fechado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (fechado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `fechado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna fechado_em em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: fechado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `checklist` | `jsonb` | não | `'[]'::jsonb` |  | Dicionário estrutural da coluna checklist em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: checklist; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 14 | `score_conformidade` | `numeric(5,2)` | não | `0` |  | Dicionário estrutural da coluna score_conformidade em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: score_conformidade; o catálogo não especifica significado adicional. Tipo: numeric(5,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (score_conformidade >= 0::numeric AND score_conformidade <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `forcado` | `boolean` | não | `false` |  | Dicionário estrutural da coluna forcado em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: forcado; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (NOT forcado OR justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `justificativa_forcado` | `text` | sim |  |  | Dicionário estrutural da coluna justificativa_forcado em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: justificativa_forcado; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (NOT forcado OR justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.fechamentos_tributarios. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fechamento_forcado_justificado | CHECK | `CHECK (NOT forcado OR justificativa_forcado IS NOT NULL AND char_length(btrim(justificativa_forcado)) >= 10)` |  |  | sim |
| fechamentos_tributarios_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| fechamentos_tributarios_empresa_id_ano_mes_key | UNIQUE | `UNIQUE (empresa_id, ano, mes)` |  |  | sim |
| fechamentos_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| fechamentos_tributarios_fechado_por_fkey | FOREIGN KEY | `FOREIGN KEY (fechado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| fechamentos_tributarios_mes_check | CHECK | `CHECK (mes >= 1 AND mes <= 12)` |  |  | sim |
| fechamentos_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| fechamentos_tributarios_score_conformidade_check | CHECK | `CHECK (score_conformidade >= 0::numeric AND score_conformidade <= 100::numeric)` |  |  | sim |
| fechamentos_tributarios_status_check | CHECK | `CHECK (status = ANY (ARRAY['aberto'::text, 'em_revisao'::text, 'fechado'::text, 'reaberto'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fechamentos_tributarios_empresa_id_ano_mes_key | btree | empresa_id, ano, mes | sim | sim |  | `CREATE UNIQUE INDEX fechamentos_tributarios_empresa_id_ano_mes_key ON public.fechamentos_tributarios USING btree (empresa_id, ano, mes)` |
| fechamentos_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fechamentos_tributarios_pkey ON public.fechamentos_tributarios USING btree (id)` |
| idx_fechamentos_tributarios_fechado_por_fk | btree | fechado_por | não | sim |  | `CREATE INDEX idx_fechamentos_tributarios_fechado_por_fk ON public.fechamentos_tributarios USING btree (fechado_por)` |


## Policies (RLS)

### `Apenas admin pode deletar fechamentos`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `fechamentos_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `fechamentos_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `fechamentos_tributarios_all_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |

### `fechamentos_tributarios_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT profiles.empresa_id    FROM profiles   WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))` |
| WITH CHECK |  |

### `fechamentos_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_fechamentos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
