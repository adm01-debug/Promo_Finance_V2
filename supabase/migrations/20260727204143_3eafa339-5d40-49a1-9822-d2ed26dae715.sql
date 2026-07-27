ALTER TABLE public.overlay_rejeicoes_auditoria
  DROP CONSTRAINT IF EXISTS overlay_rejeicoes_auditoria_catalogo_check;

ALTER TABLE public.overlay_rejeicoes_auditoria
  ADD CONSTRAINT overlay_rejeicoes_auditoria_catalogo_check
  CHECK (catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text]));