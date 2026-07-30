
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
DROP VIEW IF EXISTS public.vw_dre_mensal;
DROP VIEW IF EXISTS public.vw_dso_aging;
DROP VIEW IF EXISTS public.vw_saldos_contas;
DROP VIEW IF EXISTS public.vw_fluxo_caixa;
DROP VIEW IF EXISTS public.vw_fluxo_caixa_diario;
DROP VIEW IF EXISTS public.vw_gastos_centro_custo;
DROP VIEW IF EXISTS public.vw_metricas_cobranca;
DROP VIEW IF EXISTS public.vw_transferencias_painel;
DROP VIEW IF EXISTS public.vw_webhooks_recentes;

CREATE VIEW public.vw_contas_pagar_painel AS
SELECT cp.id, cp.empresa_id, cp.conta_bancaria_id, cp.centro_custo_id, cp.fornecedor_id, cp.fornecedor_nome,
    cp.descricao, cp.valor, cp.valor_pago, cp.data_emissao, cp.data_vencimento, cp.data_pagamento, cp.status,
    cp.tipo_cobranca, cp.numero_documento, cp.codigo_barras, cp.observacoes, cp.recorrente, cp.bitrix_deal_id,
    cp.aprovado_por, cp.aprovado_em, cp.created_by, cp.created_at, cp.updated_at, cp.valor_original,
    cp.valor_desconto, cp.valor_juros, cp.valor_multa, cp.numero_parcela_atual, cp.total_parcelas, cp.categoria,
    cp.forma_pagamento, cp.forma_pagamento_id, cp.plano_conta_id, cp.contato_id, cp.frequencia_recorrencia,
    cp.user_id, cp.vencimento, cp.parcela_atual, cp.valor_final,
    (cp.valor - COALESCE(cp.valor_pago, 0)) AS saldo_devedor,
    (cp.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    f.nome AS fornecedor, f.cnpj AS fornecedor_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo, cb.banco AS conta_bancaria,
    cp.asaas_bill_id, cp.asaas_status, cp.tags,
    pc.descricao AS plano_conta_nome, pc.codigo AS plano_conta_codigo
FROM contas_pagar cp
    LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
    LEFT JOIN contas_bancarias cb ON cb.id = cp.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cp.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cp.contato_id
WHERE cp.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_contas_receber_painel AS
SELECT cr.id, cr.empresa_id, cr.conta_bancaria_id, cr.centro_custo_id, cr.cliente_id, cr.cliente_nome,
    cr.descricao, cr.valor, cr.valor_recebido, cr.data_emissao, cr.data_vencimento, cr.data_recebimento,
    cr.status, cr.tipo_cobranca, cr.numero_documento, cr.codigo_barras, cr.chave_pix, cr.link_boleto,
    cr.observacoes, cr.etapa_cobranca, cr.bitrix_deal_id, cr.created_by, cr.created_at, cr.updated_at,
    cr.vendedor_id, cr.valor_original, cr.valor_desconto, cr.valor_juros, cr.valor_multa,
    cr.numero_parcela_atual, cr.total_parcelas, cr.categoria, cr.forma_recebimento, cr.forma_pagamento_id,
    cr.plano_conta_id, cr.contato_id, cr.frequencia_recorrencia, cr.recorrente, cr.user_id, cr.vencimento,
    cr.parcela_atual, cr.valor_pago, cr.valor_final,
    (cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_a_receber,
    (cr.data_vencimento - CURRENT_DATE) AS dias_para_vencer,
    c.razao_social AS cliente, c.cnpj_cpf AS cliente_cpf_cnpj,
    cf.nome AS contato_nome, cc.nome AS centro_custo,
    cr.numero_nf, cr.asaas_payment_id, cr.asaas_billing_type, cr.asaas_status,
    cr.data_credito, cr.valor_liquido, cr.taxa_gateway, cr.tags,
    c.score AS cliente_score, cb.banco AS conta_banco, cc.nome AS centro_custo_nome,
    pc.descricao AS plano_conta_nome
FROM contas_receber cr
    LEFT JOIN clientes c ON c.id = cr.cliente_id
    LEFT JOIN contas_bancarias cb ON cb.id = cr.conta_bancaria_id
    LEFT JOIN centros_custo cc ON cc.id = cr.centro_custo_id
    LEFT JOIN plano_contas pc ON pc.id = cr.plano_conta_id
    LEFT JOIN contatos_financeiros cf ON cf.id = cr.contato_id
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento]);

