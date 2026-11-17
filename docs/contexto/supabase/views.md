# Views


## public.extratos_bancarios_importados (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.extrato_bancario |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    user_id,
    conta_bancaria_id,
    data,
    descricao,
    valor,
    tipo,
    numero_documento,
    numero_documento_banco,
    codigo_transacao,
    arquivo_origem,
    importado_de,
    importado_em,
    linha_arquivo,
    hash_transacao,
    saldo,
    conciliado,
    created_at
   FROM extrato_bancario;
```

## public.mv_benchmark_setorial (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.vw_tributario_dashboard |
| populada | sim |
| comentário |  |


```sql
WITH carga AS (
         SELECT vw_tributario_dashboard.regime_tributario AS regime,
            vw_tributario_dashboard.empresa_id,
            sum(vw_tributario_dashboard.total_tributos) AS total_12m
           FROM vw_tributario_dashboard
          WHERE vw_tributario_dashboard.ano IS NOT NULL AND vw_tributario_dashboard.mes IS NOT NULL AND (vw_tributario_dashboard.ano * 12 + vw_tributario_dashboard.mes) >= (EXTRACT(year FROM CURRENT_DATE)::integer * 12 + EXTRACT(month FROM CURRENT_DATE)::integer - 12)
          GROUP BY vw_tributario_dashboard.regime_tributario, vw_tributario_dashboard.empresa_id
        )
 SELECT regime,
    count(*) AS amostra,
    percentile_cont(0.25::double precision) WITHIN GROUP (ORDER BY (total_12m::double precision)) AS p25,
    percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (total_12m::double precision)) AS mediana,
    percentile_cont(0.75::double precision) WITHIN GROUP (ORDER BY (total_12m::double precision)) AS p75,
    avg(total_12m) AS media,
    now() AS atualizado_em
   FROM carga
  GROUP BY regime;
```

## public.mv_performance_alerts_weekly (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.performance_alerts |
| populada | sim |
| comentário |  |


```sql
WITH weekly AS (
         SELECT date_trunc('week'::text, performance_alerts.created_at)::date AS week_start,
            performance_alerts.source,
            performance_alerts.severity,
            count(*) AS alert_count,
            count(DISTINCT performance_alerts.alert_key) AS distinct_keys,
            round(avg(NULLIF(performance_alerts.current_value, 0::numeric)), 2) AS avg_current_ms,
            round(max(performance_alerts.current_value), 2) AS max_current_ms,
            round(avg(NULLIF(performance_alerts.ratio, 0::numeric)), 2) AS avg_ratio,
            round(max(performance_alerts.ratio), 2) AS max_ratio,
            sum(COALESCE(performance_alerts.sample_count, 0)) AS total_samples
           FROM performance_alerts
          WHERE performance_alerts.created_at > (now() - '90 days'::interval)
          GROUP BY (date_trunc('week'::text, performance_alerts.created_at)::date), performance_alerts.source, performance_alerts.severity
        )
 SELECT week_start,
    source,
    severity,
    alert_count,
    distinct_keys,
    avg_current_ms,
    max_current_ms,
    avg_ratio,
    max_ratio,
    total_samples,
    round((alert_count::numeric - lag(alert_count) OVER (PARTITION BY source, severity ORDER BY week_start)::numeric) / NULLIF(lag(alert_count) OVER (PARTITION BY source, severity ORDER BY week_start), 0)::numeric * 100::numeric, 1) AS delta_pct_vs_prev_week,
    now() AS refreshed_at
   FROM weekly
  ORDER BY week_start DESC, source, severity;
