ALTER TABLE public.scim_tokens
  ADD COLUMN IF NOT EXISTS default_role public.app_role;

COMMENT ON COLUMN public.scim_tokens.default_role IS
  'Papel aplicado quando o IdP não envia department/group reconhecível. NULL = usar visualizador (legado).';