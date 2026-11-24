# public.protocolos_st_ufs

> Dicionário estrutural de public.protocolos_st_ufs (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (papel = ANY (ARRAY['ORIGEM'::text, 'DESTINO'::text, 'AMBOS'::text])); PRIMARY KEY (id); FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE; UNIQUE (protocolo_id, uf). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `protocolo_id` | `uuid` | não |  |  | Dicionário estrutural da coluna protocolo_id em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: protocolo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE; UNIQUE (protocolo_id, uf). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `uf` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna uf em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: UNIQUE (protocolo_id, uf). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `papel` | `text` | não | `'AMBOS'::text` |  | Dicionário estrutural da coluna papel em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: papel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'AMBOS'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (papel = ANY (ARRAY['ORIGEM'::text, 'DESTINO'::text, 'AMBOS'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.protocolos_st_ufs. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protocolos_st_ufs_papel_check | CHECK | `CHECK (papel = ANY (ARRAY['ORIGEM'::text, 'DESTINO'::text, 'AMBOS'::text]))` |  |  | sim |
| protocolos_st_ufs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| protocolos_st_ufs_protocolo_id_fkey | FOREIGN KEY | `FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| protocolos_st_ufs_unique | UNIQUE | `UNIQUE (protocolo_id, uf)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| protocolos_st_ufs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ufs_pkey ON public.protocolos_st_ufs USING btree (id)` |
| protocolos_st_ufs_unique | btree | protocolo_id, uf | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ufs_unique ON public.protocolos_st_ufs USING btree (protocolo_id, uf)` |


## Policies (RLS)

### `protocolos_st_ufs_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `protocolos_st_ufs_write_admin`

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
| trg_protocolos_st_ufs_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