```

## public.v_sefaz_observability (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.integrity_alerts, public.nfe_recebidas, public.sefaz_dfe_cursor |
| populada | n/a |
| comentário |  |


```sql
SELECT c.cnpj,
    c.ambiente,
    c.ultimo_nsu,
    c.max_nsu,
    c.ultima_consulta,
    c.ultimo_status,
    c.circuit_open,
    c.retry_count,
    c.next_run_at,
    EXTRACT(epoch FROM now() - c.ultima_consulta)::integer AS seconds_since_last,
    COALESCE(n.nfe_24h, 0::bigint) AS nfe_24h,
    COALESCE(n.nfe_7d, 0::bigint) AS nfe_7d,
    COALESCE(a.open_alerts, 0::bigint) AS open_alerts
   FROM sefaz_dfe_cursor c
     LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE r.created_at > (now() - '24:00:00'::interval)) AS nfe_24h,
            count(*) FILTER (WHERE r.created_at > (now() - '7 days'::interval)) AS nfe_7d
           FROM nfe_recebidas r
          WHERE r.cnpj_destinatario = c.cnpj AND r.ambiente = c.ambiente) n ON true
     LEFT JOIN LATERAL ( SELECT count(*) AS open_alerts
           FROM integrity_alerts ia
          WHERE ia.domain = 'nfe_sefaz'::text AND ia.resolved_at IS NULL AND (ia.metadata ->> 'cnpj'::text) = c.cnpj) a ON true;
```

## public.v_table_bloat (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | pg_catalog.pg_stat_user_tables |
| populada | n/a |
| comentário |  |


```sql
SELECT schemaname,
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
        CASE
            WHEN (n_live_tup + n_dead_tup) > 0 THEN round(n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric * 100::numeric, 2)
            ELSE 0::numeric
        END AS dead_ratio_pct,
    pg_size_pretty(pg_total_relation_size(relid::regclass)) AS total_size_pretty,
    pg_total_relation_size(relid::regclass) AS total_size_bytes,
    pg_size_pretty(pg_relation_size(relid::regclass)) AS table_size_pretty,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
   FROM pg_stat_user_tables
  WHERE schemaname = 'public'::name;
```

## public.vw_auditoria_tributaria_recente (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.auditoria_tributaria, public.empresas, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT a.id,
    a.empresa_id,
    e.razao_social AS empresa_nome,
    a.user_id,
    p.full_name AS user_nome,
    a.user_email,
    a.acao,
    a.entidade_tipo,
    a.entidade_id,
    a.payload_anterior,
    a.payload_novo,
    a.criado_em
   FROM auditoria_tributaria a
     LEFT JOIN empresas e ON e.id = a.empresa_id
     LEFT JOIN profiles p ON p.user_id = a.user_id
  ORDER BY a.criado_em DESC
 LIMIT 500;
```

## public.vw_contas_pagar_painel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.centros_custo, public.contas_bancarias, public.contas_pagar, public.fornecedores |
| populada | n/a |
| comentário |  |


```sql
SELECT cp.id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    cp.data_pagamento,
    cp.status,
    cp.fornecedor_id,
    cp.user_id,
    cp.created_at,
    cp.updated_at,
    cp.empresa_id,
    cp.categoria_id,
    cp.centro_custo_id,
    cp.forma_pagamento,
    cp.conta_bancaria_id,
    cp.numero_documento,
    cp.observacoes,
    cp.valor_pago,
    cp.juros,
    cp.multa,
    cp.desconto,
    cp.recorrente,
    cp.parcela_atual,
    cp.total_parcelas,
    cp.anexo_url,
    cp.metadata,
    cp.categoria,
    cp.fornecedor_nome,
    cp.categoria_nome,
    cp.centro_resultado,
    cp.aprovado_por,
    cp.tipo_cobranca,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    COALESCE(cp.fornecedor_nome, f.razao_social::text, 'Fornecedor não identificado'::text) AS fornecedor_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM contas_pagar cp
     LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
     LEFT JOIN centros_custo cc ON cp.centro_custo_id = cc.id
     LEFT JOIN contas_bancarias cb ON cp.conta_bancaria_id = cb.id;
```

## public.vw_contas_receber_painel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.centros_custo, public.clientes, public.contas_bancarias, public.contas_receber |
| populada | n/a |
| comentário |  |


