CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid) RETURNS text — adiciona empresa_acessivel(p_empresa_id) após gate de admin para bloquear IDOR cross-tenant