CREATE VIEW public.vw_dre_mensal AS
SELECT date_trunc('month', m.data_movimentacao::timestamp with time zone) AS mes,
    m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS receitas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS despesas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS resultado,
    pc.tipo AS tipo_conta, cat.nome AS categoria,
    sum(m.valor) AS total_bruto,
    sum(COALESCE(m.valor_liquido, m.valor)) AS total_liquido,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL
GROUP BY date_trunc('month', m.data_movimentacao::timestamp with time zone), m.empresa_id, pc.tipo, cat.nome;

CREATE VIEW public.vw_dso_aging AS
SELECT cr.empresa_id,
    count(*) AS total_titulos, sum(cr.valor) AS valor_total,
    sum(cr.valor - COALESCE(cr.valor_recebido, 0)) AS saldo_aberto,
    sum(CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS a_vencer,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 0 AND 7 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_0_7,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 8 AND 15 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_8_15,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 16 AND 30 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_16_30,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 31 AND 60 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_31_60,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) BETWEEN 61 AND 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_61_90,
    sum(CASE WHEN (CURRENT_DATE - cr.data_vencimento) > 90 THEN cr.valor - COALESCE(cr.valor_recebido, 0) ELSE 0 END) AS vencido_90_mais,
    CASE
        WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias'
        WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias'
        ELSE '90+ dias'
    END AS faixa,
    count(*) AS quantidade,
    avg(CASE WHEN cr.data_vencimento < CURRENT_DATE THEN (CURRENT_DATE - cr.data_vencimento) ELSE 0 END) AS media_dias_atraso,
    count(*) FILTER (WHERE cr.etapa_cobranca IS NOT NULL) AS em_cobranca
FROM contas_receber cr
WHERE cr.status = ANY (ARRAY['pendente'::status_pagamento, 'vencido'::status_pagamento, 'parcial'::status_pagamento, 'atrasado'::status_pagamento])
GROUP BY cr.empresa_id, CASE WHEN cr.data_vencimento >= CURRENT_DATE THEN 'A Vencer' WHEN (CURRENT_DATE - cr.data_vencimento) <= 30 THEN '1-30 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 60 THEN '31-60 dias' WHEN (CURRENT_DATE - cr.data_vencimento) <= 90 THEN '61-90 dias' ELSE '90+ dias' END;

CREATE VIEW public.vw_saldos_contas AS
SELECT cb.id, cb.banco, cb.agencia, cb.conta, cb.tipo_conta, cb.saldo_atual, cb.cor, cb.ativo,
    cb.empresa_id, cb.nome, cb.tipo, e.razao_social AS empresa_nome
FROM contas_bancarias cb LEFT JOIN empresas e ON e.id = cb.empresa_id WHERE cb.ativo = true;

CREATE VIEW public.vw_fluxo_caixa AS
SELECT m.data_movimentacao, m.tipo, m.descricao, m.valor, m.valor_liquido, m.taxa_gateway,
    cb.banco AS conta_bancaria, cat.nome AS categoria, pc.tipo AS tipo_categoria, cc.nome AS centro_custo,
    cf.nome AS contato, m.conciliado, m.asaas_transaction_id, m.asaas_type, m.origem,
    m.created_at, m.empresa_id, m.conta_bancaria_id
FROM movimentacoes m
    LEFT JOIN contas_bancarias cb ON cb.id = m.conta_bancaria_id
    LEFT JOIN plano_contas pc ON pc.id = m.plano_conta_id
    LEFT JOIN centros_custo cc ON cc.id = m.centro_custo_id
    LEFT JOIN contatos_financeiros cf ON cf.id = m.contato_id
    LEFT JOIN categorias cat ON cat.id = m.categoria_id
WHERE m.deleted_at IS NULL;

CREATE VIEW public.vw_fluxo_caixa_diario AS
SELECT m.data_movimentacao AS dia, m.data_movimentacao AS data, m.empresa_id,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END) AS total_entradas,
    sum(CASE WHEN m.tipo = 'saida' THEN m.valor ELSE 0 END) AS total_saidas,
    sum(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE -m.valor END) AS saldo_dia,
    sum(CASE WHEN m.tipo = 'entrada' THEN COALESCE(m.valor_liquido, m.valor) ELSE 0 END) AS entradas_liquidas,
    sum(COALESCE(m.taxa_gateway, 0)) AS total_taxas
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY m.data_movimentacao, m.empresa_id;

