-- Migration 20260903001200
-- PROBLEMA: Migration 001100 concedeu EXECUTE em get_lockout_details(text) a anon,
-- criando um oracle público de bloqueio. Qualquer cliente pode chamar a função com
-- qualquer e-mail e descobrir se está bloqueado e quantas tentativas foram feitas —
-- confirmando indiretamente que o endereço existe (lockout_count > 0).
-- FIX: revogar anon, manter apenas authenticated (menor risco — usuário já autenticado
-- dificilmente está em estado de lockout pré-login, e admin pode consultar status).
-- O timer de lockout pré-login não exibirá contagem regressiva; mensagem genérica
-- "tente novamente mais tarde" é suficiente para o fluxo de UX.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.get_lockout_details(text) FROM anon;

COMMIT;
