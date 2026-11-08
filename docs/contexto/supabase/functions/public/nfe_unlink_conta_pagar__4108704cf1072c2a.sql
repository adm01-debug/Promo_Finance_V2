CREATE OR REPLACE FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cp uuid;
BEGIN
  UPDATE public.nfe_recebidas
  SET conta_pagar_id = NULL, updated_at = now()
  WHERE id = p_nfe_id
  RETURNING conta_pagar_id INTO v_cp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'conta_pagar_id', v_cp);
END;
$function$
