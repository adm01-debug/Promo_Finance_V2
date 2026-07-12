-- Sprint 1 / Item 3: consolidar overloads de registrar_evento_receber

-- Remove overload quebrado #1 (colunas tipo_evento/descricao/metadados não existem em historico_cobranca)
DROP FUNCTION IF EXISTS public.registrar_evento_receber(uuid, text, text, jsonb);

-- Remove overload quebrado #2 (colunas evento/tipo não existem em logs_baixa_automatica)
DROP FUNCTION IF EXISTS public.registrar_evento_receber(uuid, text, jsonb, text);

-- Recria overload canônico (sobrescreve para garantir search_path + grants corretos)
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
  p_conta_id uuid,
  p_evento   text,
  p_detalhes jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.logs_baixa_automatica (user_id, conta_receber_id, resultado, detalhes)
  VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), p_conta_id, p_evento, p_detalhes)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb) TO authenticated, service_role;

-- Nova função com nome claro para registrar comunicação em historico_cobranca
CREATE OR REPLACE FUNCTION public.registrar_evento_cobranca(
  p_conta_id    uuid,
  p_evento      text,
  p_mensagem    text DEFAULT NULL,
  p_canal       text DEFAULT NULL,
  p_destinatario text DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_id uuid;
  v_empresa uuid;
BEGIN
  SELECT empresa_id INTO v_empresa FROM public.contas_receber WHERE id = p_conta_id;

  INSERT INTO public.historico_cobranca (
    conta_receber_id, empresa_id, evento, mensagem, canal, destinatario, metadata, created_at
  ) VALUES (
    p_conta_id, v_empresa, p_evento, p_mensagem, p_canal, p_destinatario, COALESCE(p_metadata, '{}'::jsonb), now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento_cobranca(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_cobranca(uuid, text, text, text, text, jsonb) TO authenticated, service_role;

INSERT INTO public.audit_logs (table_name, action, details, user_email, created_at)
VALUES ('pg_proc', 'CONSOLIDATE_OVERLOAD', 'Sprint 1/Item 3 — Removidos 2 overloads quebrados de registrar_evento_receber; criada registrar_evento_cobranca', 'system', now());