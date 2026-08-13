CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID, p_simulate BOOLEAN DEFAULT false)
RETURNS TABLE (
    total_enfileirados INTEGER,
    total_erros INTEGER,
    total_sem_contato INTEGER
) AS $$
DECLARE 
    v_enfileirados INTEGER := 0; 
    v_sem_contato INTEGER := 0; 
    v_regra RECORD; 
    v_cr RECORD; 
    v_mensagem TEXT; 
    v_canal TEXT;
BEGIN
    FOR v_regra IN SELECT * FROM regua_cobranca WHERE ativo=true AND auto_executar=true AND (p_empresa_id IS NULL OR empresa_id=p_empresa_id OR empresa_id IS NULL) ORDER BY dias_gatilho LOOP
        FOR v_cr IN 
            SELECT cr.*, c.email AS cliente_email, c.telefone AS cliente_telefone 
            FROM contas_receber cr 
            LEFT JOIN clientes c ON c.id=cr.cliente_id 
            WHERE cr.status IN ('pendente','vencido','parcial','atrasado') 
              AND (CURRENT_DATE-cr.data_vencimento)>=v_regra.dias_gatilho 
              AND NOT EXISTS (SELECT 1 FROM fila_cobrancas fc WHERE fc.conta_receber_id=cr.id AND fc.etapa=v_regra.etapa AND fc.status NOT IN ('falhou','cancelado')) 
        LOOP
            IF v_regra.canais IS NOT NULL THEN
                FOREACH v_canal IN ARRAY v_regra.canais LOOP
                    IF (v_canal='email' AND v_cr.cliente_email IS NULL) OR (v_canal IN ('whatsapp','sms') AND v_cr.cliente_telefone IS NULL) THEN 
                        v_sem_contato := v_sem_contato + 1; 
                        CONTINUE; 
                    END IF;
                    
                    IF NOT p_simulate THEN
                        SELECT corpo INTO v_mensagem FROM templates_cobranca WHERE etapa=v_regra.etapa AND canal=v_canal AND ativo=true AND padrao=true LIMIT 1;
                        v_mensagem := COALESCE(v_mensagem,'Pendência financeira em aberto.');
                        v_mensagem := REPLACE(REPLACE(REPLACE(v_mensagem,'{{cliente_nome}}',COALESCE(v_cr.cliente_nome,'Cliente')),'{{valor_formatado}}','R$ '||to_char(v_cr.valor,'FM999G999G990D00')),'{{vencimento}}',to_char(v_cr.data_vencimento,'DD/MM/YYYY'));
                        
                        INSERT INTO fila_cobrancas (empresa_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem_renderizada) 
                        VALUES (v_cr.empresa_id,v_cr.id,v_cr.cliente_id,v_cr.cliente_nome,v_regra.etapa,v_canal,CASE WHEN v_canal='email' THEN v_cr.cliente_email ELSE v_cr.cliente_telefone END,v_mensagem);
                    END IF;
                    
                    v_enfileirados := v_enfileirados + 1;
                END LOOP;
            END IF;
            
            IF NOT p_simulate THEN
                UPDATE contas_receber SET etapa_cobranca=v_regra.etapa::etapa_cobranca WHERE id=v_cr.id;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT v_enfileirados, 0, v_sem_contato;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
