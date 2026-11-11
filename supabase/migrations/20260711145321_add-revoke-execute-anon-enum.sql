-- Shim: adiciona valor 'revoke_execute_anon' ao enum audit_action
-- antes de 20260711145322 que insere audit_logs com esse valor (22P02)
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'revoke_execute_anon';
