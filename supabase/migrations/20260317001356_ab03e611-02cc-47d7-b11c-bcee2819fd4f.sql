
-- Views corrigidas (clientes usa cnpj_cpf não cpf_cnpj)

CREATE OR REPLACE VIEW public.vw_contas_pagar_painel AS
SELECT cp.*, f.nome AS fornecedor_display, f.cnpj AS fornecedor_cnpj_display, cb.banco AS conta_banco, cc.nome AS centro_custo_nome, pc.descricao AS plano_conta_nome, pc.codigo AS plano_conta_codigo
FROM contas_pagar cp LEFT JOIN fornecedores f ON f.id=cp.fornecedor_id LEFT JOIN contas_bancarias cb ON cb.id=cp.conta_bancaria_id LEFT JOIN centros_custo cc ON cc.id=cp.centro_custo_id LEFT JOIN plano_contas pc ON pc.id=cp.plano_conta_id
WHERE cp.status IN ('pendente','vencido','parcial','atrasado');

CREATE OR REPLACE VIEW public.vw_contas_receber_painel AS
SELECT cr.*, c.razao_social AS cliente_display, c.cnpj_cpf AS cliente_cpf_cnpj_display, c.score AS cliente_score, cb.banco AS conta_banco, cc.nome AS centro_custo_nome, pc.descricao AS plano_conta_nome
FROM contas_receber cr LEFT JOIN clientes c ON c.id=cr.cliente_id LEFT JOIN contas_bancarias cb ON cb.id=cr.conta_bancaria_id LEFT JOIN centros_custo cc ON cc.id=cr.centro_custo_id LEFT JOIN plano_contas pc ON pc.id=cr.plano_conta_id
WHERE cr.status IN ('pendente','vencido','parcial','atrasado');

CREATE OR REPLACE VIEW public.vw_dre_mensal AS
SELECT date_trunc('month',m.data_movimentacao) AS mes, m.empresa_id, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE 0 END) AS receitas, SUM(CASE WHEN m.tipo='saida' THEN m.valor ELSE 0 END) AS despesas, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE -m.valor END) AS resultado
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY 1,2;

CREATE OR REPLACE VIEW public.vw_fluxo_caixa AS
SELECT d.dia, COALESCE(r.valor,0) AS receitas_previstas, COALESCE(p.valor,0) AS despesas_previstas, COALESCE(r.valor,0)-COALESCE(p.valor,0) AS saldo_dia
FROM generate_series(CURRENT_DATE,CURRENT_DATE+INTERVAL '90 days','1 day') AS d(dia)
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_recebido,0)) AS valor FROM contas_receber WHERE status IN ('pendente','parcial') GROUP BY 1) r ON r.dia=d.dia
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_pago,0)) AS valor FROM contas_pagar WHERE status IN ('pendente','parcial') GROUP BY 1) p ON p.dia=d.dia;

CREATE OR REPLACE VIEW public.vw_fluxo_caixa_diario AS
SELECT m.data_movimentacao AS dia, m.empresa_id, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE 0 END) AS entradas, SUM(CASE WHEN m.tipo='saida' THEN m.valor ELSE 0 END) AS saidas, SUM(CASE WHEN m.tipo='entrada' THEN m.valor ELSE -m.valor END) AS saldo
FROM movimentacoes m WHERE m.deleted_at IS NULL GROUP BY 1,2;

CREATE OR REPLACE VIEW public.vw_gastos_centro_custo AS
SELECT cc.id AS centro_custo_id, cc.nome, cc.codigo, cc.orcamento_previsto, COALESCE(SUM(cp.valor),0) AS total_gasto, CASE WHEN cc.orcamento_previsto>0 THEN ROUND((COALESCE(SUM(cp.valor),0)/cc.orcamento_previsto)*100,2) ELSE 0 END AS percentual_utilizado
FROM centros_custo cc LEFT JOIN contas_pagar cp ON cp.centro_custo_id=cc.id AND cp.status='pago' GROUP BY 1,2,3,4;