```sql
SELECT cr.id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    cr.data_recebimento,
    cr.status,
    cr.cliente_id,
    cr.user_id,
    cr.created_at,
    cr.updated_at,
    cr.empresa_id,
    cr.categoria_id,
    cr.centro_custo_id,
    cr.forma_recebimento,
    cr.conta_bancaria_id,
    cr.numero_documento,
    cr.observacoes,
    cr.valor_recebido,
    cr.juros,
    cr.multa,
    cr.desconto,
    cr.recorrente,
    cr.parcela_atual,
    cr.total_parcelas,
    cr.anexo_url,
    cr.score,
    cr.metadata,
    cr.cliente_nome,
    cr.etapa_cobranca,
    cr.tipo_cobranca,
    cr.numero_parcela_atual,
    cr.valor_desconto,
        CASE
            WHEN pode_ver_dado_sensivel() THEN cr.chave_pix
            ELSE mascarar_chave_pix(cr.chave_pix)
        END AS chave_pix,
    cr.data_emissao,
    cr.categoria_nome,
    cl.razao_social AS cliente_razao_social,
    cl.nome_fantasia AS cliente_nome_fantasia,
    COALESCE(cr.cliente_nome, cl.razao_social, 'Cliente não identificado'::text) AS cliente_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM contas_receber cr
     LEFT JOIN clientes cl ON cr.cliente_id = cl.id
     LEFT JOIN centros_custo cc ON cr.centro_custo_id = cc.id
     LEFT JOIN contas_bancarias cb ON cr.conta_bancaria_id = cb.id;
```

## public.vw_dre_mensal (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.faturamento_mensal |
| populada | n/a |
| comentário |  |


```sql
SELECT empresa_id,
    ano,
    mes,
    receita_bruta,
    receita_servicos,
    receita_vendas,
    valor_impostos AS total_tributos,
    impostos_federais,
    impostos_municipais,
    round(
        CASE
            WHEN receita_bruta > 0::numeric THEN valor_impostos / receita_bruta * 100::numeric
            ELSE 0::numeric
        END, 2) AS carga_tributaria_pct
   FROM faturamento_mensal fm;
```

## public.vw_dso_aging (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contas_receber |
| populada | n/a |
| comentário |  |


```sql
SELECT empresa_id,
    cliente_id,
    cliente_nome,
    sum(valor) AS valor_total,
    count(*) AS qtd_titulos,
    avg(dias_vencido) AS dias_vencido_medio,
    faixa_aging
   FROM ( SELECT cr.empresa_id,
            cr.cliente_id,
            cr.cliente_nome,
            cr.valor,
            CURRENT_DATE - cr.data_vencimento AS dias_vencido,
                CASE
                    WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '0-30'::text
                    WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60'::text
                    WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90'::text
                    ELSE '90+'::text
                END AS faixa_aging
           FROM contas_receber cr
          WHERE cr.status::text <> 'recebido'::text) sub
  GROUP BY empresa_id, cliente_id, cliente_nome, faixa_aging;
```

## public.vw_edge_health (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.edge_function_logs |
| populada | n/a |
| comentário |  |


```sql
SELECT function_name,
    count(*) AS total_calls,
    count(*) FILTER (WHERE level = 'error'::text OR error_message IS NOT NULL OR status_code >= 500) AS error_count,
    round(100.0 * count(*) FILTER (WHERE level = 'error'::text OR error_message IS NOT NULL OR status_code >= 500)::numeric / NULLIF(count(*), 0)::numeric, 2) AS error_rate_pct,
    round(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (duration_ms::double precision))::numeric, 2) AS p50_ms,
    round(percentile_cont(0.95::double precision) WITHIN GROUP (ORDER BY (duration_ms::double precision))::numeric, 2) AS p95_ms,
    max(created_at) AS last_call_at
   FROM edge_function_logs l
  WHERE created_at >= (now() - '24:00:00'::interval) AND (event = ANY (ARRAY['request_end'::text, 'request_error'::text]))
  GROUP BY function_name;
```

## public.vw_fluxo_caixa (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=on |
| depende de | public.contas_pagar, public.contas_receber, public.empresas |
| populada | n/a |
| comentário |  |


