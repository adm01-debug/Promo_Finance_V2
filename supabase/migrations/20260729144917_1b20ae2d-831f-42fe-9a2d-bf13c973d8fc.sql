CREATE OR REPLACE FUNCTION public.empresas_unica_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Empresa desativada nunca permanece como padrão
  IF NOT COALESCE(NEW.ativo, true) THEN
    IF TG_OP = 'UPDATE' AND NEW.is_padrao AND COALESCE(OLD.ativo, true) THEN
      NEW.is_padrao := false;
      RETURN NEW;
    END IF;
    IF NEW.is_padrao THEN
      RAISE EXCEPTION 'Uma empresa inativa não pode ser a empresa padrão';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_padrao THEN
    UPDATE public.empresas e
       SET is_padrao = false
     WHERE e.is_padrao AND e.id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;