CREATE OR REPLACE VIEW public.vw_saldos_contas AS
SELECT cb.id,cb.banco,cb.agencia,cb.conta,cb.tipo_conta,cb.saldo_atual,cb.cor,cb.ativo,cb.empresa_id,e.razao_social AS empresa_nome FROM contas_bancarias cb LEFT JOIN empresas e ON e.id=cb.empresa_id WHERE cb.ativo=true;

CREATE OR REPLACE VIEW public.vw_transferencias_painel AS
SELECT t.*,co.banco AS banco_origem,co.conta AS conta_origem_numero,cd.banco AS banco_destino,cd.conta AS conta_destino_numero FROM transferencias t LEFT JOIN contas_bancarias co ON co.id=t.conta_bancaria_id LEFT JOIN contas_bancarias cd ON cd.id=t.conta_destino_id;

CREATE OR REPLACE VIEW public.vw_webhooks_recentes AS SELECT * FROM webhooks_log ORDER BY created_at DESC LIMIT 100;

CREATE OR REPLACE VIEW public.vw_dso_aging AS
SELECT cr.empresa_id, COUNT(*) AS total_titulos, SUM(cr.valor) AS valor_total, SUM(cr.valor-COALESCE(cr.valor_recebido,0)) AS saldo_aberto,
SUM(CASE WHEN cr.data_vencimento>=CURRENT_DATE THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS a_vencer,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 0 AND 7 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_0_7,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 8 AND 15 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_8_15,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 16 AND 30 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_16_30,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 31 AND 60 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_31_60,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento BETWEEN 61 AND 90 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_61_90,
SUM(CASE WHEN CURRENT_DATE-cr.data_vencimento>90 THEN cr.valor-COALESCE(cr.valor_recebido,0) ELSE 0 END) AS vencido_90_mais
FROM contas_receber cr WHERE cr.status IN ('pendente','vencido','parcial','atrasado') GROUP BY 1;

CREATE OR REPLACE VIEW public.vw_metricas_cobranca AS
SELECT ec.etapa,ec.canal,ec.empresa_id, COUNT(*) AS total_enviados, SUM(CASE WHEN ec.entregue THEN 1 ELSE 0 END) AS total_entregues, SUM(CASE WHEN ec.lido THEN 1 ELSE 0 END) AS total_lidos,
CASE WHEN COUNT(*)>0 THEN ROUND((SUM(CASE WHEN ec.entregue THEN 1 ELSE 0 END)::NUMERIC/COUNT(*))*100,2) ELSE 0 END AS taxa_entrega
FROM execucoes_cobranca ec GROUP BY 1,2,3;

-- RPCs de Cobrança
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID DEFAULT NULL)
RETURNS TABLE(total_enfileirados INTEGER, total_ja_cobrados INTEGER, total_sem_contato INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enfileirados INTEGER:=0; v_sem_contato INTEGER:=0; v_regra RECORD; v_cr RECORD; v_mensagem TEXT; v_canal TEXT;
BEGIN
  FOR v_regra IN SELECT * FROM regua_cobranca WHERE ativo=true AND auto_executar=true AND (p_empresa_id IS NULL OR empresa_id=p_empresa_id OR empresa_id IS NULL) ORDER BY dias_gatilho LOOP
    FOR v_cr IN SELECT cr.*, c.email AS cliente_email, c.telefone AS cliente_telefone FROM contas_receber cr LEFT JOIN clientes c ON c.id=cr.cliente_id WHERE cr.status IN ('pendente','vencido','parcial','atrasado') AND (CURRENT_DATE-cr.data_vencimento)>=v_regra.dias_gatilho AND NOT EXISTS (SELECT 1 FROM fila_cobrancas fc WHERE fc.conta_receber_id=cr.id AND fc.etapa=v_regra.etapa AND fc.status NOT IN ('falhou','cancelado')) LOOP
      IF v_regra.canais IS NOT NULL THEN
        FOREACH v_canal IN ARRAY v_regra.canais LOOP
          IF (v_canal='email' AND v_cr.cliente_email IS NULL) OR (v_canal IN ('whatsapp','sms') AND v_cr.cliente_telefone IS NULL) THEN v_sem_contato:=v_sem_contato+1; CONTINUE; END IF;
          SELECT corpo INTO v_mensagem FROM templates_cobranca WHERE etapa=v_regra.etapa AND canal=v_canal AND ativo=true AND padrao=true LIMIT 1;
          v_mensagem:=COALESCE(v_mensagem,'Pendência financeira em aberto.');
          v_mensagem:=REPLACE(REPLACE(REPLACE(v_mensagem,'{{cliente_nome}}',COALESCE(v_cr.cliente_nome,'Cliente')),'{{valor_formatado}}','R$ '||to_char(v_cr.valor,'FM999G999G990D00')),'{{vencimento}}',to_char(v_cr.data_vencimento,'DD/MM/YYYY'));
          INSERT INTO fila_cobrancas (empresa_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem_renderizada) VALUES (v_cr.empresa_id,v_cr.id,v_cr.cliente_id,v_cr.cliente_nome,v_regra.etapa,v_canal,CASE WHEN v_canal='email' THEN v_cr.cliente_email ELSE v_cr.cliente_telefone END,v_mensagem);
          v_enfileirados:=v_enfileirados+1;
        END LOOP;
      END IF;
      UPDATE contas_receber SET etapa_cobranca=v_regra.etapa::etapa_cobranca WHERE id=v_cr.id;
    END LOOP;
  END LOOP;
  RETURN QUERY SELECT v_enfileirados, 0, v_sem_contato;
END; $$;

CREATE OR REPLACE FUNCTION public.processar_fila_cobrancas(p_limite INTEGER DEFAULT 50)
RETURNS TABLE(fila_id UUID, canal TEXT, destinatario TEXT, mensagem TEXT, cliente_nome TEXT, etapa TEXT, conta_receber_id UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY UPDATE fila_cobrancas fc SET status='processando',processado_em=now()
  WHERE fc.id IN (SELECT f.id FROM fila_cobrancas f WHERE f.status='pendente' AND (f.agendado_para IS NULL OR f.agendado_para<=now()) ORDER BY f.prioridade,f.created_at LIMIT p_limite FOR UPDATE SKIP LOCKED)
  RETURNING fc.id,fc.canal,fc.destinatario,fc.mensagem_renderizada,fc.cliente_nome,fc.etapa,fc.conta_receber_id;
END; $$;

CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(p_fila_id UUID, p_provider TEXT DEFAULT NULL, p_provider_message_id TEXT DEFAULT NULL, p_sucesso BOOLEAN DEFAULT true, p_erro TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fila RECORD;
BEGIN
  SELECT * INTO v_fila FROM fila_cobrancas WHERE id=p_fila_id;
  IF p_sucesso THEN
    UPDATE fila_cobrancas SET status='enviado' WHERE id=p_fila_id;
    INSERT INTO execucoes_cobranca (empresa_id,fila_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem,status,provider,provider_message_id) VALUES (v_fila.empresa_id,p_fila_id,v_fila.conta_receber_id,v_fila.cliente_id,v_fila.cliente_nome,v_fila.etapa,v_fila.canal,v_fila.destinatario,v_fila.mensagem_renderizada,'enviado',p_provider,p_provider_message_id);
  ELSE
    UPDATE fila_cobrancas SET status=CASE WHEN tentativas+1>=max_tentativas THEN 'falhou' ELSE 'pendente' END, tentativas=tentativas+1, erro_mensagem=p_erro, proxima_tentativa=CASE WHEN tentativas+1<max_tentativas THEN now()+INTERVAL '30 minutes' ELSE NULL END WHERE id=p_fila_id;
  END IF;
END; $$;