```sql
SELECT e.id AS empresa_id,
    d.dia::date AS dia,
    COALESCE(r.valor, 0::numeric) AS receitas_previstas,
    COALESCE(p.valor, 0::numeric) AS despesas_previstas,
    COALESCE(r.valor, 0::numeric) - COALESCE(p.valor, 0::numeric) AS saldo_dia
   FROM empresas e
     CROSS JOIN generate_series(CURRENT_DATE::timestamp without time zone, (CURRENT_DATE + 90)::timestamp without time zone, '1 day'::interval) d(dia)
     LEFT JOIN ( SELECT contas_receber.empresa_id,
            contas_receber.data_vencimento AS dia,
            sum(contas_receber.valor - COALESCE(contas_receber.valor_recebido, 0::numeric)) AS valor
           FROM contas_receber
          WHERE (contas_receber.status::text = ANY (ARRAY['pendente'::character varying, 'parcial'::character varying]::text[])) AND contas_receber.deleted_at IS NULL
          GROUP BY contas_receber.empresa_id, contas_receber.data_vencimento) r ON r.empresa_id = e.id AND r.dia = d.dia::date
     LEFT JOIN ( SELECT contas_pagar.empresa_id,
            contas_pagar.data_vencimento AS dia,
            sum(contas_pagar.valor - COALESCE(contas_pagar.valor_pago, 0::numeric)) AS valor
           FROM contas_pagar
          WHERE (contas_pagar.status::text = ANY (ARRAY['pendente'::character varying, 'parcial'::character varying]::text[])) AND contas_pagar.deleted_at IS NULL
          GROUP BY contas_pagar.empresa_id, contas_pagar.data_vencimento) p ON p.empresa_id = e.id AND p.dia = d.dia::date;
```

## public.vw_fluxo_caixa_diario (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.empresas |
| populada | n/a |
| comentário |  |


```sql
SELECT gen_random_uuid() AS id,
    id AS empresa_id,
    now()::date AS dia,
    2500.00 AS entradas_reais,
    1200.00 AS saidas_reais,
    1300.00 AS saldo_final
   FROM empresas;
```

## public.vw_gastos_centro_custo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contas_pagar |
| populada | n/a |
| comentário |  |


```sql
SELECT empresa_id,
    categoria,
    date_trunc('month'::text, data_vencimento::timestamp with time zone) AS mes,
    sum(valor) AS total_gasto
   FROM contas_pagar cp
  WHERE status::text = 'pago'::text
  GROUP BY empresa_id, categoria, (date_trunc('month'::text, data_vencimento::timestamp with time zone));
```

## public.vw_metricas_cobranca (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contas_receber |
| populada | n/a |
| comentário |  |


```sql
SELECT empresa_id,
    date_trunc('month'::text, data_vencimento::timestamp with time zone) AS mes,
    count(*) AS total_titulos,
    count(*) FILTER (WHERE status::text = 'recebido'::text) AS titulos_recebidos,
    count(*) FILTER (WHERE status::text <> 'recebido'::text) AS titulos_pendentes,
    round(count(*) FILTER (WHERE status::text = 'recebido'::text)::numeric * 100.0 / NULLIF(count(*), 0)::numeric, 2) AS taxa_recebimento_pct,
    sum(valor) AS valor_total,
    sum(valor) FILTER (WHERE status::text = 'recebido'::text) AS valor_recebido,
    avg(COALESCE(data_recebimento, CURRENT_DATE) - data_vencimento) FILTER (WHERE status::text = 'recebido'::text) AS prazo_medio_recebimento
   FROM contas_receber cr
  GROUP BY empresa_id, (date_trunc('month'::text, data_vencimento::timestamp with time zone));
```

## public.vw_notification_history_duplicates (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.notification_history |
| populada | n/a |
| comentário | Auditoria: pares de notificaÃ§Ãµes entregues no mesmo (user, source_ref, channel) em janela < 60s. Indica falha de dedup (ex.: realtime re-entregue apÃ³s refresh sem honrar last_seen_at). RLS via security_invoker â€” usuÃ¡rio sÃ³ vÃª o que jÃ¡ enxerga em notification_history. |


```sql
WITH ranked AS (
         SELECT nh.id,
            nh.user_id,
            nh.source,
            nh.source_ref,
            nh.channel,
            nh.title,
            nh.created_at,
            lag(nh.created_at) OVER (PARTITION BY nh.user_id, nh.source, nh.source_ref, nh.channel ORDER BY nh.created_at) AS prev_created_at
           FROM notification_history nh
          WHERE nh.source_ref IS NOT NULL
        )
 SELECT id,
    user_id,
    source,
    source_ref,
    channel,
    title,
    created_at,
    prev_created_at,
    EXTRACT(epoch FROM created_at - prev_created_at)::integer AS seconds_since_prev
   FROM ranked
  WHERE prev_created_at IS NOT NULL AND (created_at - prev_created_at) < '00:01:00'::interval;
```

