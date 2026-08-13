CREATE OR REPLACE FUNCTION public.gerar_contas_recorrentes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_rec       RECORD;
  v_data      DATE;
  v_limite    DATE := CURRENT_DATE + INTERVAL '30 days';
  v_criadas   INTEGER := 0;
  v_ref       DATE;
  v_dia       INTEGER;
  v_intervalo INTERVAL;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.pagamentos_recorrentes
    WHERE ativo
      AND data_inicio <= v_limite
      AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  LOOP
    v_intervalo := CASE v_rec.frequencia
      WHEN 'semanal'    THEN INTERVAL '7 days'
      WHEN 'quinzenal'  THEN INTERVAL '15 days'
      WHEN 'mensal'     THEN INTERVAL '1 month'
      WHEN 'bimestral'  THEN INTERVAL '2 months'
      WHEN 'trimestral' THEN INTERVAL '3 months'
      WHEN 'semestral'  THEN INTERVAL '6 months'
      ELSE INTERVAL '1 year'
    END;

    v_ref := COALESCE(v_rec.proxima_geracao, v_rec.data_inicio);

    WHILE v_ref <= v_limite AND (v_rec.data_fim IS NULL OR v_ref <= v_rec.data_fim) LOOP
      -- ajusta para o dia de vencimento válido dentro do mês
      v_dia := LEAST(
        v_rec.dia_vencimento,
        EXTRACT(DAY FROM (date_trunc('month', v_ref) + INTERVAL '1 month - 1 day'))::INTEGER
      );
      v_data := CASE
        WHEN v_rec.frequencia IN ('semanal','quinzenal') THEN v_ref
        ELSE date_trunc('month', v_ref)::DATE + (v_dia - 1)
      END;

      IF NOT EXISTS (
        SELECT 1 FROM public.contas_pagar cp
        WHERE cp.deleted_at IS NULL
          AND cp.metadata->>'pagamento_recorrente_id' = v_rec.id::TEXT
          AND cp.data_vencimento = v_data
      ) THEN
        INSERT INTO public.contas_pagar (
          descricao, valor, data_vencimento, status, fornecedor_id, fornecedor_nome,
          empresa_id, centro_custo_id, conta_bancaria_id, tipo_cobranca, observacoes,
          recorrente, user_id, metadata
        ) VALUES (
          v_rec.descricao, v_rec.valor, v_data, 'pendente', v_rec.fornecedor_id, v_rec.fornecedor_nome,
          v_rec.empresa_id, v_rec.centro_custo_id, v_rec.conta_bancaria_id,
          v_rec.tipo_cobranca::TEXT, v_rec.observacoes,
          TRUE, auth.uid(),
          jsonb_build_object('pagamento_recorrente_id', v_rec.id, 'gerado_em', now())
        );
        v_criadas := v_criadas + 1;
      END IF;

      v_ref := (v_ref + v_intervalo)::DATE;
    END LOOP;

    UPDATE public.pagamentos_recorrentes
       SET ultima_geracao = CURRENT_DATE,
           proxima_geracao = v_ref,
           total_gerado    = total_gerado + v_criadas
     WHERE id = v_rec.id;
  END LOOP;

  RETURN v_criadas;
END;
$$;

REVOKE ALL ON FUNCTION public.gerar_contas_recorrentes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gerar_contas_recorrentes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_contas_recorrentes() TO service_role;