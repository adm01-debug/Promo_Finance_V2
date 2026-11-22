# Schema fiscal atual (etapa 31)

Inventário via `information_schema` do projeto Supabase oficial (`bwwbeyolnnzppeuhgkcd`), levantado em 2026-11-22. Base para as etapas 32-40 (Fase 3 — modelo de dados IBS/CBS).

## `notas_fiscais`

| Coluna         | Tipo        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| empresa_id     | uuid        | YES      | —                 |
| numero         | text        | YES      | —                 |
| serie          | text        | YES      | —                 |
| chave_acesso   | text        | YES      | —                 |
| valor_total    | numeric     | YES      | 0                 |
| valor_icms     | numeric     | YES      | 0                 |
| status         | text        | YES      | 'emitida'         |
| xml_url        | text        | YES      | —                 |
| data_emissao   | timestamptz | YES      | now()             |
| created_at     | timestamptz | YES      | now()             |
| valor_produtos | numeric     | YES      | 0                 |
| cliente_cnpj   | text        | YES      | —                 |
| cliente_nome   | text        | YES      | —                 |
| valor_desconto | numeric     | NO       | 0                 |
| valor_frete    | numeric     | NO       | 0                 |

Sem grupo IBS/CBS/IS — nenhuma coluna `v_ibs*`, `v_cbs`, `v_is`, `cst_ibscbs`, `cclasstrib`. Confirma a necessidade das etapas 35 (totais na nota) e 32-34 (itens + grupos).

## `operacoes_tributaveis`

54 colunas. Já tem `cbs_aliquota`, `cbs_valor`, `cbs_credito`, `ibs_aliquota`, `ibs_valor`, `ibs_credito`, `is_valor`, `is_categoria`, `is_aliquota`, `is_aliquota_customizada` (a última é a migration `20261121120000_adiciona_is_aliquota_customizada.sql`, já aplicada). Residuais `icms_valor/aliquota`, `iss_valor/aliquota`, `pis_valor/aliquota`, `cofins_valor/aliquota` presentes. `regime_especial`, `reducao_aliquota`, `isento`, `motivo_isencao`, `split_payment*` também existem. `apuracao_id` liga à apuração do período.

Não tem granularidade de item (NCM/CFOP por linha vêm de `ncm`/`cfop` únicos na própria operação) — é por isso que a Fase 3 cria `notas_fiscais_itens` em vez de reaproveitar esta tabela para o detalhamento por item do XML.

## `creditos_tributarios`

23 colunas. Tem `tipo_tributo`, `tipo_credito`, `saldo_disponivel`, `valor_credito`, `valor_utilizado`, `documento_tipo/numero/chave`, `fornecedor_id/cnpj/nome`, `apuracao_id`, `competencia_origem/utilizacao`.

**Não tem** `origem` (enum `'xml_destacado'|'estimado'|'manual'`) nem `efeito_tributario boolean` nem `ano_fato_gerador int` — exatamente o que a etapa 36 adiciona. Todo crédito hoje é indistinguível entre destacado em XML e estimado.

## `apuracoes_tributarias`

40 colunas. Já tem blocos completos por tributo: `cbs_debitos/creditos/a_pagar/a_compensar/saldo_anterior`, `ibs_*` (mesmo padrão), `is_*`, `icms_*`, `iss_*`, residuais (`icms_residual`, `iss_residual`, `pis_residual`, `cofins_residual`), totais (`total_tributos_novos`, `total_tributos_residuais`, `total_geral`), `data_transmissao`, `protocolo_transmissao`, `created_by`.

Estrutura já comporta a apuração mensal da etapa 88 sem alteração de schema — é dado, não DDL, que falta (débitos/créditos reais em vez de fictícios).

## RPC `registrar_nfe_com_creditos(p_empresa_id uuid, p_nota jsonb, p_creditos jsonb)`

`plpgsql`, `SECURITY INVOKER` (sem `SECURITY DEFINER` declarado), `search_path` fixo (`public, pg_catalog`). Fluxo:

1. Exige `auth.uid()` não nulo e `empresa_acessivel(p_empresa_id)` — nega com `42501` caso contrário.
2. Valida que `p_nota` é um objeto JSON; rejeita (`22023`) se não for.
3. Confere que toda chave de `p_nota` (exceto `id`/`empresa_id`) existe como coluna real de `notas_fiscais` via `information_schema.columns` — rejeita com `42703` listando as desconhecidas. Esse é o padrão de validação que a etapa 45 (RPC de itens) deve repetir contra `notas_fiscais_itens`.
4. Monta e executa um `INSERT ... RETURNING *` dinâmico a partir das colunas presentes em `p_nota`.
5. Se `p_creditos` (array) não for vazio, insere em `creditos_tributarios` via `jsonb_to_recordset` com colunas fixas (`tipo_tributo, valor_credito, saldo_disponivel, data_origem, competencia_origem, status`) — **não inclui `origem`/`efeito_tributario`/`ano_fato_gerador`**, então a etapa 36 precisa alterar também o `jsonb_to_recordset` desta função (ou criar uma nova versão) para esses créditos serem gravados com a origem certa desde a importação.
6. Confere `ROW_COUNT` dos créditos inseridos contra o array recebido; diverge → `42501`.

## Tabelas/colunas que a Fase 3 ainda precisa criar

Confirmado por consulta direta ao `information_schema` — nenhuma das seguintes existe hoje:

- `notas_fiscais_itens` (etapa 32)
- grupo IBS/CBS/IS por item (etapas 33-34, dependem da tabela acima)
- `catalogo_cclasstrib`, `catalogo_ncm`, `catalogo_nbs`, `catalogo_aliquota_referencia` (etapas 37-38)
- `rfb_calculos` — **não será criada**: etapa 39 foi dispensada pelo ADR-004 (servia só ao proxy da calculadora oficial, fora de escopo)

## Fonte

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = '<tabela>'
order by ordinal_position;

select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'registrar_nfe_com_creditos';
```

Executado via MCP `SUPABASE - PROMO FINANCE V2 - MCP` contra o projeto `bwwbeyolnnzppeuhgkcd`.
