-- Sobrecarga legada: sem verificação de autenticação nem de empresa (risco de
-- forja de trilha de auditoria e IDOR). A versão completa cobre as mesmas chamadas
-- (p_conta_id, p_evento, p_detalhes) com validação integral.
DROP FUNCTION IF EXISTS public.registrar_evento_receber(uuid, text, jsonb);

REVOKE ALL ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb, text, text, jsonb) TO authenticated, service_role;