# public.ufs

> Dicionário estrutural de public.ufs (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05); CHECK (aliquota_interna_padrao >= 0::numeric AND aliquota_interna_padrao <= 0.35); CHECK (codigo_ibge >= 11 AND codigo_ibge <= 53); PRIMARY KEY (id); UNIQUE (sigla); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.ufs. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `sigla` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna sigla em public.ufs. Papel funcional indicado pelo identificador: sigla; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: UNIQUE (sigla). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.ufs. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `codigo_ibge` | `integer` | não |  |  | Dicionário estrutural da coluna codigo_ibge em public.ufs. Papel funcional indicado pelo identificador: codigo_ibge; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (codigo_ibge >= 11 AND codigo_ibge <= 53). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `regiao` | `regiao_brasil` | não |  |  | Dicionário estrutural da coluna regiao em public.ufs. Papel funcional indicado pelo identificador: regiao; o catálogo não especifica significado adicional. Tipo: regiao_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: NORTE, NORDESTE, CENTRO_OESTE, SUDESTE, SUL. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `aliquota_interna_padrao` | `numeric` | não | `0.18` |  | Dicionário estrutural da coluna aliquota_interna_padrao em public.ufs. Papel funcional indicado pelo identificador: aliquota_interna_padrao; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.18. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_interna_padrao >= 0::numeric AND aliquota_interna_padrao <= 0.35). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `possui_fcp` | `boolean` | não | `false` |  | Dicionário estrutural da coluna possui_fcp em public.ufs. Papel funcional indicado pelo identificador: possui_fcp; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `aliquota_fcp` | `numeric` | não | `0` |  | Dicionário estrutural da coluna aliquota_fcp em public.ufs. Papel funcional indicado pelo identificador: aliquota_fcp; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `exige_antecipacao` | `boolean` | não | `false` |  | Dicionário estrutural da coluna exige_antecipacao em public.ufs. Papel funcional indicado pelo identificador: exige_antecipacao; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `difal_base_dupla` | `boolean` | não | `false` |  | Dicionário estrutural da coluna difal_base_dupla em public.ufs. Papel funcional indicado pelo identificador: difal_base_dupla; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.ufs. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.ufs. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.ufs. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `vigente_de` | `date` | não | `'2000-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.ufs. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2000-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.ufs. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ufs_aliquota_fcp_range_chk | CHECK | `CHECK (aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05)` |  |  | sim |
| ufs_aliquota_interna_range_chk | CHECK | `CHECK (aliquota_interna_padrao >= 0::numeric AND aliquota_interna_padrao <= 0.35)` |  |  | sim |
| ufs_codigo_ibge_range_chk | CHECK | `CHECK (codigo_ibge >= 11 AND codigo_ibge <= 53)` |  |  | sim |
| ufs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ufs_sigla_key | UNIQUE | `UNIQUE (sigla)` |  |  | sim |
| ufs_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ufs_codigo_ibge_unq | btree | codigo_ibge | sim | sim |  | `CREATE UNIQUE INDEX ufs_codigo_ibge_unq ON public.ufs USING btree (codigo_ibge)` |
| ufs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ufs_pkey ON public.ufs USING btree (id)` |
| ufs_sigla_key | btree | sigla | sim | sim |  | `CREATE UNIQUE INDEX ufs_sigla_key ON public.ufs USING btree (sigla)` |


## Policies (RLS)

### `admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `ufs_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ufs_write_admin`

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
| trg_ufs_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
