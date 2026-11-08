CREATE OR REPLACE FUNCTION private.atribui_empresa_do_anexo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_empresa := private.empresa_da_entidade_financeira(NEW.entidade_tipo, NEW.entidade_id);
  ELSE
    CASE NEW.entidade_tipo
      WHEN 'contas_pagar', 'conta_pagar' THEN
        SELECT cp.empresa_id INTO v_empresa
          FROM public.contas_pagar cp WHERE cp.id = NEW.entidade_id FOR UPDATE;
      WHEN 'contas_receber', 'conta_receber' THEN
        SELECT cr.empresa_id INTO v_empresa
          FROM public.contas_receber cr WHERE cr.id = NEW.entidade_id FOR UPDATE;
      WHEN 'movimentacoes', 'movimentacao' THEN
        SELECT mv.empresa_id INTO v_empresa
          FROM public.movimentacoes mv WHERE mv.id = NEW.entidade_id FOR UPDATE;
    END CASE;
    IF v_empresa IS NOT NULL AND NEW.user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = NEW.user_id
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = v_empresa
    ) THEN
      RAISE EXCEPTION 'anexos_financeiros: usuario % sem vinculo de escrita na empresa % da entidade',
        NEW.user_id, v_empresa
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  NEW.empresa_id := COALESCE(v_empresa, NEW.empresa_id);
  RETURN NEW;
END;
$function$
