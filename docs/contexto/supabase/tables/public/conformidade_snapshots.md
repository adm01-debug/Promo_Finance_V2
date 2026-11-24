# public.conformidade_snapshots

> Dicionário estrutural de public.conformidade_snapshots (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (nivel = ANY (ARRAY['critico'::text, 'atencao'::text, 'bom'::text, 'excelente'::text])); PRIMARY KEY (id); CHECK (pontualidade >= 0::numeric AND pontualidade <= 100::numeric); CHECK (score >= 0::numeric AND score <= 100::numeric); UNIQUE (empresa_id, competencia). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.conformidade_snapshots. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.conformidade_snapshots. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; UNIQUE (empresa_id, competencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `competencia` | `text` | não |  |  | Dicionário estrutural da coluna competencia em public.conformidade_snapshots. Papel funcional indicado pelo identificador: competencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text); UNIQUE (empresa_id, competencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `score` | `numeric` | não |  |  | Dicionário estrutural da coluna score em public.conformidade_snapshots. Papel funcional indicado pelo identificador: score; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (score >= 0::numeric AND score <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `nivel` | `text` | não |  |  | Dicionário estrutural da coluna nivel em public.conformidade_snapshots. Papel funcional indicado pelo identificador: nivel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (nivel = ANY (ARRAY['critico'::text, 'atencao'::text, 'bom'::text, 'excelente'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `total_obrigacoes` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_obrigacoes em public.conformidade_snapshots. Papel funcional indicado pelo identificador: total_obrigacoes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `entregues` | `integer` | não | `0` |  | Dicionário estrutural da coluna entregues em public.conformidade_snapshots. Papel funcional indicado pelo identificador: entregues; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `vencidas_pendentes` | `integer` | não | `0` |  | Dicionário estrutural da coluna vencidas_pendentes em public.conformidade_snapshots. Papel funcional indicado pelo identificador: vencidas_pendentes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `entregues_com_atraso` | `integer` | não | `0` |  | Dicionário estrutural da coluna entregues_com_atraso em public.conformidade_snapshots. Papel funcional indicado pelo identificador: entregues_com_atraso; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `pontualidade` | `numeric` | não | `0` |  | Dicionário estrutural da coluna pontualidade em public.conformidade_snapshots. Papel funcional indicado pelo identificador: pontualidade; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (pontualidade >= 0::numeric AND pontualidade <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `multa_registrada` | `numeric` | não | `0` |  | Dicionário estrutural da coluna multa_registrada em public.conformidade_snapshots. Papel funcional indicado pelo identificador: multa_registrada; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 12 | `gerado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna gerado_por em public.conformidade_snapshots. Papel funcional indicado pelo identificador: gerado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.conformidade_snapshots. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.conformidade_snapshots. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conformidade_snapshots_competencia_fmt | CHECK | `CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text)` |  |  | sim |
| conformidade_snapshots_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conformidade_snapshots_nivel_check | CHECK | `CHECK (nivel = ANY (ARRAY['critico'::text, 'atencao'::text, 'bom'::text, 'excelente'::text]))` |  |  | sim |
| conformidade_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conformidade_snapshots_pontualidade_range | CHECK | `CHECK (pontualidade >= 0::numeric AND pontualidade <= 100::numeric)` |  |  | sim |
| conformidade_snapshots_score_range | CHECK | `CHECK (score >= 0::numeric AND score <= 100::numeric)` |  |  | sim |
| conformidade_snapshots_unica | UNIQUE | `UNIQUE (empresa_id, competencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conformidade_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conformidade_snapshots_pkey ON public.conformidade_snapshots USING btree (id)` |
| conformidade_snapshots_unica | btree | empresa_id, competencia | sim | sim |  | `CREATE UNIQUE INDEX conformidade_snapshots_unica ON public.conformidade_snapshots USING btree (empresa_id, competencia)` |


## Policies (RLS)

### `conformidade_snapshots_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `conformidade_snapshots_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK |  |

### `conformidade_snapshots_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `conformidade_snapshots_tenant_rw`

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
| trg_conformidade_snapshots_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
