CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(
  p_conta_id UUID,
  p_tipo TEXT,
  p_mensagem TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.historico_pagamento (
    conta_pagar_id,
    tipo,
    mensagem,
    metadata,
    created_at
  ) VALUES (
    p_conta_id,
    p_tipo,
    p_mensagem,
    p_metadata,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;