## public.vw_rpc_hotspots (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.rpc_observability_metrics |
| populada | n/a |
| comentário |  |


```sql
SELECT function_name,
    date_trunc('hour'::text, called_at) AS bucket_hour,
    count(*) AS calls,
    count(*) FILTER (WHERE NOT success) AS errors,
    round(avg(duration_ms), 2) AS avg_ms,
    round(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (duration_ms::double precision))::numeric, 2) AS p50_ms,
    round(percentile_cont(0.95::double precision) WITHIN GROUP (ORDER BY (duration_ms::double precision))::numeric, 2) AS p95_ms,
    round(percentile_cont(0.99::double precision) WITHIN GROUP (ORDER BY (duration_ms::double precision))::numeric, 2) AS p99_ms,
    max(duration_ms) AS max_ms
   FROM rpc_observability_metrics
  WHERE called_at >= (now() - '7 days'::interval)
  GROUP BY function_name, (date_trunc('hour'::text, called_at));
```

## public.vw_rpc_slow_calls (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.rpc_observability_metrics |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    function_name,
    caller_user_id,
    caller_role,
    duration_ms,
    success,
    error_sqlstate,
    error_message,
    meta,
    called_at
   FROM rpc_observability_metrics
  WHERE called_at >= (now() - '24:00:00'::interval)
  ORDER BY duration_ms DESC
 LIMIT 200;
```

## public.vw_saldos_contas (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contas_bancarias, public.empresas |
| populada | n/a |
| comentário |  |


```sql
SELECT e.id AS empresa_id,
    cb.id AS conta_bancaria_id,
    cb.banco,
    cb.agencia,
    cb.numero_conta,
    cb.tipo_conta,
    cb.saldo_atual
   FROM empresas e
     JOIN contas_bancarias cb ON cb.empresa_id = e.id;
```

## public.vw_transferencias_painel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.asaas_transfers, public.empresas |
| populada | n/a |
| comentário |  |


```sql
SELECT t.id,
    t.empresa_id,
    e.razao_social,
    t.asaas_id,
    t.valor,
    t.status,
    t.tipo_chave,
        CASE
            WHEN pode_ver_dado_sensivel() THEN t.chave_pix
            ELSE mascarar_chave_pix(t.chave_pix)
        END AS chave_pix,
    t.descricao,
    t.created_at,
    t.updated_at
   FROM asaas_transfers t
     LEFT JOIN empresas e ON e.id = t.empresa_id;
```

## public.vw_tributario_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.apuracoes_tributarias, public.empresas |
| populada | n/a |
| comentário |  |


```sql
SELECT e.id AS empresa_id,
    e.razao_social,
    COALESCE(e.regime_tributario, 'nao_informado'::text) AS regime_tributario,
    at_.ano,
    at_.mes,
    at_.competencia,
    COALESCE(at_.total_geral, 0::numeric) AS total_tributos,
    COALESCE(at_.total_tributos_novos, 0::numeric) AS tributos_novos,
    COALESCE(at_.total_tributos_residuais, 0::numeric) AS tributos_residuais,
    COALESCE(at_.cbs_a_pagar, 0::numeric) AS cbs,
    COALESCE(at_.ibs_a_pagar, 0::numeric) AS ibs,
    COALESCE(at_.is_a_pagar, 0::numeric) AS imposto_seletivo,
    at_.status AS status_apuracao
   FROM empresas e
     LEFT JOIN apuracoes_tributarias at_ ON at_.empresa_id = e.id
  WHERE e.id IS NOT NULL;
```

## public.vw_webhooks_recentes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.webhooks_log |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    source AS endpoint,
    event_type AS evento,
    status AS status_code,
    created_at,
    error_message,
    attempts
   FROM webhooks_log wl
  ORDER BY created_at DESC
 LIMIT 100;
```