CREATE VIEW public.vw_gastos_centro_custo AS
SELECT cc.id AS centro_custo_id, cc.nome, cc.nome AS centro_custo, cc.codigo, cc.orcamento_previsto,
    COALESCE(sum(cp.valor), 0) AS total_gasto,
    CASE WHEN cc.orcamento_previsto > 0 THEN round((COALESCE(sum(cp.valor), 0) / cc.orcamento_previsto) * 100, 2) ELSE 0 END AS percentual_utilizado,
    cc.tipo, (cc.orcamento_previsto - COALESCE(sum(cp.valor), 0)) AS saldo_orcamento, cc.bitrix_deal_id
FROM centros_custo cc LEFT JOIN contas_pagar cp ON cp.centro_custo_id = cc.id AND cp.status = 'pago'::status_pagamento
GROUP BY cc.id, cc.nome, cc.codigo, cc.orcamento_previsto, cc.tipo, cc.bitrix_deal_id;

CREATE VIEW public.vw_metricas_cobranca AS
SELECT ec.etapa, ec.etapa AS etapa_nome, ec.canal, ec.empresa_id,
    count(DISTINCT ec.conta_receber_id) AS contas_cobradas, count(*) AS total_enviados, count(*) AS total_disparos,
    count(*) FILTER (WHERE ec.status = 'enviado') AS enviados,
    sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS total_entregues, sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS entregues,
    sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS total_lidos, sum(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS lidos,
    count(*) FILTER (WHERE ec.respondido_em IS NOT NULL) AS respondidos,
    count(*) FILTER (WHERE ec.status = 'falhou') AS falhas, sum(COALESCE(ec.custo, 0)) AS custo_total,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega,
    CASE WHEN count(*) > 0 THEN round((sum(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2) ELSE 0 END AS taxa_entrega_pct
FROM execucoes_cobranca ec GROUP BY ec.etapa, ec.canal, ec.empresa_id;

CREATE VIEW public.vw_transferencias_painel AS
SELECT t.id, t.empresa_id, t.conta_bancaria_id, t.conta_destino_id, t.conta_pagar_id, t.tipo,
    t.descricao, t.valor, t.taxa, t.valor_liquido, t.data_transferencia, t.data_efetivacao, t.status,
    t.chave_pix, t.tipo_chave_pix, t.favorecido_nome, t.favorecido_cpf_cnpj, t.favorecido_banco,
    t.favorecido_agencia, t.favorecido_conta, t.favorecido_tipo_conta, t.codigo_barras, t.linha_digitavel,
    t.comprovante_url, t.protocolo, t.asaas_transfer_id, t.asaas_status, t.erro_mensagem, t.observacoes,
    t.aprovado_por, t.aprovado_em, t.cancelado_por, t.cancelado_em, t.motivo_cancelamento,
    t.movimentacao_id, t.numero_documento, t.origem, t.created_by, t.created_at, t.updated_at,
    t.modalidade, t.data_solicitacao, t.favorecido_nome AS destinatario, co.banco AS conta_origem, t.pix_chave_destino,
    t.asaas_end_to_end, t.asaas_comprovante_url, t.bitrix_deal_id, t.external_reference, t.tags,
    co.banco AS banco_origem, co.conta AS conta_origem_numero, cd.banco AS banco_destino, cd.conta AS conta_destino_numero
FROM transferencias t
    LEFT JOIN contas_bancarias co ON co.id = t.conta_bancaria_id
    LEFT JOIN contas_bancarias cd ON cd.id = t.conta_destino_id;

CREATE VIEW public.vw_webhooks_recentes AS
SELECT wl.id, wl.provider, wl.event_type, wl.evento, wl.payload, wl.headers, wl.status,
    wl.status_processamento, wl.processado, wl.processado_em, wl.erro_mensagem, wl.erro_detalhe,
    wl.ip_origem, wl.asaas_payment_id, wl.asaas_transfer_id, wl.created_at, wl.updated_at
FROM webhooks_log wl ORDER BY wl.created_at DESC LIMIT 100;
