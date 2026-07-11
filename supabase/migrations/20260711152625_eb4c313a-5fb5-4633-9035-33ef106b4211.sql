
-- Consolidação: drop overloads sem callers, mantém apenas a canônica mais ampla.
-- confirmar_conciliacao: 4 overloads -> 1 canônica (6 args)
DROP FUNCTION IF EXISTS public.confirmar_conciliacao(uuid, uuid);
DROP FUNCTION IF EXISTS public.confirmar_conciliacao(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.confirmar_conciliacao(uuid, uuid, uuid, uuid, uuid);
-- mantém: confirmar_conciliacao(uuid, uuid, uuid, uuid, uuid, numeric)

-- desfazer_conciliacao: 3 overloads -> 1 canônica (3 args)
DROP FUNCTION IF EXISTS public.desfazer_conciliacao(uuid);
DROP FUNCTION IF EXISTS public.desfazer_conciliacao(uuid, uuid);
-- mantém: desfazer_conciliacao(uuid, uuid, uuid)

COMMENT ON FUNCTION public.confirmar_conciliacao(uuid, uuid, uuid, uuid, uuid, numeric)
  IS 'Versão canônica consolidada. Parâmetros posteriores ao 2º são opcionais (passe NULL). Sobrecargas removidas em 2026-07-11.';

COMMENT ON FUNCTION public.desfazer_conciliacao(uuid, uuid, uuid)
  IS 'Versão canônica consolidada. Parâmetros 2 e 3 são opcionais (passe NULL). Sobrecargas removidas em 2026-07-11.';
