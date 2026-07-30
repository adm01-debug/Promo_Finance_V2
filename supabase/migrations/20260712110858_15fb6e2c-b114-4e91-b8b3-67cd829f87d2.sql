-- Item 30: Consolidar sobrecarga órfã de registrar_evento_pagar.
-- A assinatura (uuid, text, jsonb) retorna UUID e possui corpo stub (apenas gen_random_uuid()).
-- Callers reais no código usam (p_conta_id, p_tipo, p_mensagem, p_metadata) — assinatura de 4 args.
-- Removemos o stub para eliminar ambiguidade de dispatch e potencial silêncio de bugs.

DROP FUNCTION IF EXISTS public.registrar_evento_pagar(uuid, text, jsonb);

-- Registrar consolidação
INSERT INTO public.audit_logs (action, table_name, details, created_at)
VALUES (
  'function_overloads_consolidated',
  'registrar_evento_pagar',
  'Removida sobrecarga stub (uuid,text,jsonb)->uuid. Canônica: (uuid,text,text,jsonb)->void.',
  now()
);