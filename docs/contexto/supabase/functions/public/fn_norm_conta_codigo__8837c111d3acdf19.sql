CREATE OR REPLACE FUNCTION public.fn_norm_conta_codigo(p_codigo text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT string_agg(lpad(seg, 2, '0'), '' ORDER BY ord)
     FROM unnest(
       string_to_array(regexp_replace(COALESCE(p_codigo, ''), '[^0-9.]', '', 'g'), '.')
     ) WITH ORDINALITY AS t(seg, ord)
     WHERE seg <> ''),
    ''
  );
$function$
