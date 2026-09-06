-- Migration 20260903000600
-- PROBLEMA: empresa_acessivel() usa COALESCE(ue.ativo, true) — se ativo for NULL,
-- o usuário recebe acesso como se estivesse ativo. Essa função é a guarda central
-- de TODAS as RLS policies do sistema (130+ tabelas). Um registro user_empresas com
-- ativo=NULL concede acesso full-tenant indevido.
-- empresa_membro_ativo() já usa ue.ativo = true (correto).
-- FIX: substituir COALESCE(ue.ativo, true) por ue.ativo = true.

BEGIN;

CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND ue.ativo = true
     )
$$;

COMMIT;
