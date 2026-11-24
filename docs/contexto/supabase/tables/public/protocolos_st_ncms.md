# public.protocolos_st_ncms

> Dicionário estrutural de public.protocolos_st_ncms (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (ncm_codigo ~ '^[0-9]{8}$'::text); CHECK (mva_original IS NULL OR mva_original >= 0::numeric); FOREIGN KEY (ncm_id) REFERENCES ncms(id); PRIMARY KEY (id); FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE; UNIQUE (protocolo_id, ncm_codigo); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `protocolo_id` | `uuid` | não |  |  | Dicionário estrutural da coluna protocolo_id em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: protocolo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE; UNIQUE (protocolo_id, ncm_codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `ncm_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna ncm_id em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: ncm_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (ncm_id) REFERENCES ncms(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `ncm_codigo` | `text` | não |  |  | Dicionário estrutural da coluna ncm_codigo em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: ncm_codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ncm_codigo ~ '^[0-9]{8}$'::text); UNIQUE (protocolo_id, ncm_codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `mva_original` | `numeric` | sim |  |  | Dicionário estrutural da coluna mva_original em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: mva_original; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (mva_original IS NULL OR mva_original >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `cest` | `text` | sim |  |  | Dicionário estrutural da coluna cest em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: cest; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `vigente_de` | `date` | não | `'2000-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2000-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.protocolos_st_ncms. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protocolos_st_ncms_codigo_formato_chk | CHECK | `CHECK (ncm_codigo ~ '^[0-9]{8}$'::text)` |  |  | sim |
| protocolos_st_ncms_mva_range_chk | CHECK | `CHECK (mva_original IS NULL OR mva_original >= 0::numeric)` |  |  | sim |
| protocolos_st_ncms_ncm_id_fkey | FOREIGN KEY | `FOREIGN KEY (ncm_id) REFERENCES ncms(id)` | NO ACTION | NO ACTION | sim |
| protocolos_st_ncms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| protocolos_st_ncms_protocolo_id_fkey | FOREIGN KEY | `FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| protocolos_st_ncms_unq | UNIQUE | `UNIQUE (protocolo_id, ncm_codigo)` |  |  | sim |
| protocolos_st_ncms_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_protocolos_st_ncms_ncm_id_fk | btree | ncm_id | não | sim |  | `CREATE INDEX idx_protocolos_st_ncms_ncm_id_fk ON public.protocolos_st_ncms USING btree (ncm_id)` |
| idx_protocolos_st_ncms_protocolo_id_fk | btree | protocolo_id | não | sim |  | `CREATE INDEX idx_protocolos_st_ncms_protocolo_id_fk ON public.protocolos_st_ncms USING btree (protocolo_id)` |
| idx_pst_ncms_codigo | btree | ncm_codigo | não | sim |  | `CREATE INDEX idx_pst_ncms_codigo ON public.protocolos_st_ncms USING btree (ncm_codigo)` |
| protocolos_st_ncms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ncms_pkey ON public.protocolos_st_ncms USING btree (id)` |
| protocolos_st_ncms_unq | btree | protocolo_id, ncm_codigo | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ncms_unq ON public.protocolos_st_ncms USING btree (protocolo_id, ncm_codigo)` |


## Policies (RLS)

### `protocolos_st_ncms_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `protocolos_st_ncms_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_protocolo_st_ncm_autolink | BEFORE | INSERT OR UPDATE | ROW | enabled | public.protocolo_st_ncm_autolink |
| trg_protocolos_st_ncms_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
