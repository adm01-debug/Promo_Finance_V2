-- 20261116120000 — Login bloqueado em produção por allowlist de IP/país
--
-- Causa: is_ip_allowed_for_login/is_country_allowed_for_login retornam FALSE
-- tanto quando o IP/país não bate numa regra quanto quando não há regra alguma.
-- A edge function validate-ip-geo bloqueia o login em `=== false` assumindo
-- (comentário em supabase/functions/validate-ip-geo/index.ts) que a função só
-- devolve false havendo pelo menos uma regra ativa. Com allowed_ips contendo
-- apenas seeds de rede privada (192.168.1.0/24, 127.0.0.1/32) e
-- allowed_countries vazia, todo acesso vindo da internet era negado
-- (auth_logs: 70 eventos ip_geo_validation_denied, 0 ip_geo_validation_ok).
--
-- Correção: NULL = "política não se aplica" quando não há regra ativa.
-- `=== false` na edge function deixa de disparar, sem afastar o bloqueio
-- quando o dono configurar regras reais.

CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_ips ai WHERE ai.ativo IS TRUE) THEN
    RETURN NULL;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_ips ai
    WHERE ai.ativo IS TRUE
      AND CASE
        WHEN pg_catalog.pg_input_is_valid(btrim(ai.ip_address), 'inet')
          THEN btrim(ai.ip_address)::inet >>= _ip
        ELSE false
      END
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- `ativo` é o campo canônico; `enabled` só existe no banco consolidado.
  -- to_jsonb(record) mantém a migration compatível com o replay histórico.
  IF NOT EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE coalesce(
      nullif(to_jsonb(ac)->>'ativo', '')::boolean,
      nullif(to_jsonb(ac)->>'enabled', '')::boolean,
      false
    )
  ) THEN
    RETURN NULL;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE ac.country_code = _country
      AND coalesce(
        nullif(to_jsonb(ac)->>'ativo', '')::boolean,
        nullif(to_jsonb(ac)->>'enabled', '')::boolean,
        false
      )
  );
END
$function$;

-- Seeds de 2026-07-28 que só cobrem rede privada: mantidas na tabela (histórico),
-- desativadas para não negar 100% dos acessos vindos da internet.
UPDATE public.allowed_ips
   SET ativo = false
 WHERE ativo IS TRUE
   AND btrim(ip_address) IN ('192.168.1.0/24', '127.0.0.1/32');
